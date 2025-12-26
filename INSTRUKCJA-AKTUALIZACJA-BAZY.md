# Instrukcja aktualizacji bazy danych

## Krok 1: Zaktualizuj DATABASE_URL w pliku .env

1. Otwórz plik `.env` w głównym katalogu projektu
2. Zaktualizuj `DATABASE_URL` na connection string z Neon.tech:

```env
DATABASE_URL="postgresql://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require"
```

**Gdzie znaleźć connection string:**
- Zaloguj się do [Neon.tech](https://neon.tech)
- Wybierz swój projekt
- W sekcji "Connection Details" skopiuj connection string
- Wklej go do pliku `.env`

## Krok 2: Uruchom migracje Prisma

Po zaktualizowaniu `DATABASE_URL`, uruchom jedną z poniższych komend:

### Opcja A: Migracje (zalecane dla produkcji)

```bash
npm run db:migrate
```

Lub bezpośrednio:
```bash
npx prisma migrate dev --name add_admin_panel
```

### Opcja B: Push schema (szybsze, dla rozwoju)

```bash
npm run db:push
```

Lub bezpośrednio:
```bash
npx prisma db push
```

## Krok 3: Wygeneruj Prisma Client

```bash
npm run db:generate
```

Lub bezpośrednio:
```bash
npx prisma generate
```

## Krok 4: Sprawdź połączenie

```bash
npm run test-db
```

## Co zostało dodane do bazy danych?

Panel admina wykorzystuje istniejące modele w bazie danych:
- ✅ `User` - z rolą `ADMIN`
- ✅ `Course` - wszystkie kursy
- ✅ `Subscription` - subskrypcje użytkowników

**Nie są wymagane żadne nowe migracje** - wszystkie potrzebne tabele już istnieją w schemacie!

## Rozwiązywanie problemów

### Błąd: "the URL must start with the protocol postgresql://"

**Rozwiązanie:** Upewnij się, że `DATABASE_URL` w `.env` zaczyna się od `postgresql://` lub `postgres://`

### Błąd: "Connection refused"

**Rozwiązanie:** 
- Sprawdź, czy connection string jest poprawny
- Upewnij się, że projekt w Neon.tech jest aktywny
- Sprawdź, czy używasz `?sslmode=require` w connection stringu

### Błąd: "Table does not exist"

**Rozwiązanie:** Uruchom migracje:
```bash
npm run db:migrate
```

## Po zaktualizowaniu bazy danych

1. Panel admina będzie dostępny pod adresem: `/dashboard/admin`
2. Tylko użytkownicy z rolą `ADMIN` mają dostęp do panelu
3. Link "Admin" pojawi się w Navbar dla administratorów

## Utworzenie konta admina

Jeśli jeszcze nie masz konta admina, uruchom:

```bash
npm run create-admin
```

I podaj swój email, aby otrzymać uprawnienia administratora.

