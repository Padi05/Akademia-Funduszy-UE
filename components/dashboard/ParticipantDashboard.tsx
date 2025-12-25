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
    <div className="space-y-8 animate-fade-in">
      <div>
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold gradient-text">Moje dokumenty</h2>
            <p className="text-gray-200 mt-1">Zarządzaj swoimi przesłanymi dokumentami</p>
          </div>
          <Link
            href="/dashboard/files/upload"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 flex items-center space-x-2 shadow-lg hover-lift transition-all font-semibold border border-purple-500/50"
          >
            <Upload className="h-5 w-5" />
            <span>Prześlij dokument</span>
          </Link>
        </div>

        {filesList.length === 0 ? (
          <div className="glass rounded-2xl shadow-xl p-12 text-center animate-scale-in border border-purple-500/30">
            <div className="text-6xl mb-4 animate-float">📄</div>
            <p className="text-gray-100 text-lg mb-6">
              Nie masz jeszcze żadnych przesłanych dokumentów.
            </p>
            <Link
              href="/dashboard/files/upload"
              className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 shadow-lg hover-lift transition-all font-semibold"
            >
              Prześlij pierwszy dokument
            </Link>
          </div>
        ) : (
          <div className="glass rounded-xl shadow-xl overflow-hidden animate-fade-in border border-purple-500/30">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-purple-900/30">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Nazwa pliku
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Rozmiar
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
                    Data przesłania
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-200 uppercase tracking-wider">
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-purple-900/50 p-2 rounded-lg mr-3 border border-purple-500/30">
                          <FileText className="h-5 w-5 text-purple-300" />
                        </div>
                        <span className="text-sm font-semibold text-white">
                          {file.originalName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                      {(file.size / 1024).toFixed(2)} KB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {format(new Date(file.createdAt), 'd MMMM yyyy, HH:mm', {
                        locale: pl,
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
        )}
      </div>
    </div>
  )
}

