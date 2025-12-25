import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(6, 'Hasło musi mieć minimum 6 znaków'),
  name: z.string().min(2, 'Imię musi mieć minimum 2 znaki'),
  role: z.enum(['ORGANIZER', 'PARTICIPANT']),
  hasBurEntry: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Registration request body:', { ...body, password: '***' })
    
    const validatedData = registerSchema.parse(body)
    console.log('Validated data:', { ...validatedData, password: '***' })

    // Sprawdź czy użytkownik już istnieje
    let existingUser
    try {
      existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      })
    } catch (dbError: any) {
      console.error('Database error when checking existing user:', dbError)
      
      // Sprawdź typ błędu Prisma
      if (dbError.code === 'P1000') {
        return NextResponse.json(
          { 
            error: 'Nie można połączyć się z bazą danych. Sprawdź czy PostgreSQL działa i czy hasło w .env jest poprawne.',
            hint: 'Uruchom: npm run test-db'
          },
          { status: 500 }
        )
      } else if (dbError.code === 'P1001') {
        return NextResponse.json(
          { 
            error: 'Nie można osiągnąć serwera bazy danych. Sprawdź czy PostgreSQL działa na porcie 5432.',
            hint: 'Sprawdź czy PostgreSQL jest uruchomiony'
          },
          { status: 500 }
        )
      } else if (dbError.code === 'P1017') {
        return NextResponse.json(
          { 
            error: 'Serwer bazy danych zamknął połączenie. Sprawdź konfigurację PostgreSQL.',
            hint: 'Sprawdź ustawienia PostgreSQL'
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Błąd połączenia z bazą danych',
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'Użytkownik o tym adresie email już istnieje' },
        { status: 400 }
      )
    }

    // Hashuj hasło
    let hashedPassword
    try {
      hashedPassword = await hashPassword(validatedData.password)
    } catch (hashError) {
      console.error('Password hashing error:', hashError)
      return NextResponse.json(
        { error: 'Błąd podczas przetwarzania hasła' },
        { status: 500 }
      )
    }

    // Utwórz użytkownika
    let user
    try {
      user = await prisma.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          name: validatedData.name,
          role: validatedData.role,
          hasBurEntry: validatedData.hasBurEntry ?? false,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          hasBurEntry: true,
        },
      })
    } catch (createError: any) {
      console.error('User creation error:', createError)
      
      // Sprawdź czy to błąd unikalności
      if (createError.code === 'P2002') {
        return NextResponse.json(
          { error: 'Użytkownik o tym adresie email już istnieje' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Błąd podczas tworzenia konta',
          details: process.env.NODE_ENV === 'development' ? createError.message : undefined
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Konto zostało utworzone', user },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors)
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    if (error instanceof SyntaxError) {
      console.error('JSON parsing error:', error)
      return NextResponse.json(
        { error: 'Nieprawidłowy format danych' },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd'
    
    return NextResponse.json(
      { 
        error: 'Wystąpił błąd podczas rejestracji',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

