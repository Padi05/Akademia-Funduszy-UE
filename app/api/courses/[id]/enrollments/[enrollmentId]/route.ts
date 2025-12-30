import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const updateEnrollmentSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']),
})

// Aktualizuj status zapisu na kurs (potwierdź lub anuluj)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; enrollmentId: string } }
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

    // Tylko organizator kursu lub admin może potwierdzać zapisy
    if (course.organizerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Brak uprawnień' },
        { status: 403 }
      )
    }

    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id: params.enrollmentId },
    })

    if (!enrollment || enrollment.courseId !== params.id) {
      return NextResponse.json(
        { error: 'Zapis nie został znaleziony' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updateEnrollmentSchema.parse(body)

    // Zaktualizuj status zapisu
    const updatedEnrollment = await prisma.courseEnrollment.update({
      where: { id: params.enrollmentId },
      data: {
        status: validatedData.status,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    // Jeśli zapis został potwierdzony, zaktualizuj transakcję finansową
    if (validatedData.status === 'CONFIRMED') {
      const transaction = await prisma.financialTransaction.findFirst({
        where: {
          enrollmentId: params.enrollmentId,
          transactionType: 'COURSE_LIVE',
        },
      })

      if (transaction) {
        await prisma.financialTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'COMPLETED',
            paymentDate: new Date(),
            paymentMethod: 'TRANSFER', // Domyślnie przelew
          },
        })
      }
    } else if (validatedData.status === 'CANCELLED') {
      // Jeśli zapis został anulowany, zaktualizuj transakcję
      const transaction = await prisma.financialTransaction.findFirst({
        where: {
          enrollmentId: params.enrollmentId,
          transactionType: 'COURSE_LIVE',
        },
      })

      if (transaction) {
        await prisma.financialTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'CANCELLED',
          },
        })
      }
    }

    return NextResponse.json(updatedEnrollment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Error updating enrollment:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas aktualizacji zapisu' },
      { status: 500 }
    )
  }
}

