'use client'

import { useState } from 'react'
import { Upload, FileText, X, Trash2 } from 'lucide-react'
import { CourseFile } from '@prisma/client'

interface CourseFileUploadProps {
  courseId: string
  files: CourseFile[]
  onFileAdded: (file: CourseFile) => void
  onFileDeleted: (fileId: string) => void
}

export default function CourseFileUpload({
  courseId,
  files,
  onFileAdded,
  onFileDeleted,
}: CourseFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]
    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/courses/${courseId}/files`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Wystąpił błąd podczas przesyłania pliku')
        return
      }

      onFileAdded(result)
      
      // Reset file input
      e.target.value = ''
    } catch (err) {
      setError('Wystąpił błąd podczas przesyłania pliku')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten plik?')) {
      return
    }

    try {
      const response = await fetch(`/api/courses/${courseId}/files/${fileId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        alert('Wystąpił błąd podczas usuwania pliku')
        return
      }

      onFileDeleted(fileId)
    } catch (error) {
      alert('Wystąpił błąd podczas usuwania pliku')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pliki kursu (np. program w PDF)
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-primary-400 transition">
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="course-file"
                className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500"
              >
                <span>Wybierz plik</span>
                <input
                  id="course-file"
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  accept=".pdf,.doc,.docx"
                />
              </label>
            </div>
            <p className="text-xs text-gray-500">PDF, DOC, DOCX (max 10MB)</p>
          </div>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
        {isUploading && (
          <p className="mt-2 text-sm text-gray-500">Przesyłanie...</p>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Przesłane pliki:</h4>
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between bg-gray-50 p-3 rounded"
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">{file.originalName}</span>
              </div>
              <button
                onClick={() => handleDelete(file.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


