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

## ✅ Night 2 (2026-11-21) — fast entry & knowing the customer (decision 0008)
- [x] Tested on a real Android phone in Expo Go; fixed RTL chips, dark-mode contrast, reversed amounts in Arabic
- [x] Calculator keypad for amounts (`1500 + 800`, `000` key) — no system keyboard
- [x] Product catalog with prices; tap = +1, long-press = −1; note written automatically; most-used first
- [x] "+ Credit" button on every customer row
- [x] Import customer from phone contacts; description field; last activity on rows; filters All / Owe me / Settled
- [x] WhatsApp receipt prompt after each entry, with the new balance
- [x] Back twice to exit on home

## ✅ Night 2b (2026-11-21) — cash loans, units, stack (decisions 0009, 0010, 0011)
- [x] Credit type: 💵 Money (default) or 🛒 Goods
- [x] Product units piece / kg / liter / pack; quantity picker ¼ ½ ¾ 1 1½ 2 3 5 + custom
- [x] Items stored per entry (`entry_items`), shown line by line with prices in the history
- [x] Zustand settings store; React Hook Form + Zod for customer, product and shop forms
- [x] Home stays under any screen opened by link (Back never exits from an inner screen)
- [x] WhatsApp-for-shopkeepers analysed (decision 0011) — not built, needs validation first

## ✅ Trust core (2026-11-21, decision 0013 — from analysis 0001)
- [x] Settle all (pre-filled payment) · Forgive (own entry kind) · Cancel instead of delete + Undo + restore
- [x] Customer trash (30 days, auto purge) · Activity log · CSV `status` column · Lucide icons everywhere

## ✅ External review fixes (2026-11-21, decision 0016)
- [x] Credit in warm amber (not alarm red) · AA contrast for muted / cancelled text · neutral avatars
- [x] Opening balance ("old debt" from the paper notebook) excluded from "credit given today"
- [x] Hide-amounts eye · pinned keypad + Save · save-error toast · Arabic plurals · mirrored report bars · 48 dp targets

## Next — from the external review (decision 0016)
- [ ] Read-only entry detail sheet (items, method, who cancelled and why)
- [x] Forgot PIN: recovery code shown once at PIN setup (decision 0017)
- [ ] Motion: sliding tab indicator, money-direction cue, own forgive animation, list → customer transition
- [ ] Setting "ask for a receipt after each entry"

## Next — from analysis 0001
- [ ] Payment promises on credit (end of week / month / payday / date / when he can)
- [ ] Customer modes: Normal / Trusted (no pressure) / Give time (hardship)
- [ ] "To follow up" screen + daily summary notification + gentle / normal / firm messages
- [ ] Protection levels (Simple / Protected / Owner + helper) + hide-amounts eye + weekly backup reminder

## Night 3 — collection & trust
- [ ] Due date on credit + local reminder notification for the shopkeeper; "Overdue" filter
- [ ] Customer statement as PDF (expo-print) shared over WhatsApp
- [ ] Edit an entry (not only delete)
- [ ] "Daily close" screen: totals per payment channel (cash / Wave / OM / MTN)
- [ ] Aging dashboard: 0–30 / 31–60 / 60+ days; top debtors
- [ ] Customer photo; credit limit per customer
- [ ] Full RTL with `I18nManager` (navigation header/back arrow direction) — needs app reload

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
