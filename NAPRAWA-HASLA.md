# Naprawa problemu z autentykacją PostgreSQL

Jeśli otrzymujesz błąd: `P1000: Authentication failed`, oznacza to, że hasło w pliku `.env` nie pasuje do hasła użytkownika w PostgreSQL.

## Szybkie rozwiązanie

### Krok 1: Znajdź lub zmień hasło w PostgreSQL

**Opcja A: Jeśli znasz hasło użytkownika postgres**
1. Otwórz plik `.env`
2. Zaktualizuj `DATABASE_URL` z prawidłowym hasłem:
   ```
   DATABASE_URL="postgresql://postgres:TWOJE_PRAWDZIWE_HASLO@localhost:5432/kursy_dotacyjne"
   ```

**Opcja B: Zmień hasło w PostgreSQL na "postgres"**
1. Otwórz **pgAdmin** (GUI) lub **SQL Shell (psql)** (wiersz poleceń)
2. Zaloguj się jako użytkownik `postgres` (może wymagać hasła ustawionego podczas instalacji)
3. Wykonaj komendę:
   ```sql
   ALTER USER postgres WITH PASSWORD 'postgres';
   ```
4. Plik `.env` już ma prawidłowe hasło, więc możesz przejść do kroku 2

**Opcja C: Utwórz nowego użytkownika**
1. Otwórz psql lub pgAdmin
2. Wykonaj:
   ```sql
   CREATE USER kursy_user WITH PASSWORD 'haslo123';
   CREATE DATABASE kursy_dotacyjne OWNER kursy_user;
   GRANT ALL PRIVILEGES ON DATABASE kursy_dotacyjne TO kursy_user;
   ```
3. Zaktualizuj `.env`:
   ```
   DATABASE_URL="postgresql://kursy_user:haslo123@localhost:5432/kursy_dotacyjne"
   ```

### Krok 2: Utwórz bazę danych (jeśli nie istnieje)

```sql
CREATE DATABASE kursy_dotacyjne;
```

### Krok 3: Uruchom migrację

```bash
npm run db:migrate
```

## Jak znaleźć pgAdmin lub psql?

- **pgAdmin**: Szukaj w menu Start "pgAdmin" - to graficzny interfejs
- **SQL Shell (psql)**: Szukaj w menu Start "SQL Shell" - to wiersz poleceń
- **Lokalizacja**: Zwykle w `C:\Program Files\PostgreSQL\[wersja]\bin\`

## Test połączenia

Możesz przetestować połączenie używając psql:
```bash
psql -U postgres -d kursy_dotacyjne
```

Jeśli połączenie działa, możesz uruchomić migrację.

