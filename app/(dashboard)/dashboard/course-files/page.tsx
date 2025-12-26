import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { FileText } from 'lucide-react'
import CourseFilesList from '@/components/courses/CourseFilesList'

async function getCourseFiles() {
  const courseFiles = await prisma.courseFile.findMany({
    include: {
      course: {
        select: {
          id: true,
          title: true,
          organizerId: true,
          organizer: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Filtruj tylko pliki PDF
  return courseFiles.filter(
    (file) => 
      file.mimeType === 'application/pdf' || 
      file.originalName.toLowerCase().endsWith('.pdf')
  )
}

export default async function CourseFilesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const files = await getCourseFiles()

  // Utwórz mapę organizatorów kursów dla sprawdzania uprawnień
  const courseOrganizers: Record<string, string> = {}
  files.forEach((file) => {
    courseOrganizers[file.course.id] = file.course.organizerId
  })

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="hero-background relative overflow-hidden">
        <div className="hero-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="mb-8 sm:mb-10 animate-fade-in-scale">
            <div className="glass rounded-2xl p-6 sm:p-8 shadow-xl">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3 drop-shadow-lg flex items-center space-x-3">
                <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-purple-400" />
                <span>Pliki z kursów</span>
              </h1>
              <p className="text-base sm:text-lg text-white drop-shadow-md">
                Przeglądaj i pobieraj wszystkie pliki PDF dodane do kursów
              </p>
            </div>
          </div>
        </div>
        {/* Dekoracyjne elementy */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl animate-float animate-pulse-custom"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl animate-float animate-delay-300"></div>
      </div>

      {/* Sekcja z plikami */}
      <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {files.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center border border-purple-500/30">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Brak plików PDF
              </h3>
              <p className="text-gray-400">
                Nie ma jeszcze żadnych plików PDF dodanych do kursów.
              </p>
            </div>
          ) : (
            <CourseFilesList
              files={files}
              userRole={session.user.role}
              userId={session.user.id}
              courseOrganizers={courseOrganizers}
            />
          )}
        </div>
      </div>
    </div>
  )
}


