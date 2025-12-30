'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Globe, MapPin, X, Calendar, Star } from 'lucide-react'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale/pl'
import Link from 'next/link'

// Dynamiczny import Globe (wymaga client-side rendering)
const GlobeComponent = dynamic(() => import('react-globe.gl'), { ssr: false })

// Lista województw Polski z koordynatami
const VOIVODESHIPS = [
  { name: 'Dolnośląskie', lat: 51.1, lng: 17.0 },
  { name: 'Kujawsko-Pomorskie', lat: 53.0, lng: 18.0 },
  { name: 'Lubelskie', lat: 51.2, lng: 22.6 },
  { name: 'Lubuskie', lat: 52.4, lng: 15.6 },
  { name: 'Łódzkie', lat: 51.8, lng: 19.5 },
  { name: 'Małopolskie', lat: 50.1, lng: 19.9 },
  { name: 'Mazowieckie', lat: 52.2, lng: 21.0 },
  { name: 'Opolskie', lat: 50.7, lng: 17.9 },
  { name: 'Podkarpackie', lat: 50.0, lng: 22.0 },
  { name: 'Podlaskie', lat: 53.1, lng: 23.2 },
  { name: 'Pomorskie', lat: 54.4, lng: 18.6 },
  { name: 'Śląskie', lat: 50.3, lng: 19.0 },
  { name: 'Świętokrzyskie', lat: 50.9, lng: 20.6 },
  { name: 'Warmińsko-Mazurskie', lat: 53.8, lng: 20.5 },
  { name: 'Wielkopolskie', lat: 52.4, lng: 16.9 },
  { name: 'Zachodniopomorskie', lat: 53.4, lng: 14.6 },
]

interface Course {
  id: string
  title: string
  description: string
  price: number
  startDate: string
  city: string | null
  voivodeship: string | null
  organizer: {
    name: string
    email: string
  }
  averageRating: number
  totalReviews: number
  totalEnrollments: number
}

export default function MapPage() {
  const [selectedVoivodeship, setSelectedVoivodeship] = useState<string | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [globeReady, setGlobeReady] = useState(false)
  const globeRef = useRef<any>(null)

  // Przygotuj punkty na globie dla województw
  const points = VOIVODESHIPS.map((voivodeship) => ({
    lat: voivodeship.lat,
    lng: voivodeship.lng,
    size: 0.5,
    color: selectedVoivodeship === voivodeship.name ? '#a855f7' : '#6b7280',
    voivodeship: voivodeship.name,
  }))

  useEffect(() => {
    if (selectedVoivodeship) {
      fetchCourses(selectedVoivodeship)
    } else {
      setCourses([])
    }
  }, [selectedVoivodeship])

  const fetchCourses = async (voivodeship: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/courses/by-voivodeship?voivodeship=${encodeURIComponent(voivodeship)}`)
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses)
      } else {
        setCourses([])
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      setCourses([])
    } finally {
      setIsLoading(false)
    }
  }

  const handlePointClick = (point: any) => {
    setSelectedVoivodeship(point.voivodeship)
  }

  const handleVoivodeshipSelect = (voivodeship: string) => {
    setSelectedVoivodeship(voivodeship)
    // Przesuń glob do wybranego województwa
    if (globeRef.current) {
      const voivodeshipData = VOIVODESHIPS.find((v) => v.name === voivodeship)
      if (voivodeshipData) {
        globeRef.current.pointOfView({
          lat: voivodeshipData.lat,
          lng: voivodeshipData.lng,
          altitude: 2,
        }, 1000)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div className="hero-background relative overflow-hidden">
        <div className="hero-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="mb-8 sm:mb-10 animate-fade-in-scale">
            <div className="glass rounded-2xl p-6 sm:p-8 shadow-xl">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3 drop-shadow-lg flex items-center space-x-3">
                <Globe className="h-8 w-8 sm:h-10 sm:w-10 text-purple-400" />
                <span>Mapa Kursów</span>
              </h1>
              <p className="text-base sm:text-lg text-white drop-shadow-md">
                Wybierz województwo, aby zobaczyć dostępne kursy w Twojej okolicy
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Lewa kolumna - Glob */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl p-4 sm:p-6 border border-purple-500/30 h-[500px] sm:h-[600px] relative">
              {globeReady ? (
                <GlobeComponent
                  ref={globeRef}
                  globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                  backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                  pointsData={points}
                  pointColor="color"
                  pointRadius="size"
                  pointLabel={(d: any) => d.voivodeship}
                  onPointClick={handlePointClick}
                  onGlobeReady={() => setGlobeReady(true)}
                  pointResolution={12}
                  pointAltitude={0.01}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Globe className="h-16 w-16 text-purple-400 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-300">Ładowanie globu...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Prawa kolumna - Lista województw i kursy */}
          <div className="space-y-6">
            {/* Lista województw */}
            <div className="glass rounded-2xl p-4 sm:p-6 border border-purple-500/30">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-purple-400" />
                Województwa
              </h2>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {VOIVODESHIPS.map((voivodeship) => (
                  <button
                    key={voivodeship.name}
                    onClick={() => handleVoivodeshipSelect(voivodeship.name)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                      selectedVoivodeship === voivodeship.name
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800/50 text-gray-200 hover:bg-gray-700'
                    }`}
                  >
                    {voivodeship.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Wybrane województwo i kursy */}
            {selectedVoivodeship && (
              <div className="glass rounded-2xl p-4 sm:p-6 border border-purple-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">
                    {selectedVoivodeship}
                  </h2>
                  <button
                    onClick={() => setSelectedVoivodeship(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
                    <p className="text-gray-300 mt-2">Ładowanie kursów...</p>
                  </div>
                ) : courses.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300">Brak kursów w tym województwie</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {courses.map((course) => (
                      <Link
                        key={course.id}
                        href={`/courses/${course.id}`}
                        className="block p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-all hover-lift"
                      >
                        <h3 className="text-white font-semibold mb-2 line-clamp-2">
                          {course.title}
                        </h3>
                        <div className="space-y-2 text-sm">
                          {course.city && (
                            <div className="flex items-center text-gray-300">
                              <MapPin className="h-4 w-4 mr-2 text-purple-400" />
                              {course.city}
                            </div>
                          )}
                          <div className="flex items-center text-gray-300">
                            <Calendar className="h-4 w-4 mr-2 text-purple-400" />
                            {format(new Date(course.startDate), 'dd MMMM yyyy', { locale: pl })}
                          </div>
                          {course.averageRating > 0 && (
                            <div className="flex items-center text-gray-300">
                              <Star className="h-4 w-4 mr-2 text-yellow-400 fill-yellow-400" />
                              {course.averageRating.toFixed(1)} ({course.totalReviews} {course.totalReviews === 1 ? 'ocena' : 'ocen'})
                            </div>
                          )}
                          <div className="text-purple-300 font-semibold">
                            {course.price} zł
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

