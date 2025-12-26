import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [totalUsers, totalCourses, activeSubscriptions, subscriptions] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          endDate: {
            gte: new Date(),
          },
        },
      }),
      prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
        },
      }),
    ])

    // Oblicz przychód z aktywnych subskrypcji (miesięczna cena * liczba aktywnych)
    const totalRevenue = subscriptions.reduce((sum, sub) => sum + sub.monthlyPrice, 0)

    return NextResponse.json({
      totalUsers,
      totalCourses,
      activeSubscriptions,
      totalRevenue,
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

