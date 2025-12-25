import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function DELETE(
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

    const file = await prisma.userFile.findUnique({
      where: { id: params.id },
    })

    if (!file) {
      return NextResponse.json(
        { error: 'Plik nie został znaleziony' },
        { status: 404 }
      )
    }

    if (file.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Brak uprawnień' },
        { status: 403 }
      )
    }

    // Usuń plik z dysku
    const filepath = join(process.cwd(), 'public', file.path)
    if (existsSync(filepath)) {
      await unlink(filepath)
    }

    // Usuń rekord z bazy
    await prisma.userFile.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Plik został usunięty' })
  } catch (error) {
    console.error('File delete error:', error)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas usuwania pliku' },
      { status: 500 }
    )
  }
}

