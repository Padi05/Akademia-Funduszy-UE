# Konfiguracja Stripe dla Subskrypcji

Ten dokument opisuje, jak skonfigurować Stripe do obsługi płatności subskrypcyjnych w aplikacji.

## Krok 1: Utwórz konto Stripe

1. Przejdź do [https://stripe.com](https://stripe.com)
2. Zarejestruj się lub zaloguj do swojego konta
3. Przejdź do [Dashboard](https://dashboard.stripe.com)

## Krok 2: Pobierz klucze API

### Tryb testowy (Development)

1. W Dashboard Stripe przejdź do **Developers** → **API keys**
2. Skopiuj **Publishable key** (zaczyna się od `pk_test_`)
3. Skopiuj **Secret key** (zaczyna się od `sk_test_`) - kliknij "Reveal test key"

### Tryb produkcyjny (Production)

1. Przełącz się na tryb produkcyjny w prawym górnym rogu Dashboard
2. Przejdź do **Developers** → **API keys**
3. Skopiuj **Publishable key** (zaczyna się od `pk_live_`)
4. Skopiuj **Secret key** (zaczyna się od `sk_live_`)

## Krok 3: Skonfiguruj Webhook

Webhook jest potrzebny do otrzymywania powiadomień od Stripe o zmianach w subskrypcjach.

### Lokalne środowisko (Development)

1. Zainstaluj Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Zaloguj się do Stripe CLI:
   ```bash
   stripe login
   ```
3. Przekieruj webhook do lokalnego serwera:
   ```bash
   stripe listen --forward-to localhost:3000/api/subscription/webhook
   ```
4. Skopiuj **Signing secret** (zaczyna się od `whsec_`) - pojawi się w terminalu

### Produkcja

1. W Dashboard Stripe przejdź do **Developers** → **Webhooks**
2. Kliknij **Add endpoint**
3. Wpisz URL endpointu:
   ```
   https://twoja-domena.com/api/subscription/webhook
   ```
4. Wybierz zdarzenia do nasłuchiwania:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Kliknij **Add endpoint**
6. Skopiuj **Signing secret** (zaczyna się od `whsec_`)

## Krok 4: Zaktualizuj plik .env

Dodaj następujące zmienne do pliku `.env`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # lub sk_live_... dla produkcji
STRIPE_WEBHOOK_SECRET=whsec_... # Signing secret z webhook

# NextAuth (jeśli jeszcze nie masz)
NEXTAUTH_URL=http://localhost:3000 # lub https://twoja-domena.com dla produkcji
NEXTAUTH_SECRET=twoj-tajny-klucz
```

**WAŻNE:**
- W trybie testowym użyj kluczy zaczynających się od `pk_test_` i `sk_test_`
- W trybie produkcyjnym użyj kluczy zaczynających się od `pk_live_` i `sk_live_`
- Nigdy nie udostępniaj kluczy API publicznie (nie commituj ich do repozytorium)

## Krok 5: Testowanie

### Testowanie lokalnie

1. Uruchom serwer deweloperski:
   ```bash
   npm run dev
   ```

2. W innym terminalu uruchom Stripe CLI do przekierowania webhooków:
   ```bash
   stripe listen --forward-to localhost:3000/api/subscription/webhook
   ```

3. Przejdź do `/dashboard/subscription` w aplikacji
4. Kliknij "Aktywuj subskrypcję"
5. Zostaniesz przekierowany do Stripe Checkout
6. Użyj testowych danych karty:
   - **Numer karty:** `4242 4242 4242 4242`
   - **Data ważności:** dowolna przyszła data (np. `12/34`)
   - **CVC:** dowolne 3 cyfry (np. `123`)
   - **Kod pocztowy:** dowolny (np. `12345`)

### Inne testowe numery kart

- **Karta wymagająca 3D Secure:** `4000 0025 0000 3155`
- **Karta odrzucona:** `4000 0000 0000 0002`
- **Karta z niewystarczającymi środkami:** `4000 0000 0000 9995`

Więcej testowych kart: [https://stripe.com/docs/testing](https://stripe.com/docs/testing)

## Krok 6: Weryfikacja działania

Po pomyślnej płatności:

1. Sprawdź w Dashboard Stripe, czy subskrypcja została utworzona
2. Sprawdź w aplikacji (`/dashboard/subscription`), czy subskrypcja jest aktywna
3. Sprawdź w bazie danych (Neon.tech), czy rekord subskrypcji został utworzony/zaktualizowany

## Rozwiązywanie problemów

### Problem: "Stripe nie jest skonfigurowany"

- Sprawdź, czy `STRIPE_SECRET_KEY` jest ustawiony w `.env`
- Upewnij się, że zrestartowałeś serwer po dodaniu zmiennych środowiskowych

### Problem: Webhook nie działa

- Sprawdź, czy `STRIPE_WEBHOOK_SECRET` jest ustawiony w `.env`
- W trybie lokalnym upewnij się, że Stripe CLI działa i przekierowuje webhooky
- W produkcji sprawdź, czy URL webhooku jest poprawny i dostępny publicznie
- Sprawdź logi w Dashboard Stripe → **Developers** → **Webhooks** → **Logs**

### Problem: Subskrypcja nie jest aktywowana po płatności

- Sprawdź logi serwera, czy webhook został odebrany
- Sprawdź w Dashboard Stripe, czy zdarzenie `checkout.session.completed` zostało wysłane
- Sprawdź, czy `userId` jest poprawnie przekazywany w metadanych sesji

### Problem: Błąd weryfikacji podpisu webhook

- Upewnij się, że `STRIPE_WEBHOOK_SECRET` jest poprawny
- W trybie lokalnym użyj signing secret z Stripe CLI (nie z Dashboard)
- W produkcji użyj signing secret z Dashboard Stripe

## Przejście na produkcję

1. Przełącz się na tryb produkcyjny w Dashboard Stripe
2. Zaktualizuj klucze API w `.env` na klucze produkcyjne
3. Utwórz webhook w Dashboard Stripe z URL produkcyjnym
4. Zaktualizuj `NEXTAUTH_URL` na URL produkcyjny
5. Zrestartuj aplikację

## Bezpieczeństwo

- **Nigdy nie commituj** pliku `.env` do repozytorium
- Użyj zmiennych środowiskowych w środowisku produkcyjnym (np. Vercel, Railway)
- W produkcji używaj tylko kluczy `live_`
- Regularnie rotuj klucze API w przypadku podejrzenia kompromitacji

## Dodatkowe zasoby

- [Dokumentacja Stripe](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)

