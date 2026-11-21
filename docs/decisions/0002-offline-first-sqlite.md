# Decision 0002 — Offline-first with SQLite, no backend

**Status:** Accepted · **Date:** 2026-11-21

**Context:** Target shops have unreliable or expensive mobile data. Competitor Kippa shut down and users lost their data.

**Decision:** All data lives in `expo-sqlite` on the device. Schema changes go through append-only
migrations tracked with `PRAGMA user_version` (`src/db/migrations.ts`). All SQL lives in
`src/db/repository.ts`. Users can export CSV and back up / restore JSON at any time.

**Consequences:** Zero hosting cost, instant UI, privacy. Multi-device sync and cloud backup are future work.
