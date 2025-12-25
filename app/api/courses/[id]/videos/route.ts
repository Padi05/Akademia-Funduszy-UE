import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Konfiguracja dla App Router - wymagane gdy używamy dynamicznych funkcji
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    if (!course.isOnlineCourse) {
      return NextResponse.json(
        { error: 'To nie jest kurs online' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const order = parseInt(formData.get('order') as string) || 0

    if (!file) {
      return NextResponse.json(
        { error: 'Brak pliku' },
        { status: 400 }
      )
    }

    // Sprawdź rozmiar pliku (max 500MB dla wideo)
    if (file.size > 500 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Plik jest zbyt duży (max 500MB)' },
        { status: 400 }
      )
    }

    // Sprawdź typ pliku (tylko wideo)
    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Dozwolone są tylko pliki wideo' },
        { status: 400 }
      )
    }

    // Utwórz katalog jeśli nie istnieje
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'courses', params.id, 'videos')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Zapisz plik
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = `${Date.now()}-${file.name}`
    const filepath = join(uploadsDir, filename)

    await writeFile(filepath, buffer)

    // Zapisz informacje o pliku wideo w bazie
    const videoFile = await prisma.courseVideoFile.create({
      data: {
        filename,
        originalName: file.name,
        path: `/uploads/courses/${params.id}/videos/${filename}`,
        size: file.size,
        mimeType: file.type,
        order,
        courseId: params.id,
      },
    })

    return NextResponse.json(videoFile, { status: 201 })
  } catch (error) {
    console.error('Video upload error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas przesyłania pliku wideo' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Brak autoryzacji' },
        { status: 401 }
      )
    }

    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        videoFiles: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Kurs nie został znaleziony' },
        { status: 404 }
      )
    }

    // Sprawdź czy użytkownik ma dostęp (organizator lub kupił kurs)
    const hasAccess = 
      course.organizerId === session.user.id ||
      (await prisma.coursePurchase.findFirst({
        where: {
          courseId: params.id,
          userId: session.user.id,
        },
      })) !== null

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Brak dostępu do tego kursu' },
        { status: 403 }
      )
    }

    return NextResponse.json(course.videoFiles)
  } catch (error) {
    console.error('Videos fetch error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania plików wideo' },
      { status: 500 }
    )
  }
}

