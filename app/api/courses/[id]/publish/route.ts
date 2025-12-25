import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
      include: {
        videoFiles: true,
      },
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

    if (course.videoFiles.length === 0) {
      return NextResponse.json(
        { error: 'Nie można wystawić kursu bez plików wideo' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { isPublished, onlinePrice, commissionRate } = body

    const updatedCourse = await prisma.course.update({
      where: { id: params.id },
      data: {
        isPublished: isPublished !== undefined ? isPublished : course.isPublished,
        onlinePrice: onlinePrice !== undefined ? onlinePrice : course.onlinePrice || 100,
        commissionRate: commissionRate !== undefined ? commissionRate : course.commissionRate || 10,
      },
    })

    return NextResponse.json(updatedCourse)
  } catch (error) {
    console.error('Course publish error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas aktualizacji kursu' },
      { status: 500 }
    )
  }
}

