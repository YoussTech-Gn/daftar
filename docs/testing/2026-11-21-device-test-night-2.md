# Device test — Night 2 (2026-11-21)

**Device:** Android phone (A142), Expo Go 58 · **Language:** Arabic · **Currency:** GNF · **Theme:** dark

| Step | Result |
|---|---|
| Migration v2 on existing data (customers.note, products table) | ✅ data kept |
| Home: Products / Settings buttons, filters, last activity, "+ دين" on row | ✅ |
| Products: add Riz 25kg 250 000, Huile 1L 30 000, Sucre 15 000 | ✅ |
| Quick credit from row: Riz ×2 + Huile + keypad `5` `000` | ✅ total 535 000, note "Riz 25kg ×2, Huile 1L + 5000" |
| Save → receipt prompt → Send opens WhatsApp chooser | ✅ (nothing sent) |
| Balance updated on home (688 888 → 1 223 888) | ✅ |
| Back from entry → home; Back on home shows "press again" toast, app stays open | ✅ |
| Add-customer form: contacts button + description field render | ✅ |

## Bugs found during this test and fixed
1. Picking the first product added a row that pushed the products down, so the next tap landed on the
   wrong chip. → Quantity now shown on the product chip itself (tap +1, long-press −1); nothing moves.
2. Amounts inside Arabic text were reversed ("GNF 000 535 · حفظ"). → Amounts are wrapped in a
   left-to-right isolate (U+2066 … U+2069).

## Not tested on the device
- Contacts picker (needs the user's permission to read contacts — left for the user).
- French / English / light mode for the new screens; iOS.
