# Instrukcja importu bazy danych do Neon.tech

## Krok 1: Przygotowanie bazy danych lokalnie

1. Upewnij się, że masz zaktualizowaną bazę danych:
```bash
npx prisma migrate dev
# lub
npx prisma db push
```

2. Wygeneruj Prisma Client:
```bash
npx prisma generate
```

## Krok 2: Utworzenie konta administratora

Uruchom skrypt do utworzenia konta admina:
```bash
node scripts/create-admin.js
```

Podaj:
- Email administratora
- Imię i nazwisko
- Hasło (dwukrotnie)

## Krok 3: Eksport bazy danych

### Opcja A: Używając pg_dump (zalecane)

1. Upewnij się, że masz zainstalowany PostgreSQL client tools
2. Eksportuj bazę danych:
```bash
pg_dump -h localhost -U postgres -d nazwa_bazy -F c -f backup.dump
```

Lub w formacie SQL:
```bash
pg_dump -h localhost -U postgres -d nazwa_bazy > backup.sql
```

### Opcja B: Używając Prisma Studio

1. Otwórz Prisma Studio:
```bash
npx prisma studio
```

2. Ręcznie skopiuj dane (niezalecane dla dużych baz)

## Krok 4: Konfiguracja Neon.tech

1. Zaloguj się do [Neon.tech](https://neon.tech)
2. Utwórz nowy projekt
3. Skopiuj connection string (DATABASE_URL)

## Krok 5: Import do Neon.tech

### Metoda 1: Przez Neon Dashboard (SQL Editor)

1. Otwórz SQL Editor w Neon Dashboard
2. Wklej zawartość pliku `backup.sql` (jeśli używasz formatu SQL)
3. Uruchom zapytania

### Metoda 2: Używając psql

1. Zainstaluj PostgreSQL client tools
2. Połącz się z Neon:
```bash
psql "postgresql://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require"
```

3. Importuj dane:
```bash
psql "postgresql://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require" < backup.sql
```

### Metoda 3: Używając Prisma Migrate (zalecane)

1. Zaktualizuj `.env` z connection string z Neon:
```
DATABASE_URL="postgresql://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require"
```

2. Uruchom migracje:
```bash
npx prisma migrate deploy
```

3. Utwórz konto admina ponownie:
```bash
node scripts/create-admin.js
```

## Krok 6: Weryfikacja

1. Sprawdź połączenie:
```bash
node test-db-connection.js
```

2. Otwórz Prisma Studio z nowym connection string:
```bash
npx prisma studio
```

## Uwagi

- Neon.tech automatycznie tworzy kopie zapasowe
- Connection string zmienia się po każdym restarcie (jeśli nie używasz connection pooling)
- Używaj connection pooling dla produkcji



