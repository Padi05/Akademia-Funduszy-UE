'use client'

import { useState } from 'react'
import { UserPlus, Check, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface EnrollButtonProps {
  courseId: string
  isEnrolled: boolean
  enrollmentStatus?: string
}

export default function EnrollButton({ courseId, isEnrolled, enrollmentStatus }: EnrollButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleEnroll = async () => {
    if (isEnrolled) return

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Wystąpił błąd podczas zapisywania na kurs')
        return
      }

      setSuccess(true)
      router.refresh()
    } catch (error) {
      setError('Wystąpił błąd podczas zapisywania na kurs')
    } finally {
      setIsLoading(false)
    }
  }

  if (isEnrolled) {
    return (
      <div className="w-full bg-green-600/20 text-green-300 px-4 sm:px-6 py-3 sm:py-4 rounded-lg flex items-center justify-center space-x-2 shadow-lg border border-green-500/50 font-semibold text-sm sm:text-base">
        <Check className="h-4 w-4 sm:h-5 sm:w-5" />
        <span>
          {enrollmentStatus === 'CONFIRMED' ? 'Zapis potwierdzony' : 'Oczekuje na potwierdzenie'}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleEnroll}
        disabled={isLoading || success}
        className="w-full bg-purple-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2 shadow-lg hover-lift transition-all font-semibold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
        <span>{isLoading ? 'Zapisywanie...' : success ? 'Zapisano!' : 'Zapisz się na kurs'}</span>
      </button>
      {error && (
        <div className="p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-900/50 border border-green-500/50 rounded-lg text-green-200 text-sm">
          Zostałeś zapisany na kurs! Organizator skontaktuje się z Tobą wkrótce.
        </div>
      )}
    </div>
  )
}

