const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkCourses() {
  try {
    console.log('Sprawdzanie kursów w bazie danych...\n')
    
    // Wszystkie kursy
    const allCourses = await prisma.course.findMany({
      include: {
        organizer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`Wszystkie kursy: ${allCourses.length}`)
    
    // Opublikowane kursy
    const publishedCourses = await prisma.course.findMany({
      where: {
        isPublished: true,
      },
      include: {
        organizer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`Opublikowane kursy: ${publishedCourses.length}\n`)

    if (allCourses.length > 0) {
      console.log('Szczegóły kursów:')
      allCourses.forEach((course, index) => {
        console.log(`\n${index + 1}. ${course.title}`)
        console.log(`   ID: ${course.id}`)
        console.log(`   Typ: ${course.type}`)
        console.log(`   Opublikowany: ${course.isPublished ? 'TAK' : 'NIE'}`)
        console.log(`   Organizator: ${course.organizer.name} (${course.organizer.email})`)
        console.log(`   Data utworzenia: ${course.createdAt}`)
      })
    } else {
      console.log('Brak kursów w bazie danych!')
    }

    // Sprawdź kursy stacjonarne
    const stationaryCourses = await prisma.course.findMany({
      where: {
        type: 'STACJONARNY',
      },
    })

    console.log(`\nKursy stacjonarne: ${stationaryCourses.length}`)
    const publishedStationary = stationaryCourses.filter(c => c.isPublished).length
    console.log(`Opublikowane kursy stacjonarne: ${publishedStationary}`)

    // Sprawdź kursy online
    const onlineCourses = await prisma.course.findMany({
      where: {
        type: 'ONLINE',
      },
    })

    console.log(`\nKursy online: ${onlineCourses.length}`)
    const publishedOnline = onlineCourses.filter(c => c.isPublished).length
    console.log(`Opublikowane kursy online: ${publishedOnline}`)

  } catch (error) {
    console.error('Błąd podczas sprawdzania kursów:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

checkCourses()
  .then(() => {
    console.log('\nZakończono pomyślnie')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Błąd:', error)
    process.exit(1)
  })

