'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

const courseSchema = z.object({
  title: z.string().min(3, 'Tytuł musi mieć minimum 3 znaki'),
  description: z.string().min(10, 'Opis musi mieć minimum 10 znaków'),
  type: z.enum(['STACJONARNY', 'ONLINE']),
  price: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: 'Podaj prawidłową cenę',
  }),
  fundingInfo: z.string().min(5, 'Informacje o dofinansowaniu są wymagane'),
  startDate: z.string(),
  endDate: z.string().optional(),
  // Pola dla kursów online
  isOnlineCourse: z.boolean().optional(),
  onlinePrice: z.string().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), {
    message: 'Podaj prawidłową cenę kursu online',
  }).optional(),
  commissionRate: z.string().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100), {
    message: 'Prowizja musi być między 0 a 100%',
  }).optional(),
  isPublished: z.boolean().optional(),
})

type CourseForm = z.infer<typeof courseSchema>

export default function NewCoursePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
  })

  const courseType = watch('type')

  const onSubmit = async (data: CourseForm) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          price: parseFloat(data.price),
          isOnlineCourse: courseType === 'ONLINE' ? (data.isOnlineCourse || false) : false,
          onlinePrice: data.onlinePrice ? parseFloat(data.onlinePrice) : (courseType === 'ONLINE' ? 100 : null),
          commissionRate: data.commissionRate ? parseFloat(data.commissionRate) : (courseType === 'ONLINE' ? 10 : null),
          isPublished: data.isPublished || false,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Wystąpił błąd podczas tworzenia kursu')
        return
      }

      router.push(`/dashboard/courses/${result.id}/edit`)
    } catch (err) {
      setError('Wystąpił błąd podczas tworzenia kursu')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section z tłem i animacjami */}
      <div className="hero-background relative overflow-hidden">
        {/* Animowane elementy w tle */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl animate-float animate-pulse-custom"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-400/20 rounded-full blur-2xl animate-float animate-delay-300"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gray-600/20 rounded-full blur-xl animate-float animate-delay-200"></div>
        <div className="absolute bottom-1/3 right-1/4 w-28 h-28 bg-purple-600/30 rounded-full blur-xl animate-float animate-delay-100"></div>
        <div className="absolute top-1/4 right-1/3 w-36 h-36 bg-purple-500/15 rounded-full blur-3xl animate-float animate-delay-400"></div>
        <div className="absolute bottom-1/4 left-1/3 w-44 h-44 bg-gray-700/20 rounded-full blur-3xl animate-float animate-delay-500"></div>
        
        {/* Animowane linie */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-20 left-0 w-1 h-64 bg-gradient-to-b from-purple-500/30 to-transparent animate-slide-down"></div>
          <div className="absolute top-40 right-0 w-1 h-80 bg-gradient-to-b from-purple-400/20 to-transparent animate-slide-down animate-delay-200"></div>
          <div className="absolute bottom-20 left-1/4 w-1 h-72 bg-gradient-to-b from-transparent to-purple-500/30 animate-slide-up"></div>
          <div className="absolute bottom-40 right-1/4 w-1 h-96 bg-gradient-to-b from-transparent to-purple-400/20 animate-slide-up animate-delay-300"></div>
        </div>

        {/* Animowane kropki */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-purple-400/40 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            ></div>
          ))}
        </div>

        <div className="hero-content max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-white hover:text-purple-300 mb-6 transition-colors drop-shadow-md relative z-20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Powrót do dashboardu
          </Link>
        </div>
      </div>

      <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Tło z animowanymi kształtami */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Duże animowane kształty */}
          <div className="absolute top-20 -left-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 -right-20 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl animate-float animate-delay-300"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gray-700/5 rounded-full blur-3xl animate-pulse-glow"></div>
          
          {/* Animowane linie gradientowe */}
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-purple-500/20 to-transparent animate-pulse"></div>
          <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-purple-400/20 to-transparent animate-pulse animate-delay-200"></div>
          
          {/* Małe animowane elementy */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 bg-purple-400/30 rounded-full animate-float"
              style={{
                left: `${10 + i * 12}%`,
                top: `${20 + (i % 3) * 30}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${4 + (i % 3)}s`,
              }}
            ></div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
          <div className="glass rounded-2xl shadow-xl p-8 border border-purple-500/30 relative z-20 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-white">Dodaj nowy kurs</h1>
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse animate-delay-200"></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse animate-delay-400"></div>
              </div>
            </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
              Tytuł kursu *
            </label>
            <input
              {...register('title')}
              id="title"
              type="text"
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-800 text-white disabled:bg-gray-900 disabled:cursor-not-allowed disabled:text-gray-500"
              placeholder="Np. Kurs programowania w Python"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-200 mb-2">
              Opis kursu *
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={6}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-800 text-white disabled:bg-gray-900 disabled:cursor-not-allowed disabled:text-gray-500"
              placeholder="Szczegółowy opis kursu..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-white mb-2">
                Typ kursu *
              </label>
              <select
                {...register('type')}
                id="type"
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-800 text-white disabled:bg-gray-900 disabled:cursor-not-allowed disabled:text-gray-500"
              >
                <option value="STACJONARNY">Stacjonarny</option>
                <option value="ONLINE">Online</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-400">{errors.type.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-white mb-2">
                Cena (zł) *
              </label>
              <input
                {...register('price')}
                id="price"
                type="number"
                step="0.01"
                min="0"
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-800 text-white disabled:bg-gray-900 disabled:cursor-not-allowed disabled:text-gray-500"
                placeholder="0.00"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-400">{errors.price.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="fundingInfo" className="block text-sm font-medium text-white mb-2">
              Informacje o dofinansowaniu *
            </label>
            <textarea
              {...register('fundingInfo')}
              id="fundingInfo"
              rows={3}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-800 text-white disabled:bg-gray-900 disabled:cursor-not-allowed disabled:text-gray-500"
              placeholder="Np. Kurs dofinansowany w 80% przez UE, 20% własny wkład"
            />
            {errors.fundingInfo && (
              <p className="mt-1 text-sm text-red-400">{errors.fundingInfo.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-white mb-2">
                Data rozpoczęcia *
              </label>
              <input
                {...register('startDate')}
                id="startDate"
                type="datetime-local"
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-800 text-white disabled:bg-gray-900 disabled:cursor-not-allowed disabled:text-gray-500"
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-400">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-white mb-2">
                Data zakończenia (opcjonalnie)
              </label>
              <input
                {...register('endDate')}
                id="endDate"
                type="datetime-local"
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-800 text-white disabled:bg-gray-900 disabled:cursor-not-allowed disabled:text-gray-500"
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-400">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Link
              href="/dashboard"
              className="px-6 py-2 border border-gray-700 rounded-md text-white hover:bg-gray-800"
            >
              Anuluj
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{isLoading ? 'Zapisywanie...' : 'Zapisz kurs'}</span>
            </button>
          </div>
        </form>
          </div>
        </div>
      </div>
    </div>
  )
}

