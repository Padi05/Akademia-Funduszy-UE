'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale/pl'
import { Upload, FileText, Trash2, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { UserFile } from '@prisma/client'

interface ParticipantDashboardProps {
  files: UserFile[]
  hasBurEntry: boolean
}

export default function ParticipantDashboard({
  files,
  hasBurEntry,
}: ParticipantDashboardProps) {
  const [filesList, setFilesList] = useState(files)

  const handleDelete = async (fileId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten plik?')) {
      return
    }

    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setFilesList(filesList.filter((f) => f.id !== fileId))
      } else {
        alert('Wystąpił błąd podczas usuwania pliku')
      }
    } catch (error) {
      alert('Wystąpił błąd podczas usuwania pliku')
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <div>
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold gradient-text">Moje dokumenty</h2>
            <p className="text-gray-200 mt-1 text-sm sm:text-base">Zarządzaj swoimi przesłanymi dokumentami</p>
          </div>
          <Link
            href="/dashboard/files/upload"
            className="bg-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2 shadow-lg hover-lift transition-all font-semibold border border-purple-500/50 w-full sm:w-auto text-sm sm:text-base"
          >
            <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Prześlij dokument</span>
          </Link>
        </div>

        {filesList.length === 0 ? (
          <div className="glass rounded-2xl shadow-xl p-6 sm:p-8 lg:p-12 text-center animate-scale-in border border-purple-500/30">
            <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4 animate-float">📄</div>
            <p className="text-gray-100 text-base sm:text-lg mb-4 sm:mb-6">
              Nie masz jeszcze żadnych przesłanych dokumentów.
            </p>
            <Link
              href="/dashboard/files/upload"
              className="inline-block bg-purple-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg hover:bg-purple-700 shadow-lg hover-lift transition-all font-semibold text-sm sm:text-base"
            >
              Prześlij pierwszy dokument
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {filesList.map((file, index) => (
                <div
                  key={file.id}
                  className="glass rounded-xl shadow-xl p-4 border border-purple-500/30 animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="bg-purple-900/50 p-2 rounded-lg mr-3 border border-purple-500/30 flex-shrink-0">
                        <FileText className="h-5 w-5 text-purple-300" />
                      </div>
                      <span className="text-sm font-semibold text-white truncate">
                        {file.originalName}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="text-xs text-gray-300">
                      <span className="font-semibold">Rozmiar:</span> {(file.size / 1024).toFixed(2)} KB
                    </div>
                    <div className="text-xs text-gray-300">
                      <span className="font-semibold">Data przesłania:</span>{' '}
                      {format(new Date(file.createdAt), 'd MMMM yyyy, HH:mm', {
                        locale: pl,
                      })}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-3 border-t border-gray-700">
                    <a
                      href={`/api/files/${file.id}/download`}
                      className="text-purple-300 hover:text-purple-200 font-semibold text-sm hover:underline transition-colors"
                    >
                      Pobierz
                    </a>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="text-red-300 hover:text-red-200 flex items-center space-x-1 font-semibold text-sm transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Usuń</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block glass rounded-xl shadow-xl overflow-hidden animate-fade-in border border-purple-500/30">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-purple-900/30">
                    <tr>
                      <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                        Nazwa pliku
                      </th>
                      <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                        Rozmiar
                      </th>
                      <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                        Data przesłania
                      </th>
                      <th className="px-4 lg:px-6 py-4 text-right text-xs font-semibold text-gray-200 uppercase tracking-wider">
                        Akcje
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                    {filesList.map((file, index) => (
                      <tr 
                        key={file.id} 
                        className="hover:bg-purple-900/20 transition-colors animate-fade-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <td className="px-4 lg:px-6 py-4">
                          <div className="flex items-center">
                            <div className="bg-purple-900/50 p-2 rounded-lg mr-3 border border-purple-500/30 flex-shrink-0">
                              <FileText className="h-5 w-5 text-purple-300" />
                            </div>
                            <span className="text-sm font-semibold text-white truncate max-w-xs">
                              {file.originalName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-sm text-white font-medium">
                          {(file.size / 1024).toFixed(2)} KB
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-sm text-white">
                          {format(new Date(file.createdAt), 'd MMMM yyyy, HH:mm', {
                            locale: pl,
                          })}
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3">
                            <a
                              href={`/api/files/${file.id}/download`}
                              className="text-purple-300 hover:text-purple-200 font-semibold hover:underline transition-colors"
                            >
                              Pobierz
                            </a>
                            <button
                              onClick={() => handleDelete(file.id)}
                              className="text-red-300 hover:text-red-200 flex items-center space-x-1 font-semibold transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Usuń</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

