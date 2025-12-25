import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Konfiguracja dla App Router - wymagane gdy używamy dynamicznych funkcji
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Pobierz status subskrypcji użytkownika
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Brak autoryzacji' },
        { status: 401 }
      )
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        status: null,
      })
    }

    // Sprawdź czy subskrypcja wygasła
    const now = new Date()
    const isExpired = subscription.endDate < now
    const isActive = subscription.status === 'ACTIVE' && !isExpired

    return NextResponse.json({
      hasSubscription: true,
      status: isExpired ? 'EXPIRED' : subscription.status,
      isActive,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      monthlyPrice: subscription.monthlyPrice,
    })
  } catch (error) {
    console.error('Subscription fetch error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania informacji o subskrypcji' },
      { status: 500 }
    )
  }
}

// Utwórz lub przedłuż subskrypcję
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Brak autoryzacji' },
        { status: 401 }
      )
    }

    console.log('=== Subscription Creation Started ===')
    console.log('User ID:', session.user.id)
    
    let body: any = {}
    try {
      body = await request.json()
      console.log('Request body:', body)
    } catch (parseError) {
      console.log('No body provided, using defaults')
    }
    
    const { monthlyPrice = 29.99 } = body
    console.log('Monthly price:', monthlyPrice)

    // Sprawdź czy użytkownik ma już subskrypcję
    console.log('Checking for existing subscription...')
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })
    console.log('Existing subscription:', existingSubscription ? 'Found' : 'Not found')

    const now = new Date()
    const endDate = new Date(now)
    endDate.setMonth(endDate.getMonth() + 1) // Dodaj 1 miesiąc

    if (existingSubscription) {
      // Przedłuż istniejącą subskrypcję
      const updatedSubscription = await prisma.subscription.update({
        where: { userId: session.user.id },
        data: {
          status: 'ACTIVE',
          startDate: existingSubscription.status === 'ACTIVE' && existingSubscription.endDate > now 
            ? existingSubscription.startDate 
            : now,
          endDate: existingSubscription.status === 'ACTIVE' && existingSubscription.endDate > now
            ? new Date(existingSubscription.endDate.getTime() + 30 * 24 * 60 * 60 * 1000) // Dodaj miesiąc do obecnej daty wygaśnięcia
            : endDate,
          monthlyPrice,
        },
      })

      return NextResponse.json(updatedSubscription, { status: 200 })
    } else {
      // Utwórz nową subskrypcję
      const subscription = await prisma.subscription.create({
        data: {
          userId: session.user.id,
          status: 'ACTIVE',
          startDate: now,
          endDate,
          monthlyPrice,
        },
      })

      return NextResponse.json(subscription, { status: 201 })
    }
  } catch (error: any) {
    console.error('=== Subscription Creation Error ===')
    console.error('Error type:', typeof error)
    console.error('Error:', error)
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    // Sprawdź czy to błąd Prisma
    if (error.code) {
      console.error('Prisma error code:', error.code)
    }
    if (error.meta) {
      console.error('Prisma error meta:', error.meta)
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { 
        error: 'Wystąpił błąd podczas tworzenia subskrypcji',
        details: errorMessage,
        code: error.code || 'UNKNOWN'
      },
      { status: 500 }
    )
  }
}

// Anuluj subskrypcję
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Brak autoryzacji' },
        { status: 401 }
      )
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'Nie masz aktywnej subskrypcji' },
        { status: 404 }
      )
    }

    // Oznacz subskrypcję jako anulowaną (nie usuwaj, aby zachować historię)
    const updatedSubscription = await prisma.subscription.update({
      where: { userId: session.user.id },
      data: {
        status: 'CANCELLED',
      },
    })

    return NextResponse.json({ 
      message: 'Subskrypcja została anulowana',
      subscription: updatedSubscription 
    })
  } catch (error) {
    console.error('Subscription cancellation error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas anulowania subskrypcji' },
      { status: 500 }
    )
  }
}

