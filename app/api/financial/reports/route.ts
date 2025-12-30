import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Pobierz raporty finansowe
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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const transactionType = searchParams.get('type')

    let where: any = {}

    // ADMIN widzi wszystkie transakcje, ORGANIZER tylko swoje
    if (session.user.role !== 'ADMIN') {
      where.organizerId = session.user.id
    }

    if (startDate || endDate) {
      where.paymentDate = {}
      if (startDate) {
        where.paymentDate.gte = new Date(startDate)
      }
      if (endDate) {
        where.paymentDate.lte = new Date(endDate)
      }
    }

    if (transactionType) {
      where.transactionType = transactionType
    }

    // Pobierz transakcje
    const transactions = await prisma.financialTransaction.findMany({
      where,
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
            packageType: true,
          },
        },
      },
      orderBy: {
        paymentDate: 'desc',
      },
    })

    // Oblicz statystyki
    const totalRevenue = transactions
      .filter(t => t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalCommission = transactions
      .filter(t => t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.commission, 0)

    const totalOrganizerEarnings = transactions
      .filter(t => t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.organizerEarnings, 0)

    // Statystyki według typu transakcji
    const statsByType = transactions
      .filter(t => t.status === 'COMPLETED')
      .reduce((acc, t) => {
        if (!acc[t.transactionType]) {
          acc[t.transactionType] = {
            count: 0,
            revenue: 0,
            commission: 0,
            organizerEarnings: 0,
          }
        }
        acc[t.transactionType].count++
        acc[t.transactionType].revenue += t.amount
        acc[t.transactionType].commission += t.commission
        acc[t.transactionType].organizerEarnings += t.organizerEarnings
        return acc
      }, {} as Record<string, { count: number; revenue: number; commission: number; organizerEarnings: number }>)

    return NextResponse.json({
      transactions,
      summary: {
        totalRevenue,
        totalCommission,
        totalOrganizerEarnings,
        totalTransactions: transactions.filter(t => t.status === 'COMPLETED').length,
        statsByType,
      },
    })
  } catch (error) {
    console.error('Error fetching financial reports:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania raportów finansowych' },
      { status: 500 }
    )
  }
}

