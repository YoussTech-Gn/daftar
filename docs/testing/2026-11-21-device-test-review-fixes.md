# Device test — external review fixes (2026-11-21)

**Device:** Android phone, Expo Go 58 · French · FCFA · dark mode
**Writes:** one temporary customer "Test Ancien", moved to the trash at the end.

| Step | Result |
|---|---|
| Home: amber credit, softer green, legible cancelled row, "1 client vous doit" | ✅ |
| Eye button → every amount on Home becomes •••••; tap again → back | ✅ |
| Ajouter un client → new field "Doit déjà (ancien cahier)" + hint | ✅ |
| Save "Test Ancien" with 10 000 → customer page: balance 10 000, history "Ancienne dette (cahier)" with book icon, neutral teal avatar | ✅ |
| Home after: total 15 445 → 25 445, "2 clients vous doivent", **"Aujourd'hui · Crédits donnés" unchanged** | ✅ |
| Crédit donné screen: keypad + Save pinned at the bottom | ✅ |
| Trash dialog → confirm → Home back to 15 445 / 1 client | ✅ |

## Not tested on device
Arabic screens (plurals, mirrored report bars), light mode, the save-failure toast (needs a broken DB).

## Known dev-only noise
"Access to closed resource" red box after a Metro reload: SQLite closed while the old bundle had
queries in flight. Seen before these changes; not in a cold start.
