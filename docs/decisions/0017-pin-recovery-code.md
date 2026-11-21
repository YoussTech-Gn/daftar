# Decision 0017 — Forgot PIN: an offline recovery code

**Status:** Accepted · **Date:** 2026-11-21 · **From:** external review (decision 0016)

## Problem
Daftar is offline and has no account. A shopkeeper who forgets the 4-digit PIN was locked out of their
own ledger, with no way back except reinstalling (which erases the local database).

## Options considered
| Option | Why not / why |
|---|---|
| Reset by SMS / e-mail | Needs a server and an account: against the offline promise (decision 0002) |
| "Wipe and start again" button | Destroys the ledger; a thief would gain nothing but the owner loses everything |
| Security question | Guessable by family and neighbours, the very people the PIN protects against |
| Biometrics | Not every target phone has a reliable sensor; still needs a fallback |
| **Recovery code written on paper** ✅ | Works offline, fits a user who already keeps a paper notebook, 60 bits of entropy |

## Design
- When a PIN is set (or changed), a **12-character code** `XXXX-XXXX-XXXX` is generated from
  `expo-crypto` random bytes, in the Crockford Base32 alphabet (no I, L, O, U, so it cannot be misread).
- Only a **salted SHA-256 hash** is kept in SecureStore; the plain code is shown **once** with
  "Write it in your paper notebook", then "I wrote it down".
- Lock screen → **"Forgot PIN?"** → enter the code (case, spaces, dashes ignored; O→0, I/L→1) →
  choose a new PIN → a new recovery code is shown (the old one stops working).
- If no code exists (PIN created before this change): an honest message — the PIN cannot be reset,
  the data is still safe on the phone, the way out is reinstall + restore the last backup.
  The ledger is **never wiped** from the lock screen.
- More › Security → **"New recovery code"** (highlighted, with a hint, when none exists yet).
- Removing the PIN also removes the recovery code.

## Code
`src/security/recovery-code.ts` (pure, tested), `src/security/pin.ts`, `src/components/pin-setup-flow.tsx`,
`src/components/recovery-code-card.tsx`, `src/screens/lock-screen.tsx`, `src/app/recovery-code.tsx`.
