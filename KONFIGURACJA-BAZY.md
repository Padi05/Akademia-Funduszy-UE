# Konfiguracja bazy danych

## Aktualna konfiguracja: SQLite (prostsza)

Aplikacja jest teraz skonfigurowana do używania SQLite, które nie wymaga dodatkowej konfiguracji.

### Plik .env powinien zawierać:
```
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="twoj-tajny-klucz-tutaj"
```

### Inicjalizacja:
```bash
npm run db:push
npm run db:generate
npm run dev
```

## Jeśli chcesz wrócić do PostgreSQL:

1. Zmień w `prisma/schema.prisma`:
   ```
   provider = "postgresql"
   ```

2. Zaktualizuj `.env`:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kursy_dotacyjne"
   ```

3. Napraw hasło w PostgreSQL (zobacz SZYBKA-NAPRAWA.md)

4. Uruchom:
   ```bash
   npm run db:push
   npm run db:generate
   ```

