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

    // Automatyczna rotacja kuli ziemskiej
    let animationFrameId: number
    const animateRotation = () => {
      if (globeRef.current) {
        rotationRef.current += 0.1
        globeRef.current.rotation({ 
          lat: 0, 
          lng: rotationRef.current, 
          meridian: 0 
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
  }, [globeReady])

  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 1,
        opacity: 0.25,
        width: '100%',
        height: '100%',
      }}
    >
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
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

