import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Brak autoryzacji' },
        { status: 401 }
      )
    }

    // Pobierz wszystkie pliki z kursów wraz z informacjami o kursie
    const courseFiles = await prisma.courseFile.findMany({
      include: {
        course: {
          select: {
            id: true,
            title: true,
            organizer: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Filtruj tylko pliki PDF
    const pdfFiles = courseFiles.filter(
      (file) => 
        file.mimeType === 'application/pdf' || 
        file.originalName.toLowerCase().endsWith('.pdf')
    )

    return NextResponse.json(pdfFiles)
  } catch (error) {
    console.error('Course files fetch error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania plików z kursów' },
      { status: 500 }
    )
  }
}

