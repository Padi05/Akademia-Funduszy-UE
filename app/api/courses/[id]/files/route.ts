import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Konfiguracja dla App Router
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Funkcja pomocnicza do tworzenia katalogów
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true })
      console.log('Directory created:', dirPath)
    }
    
    // Sprawdź czy katalog rzeczywiście istnieje
    if (!existsSync(dirPath)) {
      throw new Error(`Failed to create directory: ${dirPath}`)
    }
  } catch (error) {
    console.error('Error creating directory:', dirPath, error)
    throw error
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== File Upload Started ===')
    
    const courseId = params.id
    console.log('Course ID:', courseId)

    if (!courseId) {
      return NextResponse.json(
        { error: 'Brak ID kursu' },
        { status: 400 }
      )
    }

    const session = await getServerSession(authOptions)
    console.log('Session:', session ? { userId: session.user.id, role: session.user.role } : 'No session')

    if (!session || session.user.role !== 'ORGANIZER') {
      return NextResponse.json(
        { error: 'Brak uprawnień' },
        { status: 403 }
      )
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    })
    console.log('Course found:', course ? { id: course.id, organizerId: course.organizerId } : 'Not found')

    if (!course || course.organizerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Kurs nie został znaleziony lub brak uprawnień' },
        { status: 404 }
      )
    }

    console.log('Parsing formData...')
    const formData = await request.formData()
    const file = formData.get('file') as File
    console.log('File received:', file ? { 
      name: file.name, 
      size: file.size, 
      type: file.type 
    } : 'No file')

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

    // Utwórz strukturę katalogów dla tego kursu
    const cwd = process.cwd()
    const publicDir = join(cwd, 'public')
    const uploadsBaseDir = join(publicDir, 'uploads')
    const uploadsCoursesDir = join(uploadsBaseDir, 'courses')
    const uploadsDir = join(uploadsCoursesDir, courseId)

    try {
      console.log('Creating directory structure...', {
        cwd,
        publicDir,
        uploadsBaseDir,
        uploadsCoursesDir,
        uploadsDir
      })

      // Utwórz wszystkie katalogi w kolejności - recursive: true utworzy wszystkie potrzebne katalogi nadrzędne
      await ensureDirectoryExists(publicDir)
      await ensureDirectoryExists(uploadsBaseDir)
      await ensureDirectoryExists(uploadsCoursesDir)
      await ensureDirectoryExists(uploadsDir)
      
      console.log('All directories created successfully:', uploadsDir)
    } catch (dirError) {
      const errorDetails = dirError instanceof Error ? dirError.message : String(dirError)
      console.error('Directory creation error:', {
        error: errorDetails,
        uploadsDir,
        courseId,
        cwd,
        stack: dirError instanceof Error ? dirError.stack : undefined
      })
      
      return NextResponse.json(
        { 
          error: 'Nie udało się utworzyć katalogu dla plików',
          details: errorDetails,
          path: uploadsDir
        },
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
      // Określ mimeType - dla PDF może być puste, więc sprawdzamy rozszerzenie
      let mimeType = file.type
      if (!mimeType) {
        const ext = file.name.toLowerCase().split('.').pop()
        if (ext === 'pdf') {
          mimeType = 'application/pdf'
        } else if (ext === 'doc') {
          mimeType = 'application/msword'
        } else if (ext === 'docx') {
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        } else {
          mimeType = 'application/octet-stream'
        }
      }

      console.log('Saving to database...', {
        filename,
        originalName: file.name,
        path: `/uploads/courses/${courseId}/${filename}`,
        size: file.size,
        sizeType: typeof file.size,
        mimeType: mimeType,
        courseId: courseId,
      })
      
      // Upewnij się, że size jest liczbą (nie BigInt)
      const fileSize = Number(file.size)
      
      const courseFile = await prisma.courseFile.create({
        data: {
          filename,
          originalName: file.name,
          path: `/uploads/courses/${courseId}/${filename}`,
          size: fileSize,
          mimeType: mimeType,
          courseId: courseId,
        },
      })

      console.log('File saved successfully:', courseFile.id)
      return NextResponse.json(courseFile, { status: 201 })
    } catch (dbError) {
      console.error('Database error details:', dbError)
      if (dbError instanceof Error) {
        console.error('Error message:', dbError.message)
        console.error('Error stack:', dbError.stack)
      }
      // Usuń plik z dysku jeśli zapis do bazy się nie powiódł
      try {
        await unlink(filepath)
        console.log('File cleaned up from disk')
      } catch (unlinkError) {
        console.error('Failed to cleanup file:', unlinkError)
      }
      return NextResponse.json(
        { 
          error: 'Nie udało się zapisać informacji o pliku w bazie danych',
          details: dbError instanceof Error ? dbError.message : String(dbError)
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('=== File Upload Error ===')
    console.error('Error:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd'
    return NextResponse.json(
      { error: `Wystąpił błąd podczas przesyłania pliku: ${errorMessage}` },
      { status: 500 }
    )
  }
}

