'use client'

import { useState } from 'react'
import { Download, Trash2, FileText, Calendar, User } from 'lucide-react'
import { CourseFile } from '@prisma/client'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale/pl'

interface CourseFilesListProps {
  files: (CourseFile & {
    course: {
      id: string
      title: string
      organizerId: string
      organizer: {
        name: string
        email: string
      }
    }
  })[]
  userRole: string
  userId: string
  courseOrganizers: Record<string, string>
}

export default function CourseFilesList({
  files,
  userRole,
  userId,
  courseOrganizers,
}: CourseFilesListProps) {
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)

  const canDeleteFile = (file: CourseFilesListProps['files'][0]) => {
    // ADMIN może usuwać wszystkie pliki
    if (userRole === 'ADMIN') return true
    
    // Organizator może usuwać pliki ze swoich kursów
    if (userRole === 'ORGANIZER' && file.course.organizerId === userId) {
      return true
    }
    
    return false
  }

  const handleDownload = async (file: CourseFilesListProps['files'][0]) => {
    try {
      const response = await fetch(`/api/courses/${file.course.id}/files/${file.id}/download`)
      
      if (!response.ok) {
        throw new Error('Błąd podczas pobierania pliku')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.originalName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Błąd podczas pobierania pliku:', error)
      alert('Wystąpił błąd podczas pobierania pliku')
    }
  }

  const handleDelete = async (file: CourseFilesListProps['files'][0]) => {
    if (!canDeleteFile(file)) {
      alert('Nie masz uprawnień do usunięcia tego pliku')
      return
    }

    if (!confirm(`Czy na pewno chcesz usunąć plik "${file.originalName}"?`)) {
      return
    }

    setDeletingFileId(file.id)

    try {
      const response = await fetch(`/api/courses/${file.course.id}/files/${file.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Błąd podczas usuwania pliku')
      }

      // Odśwież stronę po usunięciu
      window.location.reload()
    } catch (error) {
      console.error('Błąd podczas usuwania pliku:', error)
      alert(error instanceof Error ? error.message : 'Wystąpił błąd podczas usuwania pliku')
      setDeletingFileId(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {files.map((file) => (
        <div
          key={file.id}
          className="glass rounded-xl p-6 border border-purple-500/30 hover:border-purple-500/50 transition-all hover-lift"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-1 truncate">
                    {file.originalName}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-300">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span>{formatFileSize(file.size)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        Dodano: {format(new Date(file.createdAt), 'dd MMMM yyyy, HH:mm', { locale: pl })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>
                        Kurs: <span className="text-purple-400">{file.course.title}</span>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>
                        Organizator: <span className="text-purple-400">{file.course.organizer.name}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleDownload(file)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2 shadow-lg hover-lift transition-all font-semibold border border-purple-500/50"
                title="Pobierz plik"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Pobierz</span>
              </button>
              {canDeleteFile(file) && (
                <button
                  onClick={() => handleDelete(file)}
                  disabled={deletingFileId === file.id}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2 shadow-lg hover-lift transition-all font-semibold border border-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Usuń plik"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {deletingFileId === file.id ? 'Usuwanie...' : 'Usuń'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

