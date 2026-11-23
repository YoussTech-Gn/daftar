# Decision 0020 — Local daily notifications for the shopkeeper

**Status:** Accepted · **Date:** 2026-11-23 · **From:** `../analysis/0001-promises-reminders-protection.md` §3

## Problem
The shopkeeper forgets who promised what and who has not paid for weeks. A stream of alarms is noisy;
WhatsApp reminders to customers must stay manual (decision 0004). He needs **one calm daily nudge on
his own phone**, at a time he chooses (often evening / closing).

## Decision
- Use **`expo-notifications`** for **local** notifications only (no Expo Push / FCM server).
- Document the library in `AGENTS.md` under **Notifications**.
- Config plugin in `app.json` with `enableRemoteNotifications: false`.
- Settings (SQLite): `reminders_enabled`, `reminder_hour` (default **20:00**), `reminder_minute`.
- One repeating **daily** notification with a short summary built from the on-device ledger:
  customers in debt, total owed, count of debts with no payment for 30+ days.
- Content is refreshed whenever the app becomes active (or settings change), so the next fire uses
  fresh numbers. Nothing is ever sent to a customer automatically.
- Tapping the notification opens the Customers tab.
- A **test notification** (2 s delay) lets him verify the phone tray without waiting until evening.
- Web: unsupported; Android / iOS only. Local notifications work in Expo Go on SDK 58.

## Out of scope (later)
- Payment promises on credit and a dedicated "To follow up" screen (analysis 0001 steps 2–3).
- Weekly backup reminder.
- Remote push (would need a development build and a backend).

## Code
- `src/domain/notifications.ts` — pure helpers + copy builder (unit-tested).
- `src/lib/notifications.ts` — permissions, Android channel, schedule / cancel / test.
- Settings UI: More › Reminders.
