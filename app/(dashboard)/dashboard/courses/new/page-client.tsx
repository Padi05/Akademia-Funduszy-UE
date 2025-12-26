'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Upload, FileText, X, CreditCard, Check } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

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

export default function NewCoursePageClient() {
  const router = useRouter()
  const { data: session } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null)
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true)
  
  // Sprawdź czy użytkownik jest ADMIN
  const isAdmin = session?.user?.role === 'ADMIN'

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
  })

  const courseType = watch('type')

  // Sprawdź status subskrypcji przy załadowaniu komponentu (tylko dla nie-adminów)
  useEffect(() => {
    const checkSubscription = async () => {
      // ADMIN nie potrzebuje subskrypcji
      if (isAdmin) {
        setHasActiveSubscription(true)
        setIsCheckingSubscription(false)
        return
      }
      
      try {
        const response = await fetch('/api/subscription')
        const data = await response.json()
        setHasActiveSubscription(data.isActive || false)
      } catch (err) {
        console.error('Error checking subscription:', err)
        setHasActiveSubscription(false)
      } finally {
        setIsCheckingSubscription(false)
      }
    }
    checkSubscription()
  }, [isAdmin])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      // Sprawdź rozmiar plików (max 10MB każdy)
      const invalidFiles = filesArray.filter(file => file.size > 10 * 1024 * 1024)
      if (invalidFiles.length > 0) {
        setError(`Niektóre pliki są zbyt duże (max 10MB): ${invalidFiles.map(f => f.name).join(', ')}`)
        return
      }
      setSelectedFiles(prev => [...prev, ...filesArray])
      setError(null)
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async (courseId: string) => {
    if (selectedFiles.length === 0) return

    setUploadProgress(`Przesyłanie plików (0/${selectedFiles.length})...`)
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      setUploadProgress(`Przesyłanie plików (${i + 1}/${selectedFiles.length}): ${file.name}...`)

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`/api/courses/${courseId}/files`, {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || `Błąd podczas przesyłania pliku ${file.name}`)
        }
      } catch (err) {
        throw new Error(`Błąd podczas przesyłania pliku ${file.name}: ${err instanceof Error ? err.message : 'Nieznany błąd'}`)
      }
    }

    setUploadProgress('')
  }

  const onSubmit = async (data: CourseForm) => {
    // ADMIN nie potrzebuje subskrypcji
    if (!isAdmin && !hasActiveSubscription) {
      setError('Aby dodać kurs, potrzebujesz aktywnej subskrypcji miesięcznej. Przejdź do sekcji Subskrypcja, aby ją aktywować.')
      return
    }

    setIsLoading(true)
    setError(null)
    setUploadProgress('')

    try {
      // Utwórz kurs z paymentId
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
        if (result.requiresSubscription) {
          setError(result.message || 'Aby dodać kurs, potrzebujesz aktywnej subskrypcji miesięcznej.')
          router.push('/dashboard/subscription')
        } else {
          setError(result.error || 'Wystąpił błąd podczas tworzenia kursu')
        }
        return
      }

      // Prześlij pliki jeśli są wybrane
      if (selectedFiles.length > 0) {
        try {
          await uploadFiles(result.id)
        } catch (uploadError) {
          // Kurs został utworzony, ale pliki nie zostały przesłane
          setError(uploadError instanceof Error ? uploadError.message : 'Kurs został utworzony, ale wystąpił błąd podczas przesyłania plików')
          // Przekieruj do edycji kursu, gdzie można dodać pliki ręcznie
          setTimeout(() => {
            router.push(`/dashboard/courses/${result.id}/edit`)
          }, 3000)
          return
        }
      }

      router.push(`/dashboard/courses/${result.id}/edit`)
    } catch (err) {
      setError('Wystąpił błąd podczas tworzenia kursu')
    } finally {
      setIsLoading(false)
      setUploadProgress('')
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
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Informacja o subskrypcji - tylko dla nie-adminów */}
        {!isAdmin && (
          <>
            {isCheckingSubscription ? (
              <div className="mb-6 p-4 rounded-lg border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                  <p className="text-gray-700 dark:text-gray-300">Sprawdzanie statusu subskrypcji...</p>
                </div>
              </div>
            ) : (
              <div className={`mb-6 p-4 rounded-lg border ${
                hasActiveSubscription 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {hasActiveSubscription ? (
                      <>
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="font-semibold text-green-800 dark:text-green-200">
                            Masz aktywną subskrypcję
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-300">
                            Możesz dodawać kursy bez dodatkowych opłat
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        <div>
                          <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                            Wymagana subskrypcja miesięczna
                          </p>
                          <p className="text-sm text-yellow-600 dark:text-yellow-300">
                            Aby dodać kurs, musisz mieć aktywną subskrypcję miesięczną
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  {!hasActiveSubscription && (
                    <Link
                      href="/dashboard/subscription"
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md flex items-center gap-2 transition-colors"
                    >
                      <CreditCard className="h-4 w-4" />
                      Aktywuj subskrypcję
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Informacja dla admina */}
        {isAdmin && (
          <div className="mb-6 p-4 rounded-lg border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-semibold text-blue-800 dark:text-blue-200">
                  Panel Administratora
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  Jako administrator możesz dodawać kursy bez subskrypcji
                </p>
              </div>
            </div>
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

          <div>
            <label htmlFor="files" className="block text-sm font-medium text-white mb-2">
              Pliki kursu (opcjonalnie)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-700 border-dashed rounded-md hover:border-purple-500 transition">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <div className="flex text-sm text-gray-400">
                  <label
                    htmlFor="files"
                    className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-purple-400 hover:text-purple-300 px-4 py-2"
                  >
                    <span>Wybierz pliki</span>
                    <input
                      id="files"
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={handleFileChange}
                      disabled={isLoading}
                      accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">PDF, DOC, DOCX, TXT, XLS, XLSX (max 10MB każdy)</p>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-white">Wybrane pliki:</h4>
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-800 p-3 rounded border border-gray-700"
                  >
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-purple-400" />
                      <span className="text-sm text-gray-300">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      disabled={isLoading}
                      className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {uploadProgress && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
              {uploadProgress}
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4">
            <Link
              href="/dashboard"
              className="px-6 py-2 border border-gray-700 rounded-md text-white hover:bg-gray-800"
            >
              Anuluj
            </Link>
            <button
              type="submit"
              disabled={isLoading || (!isAdmin && (!hasActiveSubscription || isCheckingSubscription))}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>
                {isLoading 
                  ? 'Zapisywanie...' 
                  : (!isAdmin && !hasActiveSubscription)
                    ? 'Wymagana subskrypcja' 
                    : 'Zapisz kurs'
                }
              </span>
            </button>
          </div>
        </form>
          </div>
        </div>
      </div>
    </div>
  )
}

