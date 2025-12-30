'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface FinancialStats {
  totalRevenue: number
  totalCommission: number
  totalEarnings: number
  totalTransactions: number
  byType: {
    courseLive: { count: number; revenue: number; commission: number; earnings: number }
    courseOnline: { count: number; revenue: number; commission: number; earnings: number }
    consultation: { count: number; revenue: number; commission: number; earnings: number }
    companyPackage: { count: number; revenue: number; commission: number; earnings: number }
  }
  recentTransactions: any[]
}

export default function FinancialDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<FinancialStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/financial/organizer-stats')
      if (!response.ok) {
        throw new Error('Błąd podczas pobierania statystyk')
      }
      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Ładowanie statystyk finansowych...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Panel Finansowy</h2>
        <p className="text-gray-600">Przegląd przychodów, prowizji i zarobków</p>
      </div>

      {/* Statystyki ogólne */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Całkowity przychód</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(stats.totalRevenue)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Prowizja platformy</div>
          <div className="text-2xl font-bold text-red-600 mt-2">
            {formatCurrency(stats.totalCommission)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Twoje zarobki</div>
          <div className="text-2xl font-bold text-green-600 mt-2">
            {formatCurrency(stats.totalEarnings)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Transakcje</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {stats.totalTransactions}
          </div>
        </div>
      </div>

      {/* Statystyki według typu */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Statystyki według typu</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {/* Kursy stacjonarne */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="font-medium text-gray-900 mb-2">Kursy stacjonarne (LIVE)</h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Liczba:</span>
                  <span className="ml-2 font-medium">{stats.byType.courseLive.count}</span>
                </div>
                <div>
                  <span className="text-gray-500">Przychód:</span>
                  <span className="ml-2 font-medium">{formatCurrency(stats.byType.courseLive.revenue)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Prowizja:</span>
                  <span className="ml-2 font-medium text-red-600">{formatCurrency(stats.byType.courseLive.commission)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Zarobki:</span>
                  <span className="ml-2 font-medium text-green-600">{formatCurrency(stats.byType.courseLive.earnings)}</span>
                </div>
              </div>
            </div>

            {/* Kursy online */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="font-medium text-gray-900 mb-2">Kursy online (Evergreen)</h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Liczba:</span>
                  <span className="ml-2 font-medium">{stats.byType.courseOnline.count}</span>
                </div>
                <div>
                  <span className="text-gray-500">Przychód:</span>
                  <span className="ml-2 font-medium">{formatCurrency(stats.byType.courseOnline.revenue)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Prowizja:</span>
                  <span className="ml-2 font-medium text-red-600">{formatCurrency(stats.byType.courseOnline.commission)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Zarobki:</span>
                  <span className="ml-2 font-medium text-green-600">{formatCurrency(stats.byType.courseOnline.earnings)}</span>
                </div>
              </div>
            </div>

            {/* Konsultacje */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="font-medium text-gray-900 mb-2">Konsultacje 1:1</h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Liczba:</span>
                  <span className="ml-2 font-medium">{stats.byType.consultation.count}</span>
                </div>
                <div>
                  <span className="text-gray-500">Przychód:</span>
                  <span className="ml-2 font-medium">{formatCurrency(stats.byType.consultation.revenue)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Prowizja:</span>
                  <span className="ml-2 font-medium text-red-600">{formatCurrency(stats.byType.consultation.commission)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Zarobki:</span>
                  <span className="ml-2 font-medium text-green-600">{formatCurrency(stats.byType.consultation.earnings)}</span>
                </div>
              </div>
            </div>

            {/* Pakiety firmowe */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Pakiety premium dla firm</h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Liczba:</span>
                  <span className="ml-2 font-medium">{stats.byType.companyPackage.count}</span>
                </div>
                <div>
                  <span className="text-gray-500">Przychód:</span>
                  <span className="ml-2 font-medium">{formatCurrency(stats.byType.companyPackage.revenue)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Prowizja:</span>
                  <span className="ml-2 font-medium text-red-600">{formatCurrency(stats.byType.companyPackage.commission)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Zarobki:</span>
                  <span className="ml-2 font-medium text-green-600">{formatCurrency(stats.byType.companyPackage.earnings)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ostatnie transakcje */}
      {stats.recentTransactions.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Ostatnie transakcje</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Typ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kwota
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prowizja
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zarobki
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.transactionType === 'COURSE_LIVE' && 'Kurs stacjonarny'}
                      {transaction.transactionType === 'COURSE_ONLINE' && 'Kurs online'}
                      {transaction.transactionType === 'CONSULTATION' && 'Konsultacja'}
                      {transaction.transactionType === 'COMPANY_PACKAGE' && 'Pakiet firmowy'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {formatCurrency(transaction.commission)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {formatCurrency(transaction.organizerEarnings)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.paymentDate
                        ? new Date(transaction.paymentDate).toLocaleDateString('pl-PL')
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

