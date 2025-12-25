import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Konfiguracja dla App Router - wymagane gdy używamy dynamicznych funkcji
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Brak autoryzacji' },
        { status: 401 }
      )
    }

    // Sprawdź czy kurs istnieje
    const course = await prisma.course.findUnique({
      where: { id: params.id },
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Kurs nie został znaleziony' },
        { status: 404 }
      )
    }

    // Sprawdź czy plik należy do tego kursu
    const file = await prisma.courseFile.findUnique({
      where: { id: params.fileId },
    })

    if (!file || file.courseId !== params.id) {
      return NextResponse.json(
        { error: 'Plik nie został znaleziony' },
        { status: 404 }
      )
    }

    // Sprawdź uprawnienia do pobrania pliku:
    // 1. Organizator kursu zawsze ma dostęp
    // 2. Użytkownik z aktywną subskrypcją ma dostęp
    // 3. Użytkownik, który kupił ten kurs online ma dostęp
    
    const isOrganizer = course.organizerId === session.user.id
    
    if (!isOrganizer) {
      // Sprawdź subskrypcję
      const subscription = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
      })

      const hasActiveSubscription = subscription && 
        subscription.status === 'ACTIVE' && 
        subscription.endDate > new Date()

      // Sprawdź czy użytkownik kupił ten kurs
      const hasPurchase = await prisma.coursePurchase.findFirst({
        where: {
          courseId: params.id,
          userId: session.user.id,
        },
      })

      if (!hasActiveSubscription && !hasPurchase) {
        return NextResponse.json(
          { 
            error: 'Aby pobrać plik, potrzebujesz aktywnej subskrypcji miesięcznej lub zakupić ten kurs',
            requiresSubscription: true
          },
          { status: 403 }
        )
      }
    }

    // Określ ścieżkę do pliku - w środowisku serverless używamy /tmp
    const isVercel = process.env.VERCEL === '1' || process.cwd().includes('/var/task')
    let filepath: string
    
    if (isVercel) {
      // W środowisku serverless pliki są w /tmp
      // Ścieżka w bazie to /uploads/courses/..., więc usuwamy /uploads i dodajemy /tmp
      const relativePath = file.path.replace(/^\/uploads\//, '')
      filepath = join('/tmp', 'uploads', relativePath)
    } else {
      // W środowisku lokalnym używamy public
      filepath = join(process.cwd(), 'public', file.path)
    }
    
    console.log('File download - path:', filepath, 'isVercel:', isVercel)

    if (!existsSync(filepath)) {
      console.error('File not found at:', filepath)
      return NextResponse.json(
        { error: 'Plik nie istnieje na serwerze' },
        { status: 404 }
      )
    }

    const fileBuffer = await readFile(filepath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${file.originalName}"`,
      },
    })
  } catch (error) {
    console.error('Course file download error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania pliku' },
      { status: 500 }
    )
  }
}

