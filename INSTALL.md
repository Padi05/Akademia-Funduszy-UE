# Instrukcja instalacji

## Krok 1: Zainstaluj zależności

```bash
npm install
```

## Krok 2: Zainstaluj i skonfiguruj PostgreSQL

### Opcja A: Lokalna instalacja PostgreSQL

1. **Zainstaluj PostgreSQL:**
   - Windows: Pobierz z https://www.postgresql.org/download/windows/
   - macOS: `brew install postgresql` lub pobierz z https://www.postgresql.org/download/macosx/
   - Linux: `sudo apt-get install postgresql` (Ubuntu/Debian) lub odpowiednia komenda dla Twojej dystrybucji

2. **Utwórz bazę danych:**
   ```bash
   # Zaloguj się do PostgreSQL
   psql -U postgres
   
   # Utwórz bazę danych
   CREATE DATABASE kursy_dotacyjne;
   
   # Wyjdź
   \q
   ```

### Opcja B: Docker (zalecane)

```bash
docker run --name postgres-kursy -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=kursy_dotacyjne -p 5432:5432 -d postgres:15
```

## Krok 3: Skonfiguruj zmienne środowiskowe

Utwórz plik `.env` w głównym katalogu projektu:

```env
# Database - PostgreSQL
# Format: postgresql://[user]:[password]@[host]:[port]/[database]
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kursy_dotacyjne"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="twoj-tajny-klucz-tutaj-wygeneruj-losowy-string"
```

**Ważne:** 
- Dostosuj `DATABASE_URL` do swoich ustawień PostgreSQL (użytkownik, hasło, host, port, nazwa bazy)
- Wygeneruj losowy string dla `NEXTAUTH_SECRET`. Możesz użyć:
  - Online generator: https://generate-secret.vercel.app/32
  - Lub w terminalu: `openssl rand -base64 32`

## Krok 4: Zainstaluj zależności i zainicjalizuj bazę danych

```bash
# Zainstaluj pakiety (w tym pg dla PostgreSQL)
npm install

# Wygeneruj klienta Prisma
npm run db:generate

# Utwórz migrację i zastosuj schemat
npm run db:migrate
```

To utworzy strukturę tabel w bazie PostgreSQL.

## Krok 5: Uruchom serwer deweloperski

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem: http://localhost:3000

## Krok 6: Utwórz pierwsze konto

1. Przejdź do http://localhost:3000/register
2. Wybierz typ konta (Organizator lub Uczestnik)
3. Jeśli jesteś Uczestnikiem, zaznacz "Mam wpis w BUR" jeśli chcesz przesyłać dokumenty

## Przydatne komendy

- `npm run dev` - Uruchom serwer deweloperski
- `npm run build` - Zbuduj aplikację produkcyjną
- `npm run db:studio` - Otwórz Prisma Studio (GUI do przeglądania bazy danych)
- `npm run db:migrate` - Utwórz i zastosuj nową migrację
- `npm run db:migrate:deploy` - Zastosuj migracje w środowisku produkcyjnym
- `npm run db:migrate:reset` - Zresetuj bazę danych (usuwa wszystkie dane!)
- `npm run lint` - Sprawdź kod pod kątem błędów

## Rozwiązywanie problemów

### Błąd: "NEXTAUTH_SECRET is not set"
- Upewnij się, że plik `.env` istnieje i zawiera `NEXTAUTH_SECRET`

### Błąd: "Cannot find module '@prisma/client'"
- Uruchom: `npm run db:generate`

### Błąd: "Authentication failed" (P1000)
To oznacza, że hasło użytkownika PostgreSQL jest nieprawidłowe. Rozwiązanie:

**Opcja 1: Zmień hasło w PostgreSQL**
```bash
# Otwórz SQL Shell (psql) lub pgAdmin
# Zaloguj się jako użytkownik postgres (może wymagać hasła ustawionego podczas instalacji)

# W psql wykonaj:
ALTER USER postgres WITH PASSWORD 'nowe_haslo';

# Następnie zaktualizuj plik .env:
# DATABASE_URL="postgresql://postgres:nowe_haslo@localhost:5432/kursy_dotacyjne"
```

**Opcja 2: Użyj innego użytkownika**
```bash
# Utwórz nowego użytkownika
CREATE USER kursy_user WITH PASSWORD 'haslo';
CREATE DATABASE kursy_dotacyjne OWNER kursy_user;
GRANT ALL PRIVILEGES ON DATABASE kursy_dotacyjne TO kursy_user;

# Zaktualizuj .env:
# DATABASE_URL="postgresql://kursy_user:haslo@localhost:5432/kursy_dotacyjne"
```

**Opcja 3: Użyj skryptu pomocniczego**
```powershell
.\setup-postgres.ps1
```

### Błąd bazy danych - inne problemy
- Sprawdź czy PostgreSQL jest uruchomiony: `pg_isready` lub `docker ps` (jeśli używasz Dockera)
- Sprawdź czy `DATABASE_URL` w `.env` jest poprawny
- Sprawdź czy baza danych istnieje: `psql -U postgres -l`
- Zresetuj bazę: `npm run db:migrate:reset` (UWAGA: usuwa wszystkie dane!)

