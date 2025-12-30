'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus, Mail, Lock, User, CheckSquare } from 'lucide-react'

const registerSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(6, 'Hasło musi mieć minimum 6 znaków'),
  confirmPassword: z.string(),
  name: z.string().min(2, 'Imię musi mieć minimum 2 znaki'),
  role: z.enum(['ORGANIZER', 'PARTICIPANT']),
  hasBurEntry: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasła nie są identyczne',
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'PARTICIPANT',
      hasBurEntry: false,
    },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name,
          role: data.role,
          hasBurEntry: data.hasBurEntry || false,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Wystąpił błąd podczas rejestracji')
        setIsLoading(false)
        return
      }

      // Sukces - przekieruj do logowania z komunikatem
      router.push('/login?registered=true')
    } catch (err) {
      setError('Wystąpił błąd podczas rejestracji')
    } finally {
      setIsLoading(false)
    }
  }

  return (
      <div className="auth-page-container py-8 sm:py-12 px-4 sm:px-6 lg:px-8 hero-background">
      <div className="max-w-md w-full space-y-6 sm:space-y-8 animate-scale-in relative z-10">
        <div className="glass rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="bg-gold-900/40 p-3 sm:p-4 rounded-full animate-float border border-gold-500/40">
                <UserPlus className="h-6 w-6 sm:h-8 sm:w-8 text-gold-400" />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Utwórz nowe konto
            </h2>
            <p className="text-xs sm:text-sm text-gray-200 px-2">
              Lub{' '}
              <Link
                href="/login"
                className="font-semibold text-gold-300 hover:text-gold-200 transition-colors"
              >
                zaloguj się do istniejącego konta
              </Link>
            </p>
          </div>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg animate-slide-in-right">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-white mb-2">
                Imię i nazwisko
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gold-400" />
                </div>
                <input
                  {...register('name')}
                  id="name"
                  type="text"
                  disabled={isLoading}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border-2 border-gray-700 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-gray-800 text-white disabled:bg-gray-900 disabled:cursor-not-allowed disabled:text-gray-500"
                  placeholder="Jan Kowalski"
                />
              </div>
              {errors.name && (
                <p className="mt-2 text-sm text-red-400 animate-slide-in-right">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                Adres email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gold-400" />
                </div>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  disabled={isLoading}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border-2 border-gray-700 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all bg-gray-800 text-white font-medium disabled:bg-gray-900 disabled:cursor-not-allowed disabled:text-gray-500"
                  placeholder="twoj@email.pl"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-400 animate-slide-in-right">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
                Hasło
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gold-400" />
                </div>
                <input
                  {...register('password')}
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  disabled={isLoading}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border-2 border-gray-700 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all bg-gray-800 text-white font-medium disabled:bg-gray-900 disabled:cursor-not-allowed disabled:text-gray-500"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-400 animate-slide-in-right">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-white mb-2">
                Potwierdź hasło
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gold-400" />
                </div>
                <input
                  {...register('confirmPassword')}
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  disabled={isLoading}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border-2 border-gray-700 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all bg-gray-800 text-white font-medium disabled:bg-gray-900 disabled:cursor-not-allowed disabled:text-gray-500"
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-400 animate-slide-in-right">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="p-5 bg-gold-900/30 rounded-xl border-2 border-gold-500/50 shadow-sm">
              <label htmlFor="role" className="block text-base font-bold text-white mb-4">
                Typ konta
              </label>
              <div className="space-y-3">
                <label className="flex items-center p-4 bg-gray-800 rounded-xl border-2 border-gray-700 hover:border-gold-500 hover:shadow-md cursor-pointer transition-all group">
                  <input
                    {...register('role')}
                    id="role-organizer"
                    type="radio"
                    value="ORGANIZER"
                    disabled={isLoading}
                    className="mr-4 h-5 w-5 text-gold-600 focus:ring-gold-500 focus:ring-2 disabled:cursor-not-allowed cursor-pointer"
                  />
                  <span className="font-semibold text-white text-base group-hover:text-gold-300 transition-colors">Organizator kursów</span>
                </label>
                <label className="flex items-center p-4 bg-gray-800 rounded-xl border-2 border-gray-700 hover:border-gold-500 hover:shadow-md cursor-pointer transition-all group">
                  <input
                    {...register('role')}
                    id="role-participant"
                    type="radio"
                    value="PARTICIPANT"
                    disabled={isLoading}
                    className="mr-4 h-5 w-5 text-gold-600 focus:ring-gold-500 focus:ring-2 disabled:cursor-not-allowed cursor-pointer"
                  />
                  <span className="font-semibold text-white text-base group-hover:text-gold-300 transition-colors">Uczestnik</span>
                </label>
              </div>
            </div>

            {selectedRole === 'PARTICIPANT' && (
              <div className="p-4 bg-gold-900/30 rounded-lg border border-gold-500/50 animate-fade-in">
                <label className="flex items-center cursor-pointer">
                  <input
                    {...register('hasBurEntry')}
                    id="hasBurEntry"
                    type="checkbox"
                    disabled={isLoading}
                    className="mr-3 h-5 w-5 text-gold-600 focus:ring-gold-500 rounded disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-white flex items-center font-medium">
                    <CheckSquare className="h-4 w-4 mr-2 text-gold-300" />
                    Mam wpis w BUR (uprawnia do przesyłania dokumentów)
                  </span>
                </label>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-base font-semibold text-black bg-gold-600 hover:bg-gold-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover-lift"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                  Tworzenie konta...
                </span>
              ) : (
                'Utwórz konto'
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}

