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
    console.log('Params received:', params)
    console.log('Params type:', typeof params)
    
    // Sprawdź czy params istnieje i ma właściwość id
    if (!params || !params.id) {
      console.error('Invalid params:', params)
      return NextResponse.json(
        { error: 'Brak ID kursu w parametrach' },
        { status: 400 }
      )
    }
    
    const courseId = params.id
    console.log('Course ID:', courseId)

    if (!courseId || courseId.trim() === '') {
      return NextResponse.json(
        { error: 'Brak ID kursu' },
        { status: 400 }
      )
    }

    const session = await getServerSession(authOptions)
    console.log('Session:', session ? { userId: session.user.id, role: session.user.role } : 'No session')

    // Tylko ADMIN może przesyłać pliki (ponieważ tylko ADMIN może dodawać kursy)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Brak uprawnień. Tylko administrator może przesyłać pliki.' },
        { status: 403 }
      )
    }

    let course
    try {
      course = await prisma.course.findUnique({
        where: { id: courseId },
      })
      console.log('Course found:', course ? { id: course.id, organizerId: course.organizerId } : 'Not found')
    } catch (dbError: any) {
      console.error('Database error when fetching course:', dbError)
      return NextResponse.json(
        { 
          error: 'Błąd podczas pobierania kursu z bazy danych',
          details: dbError instanceof Error ? dbError.message : String(dbError)
        },
        { status: 500 }
      )
    }

    if (!course) {
      return NextResponse.json(
        { error: 'Kurs nie został znaleziony' },
        { status: 404 }
      )
    }

    // ADMIN może przesyłać pliki do każdego kursu (nie sprawdzamy organizerId)

    console.log('Parsing formData...')
    let formData: FormData
    try {
      formData = await request.formData()
      console.log('FormData parsed successfully')
    } catch (formDataError: any) {
      console.error('FormData parsing error:', formDataError)
      return NextResponse.json(
        { 
          error: 'Błąd podczas parsowania danych formularza',
          details: formDataError instanceof Error ? formDataError.message : String(formDataError)
        },
        { status: 400 }
      )
    }
    
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

    // Określ ścieżkę do katalogu uploads
    // W środowisku serverless (Vercel) używamy /tmp, w lokalnym używamy public/uploads
    const isVercel = process.env.VERCEL === '1' || process.cwd().includes('/var/task')
    
    let uploadsDir: string
    let publicPath: string // Ścieżka względna dla URL
    
    if (isVercel) {
      // W środowisku serverless używamy /tmp (public jest tylko do odczytu)
      uploadsDir = join('/tmp', 'uploads', 'courses', courseId)
      publicPath = `/uploads/courses/${courseId}/${filename}`
      console.log('Using serverless environment - /tmp directory')
    } else {
      // W środowisku lokalnym używamy public/uploads
      const cwd = process.cwd()
      uploadsDir = join(cwd, 'public', 'uploads', 'courses', courseId)
      publicPath = `/uploads/courses/${courseId}/${filename}`
      console.log('Using local environment - public/uploads directory')
    }
    
    console.log('Environment:', { isVercel, cwd: process.cwd() })
    console.log('Uploads directory:', uploadsDir)

    // Sprawdź i utwórz katalogi
    console.log('=== Directory Creation ===')
    console.log('CWD:', process.cwd())
    console.log('Target directory:', uploadsDir)
    console.log('Directory exists before creation:', existsSync(uploadsDir))
    
    try {
      // Utwórz katalogi rekursywnie - mkdir z recursive: true tworzy wszystkie potrzebne katalogi
      console.log('Creating directory structure recursively...')
      await mkdir(uploadsDir, { recursive: true })
      console.log('Directory creation command completed')
      
      // Zweryfikuj, że katalog został utworzony
      const dirExists = existsSync(uploadsDir)
      console.log('Directory exists after creation:', dirExists)
      
      if (!dirExists) {
        console.error('Directory verification failed!')
        throw new Error(`Failed to create directory: ${uploadsDir}`)
      }
      
      console.log('Directory verified successfully')
    } catch (dirError: any) {
      const errorDetails = dirError instanceof Error ? dirError.message : String(dirError)
      const err = dirError as NodeJS.ErrnoException
      
      console.error('=== Directory Creation Error ===')
      console.error('Error type:', typeof dirError)
      console.error('Error:', errorDetails)
      console.error('Error code:', err.code)
      console.error('Error errno:', err.errno)
      console.error('Error syscall:', err.syscall)
      console.error('Target path:', uploadsDir)
      console.error('CWD:', process.cwd())
      console.error('Environment:', { isVercel })
      
      // Sprawdź czy katalog istnieje mimo błędu (może być race condition)
      const dirExists = existsSync(uploadsDir)
      console.error('Directory exists after error:', dirExists)
      
      if (!dirExists) {
        return NextResponse.json(
          { 
            error: 'Nie udało się utworzyć katalogu dla plików',
            details: errorDetails,
            path: uploadsDir,
            code: err.code || 'UNKNOWN',
            cwd: process.cwd(),
            syscall: err.syscall || 'unknown',
            environment: { isVercel }
          },
          { status: 500 }
        )
      } else {
        console.log('Directory exists despite error, continuing...')
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
          path: publicPath,
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
    console.error('Error stringified:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    
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
    if (err.syscall) {
      console.error('Error syscall:', err.syscall)
    }
    if (err.path) {
      console.error('Error path:', err.path)
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorDetails: any = {
      error: `Wystąpił błąd podczas przesyłania pliku: ${errorMessage}`,
      type: typeof error
    }
    
    if (err.code) errorDetails.code = err.code
    if (err.syscall) errorDetails.syscall = err.syscall
    if (err.path) errorDetails.path = err.path
    
    return NextResponse.json(errorDetails, { status: 500 })
  }
}

