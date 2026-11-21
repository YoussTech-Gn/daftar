# Device test — Indigo Atelier redesign (2026-11-21)

**Device:** Android phone (A142), Expo Go 58 · **Language:** French · **Currency:** FCFA · dark
**Customer used for writes:** the test customer only (the user's real customers were only viewed).

| Step | Result |
|---|---|
| Cold start: fonts (Manrope / Readex Pro) load, splash hides | ✅ |
| Lock screen (new design, French) | ✅ unlocked by the user |
| Home: hero card, "100% Hors ligne" badge, quick actions, recent activity with payment method chips | ✅ |
| Rapports: month cards (credit / encaissé / pardonné), animated ring 99 %, ages, top debtors | ✅ |
| Plus: grouped rows (products, shop, language, currency, security, export, backup, activity, trash) | ✅ |
| Centre [+] → picker (custom header, recent first) → Argent 5 000 → Enregistrer | ✅ |
| Stamp overlay "Consigné en sécurité 5 000 FCFA" | ✅ |
| Receipt sheet: preview text, WhatsApp / SMS / Plus tard | ✅ "Plus tard" closes and returns |
| Customer page: hero with status pill, last credit / payment, 6 actions, history (method / grâce chips) | ✅ |
| Long-press → designed dialog "Annuler cette opération ?" → cancel | ✅ struck through, "Annulée", balance 15 445, Undo bar with 5 s progress |

## Fixed after the test
- Hero card showed today's figures without "Aujourd'hui" → label restored.
- "1 clients vous doivent" → "1 client vous doit" (singular key in FR / EN / AR).

## Not tested on device
- Tapping "Rétablir" in the new Undo bar (the earlier version was tested), goods + quantity sheet in the new
  design, forgive / trash dialogs, light mode, Arabic RTL screens.
