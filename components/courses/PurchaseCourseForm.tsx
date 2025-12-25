'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, DollarSign, Percent, Play, CheckCircle } from 'lucide-react'
import { Course, CourseVideoFile } from '@prisma/client'

interface PurchaseCourseFormProps {
  course: Course & {
    videoFiles: CourseVideoFile[]
    organizer: { name: string; email: string }
    _count: { purchases: number }
  }
}

export default function PurchaseCourseForm({ course }: PurchaseCourseFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const price = course.onlinePrice || 100
  const commissionRate = course.commissionRate || 10
  const commission = (price * commissionRate) / 100
  const organizerEarnings = price - commission

  const handlePurchase = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/courses/${course.id}/purchase`, {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Wystąpił błąd podczas zakupu kursu')
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/dashboard/courses/${course.id}/watch`)
      }, 2000)
    } catch (err) {
      setError('Wystąpił błąd podczas zakupu kursu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="hero-background relative overflow-hidden">
        <div className="hero-content max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
          <Link
            href="/dashboard/courses/online"
            className="inline-flex items-center text-white hover:text-purple-300 mb-6 sm:mb-8 transition-colors drop-shadow-md text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Powrót do kursów online</span>
            <span className="sm:hidden">Powrót</span>
          </Link>

          <div className="glass rounded-2xl shadow-xl p-6 sm:p-8 border border-purple-500/30 backdrop-blur-xl">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{course.title}</h1>
            <p className="text-sm sm:text-base text-gray-200 mb-4 sm:mb-6">{course.description}</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-2 lg:order-1">
              <div className="glass rounded-2xl shadow-xl p-6 sm:p-8 border border-purple-500/30">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 gradient-text">
                  Szczegóły kursu
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <Play className="h-6 w-6 mr-4 text-purple-300" />
                    <div>
                      <p className="text-sm text-gray-300">Liczba wideo</p>
                      <p className="text-lg font-semibold text-white">
                        {course.videoFiles.length} {course.videoFiles.length === 1 ? 'lekcja' : 'lekcji'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-500/50">
                    <p className="text-sm text-gray-200 mb-2">
                      <span className="font-semibold text-purple-200">Organizator:</span>
                    </p>
                    <p className="text-base text-white">{course.organizer.name}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
              <div className="glass rounded-2xl shadow-xl p-6 sm:p-8 border border-purple-500/30">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Podsumowanie zakupu</h3>

                {error && (
                  <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-6">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-900/30 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg mb-6 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span>Kurs został zakupiony! Przekierowywanie...</span>
                  </div>
                )}

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <span className="text-gray-300">Cena kursu</span>
                    <span className="text-2xl font-bold text-purple-200">{price} zł</span>
                  </div>

                  <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
                    <p className="text-xs text-gray-400 mb-2">Szczegóły prowizji</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Prowizja platformy ({commissionRate}%)</span>
                        <span className="text-gray-200">{commission.toFixed(2)} zł</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-700">
                        <span className="text-white font-semibold">Dla organizatora</span>
                        <span className="text-white font-semibold">{organizerEarnings.toFixed(2)} zł</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePurchase}
                  disabled={isLoading || success}
                  className="w-full bg-purple-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2 shadow-lg hover-lift transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                      <span>Przetwarzanie...</span>
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-5 w-5" />
                      <span>Kup za {price} zł</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

