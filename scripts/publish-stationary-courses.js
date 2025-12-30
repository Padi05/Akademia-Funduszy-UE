const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function publishStationaryCourses() {
  try {
    console.log('Sprawdzanie kursów stacjonarnych...')
    
    // Znajdź wszystkie kursy stacjonarne które nie są opublikowane
    const courses = await prisma.course.findMany({
      where: {
        type: 'STACJONARNY',
        isPublished: false,
      },
    })

    console.log(`Znaleziono ${courses.length} nieopublikowanych kursów stacjonarnych`)

    if (courses.length === 0) {
      console.log('Wszystkie kursy stacjonarne są już opublikowane.')
      return
    }

    // Opublikuj wszystkie kursy stacjonarne
    const result = await prisma.course.updateMany({
      where: {
        type: 'STACJONARNY',
        isPublished: false,
      },
      data: {
        isPublished: true,
      },
    })

    console.log(`Opublikowano ${result.count} kursów stacjonarnych`)
    
    // Sprawdź też kursy online które mogą być nieopublikowane
    const onlineCourses = await prisma.course.findMany({
      where: {
        type: 'ONLINE',
        isPublished: false,
      },
    })

    console.log(`Znaleziono ${onlineCourses.length} nieopublikowanych kursów online`)
    if (onlineCourses.length > 0) {
      console.log('Kursy online wymagają ręcznej publikacji przez organizatora.')
    }

  } catch (error) {
    console.error('Błąd podczas publikowania kursów:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

publishStationaryCourses()
  .then(() => {
    console.log('Zakończono pomyślnie')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Błąd:', error)
    process.exit(1)
  })

