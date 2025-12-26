'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Check, X, Calendar, DollarSign } from 'lucide-react'

interface SubscriptionData {
  hasSubscription: boolean
  status: string | null
  isActive: boolean
  startDate?: string
  endDate?: string
  monthlyPrice?: number
}

export default function SubscriptionManager() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscription()
    
    // Sprawdź parametry URL po powrocie z Stripe
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('success') === 'true') {
      setSuccess('Subskrypcja została aktywowana pomyślnie!')
      fetchSubscription()
      // Usuń parametr z URL
      window.history.replaceState({}, '', window.location.pathname)
    } else if (urlParams.get('canceled') === 'true') {
      setError('Płatność została anulowana')
      // Usuń parametr z URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscription')
      const data = await response.json()
      setSubscription(data)
    } catch (err) {
      console.error('Error fetching subscription:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubscribe = async () => {
    setIsProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      // Utwórz sesję Checkout w Stripe
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ monthlyPrice: 29.99 }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Wystąpił błąd podczas tworzenia sesji płatności')
        setIsProcessing(false)
        return
      }

      // Przekieruj do Stripe Checkout
      if (result.url) {
        window.location.href = result.url
      } else {
        setError('Nie udało się utworzyć sesji płatności')
        setIsProcessing(false)
      }
    } catch (err) {
      console.error('Error creating checkout session:', err)
      setError('Wystąpił błąd podczas tworzenia sesji płatności')
      setIsProcessing(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Czy na pewno chcesz anulować subskrypcję?')) {
      return
    }

    setIsProcessing(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Wystąpił błąd podczas anulowania subskrypcji')
        return
      }

      setSuccess('Subskrypcja została anulowana')
      await fetchSubscription()
      
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (err) {
      setError('Wystąpił błąd podczas anulowania subskrypcji')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          Subskrypcja Miesięczna
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}

        {subscription?.hasSubscription && subscription.isActive ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-4">
              <Check className="h-5 w-5" />
              <span className="font-semibold">Masz aktywną subskrypcję</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Data rozpoczęcia</span>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatDate(subscription.startDate)}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Data wygaśnięcia</span>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatDate(subscription.endDate)}
                </p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg md:col-span-2">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm">Cena miesięczna</span>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white text-2xl">
                  {subscription.monthlyPrice?.toFixed(2)} PLN
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleCancel}
                disabled={isProcessing}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <X className="h-4 w-4" />
                {isProcessing ? 'Anulowanie...' : 'Anuluj subskrypcję'}
              </button>
            </div>
          </div>
        ) : subscription?.hasSubscription && subscription.status === 'EXPIRED' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-4">
              <X className="h-5 w-5" />
              <span className="font-semibold">Twoja subskrypcja wygasła</span>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Twoja subskrypcja wygasła {formatDate(subscription.endDate)}. 
              Przedłuż subskrypcję, aby nadal mieć dostęp do pobierania plików z kursów.
            </p>

            <button
              onClick={handleSubscribe}
              disabled={isProcessing}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              {isProcessing ? 'Przetwarzanie...' : 'Przedłuż subskrypcję'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Subskrypcja Miesięczna
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Aktywuj subskrypcję, aby móc dodawać kursy i pobierać pliki z wszystkich kursów
              </p>
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                29.99 PLN
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">miesięcznie</p>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Check className="h-5 w-5 text-green-500" />
                <span>Możliwość dodawania własnych kursów</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Check className="h-5 w-5 text-green-500" />
                <span>Nieograniczony dostęp do pobierania plików z kursów</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Check className="h-5 w-5 text-green-500" />
                <span>Dostęp do wszystkich materiałów PDF</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Check className="h-5 w-5 text-green-500" />
                <span>Anuluj w dowolnym momencie</span>
              </div>
            </div>

            <button
              onClick={handleSubscribe}
              disabled={isProcessing}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold text-lg"
            >
              <CreditCard className="h-5 w-5" />
              {isProcessing ? 'Przetwarzanie...' : 'Aktywuj subskrypcję'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

