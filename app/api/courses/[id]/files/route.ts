import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Obsługa params jako Promise (Next.js 15) lub obiektu (Next.js 14)
    const resolvedParams = await Promise.resolve(params)
    const courseId = resolvedParams.id

    if (!courseId) {
      return NextResponse.json(
        { error: 'Brak ID kursu' },
        { status: 400 }
      )
    }

    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ORGANIZER') {
      return NextResponse.json(
        { error: 'Brak uprawnień' },
        { status: 403 }
      )
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })

    if (!course || course.organizerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Kurs nie został znaleziony lub brak uprawnień' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Brak pliku' },
        { status: 400 }
      )
    }

    // Sprawdź rozmiar pliku (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Plik jest zbyt duży (max 10MB)' },
        { status: 400 }
      )
    }

    // Sanityzuj nazwę pliku - usuń niebezpieczne znaki
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `${Date.now()}-${sanitizedOriginalName}`

    // Utwórz katalog jeśli nie istnieje
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'courses', courseId)
    try {
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true })
      }
    } catch (dirError) {
      console.error('Directory creation error:', dirError)
      return NextResponse.json(
        { error: 'Nie udało się utworzyć katalogu dla plików' },
        { status: 500 }
      )
    }

    // Zapisz plik
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filepath = join(uploadsDir, filename)

    try {
      await writeFile(filepath, buffer)
    } catch (writeError) {
      console.error('File write error:', writeError)
      return NextResponse.json(
        { error: 'Nie udało się zapisać pliku na dysku' },
        { status: 500 }
      )
    }

    // Zapisz informacje o pliku w bazie
    try {
      const courseFile = await prisma.courseFile.create({
        data: {
          filename,
          originalName: file.name,
          path: `/uploads/courses/${courseId}/${filename}`,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          courseId: courseId,
        },
      })

      return NextResponse.json(courseFile, { status: 201 })
    } catch (dbError) {
      console.error('Database error:', dbError)
      // Usuń plik z dysku jeśli zapis do bazy się nie powiódł
      try {
        await unlink(filepath)
      } catch (unlinkError) {
        console.error('Failed to cleanup file:', unlinkError)
      }
      return NextResponse.json(
        { error: 'Nie udało się zapisać informacji o pliku w bazie danych' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('File upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd'
    return NextResponse.json(
      { error: `Wystąpił błąd podczas przesyłania pliku: ${errorMessage}` },
      { status: 500 }
    )
  }
}

