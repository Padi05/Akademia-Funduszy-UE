'use client'

import { useState, useEffect } from 'react'
import { Star, MessageSquare, User } from 'lucide-react'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale/pl'

interface Review {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

interface CourseReviewsProps {
  courseId: string
  canReview: boolean // Czy użytkownik może dodać recenzję
}

export default function CourseReviews({ courseId, canReview }: CourseReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReviews()
  }, [courseId])

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/reviews`)
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews)
        setAverageRating(data.averageRating)
        setTotalReviews(data.totalReviews)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      setError('Wybierz ocenę')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/courses/${courseId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          comment: comment || undefined,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Wystąpił błąd podczas dodawania recenzji')
        return
      }

      // Odśwież listę recenzji
      await fetchReviews()
      setShowForm(false)
      setRating(0)
      setComment('')
    } catch (error) {
      setError('Wystąpił błąd podczas dodawania recenzji')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-6 border border-purple-500/30">
        <p className="text-gray-300">Ładowanie recenzji...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Nagłówek z średnią oceną */}
      <div className="glass rounded-xl p-6 border border-purple-500/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2 flex items-center">
              <Star className="h-6 w-6 text-yellow-400 mr-2 fill-yellow-400" />
              {averageRating > 0 ? averageRating.toFixed(1) : 'Brak ocen'}
            </h3>
            <p className="text-gray-300">
              {totalReviews} {totalReviews === 1 ? 'recenzja' : totalReviews < 5 ? 'recenzje' : 'recenzji'}
            </p>
          </div>
          {canReview && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all font-semibold flex items-center space-x-2"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Dodaj recenzję</span>
            </button>
          )}
        </div>

        {/* Formularz dodawania recenzji */}
        {showForm && canReview && (
          <form onSubmit={handleSubmitReview} className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-purple-500/30">
            <div className="mb-4">
              <label className="block text-white font-semibold mb-2">Ocena</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`transition-all ${
                      star <= rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-400 hover:text-yellow-300'
                    }`}
                  >
                    <Star className="h-8 w-8" />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-white font-semibold mb-2">Komentarz (opcjonalnie)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:border-purple-500 focus:outline-none"
                rows={4}
                placeholder="Napisz swoją opinię o kursie..."
              />
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200">
                {error}
              </div>
            )}
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-all font-semibold disabled:opacity-50"
              >
                {isSubmitting ? 'Dodawanie...' : 'Dodaj recenzję'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setError(null)
                }}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-all font-semibold"
              >
                Anuluj
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Lista recenzji */}
      {reviews.length === 0 ? (
        <div className="glass rounded-xl p-6 border border-purple-500/30 text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300">Brak recenzji. Bądź pierwszy!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="glass rounded-xl p-6 border border-purple-500/30"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{review.user.name}</p>
                    <p className="text-gray-400 text-sm">
                      {format(new Date(review.createdAt), 'dd MMMM yyyy', { locale: pl })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= review.rating
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="text-gray-200 mt-3 leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

