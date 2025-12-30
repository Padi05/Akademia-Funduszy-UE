import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Pobierz statystyki finansowe organizatora
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Brak autoryzacji' },
        { status: 401 }
      )
    }

    // Tylko ORGANIZER i ADMIN mogą zobaczyć statystyki
    if (session.user.role !== 'ORGANIZER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Brak uprawnień' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const organizerId = searchParams.get('organizerId') || session.user.id

    // Tylko ADMIN może sprawdzać statystyki innych organizatorów
    if (organizerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Brak uprawnień' },
        { status: 403 }
      )
    }

    // Pobierz transakcje organizatora
    const transactions = await prisma.financialTransaction.findMany({
      where: {
        organizerId,
        status: 'COMPLETED',
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
        consultation: {
          select: {
            id: true,
            title: true,
          },
        },
        companyPackage: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    })

    // Statystyki według typu
    const courseLiveStats = transactions
      .filter(t => t.transactionType === 'COURSE_LIVE')
      .reduce(
        (acc, t) => {
          acc.count++
          acc.revenue += t.amount
          acc.commission += t.commission
          acc.earnings += t.organizerEarnings
          return acc
        },
        { count: 0, revenue: 0, commission: 0, earnings: 0 }
      )

    const courseOnlineStats = transactions
      .filter(t => t.transactionType === 'COURSE_ONLINE')
      .reduce(
        (acc, t) => {
          acc.count++
          acc.revenue += t.amount
          acc.commission += t.commission
          acc.earnings += t.organizerEarnings
          return acc
        },
        { count: 0, revenue: 0, commission: 0, earnings: 0 }
      )

    const consultationStats = transactions
      .filter(t => t.transactionType === 'CONSULTATION')
      .reduce(
        (acc, t) => {
          acc.count++
          acc.revenue += t.amount
          acc.commission += t.commission
          acc.earnings += t.organizerEarnings
          return acc
        },
        { count: 0, revenue: 0, commission: 0, earnings: 0 }
      )

    const companyPackageStats = transactions
      .filter(t => t.transactionType === 'COMPANY_PACKAGE')
      .reduce(
        (acc, t) => {
          acc.count++
          acc.revenue += t.amount
          acc.commission += t.commission
          acc.earnings += t.organizerEarnings
          return acc
        },
        { count: 0, revenue: 0, commission: 0, earnings: 0 }
      )

    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0)
    const totalCommission = transactions.reduce((sum, t) => sum + t.commission, 0)
    const totalEarnings = transactions.reduce((sum, t) => sum + t.organizerEarnings, 0)

    return NextResponse.json({
      organizerId,
      summary: {
        totalRevenue,
        totalCommission,
        totalEarnings,
        totalTransactions: transactions.length,
      },
      byType: {
        courseLive: courseLiveStats,
        courseOnline: courseOnlineStats,
        consultation: consultationStats,
        companyPackage: companyPackageStats,
      },
      recentTransactions: transactions.slice(0, 10),
    })
  } catch (error) {
    console.error('Error fetching organizer stats:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania statystyk' },
      { status: 500 }
    )
  }
}

