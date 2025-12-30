import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const enrollmentSchema = z.object({
  notes: z.string().optional(),
})

// Zapisz się na kurs stacjonarny
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

    // Tylko kursy stacjonarne można zapisać się online
    if (course.type !== 'STACJONARNY') {
      return NextResponse.json(
        { error: 'Można zapisać się tylko na kursy stacjonarne' },
        { status: 400 }
      )
    }

    // Sprawdź czy użytkownik już jest zapisany
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_userId: {
          courseId: params.id,
          userId: session.user.id,
        },
      },
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Jesteś już zapisany na ten kurs' },
        { status: 400 }
      )
    }

    // Organizator nie może zapisać się na swój własny kurs
    if (course.organizerId === session.user.id) {
      return NextResponse.json(
        { error: 'Nie możesz zapisać się na swój własny kurs' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = enrollmentSchema.parse(body)

    // Oblicz cenę i prowizję dla kursu stacjonarnego z dofinansowaniem UE
    let participantPrice = course.price
    let commissionAmount = 0
    let organizerEarnings = course.price

    // Jeśli kurs ma dofinansowanie UE
    if (course.euFundingPercentage && course.euFundingPercentage > 0) {
      // Cena dla uczestnika po dofinansowaniu
      participantPrice = course.participantPrice || (course.price * (1 - course.euFundingPercentage / 100))
      
      // Prowizja platformy od ceny uczestnika
      const commissionRate = course.liveCommissionRate || 10
      commissionAmount = (participantPrice * commissionRate) / 100
      organizerEarnings = participantPrice - commissionAmount
    } else {
      // Jeśli nie ma dofinansowania, prowizja od pełnej ceny
      const commissionRate = course.liveCommissionRate || 10
      commissionAmount = (course.price * commissionRate) / 100
      organizerEarnings = course.price - commissionAmount
    }

    const enrollment = await prisma.courseEnrollment.create({
      data: {
        courseId: params.id,
        userId: session.user.id,
        status: 'PENDING',
        notes: validatedData.notes,
        participantPricePaid: participantPrice,
        commissionAmount,
        organizerEarnings,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    // Utwórz transakcję finansową (status PENDING, zmieni się na COMPLETED po potwierdzeniu)
    await prisma.financialTransaction.create({
      data: {
        transactionType: 'COURSE_LIVE',
        amount: participantPrice,
        commission: commissionAmount,
        organizerEarnings,
        status: 'PENDING',
        courseId: params.id,
        enrollmentId: enrollment.id,
        organizerId: course.organizerId,
        participantId: session.user.id,
        notes: `Zapis na kurs stacjonarny: ${course.title}`,
      },
    })

    return NextResponse.json(enrollment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error creating enrollment:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas zapisywania na kurs' },
      { status: 500 }
    )
  }
}

// Pobierz zapisy na kurs (dla organizatora)
export async function GET(
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

    // Tylko organizator kursu lub admin może zobaczyć zapisy
    if (course.organizerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Brak uprawnień' },
        { status: 403 }
      )
    }

    const enrollments = await prisma.courseEnrollment.findMany({
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
        enrolledAt: 'desc',
      },
    })

    return NextResponse.json(enrollments)
  } catch (error) {
    console.error('Error fetching enrollments:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania zapisów' },
      { status: 500 }
    )
  }
}

