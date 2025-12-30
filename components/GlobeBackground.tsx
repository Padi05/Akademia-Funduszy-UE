'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamiczny import Globe
const GlobeComponent = dynamic(
  () => import('react-globe.gl'),
  { 
    ssr: false,
  }
) as any

export default function GlobeBackground() {
  const globeRef = useRef<any>(null)
  const lngRef = useRef<number>(0)
  const latRef = useRef<number>(0)
  const [globeReady, setGlobeReady] = useState(false)
  
  // Losowe wartości kierunku i prędkości rotacji (generowane raz przy montowaniu komponentu)
  const rotationSpeedLng = useRef<number>(0.15 + Math.random() * 0.15) // Prędkość rotacji długości: 0.15-0.3
  const rotationSpeedLat = useRef<number>(0.05 + Math.random() * 0.1) // Prędkość rotacji szerokości: 0.05-0.15
  const directionLng = useRef<number>(Math.random() > 0.5 ? 1 : -1) // Losowy kierunek: 1 lub -1
  const directionLat = useRef<number>(Math.random() > 0.5 ? 1 : -1) // Losowy kierunek: 1 lub -1

  useEffect(() => {
    if (!globeReady || !globeRef.current) return

    // Automatyczna rotacja kuli ziemskiej w losowym kierunku
    let animationFrameId: number
    const animateRotation = () => {
      if (globeRef.current) {
        // Rotacja wokół osi Y (długość geograficzna)
        lngRef.current += rotationSpeedLng.current * directionLng.current
        // Normalizuj wartość do zakresu 0-360
        if (lngRef.current >= 360) {
          lngRef.current -= 360
        } else if (lngRef.current < 0) {
          lngRef.current += 360
        }
        
        // Rotacja wokół osi X (szerokość geograficzna) - ograniczona do zakresu -60 do 60 stopni
        latRef.current += rotationSpeedLat.current * directionLat.current
        if (latRef.current > 60) {
          latRef.current = 60
          directionLat.current *= -1 // Zmień kierunek
        } else if (latRef.current < -60) {
          latRef.current = -60
          directionLat.current *= -1 // Zmień kierunek
        }
        
        // Aktualizuj kamerę z rotacją w obu osiach
        globeRef.current.pointOfView({
          lat: latRef.current,
          lng: lngRef.current,
          altitude: 2.5,
        }, 0) // 0ms dla natychmiastowej aktualizacji (requestAnimationFrame zapewnia płynność)
      }
      animationFrameId = requestAnimationFrame(animateRotation)
    }

    // Rozpocznij animację
    animationFrameId = requestAnimationFrame(animateRotation)

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [globeReady])

  return (
    <div 
      className="absolute pointer-events-none"
      style={{
        zIndex: 1,
        opacity: 0.25,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        overflow: 'visible',
      }}
    >
      <div style={{ 
        width: '100%', 
        height: '100%', 
        minHeight: '100vh',
        position: 'relative',
        overflow: 'visible',
      }}>
        <GlobeComponent
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          backgroundColor="rgba(0, 0, 0, 0)"
          showAtmosphere={true}
          atmosphereColor="#87ceeb"
          atmosphereAltitude={0.1}
          showGlobe={true}
          showGraticules={false}
          pointResolution={8}
          enablePointerInteraction={false}
          onGlobeReady={() => {
            setGlobeReady(true)
            if (globeRef.current) {
              // Losowa początkowa pozycja kuli ziemskiej
              const randomLat = (Math.random() - 0.5) * 60 // -30 do 30 stopni
              const randomLng = Math.random() * 360 // 0 do 360 stopni
              lngRef.current = randomLng
              latRef.current = randomLat
              globeRef.current.pointOfView({
                lat: randomLat,
                lng: randomLng,
                altitude: 2.5,
              }, 0)
            }
          }}
        />
      </div>
    </div>
  )
}

