'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale/pl'
import { Plus, Edit, Trash2, FileText, Calendar } from 'lucide-react'
import { useState } from 'react'
import { Course, CourseFile } from '@prisma/client'

interface OrganizerDashboardProps {
  courses: (Course & { files: CourseFile[] })[]
}

export default function OrganizerDashboard({ courses }: OrganizerDashboardProps) {
  const [coursesList, setCoursesList] = useState(courses)

  const handleDelete = async (courseId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten kurs?')) {
      return
    }

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setCoursesList(coursesList.filter((c) => c.id !== courseId))
      } else {
        alert('Wystąpił błąd podczas usuwania kursu')
      }
    } catch (error) {
      alert('Wystąpił błąd podczas usuwania kursu')
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold gradient-text">Moje kursy</h2>
          <p className="text-gray-200 mt-1">Zarządzaj swoimi kursami dotacyjnymi</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/courses/online"
            className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 flex items-center space-x-2 shadow-lg hover-lift transition-all font-semibold border border-purple-500/50"
          >
            <span>Kursy Online</span>
          </Link>
          <Link
            href="/dashboard/courses/new"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 flex items-center space-x-2 shadow-lg hover-lift transition-all font-semibold border border-purple-500/50"
          >
            <Plus className="h-5 w-5" />
            <span>Dodaj nowy kurs</span>
          </Link>
        </div>
      </div>

      {coursesList.length === 0 ? (
        <div className="glass rounded-2xl shadow-xl p-12 text-center animate-scale-in">
          <div className="text-6xl mb-4 animate-float">📚</div>
          <p className="text-gray-100 text-lg mb-6">Nie masz jeszcze żadnych kursów.</p>
          <Link
            href="/dashboard/courses/new"
            className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 shadow-lg hover-lift transition-all font-semibold"
          >
            Dodaj pierwszy kurs
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coursesList.map((course, index) => (
            <div
              key={course.id}
              className="glass rounded-xl shadow-lg hover-lift p-6 border border-purple-500/30 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-bold text-white flex-1 group-hover:text-purple-300 transition-colors">
                  {course.title}
                </h3>
                <span
                  className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                    course.type === 'ONLINE'
                      ? 'bg-purple-900/50 text-purple-300 border border-purple-500'
                      : 'bg-gray-700 text-gray-300 border border-gray-600'
                  }`}
                >
                  {course.type === 'ONLINE' ? '💻 Online' : '📍 Stacjonarny'}
                </span>
              </div>

              <p className="text-gray-100 mb-6 line-clamp-2 text-sm leading-relaxed">
                {course.description}
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-white bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700">
                  <Calendar className="h-5 w-5 mr-3 text-purple-300" />
                  <span className="font-medium text-white">
                    {format(new Date(course.startDate), 'd MMMM yyyy', {
                      locale: pl,
                    })}
                  </span>
                </div>
                <div className="flex items-center text-sm text-white bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700">
                  <FileText className="h-5 w-5 mr-3 text-purple-300" />
                  <span className="font-medium text-white">{course.files.length} plik(ów)</span>
                </div>
                <div className="flex items-center text-sm text-white bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700">
                  <span className="font-bold text-lg text-purple-200">{course.price} zł</span>
                </div>
              </div>

              <div className="flex space-x-2 pt-4 border-t border-gray-700">
                <Link
                  href={`/dashboard/courses/${course.id}/edit`}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 flex items-center justify-center space-x-2 transition-all"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edytuj</span>
                </Link>
                <button
                  onClick={() => handleDelete(course.id)}
                  className="flex-1 bg-red-900/50 text-red-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-800/50 flex items-center justify-center space-x-2 transition-all border border-red-500/30"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Usuń</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

