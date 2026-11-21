# Decision 0010 — Zustand for state, React Hook Form + Zod for forms

**Status:** Accepted · **Date:** 2026-11-21 · **Requested by:** the user

## Decision
- **Zustand 5** replaces the React Context settings provider (`src/state/settings-store.ts`).
  Components subscribe to the slices they need, so a settings change does not re-render the whole tree.
  The `useApp()` hook keeps the same API (`t`, `money`, `isRTL`, `settings`, `updateSettings`) so screens
  did not need rewriting. Smaller and less boilerplate than Redux Toolkit; enough for this app.
- **React Hook Form 7 + Zod 4** (`@hookform/resolvers/zod`) for every form: customer, product,
  onboarding/shop settings. Schemas live in `src/domain/schemas.ts` and are unit-tested.
  Zod error messages are **translation keys**, translated at display time (FR / AR / EN).
- SQLite stays the source of truth; Zustand only holds UI/app state (settings), not the ledger.

## Consequences
- Validation rules are in one place and testable without React.
- Uncontrolled inputs from RHF → fewer re-renders while typing on low-end phones.
