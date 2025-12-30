import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import FinancialDashboard from '@/components/financial/FinancialDashboard'

export default async function FinancialPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Tylko ORGANIZER i ADMIN mogą zobaczyć panel finansowy
  if (session.user.role !== 'ORGANIZER' && session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <FinancialDashboard />
    </div>
  )
}

