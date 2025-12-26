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
  startDate: z.string().min(1, 'Data rozpoczęcia jest wymagana'),
  endDate: z.string().optional(),
  // Pola dla kursów online
  isOnlineCourse: z.boolean().optional(),
  onlinePrice: z.number().min(0).nullable().optional(),
  commissionRate: z.number().min(0).max(100).nullable().optional(),
  isPublished: z.boolean().optional(),
}).refine((data) => {
  // Jeśli data zakończenia jest podana, musi być po dacie rozpoczęcia
  if (data.endDate && data.startDate) {
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)
    return endDate > startDate
  }
  return true
}, {
  message: 'Data zakończenia musi być po dacie rozpoczęcia',
  path: ['endDate'],
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Tylko ADMIN może dodawać kursy
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Brak uprawnień. Tylko administrator może dodawać kursy.' },
        { status: 403 }
      )
    }

    // ADMIN nie potrzebuje subskrypcji - pomijamy sprawdzanie

    const body = await request.json()
    const validatedData = courseSchema.parse(body)

    // Określ czy kurs jest online
    const isOnlineCourse = validatedData.isOnlineCourse || false
    
    // Kursy stacjonarne są automatycznie publikowane (widoczne na stronie głównej)
    // Kursy online wymagają ręcznej publikacji (dla sprzedaży)
    const shouldPublish = validatedData.isPublished !== undefined 
      ? validatedData.isPublished 
      : (validatedData.type === 'STACJONARNY' ? true : false)
    
    // Utwórz kurs (z aktywną subskrypcją nie wymagamy dodatkowej płatności 100 PLN)
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
        isOnlineCourse: isOnlineCourse,
        onlinePrice: validatedData.onlinePrice || (isOnlineCourse ? 100 : null),
        commissionRate: validatedData.commissionRate || (isOnlineCourse ? 10 : null),
        isPublished: shouldPublish,
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

