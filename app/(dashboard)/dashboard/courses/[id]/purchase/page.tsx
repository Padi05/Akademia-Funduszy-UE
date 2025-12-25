import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import PurchaseCourseForm from '@/components/courses/PurchaseCourseForm'

async function getCourse(id: string) {
  try {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            name: true,
            email: true,
          },
        },
        videoFiles: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            purchases: true,
          },
        },
      },
    })
    return course
  } catch (error) {
    console.error('Error fetching course:', error)
    return null
  }
}

export default async function PurchaseCoursePage({
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

  if (!course.isOnlineCourse || !course.isPublished) {
    redirect('/dashboard/courses/online')
  }

  // Sprawdź czy użytkownik już kupił ten kurs
  const existingPurchase = await prisma.coursePurchase.findFirst({
    where: {
      courseId: params.id,
      userId: session.user.id,
    },
  })

  if (existingPurchase) {
    redirect(`/dashboard/courses/${params.id}/watch`)
  }

  // Sprawdź czy użytkownik jest organizatorem
  if (course.organizerId === session.user.id) {
    redirect(`/dashboard/courses/${params.id}/edit`)
  }

  return <PurchaseCourseForm course={course} />
}

