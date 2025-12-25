'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Play, CheckCircle } from 'lucide-react'
import { Course, CourseVideoFile } from '@prisma/client'

interface WatchCourseProps {
  course: Course & {
    videoFiles: CourseVideoFile[]
    organizer: { name: string }
  }
}

export default function WatchCourse({ course }: WatchCourseProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set())

  const currentVideo = course.videoFiles[currentVideoIndex]

  const handleVideoEnd = () => {
    if (currentVideo) {
      setWatchedVideos(prev => {
        const newSet = new Set(prev)
        newSet.add(currentVideo.id)
        return newSet
      })
    }
    if (currentVideoIndex < course.videoFiles.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="hero-background relative overflow-hidden">
        <div className="hero-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <Link
            href="/dashboard/courses/online"
            className="inline-flex items-center text-white hover:text-purple-300 mb-6 transition-colors drop-shadow-md"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Powrót do kursów online
          </Link>
        </div>
      </div>

      <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Główny odtwarzacz */}
            <div className="lg:col-span-3">
              <div className="glass rounded-2xl shadow-xl p-6 border border-purple-500/30 mb-6">
                <h1 className="text-2xl font-bold text-white mb-4">{course.title}</h1>
                {currentVideo ? (
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      key={currentVideo.id}
                      src={currentVideo.path}
                      controls
                      className="w-full h-full"
                      onEnded={handleVideoEnd}
                      autoPlay
                    >
                      Twoja przeglądarka nie obsługuje odtwarzania wideo.
                    </video>
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
                    <p className="text-gray-400">Brak dostępnych wideo</p>
                  </div>
                )}
              </div>
            </div>

            {/* Lista lekcji */}
            <div className="lg:col-span-1">
              <div className="glass rounded-2xl shadow-xl p-6 border border-purple-500/30">
                <h2 className="text-lg font-bold text-white mb-4">Lekcje</h2>
                <div className="space-y-2">
                  {course.videoFiles.map((video, index) => (
                    <button
                      key={video.id}
                      onClick={() => setCurrentVideoIndex(index)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        index === currentVideoIndex
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800/50 text-gray-200 hover:bg-purple-900/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <Play className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">
                            Lekcja {index + 1}
                          </span>
                        </div>
                        {watchedVideos.has(video.id) && (
                          <CheckCircle className="h-4 w-4 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

