import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const voivodeship = searchParams.get('voivodeship')

    if (!voivodeship) {
      return NextResponse.json(
        { error: 'Województwo jest wymagane' },
        { status: 400 }
      )
    }

    const courses = await prisma.course.findMany({
      where: {
        voivodeship: voivodeship,
        isPublished: true,
        type: 'STACJONARNY', // Tylko kursy stacjonarne mają lokalizację
      },
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Oblicz średnie oceny
    const coursesWithRatings = courses.map((course) => {
      const averageRating = course.reviews.length > 0
        ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
        : 0

      return {
        ...course,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: course.reviews.length,
        totalEnrollments: course._count.enrollments,
        reviews: undefined,
      }
    })

    return NextResponse.json({
      courses: coursesWithRatings,
      total: coursesWithRatings.length,
    })
  } catch (error) {
    console.error('Error fetching courses by voivodeship:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania kursów' },
      { status: 500 }
    )
  }
}

