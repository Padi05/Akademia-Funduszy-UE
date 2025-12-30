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
  const rotationRef = useRef<number>(0)
  const [globeReady, setGlobeReady] = useState(false)

  useEffect(() => {
    if (!globeReady || !globeRef.current) return

    // Automatyczna rotacja kuli ziemskiej - płynna rotacja wokół osi Y
    let animationFrameId: number
    const animateRotation = () => {
      if (globeRef.current) {
        rotationRef.current += 0.2 // Szybkość rotacji (0.2 stopnia na klatkę)
        // Normalizuj wartość do zakresu 0-360
        if (rotationRef.current >= 360) {
          rotationRef.current -= 360
        }
        // Aktualizuj kamerę - rotacja wokół osi Y (długość geograficzna)
        globeRef.current.pointOfView({
          lat: 0,
          lng: rotationRef.current,
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
              globeRef.current.pointOfView({
                lat: 0,
                lng: 0,
                altitude: 2.5,
              }, 0)
            }
          }}
        />
      </div>
    </div>
  )
}

