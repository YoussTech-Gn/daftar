# Decision 0008 — Night 2 scope: fast entry, knowing the customer, receipts

**Status:** Accepted · **Date:** 2026-11-21
**Trigger:** user feedback after the first real test (`../../../prompts/0003-user-feedback-after-first-test.md`)
and research on Khatabook, OkCredit, Vyapar, Ok Khata, Ardoise Pro, Easy Khata.

## Problems reported
1. Entering a credit is too slow (typing every item for every customer).
2. Hard to know who a customer is.
3. Back on the home screen exits the app at once — feels broken.
4. "Something is missing."

## Decision (this round)
| Problem | Feature | Seen in |
|---|---|---|
| Slow entry | **Calculator keypad** (no system keyboard): `1500 + 800 + 350` → total | Ok Khata, OkCredit |
| Slow entry | **Product catalog with prices**: tap items to add them; the note is written automatically ("Riz ×2, Huile"); most-used items first | Vyapar |
| Slow entry | **"+ Credit" button on every customer row** — one tap from home to the keypad | — |
| Who is it? | **Import from phone contacts** (name + number) | Khatabook |
| Who is it? | **Description** per customer ("tailor, street 10"), shown in list and searchable | Ardoise Pro |
| Who is it? | **Last activity** on each row + **filters** All / Owe me / Settled | Khatabook, OkCredit |
| Missing / trust | **WhatsApp receipt after each entry** with the new balance | OkCredit, Khatabook |
| Back exits | **Press Back twice to exit** on the home screen (toast on first press) | Android convention |

## Deferred (next rounds)
Due dates + local reminder notifications, PDF statement, customer photo, credit limit,
aging dashboard (0–30 / 31–60 / 60+ days), barcode scan.

## Notes
- Speech-to-text is not in Expo Go; the keyboard's microphone dictation already works in the note field.
- Schema migration v2: `customers.note`, new `products` table (`use_count` for "most used first").
- Backups stay `version: 1`; `products` and customer `note` are optional fields, so old backups still restore.
