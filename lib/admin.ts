// Funkcje pomocnicze do sprawdzania uprawnień administratora
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { UserRole } from '@/types/next-auth'

/**
 * Sprawdza czy użytkownik jest administratorem
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions)
  return session?.user?.role === 'ADMIN'
}

/**
 * Sprawdza czy użytkownik ma uprawnienia administratora lub organizatora
 */
export async function isAdminOrOrganizer(): Promise<boolean> {
  const session = await getServerSession(authOptions)
  return session?.user?.role === 'ADMIN' || session?.user?.role === 'ORGANIZER'
}

/**
 * Zwraca rolę użytkownika lub null
 */
export async function getUserRole(): Promise<UserRole | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.role || null
}


