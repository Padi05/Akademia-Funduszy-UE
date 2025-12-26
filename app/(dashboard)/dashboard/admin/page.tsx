import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminDashboard from '@/components/dashboard/AdminDashboard'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="hero-background relative overflow-hidden">
        <div className="hero-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="mb-8 sm:mb-10 animate-fade-in-scale">
            <div className="glass rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-2 sm:mb-3">
                <div className="bg-red-600/20 p-3 rounded-lg border border-red-500/50">
                  <svg className="h-6 w-6 sm:h-8 sm:w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">
                  Panel Administratora
                </h1>
              </div>
              <p className="text-base sm:text-lg text-white drop-shadow-md">
                Zarządzaj użytkownikami, kursami i subskrypcjami
              </p>
            </div>
          </div>
        </div>
        {/* Dekoracyjne elementy */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-red-500/30 rounded-full blur-2xl animate-float animate-pulse-custom"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-red-400/20 rounded-full blur-2xl animate-float animate-delay-300"></div>
      </div>

      {/* Sekcja z zawartością */}
      <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <AdminDashboard />
        </div>
      </div>
    </div>
  )
}

