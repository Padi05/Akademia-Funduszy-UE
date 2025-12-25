# Skrypt pomocniczy do konfiguracji PostgreSQL
Write-Host "=== Konfiguracja PostgreSQL ===" -ForegroundColor Cyan
Write-Host ""

# Sprawdź czy port 5432 jest otwarty
Write-Host "Sprawdzanie połączenia z PostgreSQL..." -ForegroundColor Yellow
$portOpen = Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet -WarningAction SilentlyContinue

if (-not $portOpen) {
    Write-Host "❌ PostgreSQL nie działa na porcie 5432!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Opcje:" -ForegroundColor Yellow
    Write-Host "1. Zainstaluj PostgreSQL: https://www.postgresql.org/download/windows/"
    Write-Host "2. Lub użyj Dockera: docker run --name postgres-kursy -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=kursy_dotacyjne -p 5432:5432 -d postgres:15"
    Write-Host ""
    exit 1
}

Write-Host "✅ Port 5432 jest otwarty" -ForegroundColor Green
Write-Host ""

# Sprawdź czy plik .env istnieje
$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "Tworzenie pliku .env..." -ForegroundColor Yellow
    
    $databaseUrl = Read-Host "Podaj DATABASE_URL (lub naciśnij Enter dla domyślnego: postgresql://postgres:postgres@localhost:5432/kursy_dotacyjne)"
    if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
        $databaseUrl = "postgresql://postgres:postgres@localhost:5432/kursy_dotacyjne"
    }
    
    $nextAuthSecret = Read-Host "Podaj NEXTAUTH_SECRET (lub naciśnij Enter aby wygenerować)"
    if ([string]::IsNullOrWhiteSpace($nextAuthSecret)) {
        # Generuj losowy secret
        $bytes = New-Object byte[] 32
        $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        $rng.GetBytes($bytes)
        $nextAuthSecret = [Convert]::ToBase64String($bytes)
        Write-Host "Wygenerowano NEXTAUTH_SECRET: $nextAuthSecret" -ForegroundColor Green
    }
    
    $content = @"
# Database - PostgreSQL
DATABASE_URL="$databaseUrl"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$nextAuthSecret"
"@
    
    Set-Content -Path $envFile -Value $content
    Write-Host "✅ Utworzono plik .env" -ForegroundColor Green
} else {
    Write-Host "✅ Plik .env już istnieje" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Instrukcje naprawy problemu z hasłem ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Jeśli otrzymujesz błąd 'Authentication failed', spróbuj:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Sprawdź hasło użytkownika postgres:" -ForegroundColor White
Write-Host "   - Otwórz pgAdmin lub SQL Shell (psql)"
Write-Host "   - Zaloguj się jako użytkownik postgres"
Write-Host ""
Write-Host "2. Zmień hasło w PostgreSQL:" -ForegroundColor White
Write-Host "   psql -U postgres"
Write-Host "   ALTER USER postgres WITH PASSWORD 'nowe_haslo';"
Write-Host ""
Write-Host "3. Zaktualizuj DATABASE_URL w pliku .env:" -ForegroundColor White
Write-Host '   DATABASE_URL="postgresql://postgres:nowe_haslo@localhost:5432/kursy_dotacyjne"'
Write-Host ""
Write-Host "4. Utwórz bazę danych (jeśli nie istnieje):" -ForegroundColor White
Write-Host "   psql -U postgres"
Write-Host "   CREATE DATABASE kursy_dotacyjne;"
Write-Host ""
Write-Host "5. Uruchom migrację:" -ForegroundColor White
Write-Host "   npm run db:migrate"
Write-Host ""

