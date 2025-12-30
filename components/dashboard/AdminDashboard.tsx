'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, BookOpen, CreditCard, TrendingUp, Shield, Trash2, Edit, Ban, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale/pl'
import { useRouter } from 'next/navigation'

interface AdminStats {
  totalUsers: number
  totalCourses: number
  activeSubscriptions: number
  totalRevenue: number
}

interface User {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
  subscription?: {
    status: string
    endDate: string
  }
}

interface Course {
  id: string
  title: string
  organizer: {
    name: string
    email: string
  }
  createdAt: string
  isPublished: boolean
}

interface Subscription {
  id: string
  user: {
    name: string
    email: string
  }
  status: string
  startDate: string
  endDate: string
  monthlyPrice: number
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'courses' | 'subscriptions'>('overview')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      if (activeTab === 'overview') {
        const [statsRes, usersRes, coursesRes, subsRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/users'),
          fetch('/api/admin/courses'),
          fetch('/api/admin/subscriptions'),
        ])
        
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }
        if (usersRes.ok) {
          const usersData = await usersRes.json()
          setUsers(usersData)
        }
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json()
          setCourses(coursesData)
        }
        if (subsRes.ok) {
          const subsData = await subsRes.json()
          setSubscriptions(subsData)
        }
      } else if (activeTab === 'users') {
        const res = await fetch('/api/admin/users')
        if (res.ok) {
          const data = await res.json()
          setUsers(data)
        } else {
          const errorData = await res.json().catch(() => ({ error: 'Nieznany błąd' }))
          setError(`Błąd podczas ładowania użytkowników: ${errorData.error || res.statusText}`)
          console.error('Error fetching users:', errorData)
        }
      } else if (activeTab === 'courses') {
        const res = await fetch('/api/admin/courses')
        if (res.ok) {
          const data = await res.json()
          setCourses(data)
        }
      } else if (activeTab === 'subscriptions') {
        const res = await fetch('/api/admin/subscriptions')
        if (res.ok) {
          const data = await res.json()
          setSubscriptions(data)
        }
      }
    } catch (err) {
      setError('Wystąpił błąd podczas ładowania danych')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tego użytkownika?')) return
    
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId))
        alert('Użytkownik został usunięty')
      } else {
        alert('Wystąpił błąd podczas usuwania użytkownika')
      }
    } catch (err) {
      alert('Wystąpił błąd podczas usuwania użytkownika')
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten kurs?')) return
    
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        setCourses(courses.filter(c => c.id !== courseId))
        alert('Kurs został usunięty')
      } else {
        alert('Wystąpił błąd podczas usuwania kursu')
      }
    } catch (err) {
      alert('Wystąpił błąd podczas usuwania kursu')
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
        // Odśwież dane po zmianie roli
        fetchData()
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Nieznany błąd' }))
        alert(`Wystąpił błąd podczas aktualizacji roli: ${errorData.error || 'Nieznany błąd'}`)
      }
    } catch (err) {
      console.error('Error updating user role:', err)
      alert('Wystąpił błąd podczas aktualizacji roli')
    }
  }

  if (loading && activeTab === 'overview') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Przycisk dodawania kursu dla admina */}
      <div className="mb-6 flex justify-end">
        <Link
          href="/dashboard/courses/new"
          className="bg-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2 shadow-lg hover-lift transition-all font-semibold border border-purple-500/50 text-sm sm:text-base"
        >
          <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>Dodaj nowy kurs</span>
        </Link>
      </div>
      
      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-semibold transition-all ${
            activeTab === 'overview'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Przegląd
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-semibold transition-all ${
            activeTab === 'users'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Użytkownicy
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 font-semibold transition-all ${
            activeTab === 'courses'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Kursy
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-4 py-2 font-semibold transition-all ${
            activeTab === 'subscriptions'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Subskrypcje
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold gradient-text mb-6">Statystyki</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <button
              onClick={() => setActiveTab('users')}
              className="glass rounded-xl p-6 border border-purple-500/30 hover:border-purple-400/50 hover:bg-purple-500/10 transition-all cursor-pointer text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <Users className="h-8 w-8 text-purple-400" />
                <span className="text-2xl font-bold text-white">{stats.totalUsers}</span>
              </div>
              <p className="text-gray-300 text-sm">Użytkowników</p>
            </button>
            
            <button
              onClick={() => setActiveTab('courses')}
              className="glass rounded-xl p-6 border border-purple-500/30 hover:border-purple-400/50 hover:bg-purple-500/10 transition-all cursor-pointer text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <BookOpen className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold text-white">{stats.totalCourses}</span>
              </div>
              <p className="text-gray-300 text-sm">Kursów</p>
            </button>
            
            <button
              onClick={() => setActiveTab('subscriptions')}
              className="glass rounded-xl p-6 border border-purple-500/30 hover:border-purple-400/50 hover:bg-purple-500/10 transition-all cursor-pointer text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <CreditCard className="h-8 w-8 text-green-400" />
                <span className="text-2xl font-bold text-white">{stats.activeSubscriptions}</span>
              </div>
              <p className="text-gray-300 text-sm">Aktywnych subskrypcji</p>
            </button>
            
            <div className="glass rounded-xl p-6 border border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-8 w-8 text-yellow-400" />
                <span className="text-2xl font-bold text-white">{stats.totalRevenue.toFixed(2)} zł</span>
              </div>
              <p className="text-gray-300 text-sm">Przychód</p>
            </div>
          </div>

          {/* Recent Users */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Ostatni użytkownicy</h3>
            <div className="glass rounded-xl overflow-hidden border border-purple-500/30">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Imię</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Rola</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Data rejestracji</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 5).map((user) => (
                      <tr key={user.id} className="border-t border-gray-700 hover:bg-gray-800/30">
                        <td className="px-4 py-3 text-sm text-gray-200">{user.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-200">{user.name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'ADMIN' ? 'bg-red-600' :
                            user.role === 'ORGANIZER' ? 'bg-purple-600' : 'bg-blue-600'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {format(new Date(user.createdAt), 'd MMM yyyy', { locale: pl })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold gradient-text mb-6">Zarządzanie użytkownikami</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="glass rounded-xl p-8 border border-purple-500/30 text-center">
              <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">Brak użytkowników w bazie danych</p>
              <p className="text-gray-500 text-sm mt-2">Użytkownicy pojawią się tutaj po rejestracji</p>
            </div>
          ) : (
            <div className="glass rounded-xl overflow-hidden border border-purple-500/30">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Imię</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Rola</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Subskrypcja</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t border-gray-700 hover:bg-gray-800/30">
                        <td className="px-4 py-3 text-sm text-gray-200">{user.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-200">{user.name}</td>
                        <td className="px-4 py-3">
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                            className="bg-gray-800 text-white px-2 py-1 rounded text-sm border border-gray-600"
                          >
                            <option value="PARTICIPANT">PARTICIPANT</option>
                            <option value="ORGANIZER">ORGANIZER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          {user.subscription ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.subscription.status === 'ACTIVE' ? 'bg-green-600' : 'bg-gray-600'
                            }`}>
                              {user.subscription.status}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-sm">Brak</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Usuń użytkownika"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold gradient-text mb-6">Zarządzanie kursami</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="glass rounded-xl overflow-hidden border border-purple-500/30">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Tytuł</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Organizator</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Data utworzenia</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course.id} className="border-t border-gray-700 hover:bg-gray-800/30">
                        <td className="px-4 py-3 text-sm text-gray-200">{course.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-200">
                          <div>
                            <div>{course.organizer.name}</div>
                            <div className="text-xs text-gray-400">{course.organizer.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {course.isPublished ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-600">
                              Opublikowany
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-600">
                              Nieopublikowany
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {format(new Date(course.createdAt), 'd MMM yyyy', { locale: pl })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/dashboard/courses/${course.id}/edit`}
                              className="text-blue-400 hover:text-blue-300 p-1"
                              title="Edytuj kurs"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDeleteCourse(course.id)}
                              className="text-red-400 hover:text-red-300 p-1"
                              title="Usuń kurs"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold gradient-text mb-6">Zarządzanie subskrypcjami</h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="glass rounded-xl overflow-hidden border border-purple-500/30">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Użytkownik</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Cena</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Data rozpoczęcia</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Data wygaśnięcia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub) => (
                      <tr key={sub.id} className="border-t border-gray-700 hover:bg-gray-800/30">
                        <td className="px-4 py-3 text-sm text-gray-200">
                          <div>
                            <div>{sub.user.name}</div>
                            <div className="text-xs text-gray-400">{sub.user.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            sub.status === 'ACTIVE' ? 'bg-green-600' :
                            sub.status === 'CANCELLED' ? 'bg-red-600' : 'bg-gray-600'
                          }`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-200">{sub.monthlyPrice} zł</td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {format(new Date(sub.startDate), 'd MMM yyyy', { locale: pl })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {format(new Date(sub.endDate), 'd MMM yyyy', { locale: pl })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

