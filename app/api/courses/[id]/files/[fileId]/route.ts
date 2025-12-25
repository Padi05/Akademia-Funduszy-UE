import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Konfiguracja dla App Router - wymagane gdy używamy dynamicznych funkcji
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ORGANIZER') {
      return NextResponse.json(
        { error: 'Brak uprawnień' },
        { status: 403 }
      )
    }

    const course = await prisma.course.findUnique({
      where: { id: params.id },
    })

    if (!course || course.organizerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Kurs nie został znaleziony lub brak uprawnień' },
        { status: 404 }
      )
    }

    const file = await prisma.courseFile.findUnique({
      where: { id: params.fileId },
    })

    if (!file || file.courseId !== params.id) {
      return NextResponse.json(
        { error: 'Plik nie został znaleziony' },
        { status: 404 }
      )
    }

    // Usuń plik z dysku - obsługa zarówno lokalnego jak i serverless środowiska
    const isVercel = process.env.VERCEL === '1' || process.cwd().includes('/var/task')
    let filepath: string
    
    if (isVercel) {
      // W środowisku serverless pliki są w /tmp
      const relativePath = file.path.replace(/^\/uploads\//, '')
      filepath = join('/tmp', 'uploads', relativePath)
    } else {
      // W środowisku lokalnym używamy public
      filepath = join(process.cwd(), 'public', file.path)
    }
    
    if (existsSync(filepath)) {
      await unlink(filepath)
    }

    // Usuń rekord z bazy
    await prisma.courseFile.delete({
      where: { id: params.fileId },
    })

    return NextResponse.json({ message: 'Plik został usunięty' })
  } catch (error) {
    console.error('File delete error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas usuwania pliku' },
      { status: 500 }
    )
  }
}

