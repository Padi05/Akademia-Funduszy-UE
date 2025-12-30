import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const consultationSchema = z.object({
  title: z.string().min(3, 'Tytuł musi mieć minimum 3 znaki'),
  description: z.string().optional(),
  pricePerHour: z.number().min(0, 'Cena nie może być ujemna'),
  duration: z.number().min(15, 'Minimalny czas to 15 minut').max(480, 'Maksymalny czas to 8 godzin'),
  scheduledDate: z.string().min(1, 'Data jest wymagana'),
  notes: z.string().optional(),
})

// Utwórz ofertę konsultacji (trener)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Brak autoryzacji' },
        { status: 401 }
      )
    }

    // Tylko ORGANIZER może tworzyć oferty konsultacji
    if (session.user.role !== 'ORGANIZER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Tylko organizator może tworzyć oferty konsultacji' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = consultationSchema.parse(body)

    const scheduledDate = new Date(validatedData.scheduledDate)
    if (scheduledDate < new Date()) {
      return NextResponse.json(
        { error: 'Data konsultacji nie może być w przeszłości' },
        { status: 400 }
      )
    }

    // Sprawdź czy trener nie ma już konsultacji w tym czasie
    const existingConsultation = await prisma.consultation.findFirst({
      where: {
        trainerId: session.user.id,
        scheduledDate: {
          gte: new Date(scheduledDate.getTime() - validatedData.duration * 60000),
          lte: new Date(scheduledDate.getTime() + validatedData.duration * 60000),
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    })

    if (existingConsultation) {
      return NextResponse.json(
        { error: 'Masz już zaplanowaną konsultację w tym czasie' },
        { status: 400 }
      )
    }

    const consultation = await prisma.consultation.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        pricePerHour: validatedData.pricePerHour,
        duration: validatedData.duration,
        scheduledDate,
        notes: validatedData.notes,
        commissionRate: 10, // Domyślnie 10%
        trainerId: session.user.id,
        participantId: session.user.id, // Tymczasowo - zostanie zmienione po rezerwacji
        status: 'PENDING',
      },
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(consultation, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error creating consultation:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas tworzenia konsultacji' },
      { status: 500 }
    )
  }
}

// Pobierz konsultacje (dla trenera lub uczestnika)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Brak autoryzacji' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') // 'trainer' lub 'participant'
    const status = searchParams.get('status')

    let where: any = {}

    if (role === 'trainer') {
      where.trainerId = session.user.id
    } else if (role === 'participant') {
      where.participantId = session.user.id
      where.status = { not: 'PENDING' } // Uczestnik widzi tylko zarezerwowane konsultacje
    } else {
      // Domyślnie: trener widzi swoje oferty, uczestnik widzi dostępne
      if (session.user.role === 'ORGANIZER' || session.user.role === 'ADMIN') {
        where.trainerId = session.user.id
      } else {
        where.status = 'PENDING' // Uczestnik widzi tylko dostępne konsultacje
      }
    }

    if (status) {
      where.status = status
    }

    const consultations = await prisma.consultation.findMany({
      where,
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        participant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    })

    return NextResponse.json(consultations)
  } catch (error) {
    console.error('Error fetching consultations:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania konsultacji' },
      { status: 500 }
    )
  }
}

