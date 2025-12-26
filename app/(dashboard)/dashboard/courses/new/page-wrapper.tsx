import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import NewCoursePage from './page'

export default async function NewCoursePageWrapper() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Tylko ADMIN może dodawać kursy
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return <NewCoursePage />
}

