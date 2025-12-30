import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Rezerwacja konsultacji przez uczestnika
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

    const consultation = await prisma.consultation.findUnique({
      where: { id: params.id },
      include: {
        trainer: true,
      },
    })

    if (!consultation) {
      return NextResponse.json(
        { error: 'Konsultacja nie została znaleziona' },
        { status: 404 }
      )
    }

    if (consultation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Konsultacja nie jest dostępna do rezerwacji' },
        { status: 400 }
      )
    }

    if (consultation.trainerId === session.user.id) {
      return NextResponse.json(
        { error: 'Nie możesz zarezerwować własnej konsultacji' },
        { status: 400 }
      )
    }

    // Oblicz cenę i prowizję
    const hours = consultation.duration / 60
    const totalPrice = consultation.pricePerHour * hours
    const commissionRate = consultation.commissionRate || 10
    const commissionAmount = (totalPrice * commissionRate) / 100
    const organizerEarnings = totalPrice - commissionAmount

    // Generuj link do video call (w rzeczywistości można użyć Zoom, Google Meet, etc.)
    const videoCallLink = `https://meet.example.com/${params.id}`

    // Zaktualizuj konsultację
    const updatedConsultation = await prisma.consultation.update({
      where: { id: params.id },
      data: {
        participantId: session.user.id,
        status: 'CONFIRMED',
        videoCallLink,
        commissionAmount,
        organizerEarnings,
      },
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
    })

    // Utwórz transakcję finansową
    await prisma.financialTransaction.create({
      data: {
        transactionType: 'CONSULTATION',
        amount: totalPrice,
        commission: commissionAmount,
        organizerEarnings,
        status: 'COMPLETED',
        consultationId: params.id,
        organizerId: consultation.trainerId,
        participantId: session.user.id,
        paymentDate: new Date(),
        paymentMethod: 'STRIPE', // W rzeczywistości zależy od metody płatności
      },
    })

    return NextResponse.json(updatedConsultation)
  } catch (error) {
    console.error('Error booking consultation:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas rezerwacji konsultacji' },
      { status: 500 }
    )
  }
}

// Pobierz szczegóły konsultacji
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

    const consultation = await prisma.consultation.findUnique({
      where: { id: params.id },
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
    })

    if (!consultation) {
      return NextResponse.json(
        { error: 'Konsultacja nie została znaleziona' },
        { status: 404 }
      )
    }

    // Sprawdź uprawnienia
    if (
      consultation.trainerId !== session.user.id &&
      consultation.participantId !== session.user.id &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Brak uprawnień' },
        { status: 403 }
      )
    }

    return NextResponse.json(consultation)
  } catch (error) {
    console.error('Error fetching consultation:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania konsultacji' },
      { status: 500 }
    )
  }
}

// Anuluj konsultację
export async function DELETE(
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

    const consultation = await prisma.consultation.findUnique({
      where: { id: params.id },
    })

    if (!consultation) {
      return NextResponse.json(
        { error: 'Konsultacja nie została znaleziona' },
        { status: 404 }
      )
    }

    // Tylko trener lub uczestnik może anulować
    if (
      consultation.trainerId !== session.user.id &&
      consultation.participantId !== session.user.id &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Brak uprawnień' },
        { status: 403 }
      )
    }

    // Jeśli konsultacja była potwierdzona, zwróć środki (w rzeczywistości)
    if (consultation.status === 'CONFIRMED') {
      // Tutaj można dodać logikę zwrotu środków
    }

    const updatedConsultation = await prisma.consultation.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
      },
    })

    return NextResponse.json(updatedConsultation)
  } catch (error) {
    console.error('Error cancelling consultation:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas anulowania konsultacji' },
      { status: 500 }
    )
  }
}

