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
  description: z.string().min(10, 'Opis musi mieć minimum 10 znaki'),
  type: z.enum(['STACJONARNY', 'ONLINE']),
  price: z.number().min(0, 'Cena nie może być ujemna'),
  fundingInfo: z.string().min(5, 'Informacje o dofinansowaniu są wymagane'),
  startDate: z.string(),
  endDate: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        organizer: {
          select: {
            name: true,
            email: true,
          },
        },
        files: true,
        videoFiles: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Kurs nie został znaleziony' },
        { status: 404 }
      )
    }

    return NextResponse.json(course)
  } catch (error) {
    console.error('Course fetch error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania kursu' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Tylko ADMIN może edytować kursy
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Brak uprawnień. Tylko administrator może edytować kursy.' },
        { status: 403 }
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

    // ADMIN może edytować każdy kurs (nie sprawdzamy organizerId)

    const body = await request.json()
    const validatedData = courseSchema.parse(body)

    const updatedCourse = await prisma.course.update({
      where: { id: params.id },
      data: {
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type,
        price: validatedData.price,
        fundingInfo: validatedData.fundingInfo,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      },
    })

    return NextResponse.json(updatedCourse)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Course update error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas aktualizacji kursu' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Tylko ADMIN może usuwać kursy
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Brak uprawnień. Tylko administrator może usuwać kursy.' },
        { status: 403 }
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

    // ADMIN może usuwać każdy kurs (nie sprawdzamy organizerId)

    await prisma.course.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Kurs został usunięty' })
  } catch (error) {
    console.error('Course delete error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas usuwania kursu' },
      { status: 500 }
    )
  }
}

