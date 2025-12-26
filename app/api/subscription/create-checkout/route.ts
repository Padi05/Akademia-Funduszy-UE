import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Brak autoryzacji' },
        { status: 401 }
      )
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY nie jest ustawiony w zmiennych środowiskowych')
      return NextResponse.json(
        { error: 'Stripe nie jest skonfigurowany' },
        { status: 500 }
      )
    }

    const { monthlyPrice = 29.99 } = await request.json().catch(() => ({ monthlyPrice: 29.99 }))

    // Utwórz lub pobierz klienta Stripe
    const { prisma } = await import('@/lib/prisma')
    
    // Sprawdź czy użytkownik ma już customer ID w bazie
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    })

    let customerId = user?.subscription?.stripeCustomerId

    // Jeśli nie ma customer ID, utwórz nowego klienta w Stripe
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name!,
        metadata: {
          userId: session.user.id,
        },
      })
      customerId = customer.id

      // Zapisz customer ID w bazie (w subskrypcji lub bezpośrednio w użytkowniku)
      if (user?.subscription) {
        await prisma.subscription.update({
          where: { userId: session.user.id },
          data: { stripeCustomerId: customerId },
        })
      }
    }

    // Utwórz Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'pln',
            product_data: {
              name: 'Subskrypcja Miesięczna',
              description: 'Subskrypcja miesięczna do platformy kursów dotacyjnych',
            },
            recurring: {
              interval: 'month',
            },
            unit_amount: Math.round(monthlyPrice * 100), // Stripe używa groszy
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/subscription?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard/subscription?canceled=true`,
      metadata: {
        userId: session.user.id,
      },
    })

    return NextResponse.json({ 
      sessionId: checkoutSession.id,
      url: checkoutSession.url 
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { 
        error: 'Wystąpił błąd podczas tworzenia sesji płatności',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

