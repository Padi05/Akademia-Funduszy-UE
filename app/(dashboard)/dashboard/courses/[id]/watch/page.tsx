import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import WatchCourse from '@/components/courses/WatchCourse'

async function getCourse(id: string) {
  try {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            name: true,
          },
        },
        videoFiles: {
          orderBy: { order: 'asc' },
        },
      },
    })
    return course
  } catch (error) {
    console.error('Error fetching course:', error)
    return null
  }
}

export default async function WatchCoursePage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const course = await getCourse(params.id)

  if (!course) {
    notFound()
  }

  if (!course.isOnlineCourse) {
    redirect(`/courses/${params.id}`)
  }

  // Sprawdź dostęp
  const hasAccess =
    course.organizerId === session.user.id ||
    (await prisma.coursePurchase.findFirst({
      where: {
        courseId: params.id,
        userId: session.user.id,
      },
    })) !== null

  if (!hasAccess) {
    redirect(`/dashboard/courses/${params.id}/purchase`)
  }

  return <WatchCourse course={course} />
}

