import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
})

// Pobierz wszystkie recenzje kursu
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviews = await prisma.courseReview.findMany({
      where: { courseId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Oblicz średnią ocenę
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0

    return NextResponse.json({
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania recenzji' },
      { status: 500 }
    )
  }
}

// Dodaj recenzję
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Brak autoryzacji' },
        { status: 401 }
      )
    }

    const course = await prisma.course.findUnique({
      where: { id: params.id },
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Kurs nie został znaleziony' },
        { status: 404 }
      )
    }

    // Sprawdź czy użytkownik może ocenić ten kurs
    // Musi mieć zakupiony kurs online lub być zapisanym na kurs stacjonarny
    const hasPurchase = await prisma.coursePurchase.findFirst({
      where: {
        courseId: params.id,
        userId: session.user.id,
      },
    })

    const hasEnrollment = await prisma.courseEnrollment.findFirst({
      where: {
        courseId: params.id,
        userId: session.user.id,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    })

    if (!hasPurchase && !hasEnrollment && course.organizerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Musisz być zapisanym na kurs lub go zakupić, aby móc go ocenić' },
        { status: 403 }
      )
    }

    // Sprawdź czy użytkownik już ocenił ten kurs
    const existingReview = await prisma.courseReview.findUnique({
      where: {
        courseId_userId: {
          courseId: params.id,
          userId: session.user.id,
        },
      },
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'Już oceniłeś ten kurs' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = reviewSchema.parse(body)

    const review = await prisma.courseReview.create({
      data: {
        courseId: params.id,
        userId: session.user.id,
        rating: validatedData.rating,
        comment: validatedData.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas dodawania recenzji' },
      { status: 500 }
    )
  }
}

