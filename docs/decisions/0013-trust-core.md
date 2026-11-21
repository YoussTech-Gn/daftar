# Decision 0013 — Trust core: settle all, forgive, cancel instead of delete, trash, activity log

**Status:** Accepted · **Date:** 2026-11-21 · **From:** `../analysis/0001-promises-reminders-protection.md` §4–§5

## Decision
1. **Settle all** — button on the customer page; opens the payment screen pre-filled with the whole
   balance (the shopkeeper picks cash / Wave / OM / MTN). The receipt says the account is clear.
2. **Forgive** — new entry kind `forgiven`. It lowers the balance like a payment but is **not** counted as
   money received (today's payments, CSV type `forgiven`). Confirmation required.
3. **Cancel instead of delete** — an entry is never erased: `cancelled_at` + optional reason; it stays in
   the history, crossed out, and is ignored by balances and totals. An **Undo** bar appears for 5 seconds;
   a cancelled entry can be restored with a long-press.
4. **Trash** — deleting a customer sets `deleted_at`. Settings → Trash lists them with *Restore*.
   Customers in the trash for more than **30 days** are permanently removed at app start.
5. **Activity log** — every add / cancel / restore / settle / forgive / delete / restore-customer /
   backup-restore is written to `activity_log` and shown in Settings → Activity.

## Migration v4
SQLite cannot change a `CHECK` constraint, so `entries` is **rebuilt** following SQLite's documented
procedure (foreign keys off → new table → copy → drop → rename → index), inside a transaction that is
rolled back on error. Adds `entries.cancelled_at`, `entries.cancel_reason`, `customers.deleted_at`,
and the `activity_log` table.

## Not in this step
Protection levels / PIN for sensitive actions, promises, reminders (next steps of the analysis).
