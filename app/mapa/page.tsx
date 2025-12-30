'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Globe, MapPin, X, Calendar, Star, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale/pl'
import Link from 'next/link'

// Dynamiczny import Globe z opcjami optymalizacji
const GlobeComponent = dynamic(
  () => import('react-globe.gl'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-purple-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-300">Ładowanie globu...</p>
        </div>
      </div>
    )
  }
)

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

  // Przygotuj punkty na globie dla województw z mniejszymi rozmiarami dla lepszej widoczności
  const points = VOIVODESHIPS.map((voivodeship) => ({
    lat: voivodeship.lat,
    lng: voivodeship.lng,
    size: selectedVoivodeship === voivodeship.name ? 0.8 : 0.5,
    color: selectedVoivodeship === voivodeship.name ? '#00D9FF' : '#FF6B35',
    voivodeship: voivodeship.name,
    label: voivodeship.name,
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
    if (point && point.voivodeship) {
      setSelectedVoivodeship(point.voivodeship)
      // Przesuń glob do wybranego województwa
      if (globeRef.current) {
        const voivodeshipData = VOIVODESHIPS.find((v) => v.name === point.voivodeship)
        if (voivodeshipData) {
          globeRef.current.pointOfView({
            lat: voivodeshipData.lat,
            lng: voivodeshipData.lng,
            altitude: 1.5,
          }, 1000)
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-950 relative overflow-hidden">
      {/* Iron Man style background effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Hero Section */}
      <div className="relative z-10 pt-8 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 animate-fade-in-scale">
            <div className="glass rounded-2xl p-6 sm:p-8 shadow-xl border-orange-500/30" style={{
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(31, 41, 55, 0.95) 100%)',
              borderColor: 'rgba(255, 107, 53, 0.3)',
              boxShadow: '0 0 30px rgba(255, 107, 53, 0.2), 0 0 60px rgba(0, 217, 255, 0.1)'
            }}>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3 drop-shadow-lg flex items-center justify-center space-x-3">
                <Globe className="h-8 w-8 sm:h-10 sm:w-10" style={{ color: '#FF6B35', filter: 'drop-shadow(0 0 10px rgba(255, 107, 53, 0.8))' }} />
                <span className="bg-gradient-to-r from-orange-400 via-yellow-400 to-cyan-400 bg-clip-text text-transparent">
                  Mapa Kursów
                </span>
              </h1>
              <p className="text-base sm:text-lg text-gray-300 drop-shadow-md text-center">
                Kliknij na punkt na kuli ziemskiej, aby zobaczyć dostępne kursy w danym województwie
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Centered Globe */}
      <div className="relative z-10 flex items-center justify-center px-4 sm:px-6 lg:px-8 pb-12 min-h-[calc(100vh-250px)]">
        <div 
          className="rounded-2xl relative mx-auto flex items-center justify-center"
          data-globe-container
          style={{
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(31, 41, 55, 0.9) 100%)',
            border: '2px solid rgba(255, 107, 53, 0.4)',
            boxShadow: '0 0 40px rgba(255, 107, 53, 0.3), 0 0 80px rgba(0, 217, 255, 0.2), inset 0 0 60px rgba(0, 0, 0, 0.5)',
            width: '90vw',
            maxWidth: '1200px',
            height: 'calc(100vh - 250px)',
            minHeight: '600px'
          }}
        >
          <GlobeComponent
            ref={globeRef}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            backgroundColor="rgba(0, 0, 0, 0)"
            showAtmosphere={true}
            atmosphereColor="#00D9FF"
            atmosphereAltitude={0.25}
            pointsData={points}
            pointColor="color"
            pointRadius="size"
            pointLabel={(d: any) => `${d.voivodeship}\n(Kliknij, aby zobaczyć kursy)`}
            onPointClick={handlePointClick}
            onGlobeReady={() => {
              setGlobeReady(true)
              // Ustaw początkowy widok na Polskę
              if (globeRef.current) {
                globeRef.current.pointOfView({
                  lat: 52.0,
                  lng: 19.0,
                  altitude: 2.2,
                }, 0)
              }
            }}
            pointResolution={12}
            pointAltitude={0.03}
            showGlobe={true}
            showGraticules={true}
          />
          {!globeReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
              <div className="text-center">
                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" style={{ color: '#FF6B35' }} />
                <p className="text-gray-300">Ładowanie globu...</p>
              </div>
            </div>
          )}
          {/* Instrukcja */}
          <div 
            className="absolute bottom-4 left-4 right-4 rounded-lg p-3"
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 107, 53, 0.4)',
              boxShadow: '0 0 20px rgba(255, 107, 53, 0.3)'
            }}
          >
            <p className="text-sm text-white text-center">
              <span className="font-semibold" style={{ color: '#FFD700' }}>💡 Wskazówka:</span>{' '}
              <span>Kliknij na punkt na globie, aby zobaczyć kursy w danym województwie</span>
            </p>
          </div>
        </div>
      </div>

      {/* Courses Modal/Overlay - appears when a voivodeship is selected */}
      {selectedVoivodeship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(31, 41, 55, 0.98) 100%)',
              border: '2px solid rgba(255, 107, 53, 0.5)',
              boxShadow: '0 0 40px rgba(255, 107, 53, 0.4), 0 0 80px rgba(0, 217, 255, 0.3)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <MapPin className="h-6 w-6 mr-2" style={{ color: '#FF6B35' }} />
                <span className="bg-gradient-to-r from-orange-400 to-cyan-400 bg-clip-text text-transparent">
                  {selectedVoivodeship}
                </span>
              </h2>
              <button
                onClick={() => {
                  setSelectedVoivodeship(null)
                  setCourses([])
                  if (globeRef.current) {
                    globeRef.current.pointOfView({
                      lat: 52.0,
                      lng: 19.0,
                      altitude: 2.2,
                    }, 1000)
                  }
                }}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-12 flex-1 flex items-center justify-center">
                <div>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#FF6B35' }}></div>
                  <p className="text-gray-300">Ładowanie kursów...</p>
                </div>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12 flex-1 flex items-center justify-center">
                <div>
                  <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300">Brak kursów w tym województwie</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                {courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="block p-4 rounded-lg border transition-all hover:scale-105"
                    style={{
                      background: 'rgba(31, 41, 55, 0.6)',
                      borderColor: 'rgba(255, 107, 53, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 107, 53, 0.8)'
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 107, 53, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 107, 53, 0.3)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <h3 className="text-white font-semibold mb-2 line-clamp-2 text-lg">
                      {course.title}
                    </h3>
                    <div className="space-y-2 text-sm">
                      {course.city && (
                        <div className="flex items-center text-gray-300">
                          <MapPin className="h-4 w-4 mr-2" style={{ color: '#FF6B35' }} />
                          {course.city}
                        </div>
                      )}
                      <div className="flex items-center text-gray-300">
                        <Calendar className="h-4 w-4 mr-2" style={{ color: '#FFD700' }} />
                        {format(new Date(course.startDate), 'dd MMMM yyyy', { locale: pl })}
                      </div>
                      {course.averageRating > 0 && (
                        <div className="flex items-center text-gray-300">
                          <Star className="h-4 w-4 mr-2 text-yellow-400 fill-yellow-400" />
                          {course.averageRating.toFixed(1)} ({course.totalReviews} {course.totalReviews === 1 ? 'ocena' : 'ocen'})
                        </div>
                      )}
                      <div className="font-semibold" style={{ color: '#FFD700' }}>
                        {course.price} zł
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
