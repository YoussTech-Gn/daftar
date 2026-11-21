# Decision 0006 — Optional PIN lock, hashed PIN in SecureStore

**Status:** Accepted · **Date:** 2026-11-21

**Context:** Shop phones are shared with family and staff; the debt book is sensitive.

**Decision:** Optional 4-digit PIN, stored as SHA-256(salt:pin) with a random salt in
`expo-secure-store` (Keychain / Keystore), never in SQLite or in backups. The app relocks after
30 seconds in the background.

**Consequences:** Good protection against casual access. A 4-digit PIN is not strong cryptography;
biometrics (expo-local-authentication) and attempt throttling are future improvements.
