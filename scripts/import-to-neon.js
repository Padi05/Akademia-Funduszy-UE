// Skrypt do importu struktury bazy danych do Neon.tech
// Używa Prisma Migrate do utworzenia struktury w Neon

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Załaduj zmienne środowiskowe z .env
try {
  const envFile = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8')
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
} catch (e) {
  console.warn('⚠ Nie znaleziono pliku .env, używam zmiennych środowiskowych systemowych')
}

console.log('=== Import bazy danych do Neon.tech ===\n')

// Sprawdź czy DATABASE_URL jest ustawiony
if (!process.env.DATABASE_URL) {
  console.error('✗ Błąd: DATABASE_URL nie jest ustawiony w pliku .env')
  console.error('  Upewnij się, że masz connection string z Neon.tech')
  process.exit(1)
}

const dbUrl = process.env.DATABASE_URL

// Sprawdź czy to connection string z Neon
if (!dbUrl.includes('neon.tech')) {
  console.warn('⚠ Ostrzeżenie: DATABASE_URL nie wygląda na connection string z Neon.tech')
  const continue = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  continue.question('Czy chcesz kontynuować? (t/n): ', (answer) => {
    continue.close()
    if (answer.toLowerCase() !== 't' && answer.toLowerCase() !== 'tak') {
      console.log('Anulowano.')
      process.exit(0)
    }
    runImport()
  })
} else {
  runImport()
}

function runImport() {
  try {
    console.log('1. Generowanie Prisma Client...')
    execSync('npx prisma generate', { stdio: 'inherit' })
    console.log('✓ Prisma Client wygenerowany\n')
    
    console.log('2. Wdrażanie migracji do Neon.tech...')
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })
    console.log('✓ Migracje wdrożone\n')
    
    console.log('3. Weryfikacja połączenia...')
    execSync('node test-db-connection.js', { stdio: 'inherit' })
    console.log('✓ Połączenie działa poprawnie\n')
    
    console.log('✓ Import zakończony pomyślnie!')
    console.log('\nNastępne kroki:')
    console.log('1. Uruchom: node scripts/create-admin.js')
    console.log('2. Utwórz konto administratora')
    console.log('3. Sprawdź bazę w Prisma Studio: npx prisma studio')
    
  } catch (error) {
    console.error('\n✗ Błąd podczas importu:')
    console.error(error.message)
    process.exit(1)
  }
}

