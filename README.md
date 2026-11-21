# Daftar — the shop credit notebook, in your pocket

Daftar ("notebook" in Arabic) is an **offline-first credit ledger** for corner shops and small merchants
in francophone West Africa and the Arabic-speaking world. It replaces the paper *crédit cahier* / *karni*.

- 📒 Customers with live balances (who owes you, who has an advance)
- ↑ / ↓ Two-tap entries: **credit given** and **payment received** (cash, Wave, Orange Money, MTN MoMo, other)
- 💬 **WhatsApp reminders** with a polite pre-filled message in the shop's language
- 🌍 **French, Arabic (RTL) and English**; currencies GNF, XOF, XAF, MAD, DZD, TND, EGP, MRU, NGN, EUR, USD
- 🔒 Optional **4-digit PIN lock** (hashed, kept in the device secure store; relocks after 30 s in background)
- 💾 **Your data is yours**: CSV export, JSON backup and restore — no account, no server, works offline
- 🌓 Light and dark mode

The app never holds or moves money — it only records it.

## Run it in Expo Go

```bash
cd daftar
npm install
npx expo start
```

Scan the QR code with **Expo Go** (Android) or the Camera app (iOS).

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Start the Expo dev server |
| `npm test` | Unit tests (Jest + `jest-expo`) |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm run lint` | ESLint (`expo lint`) |

## Project structure

```
src/
  app/                Expo Router screens (file = route)
    _layout.tsx       DB provider, settings provider, onboarding / PIN gate, stack
    index.tsx         Home: totals, customer list, search
    customer/[id].tsx Customer ledger, credit / payment buttons, WhatsApp reminder
    customer/form.tsx Add / edit customer (modal)
    entry/new.tsx     New credit or payment (modal)
    settings.tsx      Shop, language, currency, PIN, export / backup / restore
    pin-setup.tsx     Choose + confirm PIN (modal)
  components/         UI kit (RTL-aware Txt / Row, Button, Field, Chip, Avatar, PinPad)
  db/                 SQLite migrations + repository (all SQL lives here)
  domain/             Pure logic: types, currency, reminders, CSV, plan limits (+ tests)
  i18n/               FR / AR / EN dictionaries (typed keys)
  lib/                File export / share / restore
  screens/            Non-route screens (onboarding, lock)
  security/           PIN hashing (expo-crypto) + storage (expo-secure-store)
  state/              App settings context (language, currency, shop, i18n helpers)
docs/
  decisions/          One file per technical / product decision
  prompts/            One file per prompt that shaped this project
  ROADMAP.md          Night-by-night roadmap
```

## Key technical choices
See `docs/decisions/`. In short: Expo SDK 58 + Expo Router + strict TypeScript, `expo-sqlite`
with versioned migrations, money stored as **integer minor units**, no backend.
