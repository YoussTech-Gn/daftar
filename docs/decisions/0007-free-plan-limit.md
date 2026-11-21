# Decision 0007 — Freemium limit prepared but disabled

**Status:** Accepted · **Date:** 2026-11-21

**Decision:** `src/domain/plan.ts` defines `FREE_CUSTOMER_LIMIT = 50` and `ENFORCE_FREE_LIMIT = false`.
The check already exists in the add-customer flow but stays off until Pro can be purchased.

**Why:** The research suggests free up to about 30–50 customers, then a Pro pass (3 or 12 months)
paid by mobile money. Charging before trust is earned would hurt adoption.
