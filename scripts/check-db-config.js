// Skrypt do sprawdzania konfiguracji bazy danych
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '.env')
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma')

console.log('=== Sprawdzanie konfiguracji bazy danych ===\n')

// Sprawdź schema.prisma
if (fs.existsSync(schemaPath)) {
  const schemaContent = fs.readFileSync(schemaPath, 'utf8')
  const providerMatch = schemaContent.match(/provider\s*=\s*"(\w+)"/)
  if (providerMatch) {
    console.log(`✓ Schema provider: ${providerMatch[1]}`)
  }
}

// Sprawdź .env
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  const dbUrlMatch = envContent.match(/DATABASE_URL\s*=\s*"([^"]+)"/)
  if (dbUrlMatch) {
    const dbUrl = dbUrlMatch[1]
    console.log(`✓ DATABASE_URL: ${dbUrl.substring(0, 50)}...`)
    
    if (dbUrl.startsWith('file:')) {
      console.log('\n⚠ OSTRZEŻENIE: Używasz SQLite, ale schema.prisma jest skonfigurowane na PostgreSQL!')
      console.log('\nAby naprawić:')
      console.log('1. Jeśli chcesz używać Neon.tech (PostgreSQL):')
      console.log('   - Zaktualizuj DATABASE_URL w .env na connection string z Neon.tech')
      console.log('   - Przykład: DATABASE_URL="postgresql://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require"')
      console.log('\n2. Jeśli chcesz używać lokalnego PostgreSQL:')
      console.log('   - Zaktualizuj DATABASE_URL w .env na connection string do lokalnego PostgreSQL')
      console.log('   - Przykład: DATABASE_URL="postgresql://postgres:password@localhost:5432/dbname"')
    } else if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
      console.log('\n✓ Używasz PostgreSQL - konfiguracja jest poprawna!')
    }
  } else {
    console.log('✗ DATABASE_URL nie znaleziony w .env')
  }
} else {
  console.log('✗ Plik .env nie istnieje')
}



