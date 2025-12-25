import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Konfiguracja dla App Router - wymagane gdy używamy dynamicznych funkcji
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COURSE_CREATION_PRICE = 100.0 // Cena za dodanie kursu

// Utwórz płatność za dodanie kursu (przed utworzeniem kursu)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ORGANIZER') {
      return NextResponse.json(
        { error: 'Brak uprawnień' },
        { status: 403 }
      )
    }

    // Utwórz płatność bez courseId (zostanie powiązana po utworzeniu kursu)
    const payment = await prisma.coursePayment.create({
      data: {
        userId: session.user.id,
        amount: COURSE_CREATION_PRICE,
        status: 'COMPLETED', // W przyszłości można zmienić na PENDING i czekać na potwierdzenie z Stripe
        paymentDate: new Date(),
        // courseId zostanie ustawione później, gdy kurs zostanie utworzony
      },
    })

    return NextResponse.json({
      success: true,
      payment,
      message: 'Płatność została zarejestrowana',
    })
  } catch (error) {
    console.error('Course payment error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas przetwarzania płatności' },
      { status: 500 }
    )
  }
}

// Sprawdź status płatności za kurs (opcjonalnie przez courseId lub paymentId)
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
    const courseId = searchParams.get('courseId')
    const paymentId = searchParams.get('paymentId')

    if (courseId) {
      // Sprawdź płatność dla konkretnego kursu
      const payment = await prisma.coursePayment.findUnique({
        where: { courseId },
      })

      if (!payment) {
        return NextResponse.json({
          hasPayment: false,
          isPaid: false,
          amount: COURSE_CREATION_PRICE,
        })
      }

      return NextResponse.json({
        hasPayment: true,
        isPaid: payment.status === 'COMPLETED',
        status: payment.status,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
      })
    } else if (paymentId) {
      // Sprawdź konkretną płatność
      const payment = await prisma.coursePayment.findUnique({
        where: { id: paymentId },
      })

      if (!payment) {
        return NextResponse.json(
          { error: 'Płatność nie została znaleziona' },
          { status: 404 }
        )
      }

      if (payment.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'Brak uprawnień' },
          { status: 403 }
        )
      }

      return NextResponse.json({
        hasPayment: true,
        isPaid: payment.status === 'COMPLETED',
        status: payment.status,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        courseId: payment.courseId,
      })
    } else {
      // Zwróć wszystkie nieużyte płatności użytkownika (bez courseId)
      const payments = await prisma.coursePayment.findMany({
        where: {
          userId: session.user.id,
          courseId: null, // Tylko płatności, które nie zostały jeszcze użyte
          status: 'COMPLETED',
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return NextResponse.json({
        hasPayment: payments.length > 0,
        availablePayments: payments,
        amount: COURSE_CREATION_PRICE,
      })
    }
  } catch (error) {
    console.error('Payment status check error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas sprawdzania statusu płatności' },
      { status: 500 }
    )
  }
}

