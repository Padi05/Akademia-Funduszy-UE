'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Download, Calendar, User, BookOpen, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface CourseFile {
  id: string
  originalName: string
  size: number
  createdAt: Date | string
  course: {
    id: string
    title: string
    organizer: {
      name: string
      email: string
    }
  }
}

interface CourseFilesListProps {
  files: CourseFile[]
  userRole: string
  userId: string
  courseOrganizers: Record<string, string> // courseId -> organizerId
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function CourseFilesList({ files, userRole, userId, courseOrganizers }: CourseFilesListProps) {
  const router = useRouter()
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canDeleteFile = (file: CourseFile) => {
    // ADMIN może usuwać wszystkie pliki
    if (userRole === 'ADMIN') return true
    // Organizator może usuwać pliki ze swoich kursów
    if (userRole === 'ORGANIZER' && courseOrganizers[file.course.id] === userId) return true
    return false
  }

  const handleDelete = async (file: CourseFile) => {
    if (!canDeleteFile(file)) {
      setError('Brak uprawnień do usunięcia tego pliku')
      return
    }

    if (!confirm(`Czy na pewno chcesz usunąć plik "${file.originalName}"?`)) {
      return
    }

    setDeletingFileId(file.id)
    setError(null)

    try {
      const response = await fetch(`/api/courses/${file.course.id}/files/${file.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Wystąpił błąd podczas usuwania pliku')
        setDeletingFileId(null)
        return
      }

      // Odśwież stronę po usunięciu
      router.refresh()
    } catch (err) {
      setError('Wystąpił błąd podczas usuwania pliku')
      setDeletingFileId(null)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      <div className="glass rounded-2xl p-6 border border-purple-500/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">
            Wszystkie pliki PDF ({files.length})
          </h2>
        </div>

        <div className="grid gap-4">
          {files.map((file) => {
            const canDelete = canDeleteFile(file)
            const isDeleting = deletingFileId === file.id

            return (
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

                  <div className="ml-4 flex items-center space-x-2 flex-shrink-0">
                    <a
                      href={`/api/courses/${file.course.id}/files/${file.id}/download`}
                      download={file.originalName}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Pobierz</span>
                    </a>
                    
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(file)}
                        disabled={isDeleting}
                        className="px-4 py-2 bg-red-900/50 text-red-300 rounded-lg hover:bg-red-800/50 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/30"
                        title="Usuń plik"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          {isDeleting ? 'Usuwanie...' : 'Usuń'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

