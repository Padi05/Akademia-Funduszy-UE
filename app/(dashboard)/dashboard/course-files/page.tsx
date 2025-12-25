import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { FileText, Download, Calendar, User, BookOpen } from 'lucide-react'
import Link from 'next/link'

async function getCourseFiles() {
  const courseFiles = await prisma.courseFile.findMany({
    include: {
      course: {
        select: {
          id: true,
          title: true,
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

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function CourseFilesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const files = await getCourseFiles()

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
            <div className="space-y-4">
              <div className="glass rounded-2xl p-6 border border-purple-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">
                    Wszystkie pliki PDF ({files.length})
                  </h2>
                </div>

                <div className="grid gap-4">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-purple-500/50 transition-all hover:bg-gray-800/70"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <FileText className="h-5 w-5 text-purple-400 flex-shrink-0" />
                            <h3 className="text-lg font-semibold text-white">
                              {file.originalName}
                            </h3>
                          </div>

                          <div className="ml-8 space-y-2">
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <div className="flex items-center space-x-1">
                                <BookOpen className="h-4 w-4" />
                                <span>
                                  Kurs:{' '}
                                  <Link
                                    href={`/courses/${file.course.id}`}
                                    className="text-purple-400 hover:text-purple-300 transition-colors"
                                  >
                                    {file.course.title}
                                  </Link>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <div className="flex items-center space-x-1">
                                <User className="h-4 w-4" />
                                <span>
                                  Organizator: {file.course.organizer.name}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>Dodano: {formatDate(file.createdAt)}</span>
                              </div>
                              <span>•</span>
                              <span>Rozmiar: {formatFileSize(file.size)}</span>
                            </div>
                          </div>
                        </div>

                        <a
                          href={`/api/courses/${file.course.id}/files/${file.id}/download`}
                          download={file.originalName}
                          className="ml-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 flex-shrink-0"
                        >
                          <Download className="h-4 w-4" />
                          <span className="hidden sm:inline">Pobierz</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

