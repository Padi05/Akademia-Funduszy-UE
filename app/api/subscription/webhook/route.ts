import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Wyłącz parsowanie body, ponieważ Stripe wymaga surowego body do weryfikacji podpisu
export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Brak podpisu Stripe' },
      { status: 400 }
    )
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET nie jest ustawiony')
    return NextResponse.json(
      { error: 'Webhook secret nie jest skonfigurowany' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Nieprawidłowy podpis webhook' },
      { status: 400 }
    )
  }

  try {
    // Obsługa różnych typów zdarzeń Stripe
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          
          const userId = session.metadata?.userId || subscription.metadata?.userId
          
          if (!userId) {
            console.error('Brak userId w metadanych sesji')
            break
          }

          // Utwórz lub zaktualizuj subskrypcję w bazie
          const now = new Date()
          const endDate = new Date(subscription.current_period_end * 1000)
          
          await prisma.subscription.upsert({
            where: { userId },
            create: {
              userId,
              status: 'ACTIVE',
              startDate: new Date(subscription.current_period_start * 1000),
              endDate,
              monthlyPrice: (subscription.items.data[0]?.price.unit_amount || 2999) / 100,
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: subscription.customer as string,
            },
            update: {
              status: 'ACTIVE',
              startDate: new Date(subscription.current_period_start * 1000),
              endDate,
              monthlyPrice: (subscription.items.data[0]?.price.unit_amount || 2999) / 100,
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: subscription.customer as string,
            },
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        
        if (!userId) {
          console.error('Brak userId w metadanych subskrypcji')
          break
        }

        const endDate = new Date(subscription.current_period_end * 1000)
        const isActive = subscription.status === 'active'

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: isActive ? 'ACTIVE' : 'CANCELLED',
            endDate,
            monthlyPrice: (subscription.items.data[0]?.price.unit_amount || 2999) / 100,
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: 'CANCELLED',
          },
        })
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          )
          
          const endDate = new Date(subscription.current_period_end * 1000)
          
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: subscription.id },
            data: {
              status: 'ACTIVE',
              endDate,
            },
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          await prisma.subscription.updateMany({
            where: { stripeSubscriptionId: invoice.subscription as string },
            data: {
              status: 'EXPIRED',
            },
          })
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Błąd podczas przetwarzania webhook' },
      { status: 500 }
    )
  }
}

