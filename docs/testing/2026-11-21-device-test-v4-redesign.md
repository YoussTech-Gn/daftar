# Device test — V4 "Équilibre Visuel" redesign with Tailwind (2026-11-21, decision 0018)

**Device:** Android phone, Expo Go 58 · French · FCFA · dark mode
**Writes:** one test credit of 1 000 on the test customer (Mamadou Bah), cancelled at the end.

| Step | Result |
|---|---|
| Cold start with NativeWind | ❌ first: "Cannot find native module 'ExpoSQLite'" (global.css imported first) → ✅ after moving the import below Expo's modules |
| PIN lock: "BD" crest, 4 dots, fingerprint button, "Code PIN oublié ?" | ✅ |
| Accueil: store badge, offline dot, "1 client vous doit", glass hero, "99% encaissé", inline eye, today split, activity panel + "Masquer annulées" | ✅ (two fixes below) |
| Floating dock + detached "+" | ✅ |
| Clients: "3 clients · 144 715 FCFA d'avance", search, Tous / Doivent / Soldés / Avance, glass list | ✅ |
| Tap a client → Nouvelle opération pre-selected (Paiement for a debtor), method chips only for payment, "Fiche client ›" | ✅ |
| Crédit (+) 1 000 → Valider → Clients shows 16 445 at once, receipt sheet, Rapports shows 16 445 | ✅ in sync |
| Rapports: 99 %, bar, reste à récupérer, age note, 2 KPI tiles, À encaisser + Encaisser, remises footnote | ✅ |
| Plus: identity card + Modifier, BOUTIQUE, SÉCURITÉ & DONNÉES (Activé pill), Corbeille badge 2, footer | ✅ |
| Long-press client → customer page → cancel the 1 000 → back to 15 445, "Rétablir" bar | ✅ |

## Fixed during the test
- `text-credit` labels rendered white: the default `text-ink` class won over it → `Txt` adds the default colour
  only when no colour class is given.
- Dock blur is not available behind views on Android: list text showed through → near-opaque surface on Android.

## Not tested on device
Light mode, Arabic RTL, fingerprint unlock itself, recovery code copy, Nouveau client sheet save.
