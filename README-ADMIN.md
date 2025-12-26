# Instrukcja: Konto Administratora i Import do Neon.tech

## Krok 1: Aktualizacja bazy danych lokalnie

Najpierw zaktualizuj schemat bazy danych, aby dodać rolę ADMIN:

```bash
npx prisma db push
# lub
npx prisma migrate dev --name add_admin_role
```

Następnie wygeneruj Prisma Client:

```bash
npx prisma generate
```

## Krok 2: Utworzenie konta administratora

Uruchom skrypt do utworzenia konta admina:

```bash
npm run create-admin
# lub
node scripts/create-admin.js
```

Skrypt poprosi Cię o:
- Email administratora
- Imię i nazwisko
- Hasło (dwukrotnie)

**Uwaga:** Jeśli użytkownik z podanym emailem już istnieje, skrypt zapyta, czy chcesz zaktualizować jego rolę na ADMIN.

## Krok 3: Konfiguracja Neon.tech

### 3.1. Utworzenie projektu w Neon.tech

1. Przejdź do [https://neon.tech](https://neon.tech)
2. Zaloguj się lub utwórz konto
3. Kliknij "Create a project"
4. Wybierz:
   - **Name**: np. "akademia-funduszy-ue"
   - **Region**: wybierz najbliższy (np. Europe)
   - **PostgreSQL version**: 15 lub 16
5. Kliknij "Create project"

### 3.2. Pobranie Connection String

**Gdzie znaleźć connection string:**

1. **W głównym dashboard projektu:**
   - Po utworzeniu projektu zobaczysz sekcję **"Connection Details"** na górze strony
   - Kliknij przycisk **"Copy"** obok connection stringa

2. **W ustawieniach:**
   - Kliknij **"Settings"** w lewym menu
   - Przejdź do zakładki **"Connection Details"**
   - Skopiuj connection string

3. **W SQL Editor:**
   - Kliknij **"SQL Editor"** w lewym menu
   - W prawym górnym rogu znajdź przycisk **"Copy connection string"**

**Format connection string:**
```
postgresql://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require
```

**Zaktualizuj plik `.env`:**

```env
DATABASE_URL="postgresql://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require"
```

**Ważne:** Neon.tech automatycznie tworzy connection pooling. Jeśli chcesz używać pooling, użyj connection string z `?pgbouncer=true`.

## Krok 4: Import struktury bazy danych do Neon.tech

### Metoda 1: Używając Prisma Migrate (ZALECANE)

1. Upewnij się, że `.env` zawiera connection string z Neon.tech
2. Uruchom migracje:

```bash
npx prisma migrate deploy
```

To utworzy wszystkie tabele w Neon.tech.

3. Wygeneruj Prisma Client:

```bash
npx prisma generate
```

4. Utwórz konto administratora w Neon.tech:

```bash
npm run create-admin
```

### Metoda 2: Używając automatycznego skryptu

Uruchom:

```bash
npm run import-neon
```

Skrypt automatycznie:
- Wygeneruje Prisma Client
- Wdroży migracje
- Zweryfikuje połączenie

Następnie utwórz konto admina:

```bash
npm run create-admin
```

### Metoda 3: Ręczny import SQL (dla zaawansowanych)

1. Eksportuj strukturę z lokalnej bazy:

```bash
pg_dump -h localhost -U postgres -d nazwa_bazy --schema-only > schema.sql
```

2. W Neon.tech Dashboard:
   - Otwórz "SQL Editor"
   - Wklej zawartość `schema.sql`
   - Uruchom zapytania

3. Utwórz konto admina:

```bash
npm run create-admin
```

## Krok 5: Weryfikacja

1. Sprawdź połączenie:

```bash
npm run test-db
```

2. Otwórz Prisma Studio z Neon.tech:

```bash
npx prisma studio
```

3. Sprawdź, czy konto administratora istnieje:
   - Otwórz tabelę `User`
   - Znajdź użytkownika z rolą `ADMIN`

## Krok 6: Testowanie konta administratora

1. Wyloguj się z obecnego konta (jeśli jesteś zalogowany)
2. Zaloguj się na konto administratora
3. Sprawdź, czy w Navbar widzisz badge "Admin" (czerwony)

## Funkcje administratora

Obecnie rola ADMIN jest zdefiniowana, ale nie ma jeszcze specjalnych uprawnień. Możesz dodać:

- Panel administracyjny
- Zarządzanie użytkownikami
- Zarządzanie wszystkimi kursami
- Statystyki systemu

Użyj funkcji z `lib/admin.ts` do sprawdzania uprawnień:

```typescript
import { isAdmin } from '@/lib/admin'

if (await isAdmin()) {
  // Kod dostępny tylko dla admina
}
```

## Rozwiązywanie problemów

### Błąd: "Prisma Client nie jest wygenerowany"

```bash
npx prisma generate
```

### Błąd: "Connection refused" przy połączeniu z Neon

1. Sprawdź, czy connection string jest poprawny
2. Upewnij się, że używasz `?sslmode=require`
3. Sprawdź, czy projekt w Neon.tech nie jest wstrzymany

### Błąd: "Table does not exist"

Uruchom migracje:

```bash
npx prisma migrate deploy
```

### Błąd: "User already exists"

Skrypt zapyta, czy chcesz zaktualizować istniejącego użytkownika na ADMIN.

## Bezpieczeństwo

- **Nigdy nie commituj** pliku `.env` do repozytorium
- Używaj silnych haseł dla konta administratora
- W produkcji używaj connection pooling z Neon.tech
- Regularnie aktualizuj hasła administratora

## Dodatkowe informacje

- Dokumentacja Neon.tech: https://neon.tech/docs
- Dokumentacja Prisma: https://www.prisma.io/docs
- Connection pooling w Neon: https://neon.tech/docs/connect/connection-pooling

