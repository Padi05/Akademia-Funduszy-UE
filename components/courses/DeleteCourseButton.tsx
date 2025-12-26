'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface DeleteCourseButtonProps {
  courseId: string
}

export default function DeleteCourseButton({ courseId }: DeleteCourseButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!confirm('Czy na pewno chcesz usunąć ten kurs? Ta operacja jest nieodwracalna.')) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Wystąpił błąd podczas usuwania kursu')
        setIsDeleting(false)
        return
      }

      // Przekieruj do dashboardu po usunięciu
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('Wystąpił błąd podczas usuwania kursu')
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="inline-flex items-center bg-red-900/50 hover:bg-red-800/50 text-red-300 px-4 py-2 rounded-lg transition-colors shadow-lg text-sm sm:text-base border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">{isDeleting ? 'Usuwanie...' : 'Usuń kurs'}</span>
        <span className="sm:hidden">{isDeleting ? '...' : 'Usuń'}</span>
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}

