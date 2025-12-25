import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Play, DollarSign, Users, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale/pl'

async function getOnlineCourses() {
  try {
    const courses = await prisma.course.findMany({
      where: {
        isOnlineCourse: true,
        isPublished: true,
      },
      include: {
        organizer: {
          select: {
            name: true,
          },
        },
        videoFiles: true,
        _count: {
          select: {
            purchases: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return courses
  } catch (error) {
    console.error('Error fetching online courses:', error)
    return []
  }
}

export default async function OnlineCoursesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const courses = await getOnlineCourses()
  const userPurchases = session.user.id
    ? await prisma.coursePurchase.findMany({
        where: { userId: session.user.id },
        select: { courseId: true },
      })
    : []

  const purchasedCourseIds = new Set(userPurchases.map((p: { courseId: string }) => p.courseId))

  return (
    <div className="min-h-screen">
      <div className="hero-background relative overflow-hidden">
        <div className="hero-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-white hover:text-purple-300 mb-8 transition-colors drop-shadow-md"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Powrót do dashboardu
          </Link>

          <div className="glass rounded-2xl shadow-xl p-8 border border-purple-500/30 backdrop-blur-xl">
            <h1 className="text-4xl font-bold text-white mb-4 gradient-text">
              Kursy Online
            </h1>
            <p className="text-lg text-gray-200">
              Przeglądaj i kupuj dostępne kursy online
            </p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {courses.length === 0 ? (
            <div className="text-center py-20">
              <div className="glass rounded-2xl p-12 max-w-md mx-auto shadow-2xl border border-purple-500/30">
                <div className="text-6xl mb-6 animate-float">🎥</div>
                <p className="text-gray-100 text-lg mb-8 font-medium">
                  Brak dostępnych kursów online w tym momencie.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course: {
                id: string
                title: string
                description: string
                onlinePrice: number | null
                videoFiles: Array<{ id: string }>
                _count: { purchases: number }
              }) => {
                const isPurchased = purchasedCourseIds.has(course.id)
                return (
                  <div
                    key={course.id}
                    className="glass rounded-xl shadow-xl hover-lift p-6 border border-purple-500/30 animate-fade-in-smooth group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-white flex-1 group-hover:text-purple-300 transition-all duration-300">
                        {course.title}
                      </h3>
                      {isPurchased && (
                        <span className="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-xs font-semibold border border-green-500/50">
                          Zakupiony
                        </span>
                      )}
                    </div>

                    <p className="text-gray-100 mb-6 line-clamp-3 text-sm leading-relaxed">
                      {course.description}
                    </p>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-white bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700">
                        <DollarSign className="h-5 w-5 mr-3 text-purple-300" />
                        <span className="font-bold text-lg text-purple-200">
                          {course.onlinePrice || 100} zł
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-white bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700">
                        <Play className="h-5 w-5 mr-3 text-purple-300" />
                        <span className="font-medium">
                          {course.videoFiles.length} {course.videoFiles.length === 1 ? 'wideo' : 'wideo'}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-white bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700">
                        <Users className="h-5 w-5 mr-3 text-purple-300" />
                        <span className="font-medium">
                          {course._count.purchases} {course._count.purchases === 1 ? 'zakup' : 'zakupów'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-700">
                      {isPurchased ? (
                        <Link
                          href={`/dashboard/courses/${course.id}/watch`}
                          className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2 shadow-lg hover-lift transition-all font-semibold"
                        >
                          <Play className="h-5 w-5" />
                          <span>Oglądaj kurs</span>
                        </Link>
                      ) : (
                        <Link
                          href={`/dashboard/courses/${course.id}/purchase`}
                          className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2 shadow-lg hover-lift transition-all font-semibold"
                        >
                          <DollarSign className="h-5 w-5" />
                          <span>Kup kurs</span>
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

