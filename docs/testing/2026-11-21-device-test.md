# Device test — 2026-11-21

**Device:** Android phone, model A142, over USB (adb) · **Runner:** Expo Go 58.0.5 · **Theme:** dark

## Flow tested (Arabic, GNF)
| Step | Result |
|---|---|
| Onboarding: language, currency, shop name, country code | ✅ |
| Home: totals, empty state, add button on the left in RTL | ✅ |
| Add customer with phone | ✅ opens the customer page |
| Credit 150 000 GNF with note, payment 50 000 GNF via Orange Money | ✅ balance 100 000 GNF, history correct |
| WhatsApp reminder | ✅ `wa.me` link opens the app chooser (nothing sent) |
| Set PIN, restart app, wrong PIN, right PIN | ✅ lock screen, error message, unlock |
| CSV export | ✅ `daftar-2026-11-21.csv` share sheet (nothing shared) |
| Remove PIN | ✅ |

## Bugs found and fixed
1. **Chips did not follow RTL** (language, currency, payment method rows started on the left in Arabic).
   Fix: new `ChipRow` component (`row-reverse` + wrap in RTL).
2. **Low contrast in dark mode**: white text on light orange / green credit and payment buttons.
   Fix: new `onAccent` palette color (dark text in dark mode).
3. **ESLint could not resolve `@/` imports** after the project moved to `D:\New folder (2)`
   (the parentheses in the path break the resolver's tsconfig lookup).
   Fix: explicit `typescript: { project: 'tsconfig.json' }` resolver setting in `eslint.config.js`.

## Not tested yet
- JSON backup and restore, edit / delete customer, delete entry (long-press), French UI end to end, light mode, iOS.
- Expo Go's floating Tools button covers the header's right side (settings ⚙️ / Edit) — development only.
