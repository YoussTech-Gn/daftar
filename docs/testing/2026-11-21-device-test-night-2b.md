# Device test — Night 2b (2026-11-21)

**Device:** Android phone (A142), Expo Go 58 · **Language:** English (chosen by the user) · **Currency:** GNF · dark

| Step | Result |
|---|---|
| Migration v3 on existing data (units, credit_type, entry_items) | ✅ data kept |
| Product form (RHF + Zod): empty submit → "Please enter a name." / "Please enter a valid price." | ✅ |
| Add product "Riz", sold by Kg, 25 000 GNF | ✅ shown as "25 000 GNF / Kg" |
| Credit screen opens on **💵 Money** by default; 100 000 → saved | ✅ history: "Money +100 000" |
| Switch to **🛒 Goods**; tap Riz (kg) → quantity sheet → ½ | ✅ |
| Huile ×2 (tap twice), Sucre ×1 | ✅ total 87 500 = 12 500 + 60 000 + 15 000 |
| History shows each line with its price | ✅ "½ kg Riz 12 500 / Huile 1L ×2 60 000 / Sucre 15 000" |
| Open products by link, press Back | ✅ goes to Home (fixed with `initialRouteName`) |

## Bug found and fixed
- Opening a screen directly (link / future notification) had no Home underneath → Back exited the app.
  Fixed with `unstable_settings = { initialRouteName: 'index' }` in the root layout.

## Not tested on device
- Customer form with RHF (covered by unit tests), contacts picker, Arabic/French for the new screens, iOS.
