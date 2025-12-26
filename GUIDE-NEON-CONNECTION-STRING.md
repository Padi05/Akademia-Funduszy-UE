# Jak znaleźć Connection String w Neon.tech

## Krok 1: Zaloguj się do Neon.tech

1. Przejdź do [https://neon.tech](https://neon.tech)
2. Zaloguj się lub utwórz konto (możesz użyć GitHub, Google, etc.)

## Krok 2: Utwórz projekt (jeśli jeszcze nie masz)

1. Po zalogowaniu kliknij **"Create a project"** (lub **"New Project"**)
2. Wypełnij formularz:
   - **Project name**: np. "akademia-funduszy-ue"
   - **Region**: wybierz najbliższy (np. "Europe (Frankfurt)")
   - **PostgreSQL version**: wybierz 15 lub 16
3. Kliknij **"Create project"**

## Krok 3: Znajdź Connection String

Po utworzeniu projektu zobaczysz dashboard. Connection string znajduje się w kilku miejscach:

### Metoda 1: Connection Details (najłatwiejsza)

1. W głównym dashboard projektu znajdź sekcję **"Connection Details"** lub **"Connect"**
2. Zobaczysz pole z connection stringiem, który wygląda tak:
   ```
   postgresql://[user]:[password]@[host]/[dbname]?sslmode=require
   ```
3. Kliknij przycisk **"Copy"** obok connection stringa, aby go skopiować

### Metoda 2: Connection String w ustawieniach

1. W lewym menu kliknij **"Settings"** (lub ikonę koła zębatego)
2. Przejdź do zakładki **"Connection Details"** lub **"Connection String"**
3. Skopiuj connection string

### Metoda 3: Connection String w SQL Editor

1. W lewym menu kliknij **"SQL Editor"**
2. W prawym górnym rogu znajdź przycisk **"Connection string"** lub **"Copy connection string"**
3. Kliknij, aby skopiować

## Krok 4: Format Connection String

Connection string z Neon.tech wygląda mniej więcej tak:

```
postgresql://[user]:[password]@ep-xxx-xxx.region.neon.tech/[dbname]?sslmode=require
```

Przykład:
```
postgresql://neondb_owner:AbCdEf123456@ep-cool-darkness-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

## Krok 5: Connection Pooling (opcjonalne, dla produkcji)

Neon.tech oferuje również connection pooling, który jest lepszy dla aplikacji produkcyjnych:

1. W sekcji **"Connection Details"** znajdź opcję **"Pooled connection"** lub **"Connection pooling"**
2. Skopiuj connection string z poolingiem (zawiera `?pgbouncer=true`)

Przykład z poolingiem:
```
postgresql://[user]:[password]@ep-xxx-xxx-pooler.region.neon.tech/[dbname]?sslmode=require&pgbouncer=true
```

## Krok 6: Zaktualizuj plik .env

1. Otwórz plik `.env` w głównym katalogu projektu
2. Znajdź linię z `DATABASE_URL`
3. Zastąp ją connection stringiem z Neon.tech:

```env
DATABASE_URL="postgresql://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require"
```

**WAŻNE:** 
- Zastąp `user`, `password`, `ep-xxx.region.neon.tech` i `dbname` wartościami z Twojego connection stringa
- Zachowaj cudzysłowy wokół connection stringa
- Nie usuwaj `?sslmode=require` - jest wymagany dla bezpiecznego połączenia

## Krok 7: Weryfikacja

Po zaktualizowaniu `.env`, sprawdź połączenie:

```bash
npm run test-db
```

Jeśli wszystko działa, zobaczysz komunikat o pomyślnym połączeniu.

## Rozwiązywanie problemów

### Problem: Nie widzę connection stringa

- Upewnij się, że jesteś zalogowany
- Sprawdź, czy projekt został utworzony
- Odśwież stronę (F5)

### Problem: Connection string nie działa

- Sprawdź, czy skopiowałeś cały string (łącznie z `?sslmode=require`)
- Upewnij się, że w `.env` connection string jest w cudzysłowach
- Sprawdź, czy projekt w Neon.tech nie jest wstrzymany (suspended)

### Problem: "Connection refused"

- Sprawdź, czy connection string jest poprawny
- Upewnij się, że używasz `?sslmode=require`
- Sprawdź, czy projekt w Neon.tech jest aktywny

## Dodatkowe informacje

- **Dokumentacja Neon.tech**: https://neon.tech/docs
- **Connection pooling**: https://neon.tech/docs/connect/connection-pooling
- **Bezpieczeństwo**: https://neon.tech/docs/security

## Wizualna lokalizacja (krótki opis)

```
Neon.tech Dashboard
├── Project Name (góra)
├── Left Menu
│   ├── Overview
│   ├── SQL Editor ← tutaj też znajdziesz connection string
│   ├── Branches
│   └── Settings ← tutaj znajdziesz connection string
└── Main Area
    └── Connection Details ← tutaj znajdziesz connection string (najczęściej tutaj)
```

## Screenshot locations (gdzie szukać)

1. **Główny dashboard projektu** - sekcja "Connection Details" na górze
2. **Settings → Connection Details** - szczegółowe ustawienia
3. **SQL Editor** - przycisk "Copy connection string" w prawym górnym rogu


