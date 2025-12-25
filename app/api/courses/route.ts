import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Konfiguracja dla App Router - wymagane gdy używamy dynamicznych funkcji
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const courseSchema = z.object({
  title: z.string().min(3, 'Tytuł musi mieć minimum 3 znaki'),
  description: z.string().min(10, 'Opis musi mieć minimum 10 znaków'),
  type: z.enum(['STACJONARNY', 'ONLINE']),
  price: z.number().min(0, 'Cena nie może być ujemna'),
  fundingInfo: z.string().min(5, 'Informacje o dofinansowaniu są wymagane'),
  startDate: z.string(),
  endDate: z.string().optional(),
  // Pola dla kursów online
  isOnlineCourse: z.boolean().optional(),
  onlinePrice: z.number().min(0).nullable().optional(),
  commissionRate: z.number().min(0).max(100).nullable().optional(),
  isPublished: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ORGANIZER') {
      return NextResponse.json(
        { error: 'Brak uprawnień' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = courseSchema.parse(body)

    // Sprawdź czy w żądaniu jest paymentId (płatność musi być wykonana przed utworzeniem kursu)
    const { paymentId, ...courseData } = body

    if (!paymentId) {
      return NextResponse.json(
        { 
          error: 'Płatność jest wymagana',
          requiresPayment: true,
          amount: 100.0,
          message: 'Aby dodać kurs, musisz najpierw opłacić 100 PLN'
        },
        { status: 402 } // 402 Payment Required
      )
    }

    // Sprawdź czy płatność istnieje i jest zakończona
    const payment = await prisma.coursePayment.findUnique({
      where: { id: paymentId },
    })

    if (!payment || payment.status !== 'COMPLETED') {
      return NextResponse.json(
        { 
          error: 'Nieprawidłowa lub nieopłacona płatność',
          requiresPayment: true,
          amount: 100.0
        },
        { status: 402 }
      )
    }

    if (payment.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Płatność nie należy do tego użytkownika' },
        { status: 403 }
      )
    }

    // Sprawdź czy płatność nie została już użyta (czy ma już powiązany kurs)
    if (payment.courseId) {
      return NextResponse.json(
        { error: 'Ta płatność została już wykorzystana' },
        { status: 400 }
      )
    }

    // Utwórz kurs
    const course = await prisma.course.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type,
        price: validatedData.price,
        fundingInfo: validatedData.fundingInfo,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        organizerId: session.user.id,
        // Pola dla kursów online
        isOnlineCourse: validatedData.isOnlineCourse || false,
        onlinePrice: validatedData.onlinePrice || (validatedData.isOnlineCourse ? 100 : null),
        commissionRate: validatedData.commissionRate || (validatedData.isOnlineCourse ? 10 : null),
        isPublished: validatedData.isPublished || false,
      },
    })

    // Powiąż płatność z utworzonym kursem
    await prisma.coursePayment.update({
      where: { id: paymentId },
      data: {
        courseId: course.id,
      },
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Course creation error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia kursu' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Brak autoryzacji' },
        { status: 401 }
      )
    }

    const courses = await prisma.course.findMany({
      where: {
        organizerId: session.user.id,
      },
      include: {
        files: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(courses)
  } catch (error) {
    console.error('Courses fetch error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania kursów' },
      { status: 500 }
    )
  }
}

