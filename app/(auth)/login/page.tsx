'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { LogIn, Mail, Lock, CheckCircle } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(1, 'Hasło jest wymagane'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccess('Konto zostało utworzone! Możesz się teraz zalogować.')
    }
  }, [searchParams])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Nieprawidłowy email lub hasło')
        setIsLoading(false)
      } else if (result?.ok) {
        // Sukces - przekieruj do dashboard
        router.push('/dashboard')
        router.refresh()
      } else {
        setError('Wystąpił błąd podczas logowania')
        setIsLoading(false)
      }
    } catch (err) {
      setError('Wystąpił błąd podczas logowania')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 hero-background">
      <div className="max-w-md w-full space-y-8 animate-scale-in relative z-20">
        <div className="glass rounded-2xl shadow-2xl p-8 relative z-20">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-purple-900/50 p-4 rounded-full animate-float border border-purple-500/30">
                <LogIn className="h-8 w-8 text-purple-400" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Zaloguj się do konta
            </h2>
            <p className="text-sm text-gray-200">
              Lub{' '}
              <Link
                href="/register"
                className="font-semibold text-purple-300 hover:text-purple-200 transition-colors"
              >
                utwórz nowe konto
              </Link>
            </p>
          </div>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {success && (
            <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-lg animate-slide-in-right flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>{success}</span>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg animate-slide-in-right">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                Adres email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-purple-400" />
                </div>
                <input
                  {...register('email')}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  disabled={isLoading}
                  readOnly={false}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border-2 border-gray-700 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-gray-800 text-white font-medium disabled:bg-gray-900 disabled:cursor-not-allowed disabled:text-gray-500 relative z-10"
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
                  <Lock className="h-5 w-5 text-purple-400" />
                </div>
                <input
                  {...register('password')}
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  readOnly={false}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border-2 border-gray-700 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-gray-800 text-white font-medium disabled:bg-gray-900 disabled:cursor-not-allowed disabled:text-gray-500 relative z-10"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-400 animate-slide-in-right">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover-lift"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                  Logowanie...
                </span>
              ) : (
                'Zaloguj się'
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}

