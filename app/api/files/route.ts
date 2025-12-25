import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Brak autoryzacji' },
        { status: 401 }
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

    // Utwórz katalog jeśli nie istnieje
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'users', session.user.id)
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Zapisz plik
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filename = `${Date.now()}-${file.name}`
    const filepath = join(uploadsDir, filename)

    await writeFile(filepath, buffer)

    // Zapisz informacje o pliku w bazie
    const userFile = await prisma.userFile.create({
      data: {
        filename,
        originalName: file.name,
        path: `/uploads/users/${session.user.id}/${filename}`,
        size: file.size,
        mimeType: file.type,
        userId: session.user.id,
      },
    })

    return NextResponse.json(userFile, { status: 201 })
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas przesyłania pliku' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Brak autoryzacji' },
        { status: 401 }
      )
    }

    const files = await prisma.userFile.findMany({
      where: { userId: session.user.id },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(files)
  } catch (error) {
    console.error('Files fetch error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania plików' },
      { status: 500 }
    )
  }
}

