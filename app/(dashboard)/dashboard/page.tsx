import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import OrganizerDashboard from '@/components/dashboard/OrganizerDashboard'
import ParticipantDashboard from '@/components/dashboard/ParticipantDashboard'

async function getOrganizerData(userId: string) {
  const courses = await prisma.course.findMany({
    where: { organizerId: userId },
    include: {
      files: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
  return courses
}

async function getParticipantData(userId: string) {
  const files = await prisma.userFile.findMany({
    where: { userId },
    orderBy: {
      createdAt: 'desc',
    },
  })
  return files
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section z tłem jak na stronie głównej */}
      <div className="hero-background relative overflow-hidden">
        <div className="hero-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="mb-8 sm:mb-10 animate-fade-in-scale">
            <div className="glass rounded-2xl p-6 sm:p-8 shadow-xl">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3 drop-shadow-lg">
                Witaj, {session.user.name}! 👋
              </h1>
            <p className="text-base sm:text-lg text-white drop-shadow-md">
              {session.user.role === 'ORGANIZER'
                ? 'Zarządzaj swoimi kursami dotacyjnymi i rozwijaj swoją działalność'
                : 'Przeglądaj dostępne kursy i zarządzaj dokumentami'}
            </p>
            </div>
          </div>
        </div>
        {/* Dekoracyjne elementy */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl animate-float animate-pulse-custom"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl animate-float animate-delay-300"></div>
      </div>

      {/* Sekcja z zawartością */}
      <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

          {session.user.role === 'ORGANIZER' ? (
            <OrganizerDashboard courses={await getOrganizerData(session.user.id)} />
          ) : (
            <ParticipantDashboard
              files={await getParticipantData(session.user.id)}
              hasBurEntry={session.user.hasBurEntry}
            />
          )}
        </div>
      </div>
    </div>
  )
}

