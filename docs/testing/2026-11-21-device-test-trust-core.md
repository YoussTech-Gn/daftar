# Device test — Trust core (2026-11-21)

**Device:** Android phone (A142), Expo Go 58 · **Language:** English · **Currency:** XOF (FCFA, set by the user) · dark
**Customer used:** the test customer only.

| Step | Result |
|---|---|
| Migration v4 (rebuild of `entries`) on the phone's existing data | ✅ no error, balance unchanged (1 411 388) |
| Same migration on a copy with Node's SQLite (v1→v4, items, FK check, CHECK, ids) | ✅ |
| Long-press entry → *Cancel entry* | ✅ crossed out, "Cancelled", balance −87 500, Undo bar |
| Undo (tap within 5 s) | ✅ balance back to 1 411 388 |
| Long-press cancelled entry → *Restore* | ✅ |
| **Settle all** → payment screen pre-filled with 1 411 388 → Cash → Save | ✅ balance 0, "Settled", Settle/Forgive buttons hidden |
| Credit 10 000 → **Forgive** → confirm | ✅ "Forgiven" entry with heart icon, balance 0 |
| **Move to trash** → customer leaves the home list | ✅ |
| Settings › **Trash**: "30 days left" → Restore | ✅ trash empty, customer back |
| Settings › **Activity** | ✅ restore, trash, forgive, entry added, settled in full… with time and amount |

## Bug found
- Credit amounts in the history lost their currency ("+10 000" instead of "+10 000 FCFA") because the "+"
  sign was outside the left-to-right isolate. **Fixed in code** (sign inside the isolate, single line) —
  not yet re-checked on the phone (the running app kept the previous bundle).

## Not tested on device
- 30-day automatic purge (covered by code path only), PIN behaviour with the new screens, Arabic/French for the new texts.
