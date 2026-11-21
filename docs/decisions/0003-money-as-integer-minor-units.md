# Decision 0003 — Store money as integer minor units

**Status:** Accepted · **Date:** 2026-11-21

**Decision:** Amounts are integers in the currency's minor unit (GNF/XOF: 0 decimals, MAD: 2, TND: 3),
see `src/domain/currency.ts`. Entries store a positive `amount` and a `kind` (`credit` | `payment`);
balance = sum of credits − sum of payments, computed in SQL. Formatting uses our own thousands
grouping (a space) instead of `Intl`, for consistent output on every Hermes build.

**Consequences:** No floating-point errors. Changing the shop currency later does not convert
existing amounts (acceptable: a shop uses one currency).
