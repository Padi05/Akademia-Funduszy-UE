import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import NewCoursePage from './page-client'

export default async function NewCoursePageWrapper() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // ADMIN i ORGANIZER mogą dodawać kursy
  if (session.user.role !== 'ADMIN' && session.user.role !== 'ORGANIZER') {
    redirect('/dashboard')
  }

  // Sprawdź subskrypcję dla organizatorów
  if (session.user.role === 'ORGANIZER') {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (!subscription) {
      // Brak subskrypcji - przekieruj do subskrypcji
      redirect('/dashboard/subscription')
    }

    // Sprawdź czy subskrypcja jest aktywna
    const now = new Date()
    const isExpired = subscription.endDate < now
    const isActive = subscription.status === 'ACTIVE' && !isExpired

    if (!isActive) {
      // Subskrypcja wygasła - przekieruj do subskrypcji
      redirect('/dashboard/subscription')
    }
  }

  return <NewCoursePage />
}

