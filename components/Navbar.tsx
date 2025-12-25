'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { LogIn, LogOut, User, Home, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="glass border-b border-purple-500/30 sticky top-0 z-50 backdrop-blur-md bg-gray-900/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-all group">
            <div className="bg-purple-900/50 p-2 rounded-lg group-hover:bg-purple-800 transition-colors border border-purple-500/30 flex items-center justify-center">
              <svg 
                className="h-5 w-5 sm:h-6 sm:w-6 animate-spin-slow group-hover:scale-110 transition-transform"
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="10" stroke="url(#globeGradient)" strokeWidth="2" fill="none"/>
                <ellipse cx="12" cy="12" rx="10" ry="4" stroke="url(#globeGradient)" strokeWidth="1.5" fill="none" opacity="0.6"/>
                <ellipse cx="12" cy="12" rx="4" ry="10" stroke="url(#globeGradient)" strokeWidth="1.5" fill="none" opacity="0.6"/>
                <path d="M2 12h20M12 2v20" stroke="url(#globeGradient)" strokeWidth="1.5" opacity="0.4"/>
                <defs>
                  <linearGradient id="globeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0066cc" />
                    <stop offset="50%" stopColor="#003399" />
                    <stop offset="100%" stopColor="#0066cc" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="font-bold text-base sm:text-xl gradient-text-eu">Akademia Funduszy UE</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-3">
            <Link
              href="/"
              className="text-gray-200 hover:text-purple-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 hover:bg-gray-800 transition-all"
            >
              <Home className="h-4 w-4" />
              <span>Strona główna</span>
            </Link>

            {status === 'loading' ? (
              <div className="text-gray-200 flex items-center">
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500 mr-2"></span>
                <span className="hidden xl:inline">Ładowanie...</span>
              </div>
            ) : session ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-200 hover:text-purple-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 hover:bg-gray-800 transition-all"
                >
                  <User className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <div className="flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg border border-gray-700">
                  <span className="font-semibold text-white text-sm max-w-[120px] truncate">{session.user.name}</span>
                  <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded-full font-medium whitespace-nowrap">
                    {session.user.role === 'ORGANIZER' ? 'Organizator' : 'Uczestnik'}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-gray-200 hover:text-red-300 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 hover:bg-gray-800 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Wyloguj</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="bg-purple-600 text-white hover:bg-purple-700 px-4 xl:px-6 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 shadow-lg hover-lift transition-all"
                >
                  <span>Rejestracja</span>
                </Link>
                <Link
                  href="/login"
                  className="bg-gray-700 text-white hover:bg-gray-600 px-4 xl:px-6 py-2 rounded-lg text-sm font-semibold flex items-center space-x-2 shadow-lg hover-lift transition-all border border-purple-500/50"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden xl:inline">Zaloguj się</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-gray-200 hover:text-purple-300 p-2 rounded-lg hover:bg-gray-800 transition-all"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-purple-500/30 pt-4 pb-4 animate-slide-down">
            <div className="flex flex-col space-y-2">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-200 hover:text-purple-300 px-4 py-3 rounded-lg text-sm font-medium flex items-center space-x-2 hover:bg-gray-800 transition-all"
              >
                <Home className="h-4 w-4" />
                <span>Strona główna</span>
              </Link>

              {status === 'loading' ? (
                <div className="text-gray-200 flex items-center px-4 py-3">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500 mr-2"></span>
                  Ładowanie...
                </div>
              ) : session ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-200 hover:text-purple-300 px-4 py-3 rounded-lg text-sm font-medium flex items-center space-x-2 hover:bg-gray-800 transition-all"
                  >
                    <User className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                  <div className="px-4 py-3 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white text-sm">{session.user.name}</span>
                      </div>
                      <span className="inline-block text-xs bg-purple-600 text-white px-2 py-1 rounded-full font-medium w-fit">
                        {session.user.role === 'ORGANIZER' ? 'Organizator' : 'Uczestnik'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      signOut({ callbackUrl: '/' })
                    }}
                    className="text-gray-200 hover:text-red-300 px-4 py-3 rounded-lg text-sm font-medium flex items-center space-x-2 hover:bg-gray-800 transition-all text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Wyloguj</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-purple-600 text-white hover:bg-purple-700 px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 shadow-lg hover-lift transition-all"
                  >
                    <span>Rejestracja</span>
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-gray-700 text-white hover:bg-gray-600 px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 shadow-lg hover-lift transition-all border border-purple-500/50"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Zaloguj się</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

