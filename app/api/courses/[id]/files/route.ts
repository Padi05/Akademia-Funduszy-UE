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
    const uploadsDir = join(cwd, 'public', 'uploads', 'courses', courseId)

    // Sprawdź i utwórz katalogi - użyj try-catch z fallback
    try {
      console.log('=== Directory Creation ===')
      console.log('CWD:', cwd)
      console.log('Target directory:', uploadsDir)
      
      // Sprawdź czy katalog już istnieje
      if (existsSync(uploadsDir)) {
        console.log('Directory already exists, skipping creation')
      } else {
        // Utwórz całą strukturę katalogów naraz
        console.log('Creating directory structure...')
        await mkdir(uploadsDir, { recursive: true })
        console.log('Directory created')
        
        // Zweryfikuj utworzenie
        if (!existsSync(uploadsDir)) {
          throw new Error(`Directory verification failed: ${uploadsDir}`)
        }
        console.log('Directory verified')
      }
    } catch (dirError: any) {
      const errorDetails = dirError instanceof Error ? dirError.message : String(dirError)
      const err = dirError as NodeJS.ErrnoException
      
      console.error('=== Directory Creation Error ===')
      console.error('Error:', errorDetails)
      console.error('Code:', err.code)
      console.error('Errno:', err.errno)
      console.error('Path:', uploadsDir)
      
      // Jeśli błąd to EEXIST (katalog już istnieje), to kontynuuj
      if (err.code === 'EEXIST') {
        console.log('EEXIST error - directory exists, continuing...')
      } 
      // Jeśli katalog istnieje mimo błędu, kontynuuj
      else if (existsSync(uploadsDir)) {
        console.log('Directory exists despite error, continuing...')
      } 
      // W przeciwnym razie zwróć błąd
      else {
        return NextResponse.json(
          { 
            error: 'Nie udało się utworzyć katalogu dla plików',
            details: errorDetails,
            path: uploadsDir,
            code: err.code || 'UNKNOWN',
            cwd: cwd
          },
          { status: 500 }
        )
      }
    }

    // Zapisz plik
    console.log('=== File Write ===')
    console.log('Reading file buffer...')
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filepath = join(uploadsDir, filename)
    
    console.log('File path:', filepath)
    console.log('File size:', buffer.length, 'bytes')
    console.log('Directory exists:', existsSync(uploadsDir))

    try {
      console.log('Writing file to disk...')
      await writeFile(filepath, buffer)
      console.log('File written successfully')
      
      // Zweryfikuj zapis
      if (!existsSync(filepath)) {
        throw new Error(`File was not written: ${filepath}`)
      }
      console.log('File verified on disk')
    } catch (writeError: any) {
      console.error('=== File Write Error ===')
      console.error('Error:', writeError)
      if (writeError instanceof Error) {
        console.error('Message:', writeError.message)
        console.error('Stack:', writeError.stack)
      }
      const err = writeError as NodeJS.ErrnoException
      console.error('Code:', err.code)
      console.error('Errno:', err.errno)
      console.error('Path:', filepath)
      
      return NextResponse.json(
        { 
          error: 'Nie udało się zapisać pliku na dysku',
          details: writeError instanceof Error ? writeError.message : String(writeError),
          code: err.code || 'UNKNOWN',
          path: filepath
        },
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
  } catch (error: any) {
    console.error('=== File Upload Error (Top Level) ===')
    console.error('Error type:', typeof error)
    console.error('Error:', error)
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    const err = error as NodeJS.ErrnoException
    if (err.code) {
      console.error('Error code:', err.code)
    }
    if (err.errno) {
      console.error('Error errno:', err.errno)
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { 
        error: `Wystąpił błąd podczas przesyłania pliku: ${errorMessage}`,
        type: typeof error,
        code: err.code || 'UNKNOWN'
      },
      { status: 500 }
    )
  }
}

