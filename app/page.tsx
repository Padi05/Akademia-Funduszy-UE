import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale/pl'
import { Calendar, MapPin, Monitor } from 'lucide-react'

export const revalidate = 60 // Revalidate every 60 seconds

async function getCourses() {
  try {
    const courses = await prisma.course.findMany({
      where: {
        // Pokaż tylko opublikowane kursy:
        // - Kursy stacjonarne (są automatycznie publikowane)
        // - Kursy online które są opublikowane
        OR: [
          { isOnlineCourse: false, isPublished: true },
          { isOnlineCourse: true, isPublished: true },
        ],
      },
      include: {
        organizer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return courses
  } catch (error) {
    console.error('Error fetching courses:', error)
    return []
  }
}

export default async function HomePage() {
  const courses = await getCourses()

  return (
    <div className="min-h-screen">
      {/* Hero Section z jednolitym tłem */}
      <div className="hero-background relative overflow-hidden">
        <div className="hero-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="text-center animate-fade-in-smooth">
            <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 animate-fade-in-smooth px-2" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)' }}>
                <span className="animate-gradient-text inline-block">
                  {'Znajdź Idealny Kurs'.split('').map((letter, index) => (
                    <span
                      key={index}
                      className="letter-animated"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {letter === ' ' ? '\u00A0' : letter}
                    </span>
                  ))}
                </span>
              </h1>
            </div>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white max-w-3xl mx-auto mb-6 sm:mb-10 px-4 drop-shadow-lg animate-fade-in-smooth animate-delay-200">
              Przeglądaj dostępne kursy dotacyjne i znajdź coś dla siebie. 
              Rozwijaj się z najlepszymi programami szkoleniowymi.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center px-4 animate-fade-in-smooth animate-delay-300">
              <a
                href="#courses"
                className="group bg-purple-600 text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 rounded-xl font-bold text-base sm:text-lg w-full sm:w-auto hover-lift shadow-2xl hover:bg-purple-700 transition-all duration-500 transform hover:scale-105 sm:hover:scale-110 hover:shadow-purple-500/50 relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Przeglądaj Kursy
                  <span className="ml-2 transform group-hover:translate-x-1 transition-transform duration-300">→</span>
                </span>
                <span className="absolute inset-0 bg-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></span>
              </a>
              <a
                href="/register"
                className="group bg-gray-800 text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 rounded-xl font-bold text-base sm:text-lg w-full sm:w-auto hover-lift shadow-2xl hover:bg-gray-700 transition-all duration-500 transform hover:scale-105 sm:hover:scale-110 hover:shadow-purple-500/30 relative overflow-hidden border border-purple-500"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Dołącz Teraz
                  <span className="ml-2 transform group-hover:translate-x-1 transition-transform duration-300">→</span>
                </span>
                <span className="absolute inset-0 bg-gray-700 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></span>
              </a>
            </div>
          </div>
        </div>
        {/* Dekoracyjne animowane elementy */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl animate-float-slow"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl animate-float-slow animate-delay-300"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gray-600/20 rounded-full blur-xl animate-float animate-delay-200"></div>
        <div className="absolute bottom-1/3 right-1/4 w-28 h-28 bg-purple-600/30 rounded-full blur-xl animate-float animate-delay-100"></div>
        <div className="absolute top-1/3 right-1/3 w-36 h-36 bg-purple-500/15 rounded-full blur-3xl animate-float-slow animate-delay-400"></div>
        <div className="absolute bottom-1/4 left-1/3 w-44 h-44 bg-gray-700/20 rounded-full blur-3xl animate-float-slow animate-delay-500"></div>
        <div className="absolute top-1/4 left-1/2 w-20 h-20 bg-purple-400/25 rounded-full blur-xl animate-float animate-delay-400"></div>
        <div className="absolute bottom-1/2 right-1/5 w-28 h-28 bg-gray-500/15 rounded-full blur-2xl animate-float animate-delay-500"></div>
      </div>

      {/* Sekcja z kursami */}
      <div id="courses" className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16 animate-fade-in-smooth px-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold gradient-text mb-4 sm:mb-6 animate-fade-in-smooth">
              Dostępne Kursy
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-100 max-w-2xl mx-auto animate-fade-in-smooth animate-delay-200">
              Wybierz kurs, który najlepiej odpowiada Twoim potrzebom
            </p>
          </div>

        {courses.length === 0 ? (
        <div className="text-center py-12 sm:py-16 lg:py-20 animate-fade-in-scale px-4">
          <div className="glass rounded-2xl p-6 sm:p-8 lg:p-12 max-w-md mx-auto shadow-2xl border border-purple-500/30">
            <div className="text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6 animate-float">📚</div>
            <p className="text-gray-100 text-base sm:text-lg mb-6 sm:mb-8 font-medium">
              Brak dostępnych kursów w tym momencie.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                href="/register"
                className="inline-block bg-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-purple-700 transition-all hover-lift shadow-xl font-semibold transform hover:scale-105 text-sm sm:text-base"
              >
                Zarejestruj się
              </Link>
              <Link
                href="/login"
                className="inline-block bg-gray-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-gray-600 transition-all hover-lift shadow-xl font-semibold transform hover:scale-105 border border-purple-500/50 text-sm sm:text-base"
              >
                Zaloguj się
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {courses.map((course, index) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="glass rounded-xl shadow-xl hover-lift p-4 sm:p-6 border border-purple-500/30 animate-fade-in-smooth group cursor-pointer block transition-all duration-300 hover:border-purple-400 hover:shadow-2xl"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex-1 group-hover:text-purple-300 transition-all duration-500 transform group-hover:scale-105 group-hover:translate-x-1">
                  {course.title}
                </h2>
                <span
                  className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                    course.type === 'ONLINE'
                      ? 'bg-purple-900/50 text-purple-300 border border-purple-500'
                      : 'bg-gray-700 text-gray-300 border border-gray-600'
                  }`}
                >
                  {course.type === 'ONLINE' ? '💻 Online' : '📍 Stacjonarny'}
                </span>
              </div>

              <p className="text-gray-100 mb-6 line-clamp-3 leading-relaxed">
                {course.description}
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-white bg-gray-800/50 rounded-lg px-3 py-2 hover:bg-purple-900/30 transition-colors group/item border border-gray-700">
                  <Calendar className="h-5 w-5 mr-3 text-purple-300" />
                  <span className="font-medium text-white">
                    {format(new Date(course.startDate), 'd MMMM yyyy', {
                      locale: pl,
                    })}
                  </span>
                </div>
                <div className="flex items-center text-sm text-white bg-gray-800/50 rounded-lg px-3 py-2 hover:bg-purple-900/30 transition-colors group/item border border-gray-700">
                  <span className="font-bold text-lg text-purple-200">{course.price} zł</span>
                </div>
              </div>

              <div className="mb-6 p-4 bg-purple-900/30 rounded-lg border border-purple-500/50">
                <p className="text-sm text-white">
                  <span className="font-semibold text-purple-200">💰 Dofinansowanie:</span>{' '}
                  <span className="text-gray-100">{course.fundingInfo}</span>
                </p>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-200 flex items-center">
                  <span className="font-medium text-gray-100 mr-2">Organizator:</span>
                  <span className="text-white">{course.organizer.name}</span>
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-sm text-purple-300 font-semibold group-hover:text-purple-200 transition-all duration-300 transform group-hover:translate-x-2 inline-block">
                  Kliknij, aby zobaczyć szczegóły →
                </p>
              </div>
            </Link>
          ))}
        </div>
        )}
        </div>
      </div>
    </div>
  )
}

