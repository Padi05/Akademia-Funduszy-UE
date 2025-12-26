import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale/pl'
import { Calendar, MapPin, Monitor, User, Mail, FileText, ArrowLeft, LogIn, UserPlus, Edit } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import DeleteCourseButton from '@/components/courses/DeleteCourseButton'

export const revalidate = 60 // Revalidate every 60 seconds

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
        files: true,
      },
    })
    return course
  } catch (error) {
    console.error('Error fetching course:', error)
    return null
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const course = await getCourse(params.id)
  const session = await getServerSession(authOptions)
  const isAdmin = session?.user?.role === 'ADMIN'

  if (!course) {
    notFound()
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section z tłem */}
      <div className="hero-background relative overflow-hidden">
        {/* Animowane elementy w tle */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl animate-float animate-pulse-custom"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl animate-float animate-delay-300"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gray-600/20 rounded-full blur-xl animate-float animate-delay-200"></div>
        <div className="absolute bottom-1/3 right-1/4 w-28 h-28 bg-purple-600/30 rounded-full blur-xl animate-float animate-delay-100"></div>

        <div className="hero-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-white hover:text-purple-300 transition-colors drop-shadow-md text-sm sm:text-base"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Powrót do strony głównej</span>
              <span className="sm:hidden">Powrót</span>
            </Link>
            {isAdmin && (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href={`/dashboard/courses/${course.id}/edit`}
                  className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg text-sm sm:text-base"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Edytuj kurs</span>
                  <span className="sm:hidden">Edytuj</span>
                </Link>
                <DeleteCourseButton courseId={course.id} />
              </div>
            )}
          </div>

          <div className="glass rounded-2xl shadow-xl p-6 sm:p-8 border border-purple-500/30 backdrop-blur-xl">
            <div className="flex items-start justify-between mb-4 sm:mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
                  {course.type === 'ONLINE' ? (
                    <Monitor className="h-5 w-5 sm:h-6 sm:w-6 text-purple-300" />
                  ) : (
                    <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-purple-300" />
                  )}
                  <span
                    className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-sm ${
                      course.type === 'ONLINE'
                        ? 'bg-purple-900/50 text-purple-300 border border-purple-500'
                        : 'bg-gray-700 text-gray-300 border border-gray-600'
                    }`}
                  >
                    {course.type === 'ONLINE' ? '💻 Online' : '📍 Stacjonarny'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 drop-shadow-lg">
                  {course.title}
                </h1>
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              <p className="text-base sm:text-lg text-gray-100 leading-relaxed mb-6 sm:mb-8">
                {course.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sekcja z szczegółami */}
      <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Główna kolumna z informacjami */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informacje o kursie */}
              <div className="glass rounded-2xl shadow-xl p-6 sm:p-8 border border-purple-500/30">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 gradient-text">
                  Szczegóły kursu
                </h2>

                <div className="space-y-4">
                  <div className="flex items-start p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:bg-purple-900/20 transition-colors">
                    <Calendar className="h-6 w-6 mr-4 text-purple-300 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-sm text-gray-300 mb-1">Data rozpoczęcia</p>
                      <p className="text-lg font-semibold text-white">
                        {format(new Date(course.startDate), 'd MMMM yyyy, HH:mm', {
                          locale: pl,
                        })}
                      </p>
                      {course.endDate && (
                        <>
                          <p className="text-sm text-gray-300 mt-2 mb-1">Data zakończenia</p>
                          <p className="text-lg font-semibold text-white">
                            {format(new Date(course.endDate), 'd MMMM yyyy, HH:mm', {
                              locale: pl,
                            })}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:bg-purple-900/20 transition-colors">
                    <div>
                      <p className="text-sm text-gray-300 mb-1">Cena kursu</p>
                      <p className="text-2xl font-bold text-purple-200">{course.price} zł</p>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-500/50">
                    <p className="text-sm text-gray-200 mb-2">
                      <span className="font-semibold text-purple-200">💰 Dofinansowanie:</span>
                    </p>
                    <p className="text-base text-white leading-relaxed">
                      {course.fundingInfo}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pliki kursu */}
              {course.files.length > 0 && (
                <div className="glass rounded-2xl shadow-xl p-6 sm:p-8 border border-purple-500/30">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 gradient-text">
                    Materiały do pobrania
                  </h2>
                  <div className="space-y-3">
                    {course.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:bg-purple-900/20 transition-colors"
                      >
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 mr-3 text-purple-300" />
                          <span className="text-white font-medium">{file.originalName}</span>
                        </div>
                        <a
                          href={`/api/courses/${course.id}/files/${file.id}/download`}
                          className="text-purple-300 hover:text-purple-200 font-semibold hover:underline transition-colors"
                        >
                          Pobierz
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Boczna kolumna z akcjami */}
            <div className="space-y-4 sm:space-y-6">
              {/* Przycisk zapisu */}
              <div className="glass rounded-2xl shadow-xl p-6 sm:p-8 border border-purple-500/30 text-center">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">
                  Zainteresowany tym kursem?
                </h3>
                <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6">
                  Zarejestruj się lub zaloguj, aby zapisać się na kurs
                </p>
                <div className="space-y-2 sm:space-y-3">
                  <Link
                    href={`/register?course=${course.id}`}
                    className="w-full bg-purple-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2 shadow-lg hover-lift transition-all font-semibold text-sm sm:text-base"
                  >
                    <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Zarejestruj się</span>
                  </Link>
                  <Link
                    href={`/login?course=${course.id}`}
                    className="w-full bg-gray-700 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg hover:bg-gray-600 flex items-center justify-center space-x-2 shadow-lg hover-lift transition-all font-semibold border border-purple-500/50 text-sm sm:text-base"
                  >
                    <LogIn className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Zaloguj się</span>
                  </Link>
                </div>
              </div>

              {/* Informacje o organizatorze */}
              <div className="glass rounded-2xl shadow-xl p-6 sm:p-8 border border-purple-500/30">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 gradient-text">
                  Organizator
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <User className="h-5 w-5 mr-3 text-purple-300" />
                    <div>
                      <p className="text-sm text-gray-300">Nazwa</p>
                      <p className="text-white font-semibold">{course.organizer.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <Mail className="h-5 w-5 mr-3 text-purple-300" />
                    <div>
                      <p className="text-sm text-gray-300">Email</p>
                      <a
                        href={`mailto:${course.organizer.email}`}
                        className="text-purple-300 hover:text-purple-200 font-semibold hover:underline transition-colors"
                      >
                        {course.organizer.email}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

