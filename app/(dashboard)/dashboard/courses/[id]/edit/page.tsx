import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import EditCourseForm from '@/components/courses/EditCourseForm'

async function getCourse(courseId: string, isAdmin: boolean) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      files: true,
      videoFiles: {
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!course) {
    return null
  }

  // ADMIN może edytować każdy kurs, nie sprawdzamy organizerId
  return course
}

export default async function EditCoursePage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  // Tylko ADMIN może edytować kursy
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const course = await getCourse(params.id, session.user.role === 'ADMIN')

  if (!course) {
    redirect('/dashboard')
  }

  return <EditCourseForm course={course} />
}

