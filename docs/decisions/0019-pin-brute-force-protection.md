# Decision 0019 — Brute-force protection for the PIN and the recovery code

**Status:** Accepted · **Date:** 2026-11-21 · **From:** the user tried ~30 wrong PINs and was never stopped

## Problem
A 4-digit PIN has 10 000 values. With no limit, a script driving the screen (for example over USB debugging)
or a patient person can try them all in a few hours. The recovery code (60 bits) is safe by itself but
had no limit either.

## Decision
- **4 free wrong tries.** From the 5th wrong try, entry pauses: 30 s, 1 min, 5 min, 15 min, then **1 hour
  for every further wrong try**. Trying all 10 000 PINs then takes more than a year (unit-tested).
- **Enforced in the security layer** (`checkPin` / `checkRecoveryCode` in `src/security/pin.ts`), not only
  in the screen: while locked, the secret is **not even compared**. Checks run one at a time, so firing
  many checks at once cannot slip extra guesses in.
- **Survives a restart:** the counter and the time of the last mistake live in SecureStore.
- **Clock tricks:** moving the phone's clock backwards restarts the full delay.
- The PIN and the recovery code have **separate counters**. Text that cannot be a recovery code (wrong
  length / letters) is a typo, not a guess, and does not count.
- Reset: a correct PIN, a successful fingerprint unlock (the owner's own finger), or setting a new PIN.
- The ledger is **never wiped** after failed tries: wiping would let a child or a rival destroy the
  shopkeeper's records just by typing wrong codes.
- UX: from 2 tries left the error says how many remain; when locked, the keypad is replaced by a countdown
  with a calm explanation. Fingerprint unlock stays available during the pause.

## Limits (honest)
- Someone with root access to the phone could read SecureStore directly; Android Keystore encryption is
  the protection there, not this counter.
- Code: `src/security/attempts.ts` (pure, tested in `__tests__/attempts.test.ts`), `src/security/pin.ts`,
  `src/screens/lock-screen.tsx`.
