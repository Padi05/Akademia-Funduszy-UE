# Platforma Ogłoszeń Kursów Dotacyjnych

Prosta i intuicyjna platforma do zarządzania ogłoszeniami kursów dotacyjnych.

## Funkcjonalności

- 🔐 System autoryzacji (logowanie/rejestracja)
- 👥 Dwa typy użytkowników: Organizatorzy i Uczestnicy
- 📝 Zarządzanie ogłoszeniami kursów (dodawanie, edycja, usuwanie)
- 📄 Upload plików (programy kursów, dokumenty uczestników)
- 🎯 Dashboard dla organizatorów i uczestników
- 📱 Pełna responsywność (desktop i mobile)

## Technologie

- **Next.js 14** - Framework React z App Router
- **TypeScript** - Typowanie statyczne
- **Prisma** - ORM do zarządzania bazą danych
- **PostgreSQL** - Relacyjna baza danych
- **NextAuth.js** - Autoryzacja i sesje
- **Tailwind CSS** - Stylowanie
- **React Hook Form** - Formularze
- **Zod** - Walidacja

## Instalacja

1. **Zainstaluj zależności:**
```bash
npm install
```

2. **Zainstaluj i skonfiguruj PostgreSQL:**
   - Zainstaluj PostgreSQL lokalnie lub użyj Dockera
   - Utwórz bazę danych: `CREATE DATABASE kursy_dotacyjne;`
   - Zobacz szczegółowe instrukcje w `INSTALL.md`

3. **Skonfiguruj zmienne środowiskowe:**
   Utwórz plik `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kursy_dotacyjne"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="twoj-tajny-klucz"
   ```

4. **Zainstaluj zależności i zainicjalizuj bazę danych:**
```bash
npm install
npm run db:generate
npm run db:migrate
```

4. **Uruchom serwer deweloperski:**
```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem [http://localhost:3000](http://localhost:3000)

## Struktura projektu

```
├── app/                    # Next.js App Router
│   ├── (auth)/            # Strony autoryzacji
│   ├── (dashboard)/       # Dashboard użytkowników
│   ├── api/               # API routes
│   └── layout.tsx         # Główny layout
├── components/            # Komponenty React
├── lib/                   # Funkcje pomocnicze
├── prisma/               # Schema Prisma
└── public/               # Pliki statyczne
```

## Użytkownicy

### Organizatorzy
- Mogą dodawać, edytować i usuwać ogłoszenia kursów
- Mogą dodawać pliki (np. program kursu w PDF)
- Widzą swoje kursy w dashboardzie

### Uczestnicy z wpisem w BUR
- Mogą przeglądać dostępne kursy
- Mogą przesyłać swoje dokumenty (tylko osoby z wpisem w BUR)
- Widzą swoje pliki w dashboardzie

## Rozwój

- `npm run dev` - Uruchom serwer deweloperski
- `npm run build` - Zbuduj aplikację produkcyjną
- `npm run db:studio` - Otwórz Prisma Studio (GUI do bazy danych)

