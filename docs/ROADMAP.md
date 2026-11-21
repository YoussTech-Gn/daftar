# Daftar — nightly roadmap

## ✅ Night 1 (2026-11-21) — MVP
- Onboarding: language (FR/AR/EN), currency, shop name, phone country code
- Customers: add / edit / delete, search, sorted by balance
- Entries: credit given, payment received (+ payment method), note, delete (long-press)
- Home dashboard: total owed, number of customers in debt, today's credit and payments
- WhatsApp reminder deep link (wa.me) + call button
- PIN lock (SHA-256 + salt in SecureStore), relock after 30 s in background
- CSV export, JSON backup + restore
- Light / dark theme, RTL-aware layout
- Unit tests for money parsing/formatting, phone normalization, WhatsApp link, CSV

## Night 2 — trust & daily use
- [ ] Test on a real phone in Expo Go (Android + iOS), fix layout issues
- [ ] Full RTL with `I18nManager` (navigation header/back arrow direction) — needs app reload
- [ ] Edit an entry (not only delete); due date on credit
- [ ] "Daily close" screen: totals per payment channel (cash / Wave / OM / MTN)
- [ ] Share a customer statement as an image / PDF over WhatsApp

## Night 3 — growth loop
- [ ] Reminder templates editable per shop; local notification to remind the shopkeeper
- [ ] Statement footer ("Kept with Daftar") for word-of-mouth
- [ ] Wolof / Pular / Darija labels

## Night 4 — modules
- [ ] **Versement**: owner ↔ driver daily payment tracker (taxis, motos, minibuses)
- [ ] **Tontine**: savings group record-keeper (contributions, draws, arrears) — never holds money

## Night 5+ — business
- [ ] Daftar Pro: free up to 50 customers (`src/domain/plan.ts`), Pro pass for 3 / 12 months
- [ ] Pro paid via mobile money (Wave / Orange Money) — needs a small backend
- [ ] Optional encrypted cloud backup / multi-device sync
- [ ] Landing page (FR/AR) + Play Store listing
- [ ] 10 shopkeeper interviews (Conakry / Dakar) to validate willingness to pay
