// Skrypt do utworzenia konta administratora
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const readline = require('readline')
const path = require('path')
const fs = require('fs')

// Załaduj zmienne środowiskowe z .env
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8')
  envFile.split('\n').forEach(line => {
    const trimmedLine = line.trim()
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const match = trimmedLine.match(/^([^=]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^["']|["']$/g, '')
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    }
  })
} else {
  console.warn('⚠ Ostrzeżenie: Nie znaleziono pliku .env')
  console.warn('  Upewnij się, że DATABASE_URL jest ustawiony w zmiennych środowiskowych')
}

// Upewnij się, że Prisma Client jest wygenerowany
try {
  require.resolve('@prisma/client')
} catch (e) {
  console.error('✗ Błąd: Prisma Client nie jest wygenerowany.')
  console.error('  Uruchom najpierw: npx prisma generate')
  process.exit(1)
}

// Sprawdź czy DATABASE_URL jest ustawiony
if (!process.env.DATABASE_URL) {
  console.error('✗ Błąd: DATABASE_URL nie jest ustawiony!')
  console.error('  Upewnij się, że plik .env istnieje i zawiera DATABASE_URL')
  console.error('  Przykład dla PostgreSQL: DATABASE_URL="postgresql://user:password@localhost:5432/dbname"')
  console.error('  Przykład dla SQLite: DATABASE_URL="file:./prisma/dev.db"')
  process.exit(1)
}

// Sprawdź typ bazy danych
const dbUrl = process.env.DATABASE_URL
const isPostgres = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')
const isSqlite = dbUrl.startsWith('file:')

if (!isPostgres && !isSqlite) {
  console.error('✗ Błąd: Nieprawidłowy format DATABASE_URL!')
  console.error('  Dla PostgreSQL: DATABASE_URL="postgresql://user:password@host:port/dbname"')
  console.error('  Dla SQLite: DATABASE_URL="file:./prisma/dev.db"')
  console.error(`  Obecna wartość: ${dbUrl.substring(0, 50)}...`)
  process.exit(1)
}

if (isSqlite) {
  console.error('\n✗ BŁĄD: Wykryto SQLite w DATABASE_URL, ale schema.prisma jest skonfigurowane na PostgreSQL!')
  console.error('\nAby naprawić:')
  console.error('1. Jeśli chcesz używać Neon.tech (PostgreSQL):')
  console.error('   - Utwórz projekt w https://neon.tech')
  console.error('   - Skopiuj connection string z Neon.tech')
  console.error('   - Zaktualizuj DATABASE_URL w pliku .env')
  console.error('   - Przykład: DATABASE_URL="postgresql://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require"')
  console.error('\n2. Jeśli chcesz używać lokalnego PostgreSQL:')
  console.error('   - Zainstaluj PostgreSQL lokalnie')
  console.error('   - Utwórz bazę danych')
  console.error('   - Zaktualizuj DATABASE_URL w pliku .env')
  console.error('   - Przykład: DATABASE_URL="postgresql://postgres:password@localhost:5432/dbname"')
  console.error('\nPo zaktualizowaniu DATABASE_URL uruchom ponownie: npm run create-admin')
  process.exit(1)
} else {
  console.log('ℹ Używana baza danych: PostgreSQL')
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

