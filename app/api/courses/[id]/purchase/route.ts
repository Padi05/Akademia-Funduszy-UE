import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function POST(
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
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Kurs nie został znaleziony' },
        { status: 404 }
      )
    }

    if (!course.isOnlineCourse || !course.isPublished) {
      return NextResponse.json(
        { error: 'Kurs nie jest dostępny do zakupu' },
        { status: 400 }
      )
    }

    // Sprawdź czy użytkownik już kupił ten kurs
    const existingPurchase = await prisma.coursePurchase.findFirst({
      where: {
        courseId: params.id,
        userId: session.user.id,
      },
    })

    if (existingPurchase) {
      return NextResponse.json(
        { error: 'Już posiadasz ten kurs' },
        { status: 400 }
      )
    }

    // Sprawdź czy użytkownik jest organizatorem tego kursu
    if (course.organizerId === session.user.id) {
      return NextResponse.json(
        { error: 'Nie możesz kupić własnego kursu' },
        { status: 400 }
      )
    }

    const price = course.onlinePrice || 100
    const commissionRate = course.commissionRate || 10
    const commission = (price * commissionRate) / 100

    // Utwórz zakup
    const purchase = await prisma.coursePurchase.create({
      data: {
        courseId: params.id,
        userId: session.user.id,
        price,
        commission,
      },
    })

    return NextResponse.json(purchase, { status: 201 })
  } catch (error) {
    console.error('Course purchase error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas zakupu kursu' },
      { status: 500 }
    )
  }
}

