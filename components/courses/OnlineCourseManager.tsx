'use client'

import { useState, useEffect } from 'react'
import { Upload, Play, Trash2, Eye, EyeOff, DollarSign, Percent } from 'lucide-react'
import { Course, CourseVideoFile } from '@prisma/client'

interface OnlineCourseManagerProps {
  course: Course & { videoFiles: CourseVideoFile[] }
}

export default function OnlineCourseManager({ course }: OnlineCourseManagerProps) {
  const [videoFiles, setVideoFiles] = useState<CourseVideoFile[]>(course.videoFiles || [])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [onlinePrice, setOnlinePrice] = useState(course.onlinePrice?.toString() || '100')
  const [commissionRate, setCommissionRate] = useState(course.commissionRate?.toString() || '10')
  const [isPublished, setIsPublished] = useState(course.isPublished || false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    setIsUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('order', videoFiles.length.toString())

      const response = await fetch(`/api/courses/${course.id}/videos`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Wystąpił błąd podczas przesyłania pliku')
        return
      }

      setVideoFiles([...videoFiles, result])
      setSuccess('Plik wideo został przesłany pomyślnie')
      e.target.value = ''
    } catch (err) {
      setError('Wystąpił błąd podczas przesyłania pliku')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten plik wideo?')) return

    try {
      const response = await fetch(`/api/courses/${course.id}/videos/${fileId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setVideoFiles(videoFiles.filter((f) => f.id !== fileId))
        setSuccess('Plik został usunięty')
      } else {
        setError('Wystąpił błąd podczas usuwania pliku')
      }
    } catch (err) {
      setError('Wystąpił błąd podczas usuwania pliku')
    }
  }

  const handlePublish = async () => {
    if (videoFiles.length === 0) {
      setError('Nie można wystawić kursu bez plików wideo')
      return
    }

    setIsPublishing(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/courses/${course.id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublished: !isPublished,
          onlinePrice: parseFloat(onlinePrice),
          commissionRate: parseFloat(commissionRate),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Wystąpił błąd podczas aktualizacji kursu')
        return
      }

      setIsPublished(result.isPublished)
      setSuccess(result.isPublished ? 'Kurs został wystawiony na sprzedaż' : 'Kurs został ukryty')
    } catch (err) {
      setError('Wystąpił błąd podczas aktualizacji kursu')
    } finally {
      setIsPublishing(false)
    }
  }

  if (!course.isOnlineCourse) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl shadow-xl p-8 border border-purple-500/30">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white gradient-text">
            Zarządzanie kursem online
          </h3>
          <div className="flex items-center space-x-2">
            {isPublished ? (
              <span className="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-sm font-semibold border border-green-500/50">
                <Eye className="h-4 w-4 inline mr-1" />
                Wystawiony
              </span>
            ) : (
              <span className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm font-semibold border border-gray-600">
                <EyeOff className="h-4 w-4 inline mr-1" />
                Ukryty
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/30 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Ustawienia ceny i prowizji */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="onlinePrice" className="block text-sm font-medium text-white mb-2">
              <DollarSign className="h-4 w-4 inline mr-1" />
              Cena kursu (zł)
            </label>
            <input
              id="onlinePrice"
              type="number"
              step="0.01"
              min="0"
              value={onlinePrice}
              onChange={(e) => setOnlinePrice(e.target.value)}
              disabled={isPublishing}
              className="w-full px-4 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-800 text-white disabled:bg-gray-900"
            />
          </div>

          <div>
            <label htmlFor="commissionRate" className="block text-sm font-medium text-white mb-2">
              <Percent className="h-4 w-4 inline mr-1" />
              Prowizja dla właściciela (%)
            </label>
            <input
              id="commissionRate"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              disabled={isPublishing}
              className="w-full px-4 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-800 text-white disabled:bg-gray-900"
            />
            <p className="mt-1 text-xs text-gray-400">
              Twoja prowizja: {((parseFloat(onlinePrice) * (100 - parseFloat(commissionRate))) / 100).toFixed(2)} zł
            </p>
          </div>
        </div>

        {/* Przycisk publikacji */}
        <div className="mb-6">
          <button
            onClick={handlePublish}
            disabled={isPublishing || videoFiles.length === 0}
            className={`w-full px-6 py-3 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all ${
              isPublished
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isPublishing ? (
              <>
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                Przetwarzanie...
              </>
            ) : isPublished ? (
              <>
                <EyeOff className="h-5 w-5" />
                <span>Ukryj kurs</span>
              </>
            ) : (
              <>
                <Eye className="h-5 w-5" />
                <span>Wystaw kurs na sprzedaż</span>
              </>
            )}
          </button>
          {videoFiles.length === 0 && (
            <p className="mt-2 text-sm text-yellow-300 text-center">
              Dodaj co najmniej jeden plik wideo, aby wystawić kurs
            </p>
          )}
        </div>

        {/* Upload plików wideo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            Dodaj plik wideo (max 500MB)
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex-1 cursor-pointer">
              <div className="flex items-center justify-center px-6 py-4 border-2 border-dashed border-gray-700 rounded-lg hover:border-purple-500 transition-colors bg-gray-800/50">
                <Upload className="h-6 w-6 mr-2 text-purple-300" />
                <span className="text-white font-medium">
                  {isUploading ? 'Przesyłanie...' : 'Wybierz plik wideo'}
                </span>
              </div>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Lista plików wideo */}
        {videoFiles.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Pliki wideo kursu</h4>
            <div className="space-y-3">
              {videoFiles.map((file, index) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:bg-purple-900/20 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="bg-purple-900/50 p-2 rounded-lg border border-purple-500/30">
                      <Play className="h-5 w-5 text-purple-300" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{file.originalName}</p>
                      <p className="text-sm text-gray-400">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • Kolejność: {index + 1}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="text-red-300 hover:text-red-200 p-2 hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

