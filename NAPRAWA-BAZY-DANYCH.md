# Naprawa błędu połączenia z bazą danych

## Problem
Błąd: `Authentication failed against database server` - hasło użytkownika postgres nie jest poprawne.

## Rozwiązanie

### Opcja 1: Zmień hasło w PostgreSQL na "postgres" (najszybsze)

1. **Otwórz pgAdmin** (graficzny interfejs) lub **SQL Shell (psql)** (wiersz poleceń)
   - pgAdmin: Szukaj w menu Start "pgAdmin"
   - SQL Shell: Szukaj w menu Start "SQL Shell" lub "psql"

2. **Zaloguj się** jako użytkownik postgres
   - Może wymagać hasła ustawionego podczas instalacji PostgreSQL

3. **Wykonaj komendy:**
   ```sql
   -- Zmień hasło
   ALTER USER postgres WITH PASSWORD 'postgres';
   
   -- Utwórz bazę danych (jeśli nie istnieje)
   CREATE DATABASE kursy_dotacyjne;
   
   -- Sprawdź czy baza istnieje
   \l
   ```

4. **Zrestartuj serwer Next.js** (Ctrl+C i `npm run dev`)

### Opcja 2: Użyj prawdziwego hasła

1. **Sprawdź jakie jest hasło** użytkownika postgres w PostgreSQL

2. **Zaktualizuj plik `.env`:**
   ```
   DATABASE_URL="postgresql://postgres:TWOJE_PRAWDZIWE_HASLO@localhost:5432/kursy_dotacyjne"
   ```

3. **Zrestartuj serwer Next.js**

### Opcja 3: Utwórz nowego użytkownika

1. **Otwórz psql lub pgAdmin**

2. **Wykonaj:**
   ```sql
   CREATE USER kursy_user WITH PASSWORD 'haslo123';
   CREATE DATABASE kursy_dotacyjne OWNER kursy_user;
   GRANT ALL PRIVILEGES ON DATABASE kursy_dotacyjne TO kursy_user;
   ```

3. **Zaktualizuj `.env`:**
   ```
   DATABASE_URL="postgresql://kursy_user:haslo123@localhost:5432/kursy_dotacyjne"
   ```

4. **Uruchom migracje:**
   ```bash
   npm run db:migrate
   ```

## Test połączenia

Po naprawie uruchom:
```bash
npm run test-db
```

Powinieneś zobaczyć: `✅ Połączenie z bazą danych działa!`

## Uruchomienie migracji

Po naprawie połączenia:
```bash
npm run db:migrate
```

To utworzy wszystkie tabele w bazie danych.

