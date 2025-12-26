'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { LogIn, LogOut, User, Home, Menu, X, FileText, CreditCard, Shield } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="glass border-b border-purple-500/30 sticky top-0 z-50 backdrop-blur-md bg-gray-900/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          <Link href="/" className="flex items-center gap-2 xl:gap-3 text-purple-400 hover:text-purple-300 transition-all group flex-shrink-0">
            <div className="bg-purple-900/50 p-2 rounded-lg group-hover:bg-purple-800/80 transition-all duration-200 border border-purple-500/30 flex items-center justify-center shadow-sm">
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
            <span className="font-bold text-base sm:text-lg xl:text-xl gradient-text-eu whitespace-nowrap">Akademia Funduszy UE</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3">
            <Link
              href="/"
              className="text-gray-200 hover:text-purple-300 px-3 xl:px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800/80 transition-all duration-200"
            >
              <Home className="h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Strona główna</span>
            </Link>

            {status === 'loading' ? (
              <div className="text-gray-200 flex items-center px-3 xl:px-4 py-2">
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500 mr-2"></span>
                <span className="hidden xl:inline whitespace-nowrap">Ładowanie...</span>
              </div>
            ) : session ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-200 hover:text-purple-300 px-3 xl:px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800/80 transition-all duration-200"
                >
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">Dashboard</span>
                </Link>
                <Link
                  href="/dashboard/course-files"
                  className="text-gray-200 hover:text-purple-300 px-3 xl:px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800/80 transition-all duration-200"
                >
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">Pliki z kursów</span>
                </Link>
                <Link
                  href="/dashboard/subscription"
                  className="text-gray-200 hover:text-purple-300 px-3 xl:px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800/80 transition-all duration-200"
                >
                  <CreditCard className="h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">Subskrypcja</span>
                </Link>
                {session.user.role === 'ADMIN' && (
                  <Link
                    href="/dashboard/admin"
                    className="text-gray-200 hover:text-red-300 px-3 xl:px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800/80 transition-all duration-200 border border-red-500/30"
                  >
                    <Shield className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">Admin</span>
                  </Link>
                )}
                
                {/* Separator */}
                <div className="h-6 w-px bg-gray-700 mx-1"></div>
                
                <div className="flex items-center gap-2 bg-gray-800/80 px-3 xl:px-4 py-2 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all duration-200">
                  <span className="font-semibold text-white text-sm max-w-[140px] xl:max-w-[180px] truncate">{session.user.name}</span>
                  <span className={`text-xs text-white px-2 py-1 rounded-full font-medium whitespace-nowrap flex-shrink-0 ${
                    session.user.role === 'ADMIN' 
                      ? 'bg-red-600' 
                      : session.user.role === 'ORGANIZER' 
                        ? 'bg-purple-600' 
                        : 'bg-blue-600'
                  }`}>
                    {session.user.role === 'ADMIN' 
                      ? 'Admin' 
                      : session.user.role === 'ORGANIZER' 
                        ? 'Organizator' 
                        : 'Uczestnik'}
                  </span>
                </div>
                
                {/* Separator */}
                <div className="h-6 w-px bg-gray-700 mx-1"></div>
                
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-gray-200 hover:text-red-300 px-3 xl:px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800/80 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">Wyloguj</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="bg-purple-600 text-white hover:bg-purple-700 px-4 xl:px-6 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg hover:shadow-purple-500/20 transition-all duration-200 whitespace-nowrap"
                >
                  <span>Rejestracja</span>
                </Link>
                <Link
                  href="/login"
                  className="bg-gray-700 text-white hover:bg-gray-600 px-4 xl:px-6 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg hover:shadow-gray-500/20 transition-all duration-200 border border-purple-500/50 whitespace-nowrap"
                >
                  <LogIn className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden xl:inline">Zaloguj się</span>
                  <span className="xl:hidden">Login</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-gray-200 hover:text-purple-300 p-2 rounded-lg hover:bg-gray-800/80 transition-all duration-200 flex items-center justify-center"
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
            <div className="flex flex-col gap-2">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-200 hover:text-purple-300 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800/80 transition-all duration-200"
              >
                <Home className="h-4 w-4 flex-shrink-0" />
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
                    className="text-gray-200 hover:text-purple-300 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800/80 transition-all duration-200"
                  >
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/dashboard/course-files"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-200 hover:text-purple-300 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800/80 transition-all duration-200"
                  >
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span>Pliki z kursów</span>
                  </Link>
                  <Link
                    href="/dashboard/subscription"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-200 hover:text-purple-300 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800/80 transition-all duration-200"
                  >
                    <CreditCard className="h-4 w-4 flex-shrink-0" />
                    <span>Subskrypcja</span>
                  </Link>
                  {session.user.role === 'ADMIN' && (
                    <Link
                      href="/dashboard/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-gray-200 hover:text-red-300 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800/80 transition-all duration-200 border border-red-500/30"
                    >
                      <Shield className="h-4 w-4 flex-shrink-0" />
                      <span>Admin</span>
                    </Link>
                  )}
                  
                  {/* Separator */}
                  <div className="h-px bg-gray-700 my-1 mx-4"></div>
                  
                  <div className="px-4 py-3 bg-gray-800/80 rounded-lg border border-gray-700/50">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm truncate">{session.user.name}</span>
                      </div>
                      <span className={`inline-block text-xs text-white px-2 py-1 rounded-full font-medium w-fit ${
                        session.user.role === 'ADMIN' 
                          ? 'bg-red-600' 
                          : session.user.role === 'ORGANIZER' 
                            ? 'bg-purple-600' 
                            : 'bg-blue-600'
                      }`}>
                        {session.user.role === 'ADMIN' 
                          ? 'Admin' 
                          : session.user.role === 'ORGANIZER' 
                            ? 'Organizator' 
                            : 'Uczestnik'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Separator */}
                  <div className="h-px bg-gray-700 my-1 mx-4"></div>
                  
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false)
                      signOut({ callbackUrl: '/' })
                    }}
                    className="text-gray-200 hover:text-red-300 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gray-800/80 transition-all duration-200 text-left"
                  >
                    <LogOut className="h-4 w-4 flex-shrink-0" />
                    <span>Wyloguj</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-purple-600 text-white hover:bg-purple-700 px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/20 transition-all duration-200"
                  >
                    <span>Rejestracja</span>
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-gray-700 text-white hover:bg-gray-600 px-4 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-gray-500/20 transition-all duration-200 border border-purple-500/50"
                  >
                    <LogIn className="h-4 w-4 flex-shrink-0" />
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

