# Instrukcja - Panel Administratora

## ✅ Panel admina jest już gotowy!

Panel administratora został w pełni zaimplementowany i jest gotowy do użycia. Oto co zostało utworzone:

### 📁 Struktura panelu admina:

1. **Strona panelu**: `/dashboard/admin`
   - Lokalizacja: `app/(dashboard)/dashboard/admin/page.tsx`
   - Dostępna tylko dla użytkowników z rolą `ADMIN`

2. **Komponent AdminDashboard**: 
   - Lokalizacja: `components/dashboard/AdminDashboard.tsx`
   - Funkcje:
     - **Przegląd**: Statystyki (użytkownicy, kursy, subskrypcje, przychód)
     - **Użytkownicy**: Lista wszystkich użytkowników, zmiana ról, usuwanie
     - **Kursy**: Lista wszystkich kursów, usuwanie
     - **Subskrypcje**: Lista wszystkich subskrypcji

3. **API Endpointy**:
   - `/api/admin/stats` - Statystyki
   - `/api/admin/users` - Lista użytkowników
   - `/api/admin/users/[id]` - Aktualizacja/usuwanie użytkownika
   - `/api/admin/courses` - Lista kursów
   - `/api/admin/courses/[id]` - Usuwanie kursu
   - `/api/admin/subscriptions` - Lista subskrypcji

4. **Nawigacja**:
   - Link "Admin" w Navbar (widoczny tylko dla administratorów)
   - Panel dostępny również z głównego dashboardu dla adminów

## 🚀 Jak uruchomić panel admina:

### Krok 1: Upewnij się, że masz konto z rolą ADMIN

Jeśli jeszcze nie masz konta administratora, utwórz je:

```bash
npm run create-admin
```

Skrypt poprosi Cię o:
- Email administratora
- Imię i nazwisko
- Hasło (dwukrotnie)

**Uwaga:** Jeśli użytkownik z podanym emailem już istnieje, skrypt zapyta, czy chcesz zaktualizować jego rolę na ADMIN.

### Krok 2: Zaloguj się na konto admina

1. Przejdź do `/login`
2. Zaloguj się używając emaila i hasła konta administratora

### Krok 3: Otwórz panel admina

Panel admina jest dostępny na dwa sposoby:

1. **Przez Navbar**: Kliknij link "Admin" (widoczny tylko dla administratorów)
2. **Bezpośrednio**: Przejdź do `/dashboard/admin`
3. **Z głównego dashboardu**: Jeśli jesteś adminem, główny dashboard automatycznie pokaże panel admina

## 🎯 Funkcje panelu admina:

### 1. Przegląd (Overview)
- **Statystyki**:
  - Całkowita liczba użytkowników
  - Całkowita liczba kursów
  - Liczba aktywnych subskrypcji
  - Całkowity przychód z subskrypcji
- **Ostatni użytkownicy**: Lista 5 ostatnio zarejestrowanych użytkowników

### 2. Użytkownicy
- **Lista wszystkich użytkowników** z informacjami:
  - Email
  - Imię
  - Rola (można zmienić)
  - Status subskrypcji
- **Funkcje**:
  - Zmiana roli użytkownika (PARTICIPANT, ORGANIZER, ADMIN)
  - Usuwanie użytkownika
  - Podgląd statusu subskrypcji

### 3. Kursy
- **Lista wszystkich kursów** z informacjami:
  - Tytuł kursu
  - Organizator (imię i email)
  - Status publikacji
  - Data utworzenia
- **Funkcje**:
  - Usuwanie kursu

### 4. Subskrypcje
- **Lista wszystkich subskrypcji** z informacjami:
  - Użytkownik (imię i email)
  - Status subskrypcji (ACTIVE, CANCELLED, EXPIRED)
  - Cena miesięczna
  - Data rozpoczęcia
  - Data wygaśnięcia

## 🔒 Zabezpieczenia:

- ✅ Wszystkie endpointy API sprawdzają rolę `ADMIN`
- ✅ Nie można usunąć samego siebie
- ✅ Nie można zmienić swojej roli na inną niż `ADMIN`
- ✅ Panel jest dostępny tylko dla zalogowanych użytkowników z rolą `ADMIN`

## 📝 Uwagi:

1. **Baza danych**: Panel wykorzystuje istniejące tabele w bazie danych:
   - `User` - z rolą `ADMIN`
   - `Course` - wszystkie kursy
   - `Subscription` - wszystkie subskrypcje

2. **Nie są wymagane żadne nowe migracje** - wszystkie potrzebne tabele już istnieją w schemacie Prisma.

3. **Po utworzeniu konta admina**: 
   - Wyloguj się i zaloguj ponownie, aby odświeżyć sesję
   - Link "Admin" pojawi się w Navbar
   - Panel będzie dostępny pod `/dashboard/admin`

## 🐛 Rozwiązywanie problemów:

### Problem: Nie widzę linku "Admin" w Navbar

**Rozwiązanie:**
1. Sprawdź, czy Twoje konto ma rolę `ADMIN` w bazie danych
2. Wyloguj się i zaloguj ponownie
3. Sprawdź w konsoli przeglądarki, czy nie ma błędów

### Problem: "Unauthorized" przy próbie dostępu do panelu

**Rozwiązanie:**
1. Upewnij się, że jesteś zalogowany
2. Sprawdź, czy Twoje konto ma rolę `ADMIN`
3. Uruchom `npm run create-admin` aby upewnić się, że masz prawidłową rolę

### Problem: Panel nie ładuje danych

**Rozwiązanie:**
1. Sprawdź, czy `DATABASE_URL` w `.env` jest poprawnie skonfigurowany
2. Sprawdź konsolę przeglądarki i serwera pod kątem błędów
3. Upewnij się, że baza danych w Neon.tech jest dostępna

## ✅ Gotowe!

Panel admina jest w pełni funkcjonalny i gotowy do użycia. Wystarczy utworzyć konto administratora i zalogować się!

