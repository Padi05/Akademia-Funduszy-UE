import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      console.error('No session found')
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      console.error('User is not ADMIN:', session.user.role)
      return NextResponse.json({ error: 'Unauthorized - Not an admin' }, { status: 403 })
    }

    console.log('Fetching users for admin:', session.user.email)

    // Najpierw sprawdźmy czy w ogóle są użytkownicy w bazie
    const userCount = await prisma.user.count()
    console.log(`Total users in database: ${userCount}`)

    // Spróbuj najpierw bez include subscription, żeby sprawdzić czy problem jest w relacji
    let users
    try {
      users = await prisma.user.findMany({
        include: {
          subscription: {
            select: {
              status: true,
              endDate: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
      console.log(`Found ${users.length} users in database (with subscription data)`)
    } catch (includeError) {
      console.error('Error fetching users with subscription include:', includeError)
      // Jeśli jest błąd z include, spróbuj bez niego
      console.log('Trying to fetch users without subscription include...')
      users = await prisma.user.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      })
      console.log(`Found ${users.length} users in database (without subscription data)`)
    }
    
    // Jeśli liczba się nie zgadza, może być problem z relacją subscription
    if (userCount !== users.length) {
      console.warn(`Warning: User count mismatch! Total: ${userCount}, Found: ${users.length}`)
    }
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch users',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

