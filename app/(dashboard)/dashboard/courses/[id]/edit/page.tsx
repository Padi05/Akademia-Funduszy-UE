import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import EditCourseForm from '@/components/courses/EditCourseForm'

async function getCourse(courseId: string, userId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      files: true,
      videoFiles: {
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!course || course.organizerId !== userId) {
    return null
  }

  return course
}

export default async function EditCoursePage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ORGANIZER') {
    redirect('/dashboard')
  }

  const course = await getCourse(params.id, session.user.id)

  if (!course) {
    redirect('/dashboard')
  }

  return <EditCourseForm course={course} />
}

