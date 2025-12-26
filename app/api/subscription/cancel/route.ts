import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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
      return NextResponse.json(
        { error: 'Stripe nie jest skonfigurowany' },
        { status: 500 }
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

    // Jeśli subskrypcja jest w Stripe, anuluj ją tam
    if (subscription.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId)
      } catch (stripeError) {
        console.error('Error canceling Stripe subscription:', stripeError)
        // Kontynuuj z anulowaniem w bazie nawet jeśli Stripe zwróci błąd
      }
    }

    // Oznacz subskrypcję jako anulowaną w bazie
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

