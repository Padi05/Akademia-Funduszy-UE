'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Globe, MapPin, X, Calendar, Star, Loader2, Filter, Check } from 'lucide-react'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale/pl'
import Link from 'next/link'

// Dynamiczny import Globe z opcjami optymalizacji
const GlobeComponent = dynamic(
  () => import('react-globe.gl').then((mod) => {
    // Obsługa różnych sposobów eksportu
    if (mod.default) {
      return mod.default
    }
    if (typeof mod === 'function') {
      return mod
    }
    // Zwróć moduł jako fallback
    return mod
  }),
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
) as any

// Lista regionów z całego świata z koordynatami
const REGIONS = [
  // POLSKA - Województwa
  { name: 'Dolnośląskie', lat: 51.1, lng: 17.0, country: 'Polska' },
  { name: 'Kujawsko-Pomorskie', lat: 53.0, lng: 18.0, country: 'Polska' },
  { name: 'Lubelskie', lat: 51.2, lng: 22.6, country: 'Polska' },
  { name: 'Lubuskie', lat: 52.4, lng: 15.6, country: 'Polska' },
  { name: 'Łódzkie', lat: 51.8, lng: 19.5, country: 'Polska' },
  { name: 'Małopolskie', lat: 50.1, lng: 19.9, country: 'Polska' },
  { name: 'Mazowieckie', lat: 52.2, lng: 21.0, country: 'Polska' },
  { name: 'Opolskie', lat: 50.7, lng: 17.9, country: 'Polska' },
  { name: 'Podkarpackie', lat: 50.0, lng: 22.0, country: 'Polska' },
  { name: 'Podlaskie', lat: 53.1, lng: 23.2, country: 'Polska' },
  { name: 'Pomorskie', lat: 54.4, lng: 18.6, country: 'Polska' },
  { name: 'Śląskie', lat: 50.3, lng: 19.0, country: 'Polska' },
  { name: 'Świętokrzyskie', lat: 50.9, lng: 20.6, country: 'Polska' },
  { name: 'Warmińsko-Mazurskie', lat: 53.8, lng: 20.5, country: 'Polska' },
  { name: 'Wielkopolskie', lat: 52.4, lng: 16.9, country: 'Polska' },
  { name: 'Zachodniopomorskie', lat: 53.4, lng: 14.6, country: 'Polska' },
  
  // NIEMCY - Kraje związkowe
  { name: 'Bavaria', lat: 48.8, lng: 11.5, country: 'Niemcy' },
  { name: 'Berlin', lat: 52.5, lng: 13.4, country: 'Niemcy' },
  { name: 'North Rhine-Westphalia', lat: 51.2, lng: 7.0, country: 'Niemcy' },
  { name: 'Baden-Württemberg', lat: 48.8, lng: 9.2, country: 'Niemcy' },
  { name: 'Lower Saxony', lat: 52.8, lng: 9.8, country: 'Niemcy' },
  { name: 'Hesse', lat: 50.1, lng: 8.7, country: 'Niemcy' },
  { name: 'Saxony', lat: 51.1, lng: 13.7, country: 'Niemcy' },
  { name: 'Rhineland-Palatinate', lat: 49.9, lng: 7.4, country: 'Niemcy' },
  
  // FRANCJA - Regiony
  { name: 'Île-de-France', lat: 48.9, lng: 2.3, country: 'Francja' },
  { name: 'Auvergne-Rhône-Alpes', lat: 45.8, lng: 4.8, country: 'Francja' },
  { name: 'Provence-Alpes-Côte d\'Azur', lat: 43.7, lng: 7.3, country: 'Francja' },
  { name: 'Nouvelle-Aquitaine', lat: 44.8, lng: -0.6, country: 'Francja' },
  { name: 'Occitanie', lat: 43.6, lng: 1.4, country: 'Francja' },
  { name: 'Hauts-de-France', lat: 50.6, lng: 3.1, country: 'Francja' },
  { name: 'Grand Est', lat: 48.6, lng: 7.7, country: 'Francja' },
  { name: 'Normandy', lat: 49.2, lng: -0.4, country: 'Francja' },
  
  // WŁOCHY - Regiony
  { name: 'Lombardy', lat: 45.5, lng: 9.2, country: 'Włochy' },
  { name: 'Lazio', lat: 41.9, lng: 12.5, country: 'Włochy' },
  { name: 'Campania', lat: 40.8, lng: 14.3, country: 'Włochy' },
  { name: 'Sicily', lat: 37.5, lng: 14.3, country: 'Włochy' },
  { name: 'Veneto', lat: 45.4, lng: 11.9, country: 'Włochy' },
  { name: 'Emilia-Romagna', lat: 44.5, lng: 11.3, country: 'Włochy' },
  { name: 'Piedmont', lat: 45.1, lng: 7.7, country: 'Włochy' },
  { name: 'Tuscany', lat: 43.8, lng: 11.3, country: 'Włochy' },
  
  // HISZPANIA - Wspólnoty autonomiczne
  { name: 'Madrid', lat: 40.4, lng: -3.7, country: 'Hiszpania' },
  { name: 'Catalonia', lat: 41.4, lng: 2.2, country: 'Hiszpania' },
  { name: 'Andalusia', lat: 37.4, lng: -5.9, country: 'Hiszpania' },
  { name: 'Valencia', lat: 39.5, lng: -0.4, country: 'Hiszpania' },
  { name: 'Basque Country', lat: 43.3, lng: -2.9, country: 'Hiszpania' },
  { name: 'Galicia', lat: 42.9, lng: -8.5, country: 'Hiszpania' },
  
  // WIELKA BRYTANIA - Regiony
  { name: 'Greater London', lat: 51.5, lng: -0.1, country: 'Wielka Brytania' },
  { name: 'West Midlands', lat: 52.5, lng: -1.9, country: 'Wielka Brytania' },
  { name: 'Greater Manchester', lat: 53.5, lng: -2.2, country: 'Wielka Brytania' },
  { name: 'West Yorkshire', lat: 53.8, lng: -1.6, country: 'Wielka Brytania' },
  { name: 'Scotland', lat: 56.0, lng: -4.2, country: 'Wielka Brytania' },
  { name: 'Wales', lat: 52.1, lng: -3.8, country: 'Wielka Brytania' },
  
  // USA - Stany
  { name: 'California', lat: 36.8, lng: -119.4, country: 'USA' },
  { name: 'New York', lat: 40.7, lng: -74.0, country: 'USA' },
  { name: 'Texas', lat: 31.0, lng: -99.9, country: 'USA' },
  { name: 'Florida', lat: 27.8, lng: -81.8, country: 'USA' },
  { name: 'Illinois', lat: 40.3, lng: -89.0, country: 'USA' },
  { name: 'Pennsylvania', lat: 40.6, lng: -77.2, country: 'USA' },
  { name: 'Ohio', lat: 40.4, lng: -82.8, country: 'USA' },
  { name: 'Georgia', lat: 33.0, lng: -83.6, country: 'USA' },
  { name: 'North Carolina', lat: 35.5, lng: -79.4, country: 'USA' },
  { name: 'Michigan', lat: 43.3, lng: -84.5, country: 'USA' },
  
  // KANADA - Prowincje
  { name: 'Ontario', lat: 43.7, lng: -79.4, country: 'Kanada' },
  { name: 'Quebec', lat: 46.8, lng: -71.2, country: 'Kanada' },
  { name: 'British Columbia', lat: 49.3, lng: -123.1, country: 'Kanada' },
  { name: 'Alberta', lat: 53.5, lng: -113.5, country: 'Kanada' },
  
  // BRAZYLIA - Stany
  { name: 'São Paulo', lat: -23.6, lng: -46.6, country: 'Brazylia' },
  { name: 'Rio de Janeiro', lat: -22.9, lng: -43.2, country: 'Brazylia' },
  { name: 'Minas Gerais', lat: -19.9, lng: -43.9, country: 'Brazylia' },
  { name: 'Bahia', lat: -12.9, lng: -38.5, country: 'Brazylia' },
  
  // CHINY - Prowincje
  { name: 'Beijing', lat: 39.9, lng: 116.4, country: 'Chiny' },
  { name: 'Shanghai', lat: 31.2, lng: 121.5, country: 'Chiny' },
  { name: 'Guangdong', lat: 23.1, lng: 113.3, country: 'Chiny' },
  { name: 'Jiangsu', lat: 32.1, lng: 118.8, country: 'Chiny' },
  { name: 'Zhejiang', lat: 30.3, lng: 120.2, country: 'Chiny' },
  
  // INDIE - Stany
  { name: 'Maharashtra', lat: 19.1, lng: 72.9, country: 'Indie' },
  { name: 'Delhi', lat: 28.6, lng: 77.2, country: 'Indie' },
  { name: 'Karnataka', lat: 12.9, lng: 77.6, country: 'Indie' },
  { name: 'Tamil Nadu', lat: 13.1, lng: 80.3, country: 'Indie' },
  { name: 'Gujarat', lat: 23.0, lng: 72.6, country: 'Indie' },
  
  // JAPONIA - Prefektury
  { name: 'Tokyo', lat: 35.7, lng: 139.7, country: 'Japonia' },
  { name: 'Osaka', lat: 34.7, lng: 135.5, country: 'Japonia' },
  { name: 'Kyoto', lat: 35.0, lng: 135.8, country: 'Japonia' },
  { name: 'Kanagawa', lat: 35.4, lng: 139.6, country: 'Japonia' },
  
  // AUSTRALIA - Stany
  { name: 'New South Wales', lat: -33.9, lng: 151.2, country: 'Australia' },
  { name: 'Victoria', lat: -37.8, lng: 144.9, country: 'Australia' },
  { name: 'Queensland', lat: -27.5, lng: 153.0, country: 'Australia' },
  { name: 'Western Australia', lat: -31.9, lng: 115.9, country: 'Australia' },
  
  // RPA - Prowincje
  { name: 'Gauteng', lat: -26.2, lng: 28.0, country: 'RPA' },
  { name: 'Western Cape', lat: -33.9, lng: 18.4, country: 'RPA' },
  { name: 'KwaZulu-Natal', lat: -29.9, lng: 30.9, country: 'RPA' },
  
  // MEKSYK - Stany
  { name: 'Mexico City', lat: 19.4, lng: -99.1, country: 'Meksyk' },
  { name: 'Jalisco', lat: 20.7, lng: -103.3, country: 'Meksyk' },
  { name: 'Nuevo León', lat: 25.7, lng: -100.3, country: 'Meksyk' },
  
  // ARGENTYNA - Prowincje
  { name: 'Buenos Aires', lat: -34.6, lng: -58.4, country: 'Argentyna' },
  { name: 'Córdoba', lat: -31.4, lng: -64.2, country: 'Argentyna' },
  
  // ROSJA - Regiony
  { name: 'Moscow', lat: 55.8, lng: 37.6, country: 'Rosja' },
  { name: 'Saint Petersburg', lat: 59.9, lng: 30.3, country: 'Rosja' },
  { name: 'Siberia', lat: 60.0, lng: 100.0, country: 'Rosja' },
  
  // TURCJA - Regiony
  { name: 'Istanbul', lat: 41.0, lng: 28.9, country: 'Turcja' },
  { name: 'Ankara', lat: 39.9, lng: 32.9, country: 'Turcja' },
  { name: 'Izmir', lat: 38.4, lng: 27.1, country: 'Turcja' },
  
  // KOREA POŁUDNIOWA - Regiony
  { name: 'Seoul', lat: 37.6, lng: 127.0, country: 'Korea Południowa' },
  { name: 'Busan', lat: 35.2, lng: 129.1, country: 'Korea Południowa' },
  
  // SINGAPUR
  { name: 'Singapore', lat: 1.3, lng: 103.8, country: 'Singapur' },
  
  // ZJEDNOCZONE EMIRATY ARABSKIE
  { name: 'Dubai', lat: 25.2, lng: 55.3, country: 'ZEA' },
  { name: 'Abu Dhabi', lat: 24.5, lng: 54.4, country: 'ZEA' },
  
  // EGIPT
  { name: 'Cairo', lat: 30.0, lng: 31.2, country: 'Egipt' },
  
  // MAROKO
  { name: 'Casablanca', lat: 33.6, lng: -7.6, country: 'Maroko' },
  { name: 'Rabat', lat: 34.0, lng: -6.8, country: 'Maroko' },
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
  const [currentAltitude, setCurrentAltitude] = useState<number>(2.5)
  const globeRef = useRef<any>(null)
  const rotationRef = useRef<number>(0)
  const [atmosphereColor, setAtmosphereColor] = useState<string>('#87ceeb')
  const [animationTime, setAnimationTime] = useState<number>(0)
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set())
  const [showFilter, setShowFilter] = useState<boolean>(false)

  // Funkcja obliczająca rozmiar punktu na podstawie altitude
  // Im mniejsze altitude (bliżej/przybliżenie), tym mniejszy punkt
  const calculatePointSize = (baseSize: number, altitude: number) => {
    // Normalizuj altitude (zakres 0.5-3.5)
    const normalizedAltitude = Math.max(0.5, Math.min(3.5, altitude))
    // Odwrotna proporcjonalność: mniejsze altitude = mniejszy punkt
    // Dla altitude 0.5 (bardzo blisko/przybliżenie) -> rozmiar 0.15
    // Dla altitude 3.5 (daleko/oddalenie) -> rozmiar 0.6
    // Większa różnica między min a max dla lepszej widoczności zmian
    const minSize = 0.15
    const maxSize = 0.6
    const sizeMultiplier = minSize + (normalizedAltitude - 0.5) / (3.5 - 0.5) * (maxSize - minSize)
    return baseSize * sizeMultiplier
  }

  // Animacja kolorów atmosfery - zmieniające się kolory
  useEffect(() => {
    if (!globeReady) return

    const intervalId = setInterval(() => {
      setAnimationTime((prev) => prev + 0.01)
      // Tworzenie płynnie zmieniających się kolorów (cykl kolorów)
      const hue = (animationTime * 50) % 360
      const saturation = 60 + Math.sin(animationTime * 2) * 20
      const lightness = 70 + Math.cos(animationTime * 1.5) * 15
      setAtmosphereColor(`hsl(${hue}, ${saturation}%, ${lightness}%)`)
    }, 50)

    return () => clearInterval(intervalId)
  }, [globeReady, animationTime])

  // Pobierz unikalne kraje z regionów
  const uniqueCountries = useMemo(() => {
    const countries = new Set(REGIONS.map(r => r.country).filter(Boolean))
    return Array.from(countries).sort()
  }, [])

  // Inicjalizuj wszystkie kraje jako wybrane przy pierwszym renderowaniu
  useEffect(() => {
    if (selectedCountries.size === 0 && uniqueCountries.length > 0) {
      setSelectedCountries(new Set(uniqueCountries))
    }
  }, [uniqueCountries, selectedCountries.size])

  // Przygotuj punkty na globie dla województw z dynamicznym rozmiarem i animacjami
  // Użyj useMemo, aby przeliczać tylko gdy zmienia się altitude lub selectedVoivodeship
  const points = useMemo(() => {
    // Zmniejszone baseSize dla mniejszych znaczników
    const baseSize = selectedVoivodeship ? 0.5 : 0.4
    const pulseFactor = 1 + Math.sin(animationTime * 3) * 0.15 // Pulsowanie punktów
    
    // Filtruj regiony według wybranych krajów
    const filteredRegions = REGIONS.filter(region => {
      if (selectedCountries.size === 0) return true
      return region.country && selectedCountries.has(region.country)
    })
    
    return filteredRegions.map((region, index) => {
      const isSelected = selectedVoivodeship === region.name
      // Animowane kolory - gradient dla wybranego, pulsujące dla innych
      let color: string
      if (isSelected) {
        // Wybrany punkt - jasny niebieski z pulsowaniem
        const brightness = 0.7 + Math.sin(animationTime * 4 + index) * 0.3
        color = `rgba(96, 165, 250, ${brightness})`
      } else {
        // Inne punkty - fioletowy z pulsowaniem
        const hue = (240 + Math.sin(animationTime * 2 + index * 0.5) * 30) % 360
        const saturation = 70 + Math.cos(animationTime * 3 + index) * 20
        color = `hsl(${hue}, ${saturation}%, 65%)`
      }
      
      return {
        lat: region.lat,
        lng: region.lng,
        size: calculatePointSize(baseSize, currentAltitude) * pulseFactor,
        color: color,
        voivodeship: region.name,
        label: `${region.name}${region.country ? `, ${region.country}` : ''}`,
        country: region.country,
      }
    })
  }, [currentAltitude, selectedVoivodeship, animationTime, selectedCountries])

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

  // Śledź zmiany punktu widoku (altitude) dla dynamicznego rozmiaru punktów
  useEffect(() => {
    if (!globeReady || !globeRef.current) return

    const checkAltitude = () => {
      if (globeRef.current) {
        try {
          const pov = globeRef.current.pointOfView()
          if (pov && pov.altitude !== undefined && pov.altitude !== currentAltitude) {
            setCurrentAltitude(pov.altitude)
          }
        } catch (e) {
          // Ignoruj błędy podczas sprawdzania
        }
      }
    }

    const intervalId = setInterval(checkAltitude, 100) // Sprawdzaj co 100ms
    return () => clearInterval(intervalId)
  }, [globeReady, currentAltitude])

  // Animacja automatycznego obrotu globusa z płynnymi efektami
  useEffect(() => {
    if (!globeReady || !globeRef.current || selectedVoivodeship) return

    let animationFrameId: number
    const animateRotation = () => {
      if (globeRef.current && !selectedVoivodeship) {
        // Płynniejsza rotacja z lekkim efektem falowania
        rotationRef.current += 0.12 + Math.sin(animationTime * 0.5) * 0.03
        // Dodaj subtelne wahania w osi lat dla efektu "kołysania"
        const latVariation = Math.sin(animationTime * 0.3) * 2
        globeRef.current.rotation({ 
          lat: latVariation, 
          lng: rotationRef.current, 
          meridian: Math.sin(animationTime * 0.4) * 5 
        })
      }
      animationFrameId = requestAnimationFrame(animateRotation)
    }

    animationFrameId = requestAnimationFrame(animateRotation)
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [globeReady, selectedVoivodeship, animationTime])


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
        const regionData = REGIONS.find((r) => r.name === point.voivodeship)
        if (regionData) {
          globeRef.current.pointOfView({
            lat: regionData.lat,
            lng: regionData.lng,
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
            <p className="text-gray-300 text-lg mb-4">
              Kliknij na punkt na globie, aby zobaczyć dostępne kursy w danym regionie
            </p>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtruj regiony
            </button>
          </div>
          
          {/* Panel filtrowania */}
          {showFilter && (
            <div className="mt-4 glass rounded-xl p-6 border border-purple-500/30 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Filter className="h-5 w-5 mr-2 text-purple-400" />
                  Wybierz kraje do wyświetlenia
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedCountries(new Set(uniqueCountries))}
                    className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
                  >
                    Zaznacz wszystkie
                  </button>
                  <button
                    onClick={() => setSelectedCountries(new Set())}
                    className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
                  >
                    Odznacz wszystkie
                  </button>
                  <button
                    onClick={() => setShowFilter(false)}
                    className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-64 overflow-y-auto pr-2">
                {uniqueCountries.map((country) => {
                  const isSelected = selectedCountries.has(country)
                  return (
                    <label
                      key={country}
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-purple-600/50 border-2 border-purple-400'
                          : 'bg-gray-800/50 border-2 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const newSet = new Set(selectedCountries)
                          if (e.target.checked) {
                            newSet.add(country)
                          } else {
                            newSet.delete(country)
                          }
                          setSelectedCountries(newSet)
                        }}
                        className="sr-only"
                      />
                      <div className={`flex items-center justify-center w-5 h-5 rounded border-2 mr-3 ${
                        isSelected ? 'bg-purple-500 border-purple-400' : 'border-gray-500'
                      }`}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="text-white text-sm font-medium">{country}</span>
                    </label>
                  )
                })}
              </div>
              <p className="mt-4 text-sm text-gray-400">
                Wybrano: {selectedCountries.size} z {uniqueCountries.length} krajów
              </p>
            </div>
          )}
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
                background: '#000',
                border: '1px solid rgba(100, 150, 200, 0.4)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 100px rgba(200, 220, 255, 0.1)',
                height: 'calc(100vh - 280px)',
                minHeight: '600px',
                width: '100%',
                position: 'relative'
              }}
            >
              {/* Starfield Background */}
              <div className="starfield">
                {/* Generate stars */}
                {Array.from({ length: 200 }).map((_, i) => {
                  const size = Math.random() < 0.7 ? 'small' : Math.random() < 0.9 ? 'medium' : 'large'
                  const left = Math.random() * 100
                  const top = Math.random() * 100
                  const delay = Math.random() * 3
                  return (
                    <div
                      key={i}
                      className={`star ${size}`}
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        animationDelay: `${delay}s`,
                        animationDuration: `${2 + Math.random() * 2}s`
                      }}
                    />
                  )
                })}
                {/* Nebula effects */}
                <div className="nebula nebula-1" />
                <div className="nebula nebula-2" />
                <div className="nebula nebula-3" />
              </div>
              <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
                <GlobeComponent
                  ref={globeRef}
                  globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                  backgroundColor="rgba(0, 0, 0, 0)"
                  showAtmosphere={true}
                  atmosphereColor={atmosphereColor}
                  atmosphereAltitude={0.15 + Math.sin(animationTime * 2) * 0.05}
                  backgroundImageUrl=""
                  pointsData={points}
                  pointColor="color"
                  pointLabel={(d: any) => d.label || `${d.voivodeship}${d.country ? `, ${d.country}` : ''}`}
                  onPointClick={handlePointClick}
                  onGlobeReady={() => {
                    setGlobeReady(true)
                    if (globeRef.current) {
                      const initialPOV = {
                        lat: 52.0,
                        lng: 19.0,
                        altitude: 2.5,
                      }
                      globeRef.current.pointOfView(initialPOV, 0)
                      setCurrentAltitude(initialPOV.altitude)
                    }
                  }}
                  pointResolution={32}
                  pointAltitude={0.02}
                  pointRadius={(d: any) => d.size || 0.8}
                  showGlobe={true}
                  showGraticules={true}
                  graticuleColor="rgba(100, 150, 200, 0.3)"
                  polygonsData={countriesData}
                  polygonAltitude={0.01}
                  polygonCapColor={(d: any) => {
                    // Animowane kolory krajów z gradientem
                    const hue = (animationTime * 20 + (d.properties?.NAME?.length || 0) * 10) % 360
                    return `hsla(${hue}, 40%, 50%, 0.2)`
                  }}
                  polygonSideColor={(d: any) => {
                    const hue = (animationTime * 20 + (d.properties?.NAME?.length || 0) * 10) % 360
                    return `hsla(${hue}, 30%, 40%, 0.15)`
                  }}
                  polygonStrokeColor={() => {
                    // Animowany kolor obramowania
                    const hue = (animationTime * 30) % 360
                    return `hsla(${hue}, 50%, 60%, 0.4)`
                  }}
                  polygonLabel={(d: any) => {
                    const props = d.properties || {}
                    return props.NAME || props.name || props.NAME_EN || 'Country'
                  }}
                />
              </div>
              {!globeReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-xl z-10">
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
                    <div className="flex items-center">
                      <MapPin className="h-6 w-6 mr-2 text-blue-400" />
                      <div className="flex flex-col">
                        <h2 className="text-2xl font-bold text-white">
                          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            {selectedVoivodeship}
                          </span>
                        </h2>
                        {(() => {
                          const region = REGIONS.find(r => r.name === selectedVoivodeship)
                          return region?.country ? (
                            <span className="text-sm text-gray-400 mt-1">{region.country}</span>
                          ) : null
                        })()}
                      </div>
                    </div>
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
                      <p className="text-gray-300">Brak kursów w tym regionie</p>
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
                  <h3 className="text-xl font-bold text-white mb-2">Wybierz region</h3>
                  <p className="text-gray-400">
                    Kliknij na punkt na globie, aby zobaczyć dostępne kursy w danym regionie
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
