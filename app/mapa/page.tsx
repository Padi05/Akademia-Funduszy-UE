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
  const [countriesData, setCountriesData] = useState<any[]>([])
  const globeRef = useRef<any>(null)
  const rotationRef = useRef<number>(0)

  // Przygotuj punkty na globie dla województw z animacją pulsowania
  const points = VOIVODESHIPS.map((voivodeship) => ({
    lat: voivodeship.lat,
    lng: voivodeship.lng,
    size: selectedVoivodeship === voivodeship.name ? 1.2 : 0.8,
    color: selectedVoivodeship === voivodeship.name ? '#60a5fa' : '#a78bfa',
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

  // Załaduj dane o granicach państw przy montowaniu komponentu
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
      .then(res => res.json())
      .then((data: any) => {
        setCountriesData(data.features || [])
      })
      .catch(err => {
        console.error('Error loading countries:', err)
        // Fallback - użyj prostszego źródła danych
        fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
          .then(res => res.json())
          .then((data: any) => {
            setCountriesData(data.features || [])
          })
          .catch(err2 => console.error('Error loading fallback countries:', err2))
      })
  }, [])

  // Animacja automatycznego obrotu globusa
  useEffect(() => {
    if (!globeReady || !globeRef.current || selectedVoivodeship) return

    let animationFrameId: number
    const animateRotation = () => {
      if (globeRef.current && !selectedVoivodeship) {
        rotationRef.current += 0.15
        globeRef.current.rotation({ lat: 0, lng: rotationRef.current, meridian: 0 })
      }
      animationFrameId = requestAnimationFrame(animateRotation)
    }

    animationFrameId = requestAnimationFrame(animateRotation)
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [globeReady, selectedVoivodeship])


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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 pt-8 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 flex items-center justify-center space-x-3">
              <Globe className="h-8 w-8 sm:h-10 sm:w-10 text-blue-400" />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-600 bg-clip-text text-transparent">
                Mapa Kursów
              </span>
            </h1>
            <p className="text-gray-300 text-lg">
              Kliknij na punkt na globie, aby zobaczyć dostępne kursy w danym województwie
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - Globe and Sidebar */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Globe - Left Side */}
          <div className="lg:col-span-2">
            <div 
              className="rounded-xl relative overflow-hidden"
              data-globe-container
              style={{
                background: 'linear-gradient(135deg, rgba(200, 220, 255, 0.15) 0%, rgba(150, 180, 220, 0.1) 100%)',
                border: '1px solid rgba(100, 150, 200, 0.4)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), inset 0 0 100px rgba(200, 220, 255, 0.1)',
                height: 'calc(100vh - 280px)',
                minHeight: '600px'
              }}
            >
              <GlobeComponent
                ref={globeRef}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                backgroundColor="rgba(200, 220, 255, 0.1)"
                showAtmosphere={true}
                atmosphereColor="#87ceeb"
                atmosphereAltitude={0.2}
                backgroundImageUrl=""
                pointsData={points}
                pointColor="color"
                pointRadius="size"
                pointLabel={(d: any) => `${d.voivodeship}`}
                onPointClick={handlePointClick}
                onGlobeReady={() => {
                  setGlobeReady(true)
                  if (globeRef.current) {
                    globeRef.current.pointOfView({
                      lat: 52.0,
                      lng: 19.0,
                      altitude: 2.5,
                    }, 0)
                  }
                }}
                pointResolution={16}
                pointAltitude={0.03}
                showGlobe={true}
                showGraticules={true}
                polygonsData={countriesData}
                polygonAltitude={0.01}
                polygonCapColor={(d: any) => 'rgba(120, 160, 200, 0.25)'}
                polygonSideColor={(d: any) => 'rgba(100, 140, 180, 0.15)'}
                polygonStrokeColor={() => 'rgba(150, 180, 220, 0.6)'}
                polygonLabel={(d: any) => {
                  const props = d.properties || {}
                  return props.NAME || props.name || props.NAME_EN || 'Country'
                }}
              />
              {!globeReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-xl">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-blue-400" />
                    <p className="text-gray-300">Ładowanie globu...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Courses List */}
          <div className="lg:col-span-1">
            <div 
              className="rounded-xl p-6 h-full"
              style={{
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                minHeight: '600px'
              }}
            >
              {selectedVoivodeship ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center">
                      <MapPin className="h-6 w-6 mr-2 text-blue-400" />
                      <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
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
                            altitude: 2.5,
                          }, 1000)
                        }
                      }}
                      className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {isLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                      <p className="text-gray-300">Ładowanie kursów...</p>
                    </div>
                  ) : courses.length === 0 ? (
                    <div className="text-center py-12">
                      <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300">Brak kursów w tym województwie</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                      {courses.map((course) => (
                        <Link
                          key={course.id}
                          href={`/courses/${course.id}`}
                          className="block p-4 rounded-lg border transition-all hover:border-blue-400"
                          style={{
                            background: 'rgba(30, 41, 59, 0.6)',
                            borderColor: 'rgba(59, 130, 246, 0.3)',
                          }}
                        >
                          <h3 className="text-white font-semibold mb-3 line-clamp-2">
                            {course.title}
                          </h3>
                          <div className="space-y-2 text-sm">
                            {course.city && (
                              <div className="flex items-center text-gray-300">
                                <MapPin className="h-4 w-4 mr-2 text-blue-400" />
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
                            <div className="font-semibold text-blue-400">
                              {course.price} zł
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Globe className="h-20 w-20 text-blue-400 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold text-white mb-2">Wybierz województwo</h3>
                  <p className="text-gray-400">
                    Kliknij na punkt na globie, aby zobaczyć dostępne kursy w danym województwie
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
