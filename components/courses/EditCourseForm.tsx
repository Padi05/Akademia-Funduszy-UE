'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Course, CourseFile, CourseVideoFile } from '@prisma/client'
import { format } from 'date-fns'
import CourseFileUpload from './CourseFileUpload'
import OnlineCourseManager from './OnlineCourseManager'

const courseSchema = z.object({
  title: z.string().min(3, 'Tytuł musi mieć minimum 3 znaki'),
  description: z.string().min(10, 'Opis musi mieć minimum 10 znaków'),
  type: z.enum(['STACJONARNY', 'ONLINE']),
  price: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: 'Podaj prawidłową cenę',
  }),
  fundingInfo: z.string().min(5, 'Informacje o dofinansowaniu są wymagane'),
  startDate: z.string().min(1, 'Data rozpoczęcia jest wymagana'),
  endDate: z.string().optional(),
}).refine((data) => {
  // Jeśli data zakończenia jest podana, musi być po dacie rozpoczęcia
  if (data.endDate && data.startDate) {
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)
    return endDate > startDate
  }
  return true
}, {
  message: 'Data zakończenia musi być po dacie rozpoczęcia',
  path: ['endDate'],
})

type CourseForm = z.infer<typeof courseSchema>

interface EditCourseFormProps {
  course: Course & { files: CourseFile[]; videoFiles: CourseVideoFile[] }
}

export default function EditCourseForm({ course }: EditCourseFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [files, setFiles] = useState<CourseFile[]>(course.files || [])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: course.title,
      description: course.description,
      type: course.type as 'STACJONARNY' | 'ONLINE',
      price: course.price.toString(),
      fundingInfo: course.fundingInfo,
      startDate: format(new Date(course.startDate), "yyyy-MM-dd'T'HH:mm"),
      endDate: course.endDate
        ? format(new Date(course.endDate), "yyyy-MM-dd'T'HH:mm")
        : '',
    },
  })

  const startDate = watch('startDate')
  
  // Oblicz minimalną datę zakończenia (data rozpoczęcia + 1 dzień)
  const minEndDate = startDate ? (() => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + 1)
    return date.toISOString().slice(0, 16)
  })() : ''

  const onSubmit = async (data: CourseForm) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          price: parseFloat(data.price),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Wystąpił błąd podczas aktualizacji kursu')
        setIsLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('Wystąpił błąd podczas aktualizacji kursu')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Czy na pewno chcesz usunąć ten kurs? Ta operacja jest nieodwracalna.')) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/courses/${course.id}`, {
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
    <div className="min-h-screen">
      {/* Hero Section z tłem */}
      <div className="hero-background relative overflow-hidden">
        <div className="hero-content max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-white hover:text-yellow-300 mb-4 sm:mb-6 transition-colors drop-shadow-md text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Powrót do dashboardu</span>
            <span className="sm:hidden">Powrót</span>
          </Link>
        </div>
      </div>

      <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="glass rounded-2xl shadow-xl p-6 sm:p-8 border border-purple-500/30">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Edytuj kurs</h1>

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
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
              Opis kursu *
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={6}
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-800 text-white disabled:bg-gray-900 disabled:cursor-not-allowed disabled:text-gray-500"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
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
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
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
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
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
            />
            {errors.fundingInfo && (
              <p className="mt-1 text-sm text-red-600">{errors.fundingInfo.message}</p>
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
                <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
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
                min={minEndDate}
                disabled={isLoading || !startDate}
                className="w-full px-4 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-800 text-white disabled:bg-gray-900 disabled:cursor-not-allowed disabled:text-gray-500"
                placeholder={!startDate ? 'Najpierw wybierz datę rozpoczęcia' : ''}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
              )}
              {startDate && !errors.endDate && (
                <p className="mt-1 text-sm text-gray-400">
                  Data zakończenia musi być po dacie rozpoczęcia
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t">
            <CourseFileUpload
              courseId={course.id}
              files={files}
              onFileAdded={(file) => setFiles([...files, file])}
              onFileDeleted={(fileId) => setFiles(files.filter((f) => f.id !== fileId))}
            />
          </div>

          {/* Zarządzanie kursem online */}
          {course.type === 'ONLINE' && (
            <div className="pt-6 border-t border-gray-700">
              <OnlineCourseManager course={course} />
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isLoading}
              className="px-6 py-2 bg-red-900/50 text-red-300 rounded-md hover:bg-red-800/50 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/30 transition-all"
            >
              <Trash2 className="h-4 w-4" />
              <span>{isDeleting ? 'Usuwanie...' : 'Usuń kurs'}</span>
            </button>
            
            <div className="flex space-x-4">
              <Link
                href="/dashboard"
                className="px-6 py-2 border border-gray-700 rounded-md text-white hover:bg-gray-800 transition-all"
              >
                Anuluj
              </Link>
              <button
                type="submit"
                disabled={isLoading || isDeleting}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Save className="h-4 w-4" />
                <span>{isLoading ? 'Zapisywanie...' : 'Zapisz zmiany'}</span>
              </button>
            </div>
          </div>
        </form>
          </div>
        </div>
      </div>
    </div>
  )
}

