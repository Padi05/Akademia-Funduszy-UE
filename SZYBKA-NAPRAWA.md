# Szybka naprawa błędu 500 przy rejestracji

## Problem
Błąd: `Authentication failed` - hasło użytkownika postgres nie jest poprawne.

## Rozwiązanie krok po kroku:

### KROK 1: Napraw hasło w PostgreSQL

**Opcja A: Użyj pgAdmin (graficzny interfejs)**
1. Otwórz **pgAdmin** (szukaj w menu Start)
2. Kliknij prawym na serwer PostgreSQL → Properties
3. Przejdź do zakładki "Connection"
4. Sprawdź hasło lub zmień je na "postgres"

**Opcja B: Użyj SQL Shell (psql) - wiersz poleceń**
1. Otwórz **SQL Shell (psql)** (szukaj w menu Start)
2. Naciśnij Enter 4 razy (dla domyślnych ustawień)
3. Wpisz hasło użytkownika postgres (to które ustawiłeś podczas instalacji)
4. Wykonaj komendy:
   ```sql
   ALTER USER postgres WITH PASSWORD 'postgres';
   CREATE DATABASE kursy_dotacyjne;
   \q
   ```

### KROK 2: Utwórz tabele w bazie danych

Uruchom w terminalu (w katalogu projektu):
```bash
npm run db:push
```

To automatycznie utworzy wszystkie tabele w bazie danych.

### KROK 3: Zrestartuj serwer Next.js

1. Zatrzymaj serwer (Ctrl+C)
2. Uruchom ponownie:
   ```bash
   npm run dev
   ```

### KROK 4: Przetestuj

1. Przejdź do http://localhost:3000/register
2. Spróbuj zarejestrować konto

## Jeśli nadal nie działa:

### Sprawdź połączenie:
```bash
npm run test-db
```

### Alternatywa: Użyj innego użytkownika

Jeśli nie możesz zmienić hasła postgres, utwórz nowego użytkownika:

1. W psql wykonaj:
   ```sql
   CREATE USER kursy_user WITH PASSWORD 'haslo123';
   CREATE DATABASE kursy_dotacyjne OWNER kursy_user;
   GRANT ALL PRIVILEGES ON DATABASE kursy_dotacyjne TO kursy_user;
   \q
   ```

2. Zaktualizuj plik `.env`:
   ```
   DATABASE_URL="postgresql://kursy_user:haslo123@localhost:5432/kursy_dotacyjne"
   ```

3. Uruchom:
   ```bash
   npm run db:push
   npm run dev
   ```

