'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Consultation {
  id: string
  title: string
  description?: string
  pricePerHour: number
  duration: number
  scheduledDate: string
  status: string
  videoCallLink?: string
  trainer: {
    id: string
    name: string
    email: string
  }
  participant?: {
    id: string
    name: string
    email: string
  }
}

export default function ConsultationManager() {
  const { data: session } = useSession()
  const router = useRouter()
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    fetchConsultations()
  }, [])

  const fetchConsultations = async () => {
    try {
      setLoading(true)
      const role = session?.user.role === 'ORGANIZER' || session?.user.role === 'ADMIN' ? 'trainer' : 'participant'
      const response = await fetch(`/api/consultations?role=${role}`)
      if (!response.ok) {
        throw new Error('Błąd podczas pobierania konsultacji')
      }
      const data = await response.json()
      setConsultations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleBook = async (consultationId: string) => {
    try {
      const response = await fetch(`/api/consultations/${consultationId}`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Błąd podczas rezerwacji')
      }

      await fetchConsultations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd')
    }
  }

  const handleCancel = async (consultationId: string) => {
    if (!confirm('Czy na pewno chcesz anulować tę konsultację?')) {
      return
    }

    try {
      const response = await fetch(`/api/consultations/${consultationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Błąd podczas anulowania')
      }

      await fetchConsultations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Ładowanie konsultacji...</div>
      </div>
    )
  }

  const isTrainer = session?.user.role === 'ORGANIZER' || session?.user.role === 'ADMIN'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Konsultacje 1:1</h2>
          <p className="text-gray-600 mt-1">
            {isTrainer ? 'Zarządzaj swoimi konsultacjami' : 'Przeglądaj dostępne konsultacje'}
          </p>
        </div>
        {isTrainer && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {showCreateForm ? 'Anuluj' : 'Nowa konsultacja'}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {showCreateForm && isTrainer && (
        <CreateConsultationForm
          onSuccess={() => {
            setShowCreateForm(false)
            fetchConsultations()
          }}
        />
      )}

      {consultations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">
            {isTrainer
              ? 'Nie masz jeszcze żadnych konsultacji. Utwórz pierwszą ofertę!'
              : 'Brak dostępnych konsultacji.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {consultations.map((consultation) => {
            const hours = consultation.duration / 60
            const totalPrice = consultation.pricePerHour * hours

            return (
              <div key={consultation.id} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {consultation.title}
                </h3>
                {consultation.description && (
                  <p className="text-sm text-gray-600 mb-4">{consultation.description}</p>
                )}
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Trener:</span>
                    <span className="ml-2 font-medium">{consultation.trainer.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Data:</span>
                    <span className="ml-2 font-medium">{formatDate(consultation.scheduledDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Czas trwania:</span>
                    <span className="ml-2 font-medium">{consultation.duration} minut</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Cena za godzinę:</span>
                    <span className="ml-2 font-medium">{formatCurrency(consultation.pricePerHour)}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-gray-500">Cena całkowita:</span>
                    <span className="ml-2 font-bold text-lg text-green-600">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                  {consultation.status === 'CONFIRMED' && consultation.videoCallLink && (
                    <div className="pt-2">
                      <a
                        href={consultation.videoCallLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Link do video call →
                      </a>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  {consultation.status === 'PENDING' && !isTrainer && (
                    <button
                      onClick={() => handleBook(consultation.id)}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      Zarezerwuj
                    </button>
                  )}
                  {(consultation.status === 'CONFIRMED' || consultation.status === 'PENDING') && (
                    <button
                      onClick={() => handleCancel(consultation.id)}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                    >
                      Anuluj
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CreateConsultationForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pricePerHour: 100,
    duration: 60,
    scheduledDate: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Błąd podczas tworzenia konsultacji')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Nowa konsultacja</h3>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tytuł *
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Opis
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cena za godzinę (PLN) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.pricePerHour}
              onChange={(e) => setFormData({ ...formData, pricePerHour: parseFloat(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Czas trwania (minuty) *
            </label>
            <input
              type="number"
              required
              min="15"
              max="480"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data i godzina *
          </label>
          <input
            type="datetime-local"
            required
            value={formData.scheduledDate}
            onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notatki
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            rows={2}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Tworzenie...' : 'Utwórz konsultację'}
          </button>
        </div>
      </form>
    </div>
  )
}

