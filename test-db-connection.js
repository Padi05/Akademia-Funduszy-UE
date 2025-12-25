// Skrypt do testowania połączenia z bazą danych
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})

async function testConnection() {
  try {
    console.log('🔍 Testowanie połączenia z bazą danych...')
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'))
    
    // Test podstawowego połączenia
    await prisma.$connect()
    console.log('✅ Połączenie z bazą danych działa!')
    
    // Test zapytania
    const userCount = await prisma.user.count()
    console.log(`✅ Baza danych działa! Liczba użytkowników: ${userCount}`)
    
    await prisma.$disconnect()
    console.log('✅ Test zakończony pomyślnie!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Błąd połączenia z bazą danych:')
    console.error('Typ błędu:', error.constructor.name)
    console.error('Komunikat:', error.message)
    
    if (error.code === 'P1000') {
      console.error('\n💡 Problem: Nie można połączyć się z bazą danych')
      console.error('Rozwiązania:')
      console.error('1. Sprawdź czy PostgreSQL jest uruchomiony')
      console.error('2. Sprawdź hasło użytkownika postgres w pliku .env')
      console.error('3. Sprawdź czy baza danych "kursy_dotacyjne" istnieje')
      console.error('4. Uruchom: CREATE DATABASE kursy_dotacyjne;')
    } else if (error.code === 'P1001') {
      console.error('\n💡 Problem: Nie można osiągnąć serwera bazy danych')
      console.error('Sprawdź czy PostgreSQL działa na porcie 5432')
    } else if (error.code === 'P1017') {
      console.error('\n💡 Problem: Serwer zamknął połączenie')
      console.error('Sprawdź konfigurację PostgreSQL')
    }
    
    await prisma.$disconnect()
    process.exit(1)
  }
}

testConnection()

