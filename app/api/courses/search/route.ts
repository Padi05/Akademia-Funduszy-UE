import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') // STACJONARNY, ONLINE, lub null (wszystkie)
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const sortBy = searchParams.get('sortBy') || 'createdAt' // createdAt, price, rating
    const sortOrder = searchParams.get('sortOrder') || 'desc' // asc, desc

    const where: any = {
      isPublished: true,
    }

    // Wyszukiwanie po tytule i opisie
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ]
    }

    // Filtrowanie po typie
    if (type && (type === 'STACJONARNY' || type === 'ONLINE')) {
      where.type = type
    }

    // Filtrowanie po cenie
    if (minPrice || maxPrice) {
      where.OR = [
        ...(where.OR || []),
        {
          AND: [
            minPrice ? { price: { gte: parseFloat(minPrice) } } : {},
            maxPrice ? { price: { lte: parseFloat(maxPrice) } } : {},
          ],
        },
      ]
    }

    // Sortowanie
    const orderBy: any = {}
    if (sortBy === 'price') {
      orderBy.price = sortOrder
    } else if (sortBy === 'rating') {
      // Sortowanie po średniej ocenie (wymaga agregacji)
      // Na razie sortujemy po dacie utworzenia
      orderBy.createdAt = sortOrder
    } else {
      orderBy.createdAt = sortOrder
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        organizer: {
          select: {
            name: true,
            email: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            purchases: true,
          },
        },
      },
      orderBy,
    })

    // Oblicz średnie oceny dla każdego kursu
    const coursesWithRatings = courses.map((course) => {
      const averageRating = course.reviews.length > 0
        ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
        : 0

      return {
        ...course,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: course.reviews.length,
        totalEnrollments: course._count.enrollments,
        totalPurchases: course._count.purchases,
        reviews: undefined, // Usuń szczegóły recenzji z odpowiedzi
      }
    })

    return NextResponse.json({
      courses: coursesWithRatings,
      total: coursesWithRatings.length,
    })
  } catch (error) {
    console.error('Error searching courses:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas wyszukiwania kursów' },
      { status: 500 }
    )
  }
}

