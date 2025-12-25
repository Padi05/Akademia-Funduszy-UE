// Skrypt do utworzenia konta administratora
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const readline = require('readline')
const path = require('path')

// Upewnij się, że Prisma Client jest wygenerowany
try {
  require.resolve('@prisma/client')
} catch (e) {
  console.error('✗ Błąd: Prisma Client nie jest wygenerowany.')
  console.error('  Uruchom najpierw: npx prisma generate')
  process.exit(1)
}

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function createAdmin() {
  try {
    console.log('=== Tworzenie konta administratora ===\n')
    
    const email = await question('Podaj email administratora: ')
    
    if (!email || !email.includes('@')) {
      console.error('Nieprawidłowy adres email')
      process.exit(1)
    }
    
    // Sprawdź czy użytkownik już istnieje
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      console.log(`\nUżytkownik z emailem ${email} już istnieje.`)
      const update = await question('Czy chcesz zaktualizować jego rolę na ADMIN? (t/n): ')
      
      if (update.toLowerCase() === 't' || update.toLowerCase() === 'tak') {
        const updatedUser = await prisma.user.update({
          where: { email },
          data: { role: 'ADMIN' }
        })
        console.log(`\n✓ Konto ${email} zostało zaktualizowane na rolę ADMIN`)
        console.log(`  ID: ${updatedUser.id}`)
        console.log(`  Nazwa: ${updatedUser.name}`)
        console.log(`  Rola: ${updatedUser.role}`)
        rl.close()
        await prisma.$disconnect()
        return
      } else {
        console.log('Anulowano.')
        rl.close()
        await prisma.$disconnect()
        return
      }
    }
    
    const name = await question('Podaj imię i nazwisko administratora: ')
    const password = await question('Podaj hasło: ')
    const confirmPassword = await question('Potwierdź hasło: ')
    
    if (password !== confirmPassword) {
      console.error('\nHasła nie są zgodne!')
      process.exit(1)
    }
    
    if (password.length < 6) {
      console.error('\nHasło musi mieć minimum 6 znaków!')
      process.exit(1)
    }
    
    // Hashuj hasło
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Utwórz użytkownika
    const admin = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'ADMIN',
        hasBurEntry: false,
      },
    })
    
    console.log('\n✓ Konto administratora zostało utworzone pomyślnie!')
    console.log(`  ID: ${admin.id}`)
    console.log(`  Email: ${admin.email}`)
    console.log(`  Nazwa: ${admin.name}`)
    console.log(`  Rola: ${admin.role}`)
    console.log(`  Utworzono: ${admin.createdAt}`)
    
  } catch (error) {
    console.error('\n✗ Błąd podczas tworzenia konta administratora:')
    console.error(error)
    process.exit(1)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

createAdmin()

