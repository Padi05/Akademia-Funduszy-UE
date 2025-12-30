import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Konfiguracja dla App Router - wymagane gdy używamy dynamicznych funkcji
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

    if (!course.isOnlineCourse || !course.isPublished) {
      return NextResponse.json(
        { error: 'Kurs nie jest dostępny do zakupu' },
        { status: 400 }
      )
    }

    // Sprawdź czy użytkownik już kupił ten kurs
    const existingPurchase = await prisma.coursePurchase.findFirst({
      where: {
        courseId: params.id,
        userId: session.user.id,
      },
    })

    if (existingPurchase) {
      return NextResponse.json(
        { error: 'Już posiadasz ten kurs' },
        { status: 400 }
      )
    }

    // Sprawdź czy użytkownik jest organizatorem tego kursu
    if (course.organizerId === session.user.id) {
      return NextResponse.json(
        { error: 'Nie możesz kupić własnego kursu' },
        { status: 400 }
      )
    }

    // Oblicz cenę z uwzględnieniem zniżki 50% dla kursu online
    let basePrice = course.onlinePrice || 100
    
    // Jeśli kurs ma cenę bazową (price), zastosuj zniżkę 50%
    if (course.price && course.price > 0) {
      const onlineDiscount = course.onlineDiscountPercentage || 50
      basePrice = course.price * (1 - onlineDiscount / 100)
    }
    
    // Użyj onlinePrice jeśli jest ustawione, w przeciwnym razie użyj ceny po zniżce
    const finalPrice = course.onlinePrice || basePrice
    const commissionRate = course.commissionRate || 10
    const commission = (finalPrice * commissionRate) / 100
    const organizerEarnings = finalPrice - commission

    // Utwórz zakup
    const purchase = await prisma.coursePurchase.create({
      data: {
        courseId: params.id,
        userId: session.user.id,
        price: finalPrice,
        commission,
      },
    })

    // Utwórz transakcję finansową
    await prisma.financialTransaction.create({
      data: {
        transactionType: 'COURSE_ONLINE',
        amount: finalPrice,
        commission,
        organizerEarnings,
        status: 'COMPLETED',
        courseId: params.id,
        organizerId: course.organizerId,
        participantId: session.user.id,
        purchaseId: purchase.id,
        paymentDate: new Date(),
        paymentMethod: 'STRIPE',
      },
    })

    return NextResponse.json(purchase, { status: 201 })
  } catch (error) {
    console.error('Course purchase error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas zakupu kursu' },
      { status: 500 }
    )
  }
}

