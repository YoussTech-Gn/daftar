# Decision 0009 — Cash loan vs goods, units with fractions, items stored per entry

**Status:** Accepted · **Date:** 2026-11-21 · **Prompt:** `../../../prompts/0004-cash-loans-units-whatsapp-and-stack.md`

## Context
- A customer often borrows **money only** ("I need 100 000"), taking nothing from the shop.
- Other times he takes goods, in varying quantities: 1 kg, ½ kg, 3 pieces…
- The shopkeeper needs to know **what each person took and what each item cost** — not just a text note.

## Decision
1. **Two kinds of credit**, chosen with a toggle at the top of the credit screen:
   - **💵 Cash (نقد / Argent)** — the **default**. Just the calculator keypad.
   - **🛒 Goods (سلع / Marchandises)** — product chips + keypad for anything extra.
   Stored in a new column `entries.credit_type` (`cash` | `goods`, NULL for old entries and payments).
2. **Units on products:** `piece`, `kg`, `liter`, `pack` (column `products.unit`, default `piece`).
   - Piece / pack: tap = +1, long-press = −1.
   - Kg / liter: tap opens a **quantity picker** with ¼, ½, ¾, 1, 1½, 2, 3, 5 and a custom value.
   - Line total = round(unit price × quantity).
3. **Items saved per entry** in a new table `entry_items` (name, unit, qty REAL, unit_price, total,
   optional product_id). The product name and price are **copied** at the time of sale, so later price
   changes never rewrite history. The customer history shows each line: "½ kg Riz × 25 000 = 12 500".
4. The text note stays (auto-built summary) so CSV export and receipts keep working.

## Migration v3
`ALTER TABLE products ADD COLUMN unit`, `ALTER TABLE entries ADD COLUMN credit_type`, `CREATE TABLE entry_items`.
Backups gain an optional `entryItems` array; v1/v2 backup files still restore.
