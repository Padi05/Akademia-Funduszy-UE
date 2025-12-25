'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, FileText, X } from 'lucide-react'

export default function UploadFilePage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError('Wybierz plik do przesłania')
      return
    }

    setIsUploading(true)
    setError(null)
    setSuccess(false)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Wystąpił błąd podczas przesyłania pliku')
        return
      }

      setSuccess(true)
      setFile(null)
      
      // Reset file input
      const fileInput = document.getElementById('file') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }

      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      setError('Wystąpił błąd podczas przesyłania pliku')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section z tłem */}
      <div className="hero-background relative overflow-hidden">
        <div className="hero-content max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-white hover:text-yellow-300 mb-6 transition-colors drop-shadow-md"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Powrót do dashboardu
          </Link>
        </div>
      </div>

      <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="glass rounded-2xl shadow-xl p-8 border border-purple-500/30">
        <h1 className="text-2xl font-bold text-white mb-6">Prześlij dokument</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            Plik został pomyślnie przesłany! Przekierowywanie...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-white mb-2">
              Wybierz plik (max 10MB)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-700 border-dashed rounded-md hover:border-purple-500 transition bg-gray-800/50">
              <div className="space-y-1 text-center">
                {file ? (
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-600">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null)
                        const fileInput = document.getElementById('file') as HTMLInputElement
                        if (fileInput) fileInput.value = ''
                      }}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                      >
                        <span>Wybierz plik</span>
                        <input
                          id="file"
                          name="file"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                      </label>
                      <p className="pl-1">lub przeciągnij i upuść</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
                  </>
                )}
              </div>
            </div>
            {file && (
              <p className="mt-2 text-sm text-gray-500">
                Rozmiar: {(file.size / 1024).toFixed(2)} KB
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Link
              href="/dashboard"
              className="px-6 py-2 border border-gray-700 rounded-md text-gray-300 hover:bg-gray-800"
            >
              Anuluj
            </Link>
            <button
              type="submit"
              disabled={isUploading || !file || success}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="h-4 w-4" />
              <span>{isUploading ? 'Przesyłanie...' : 'Prześlij plik'}</span>
            </button>
          </div>
        </form>
          </div>
        </div>
      </div>
    </div>
  )
}

