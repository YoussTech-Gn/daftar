# Decision 0018 — "V4 Équilibre Visuel" redesign, built with Tailwind (NativeWind)

**Status:** Accepted · **Date:** 2026-11-21 · **Brief:** prompt 0014 (from the user's designer)

## Tailwind on React Native
- The user asked for Tailwind CSS "always". In React Native this means **NativeWind 4.2.7** (stable,
  Tailwind 3.4, works in Expo Go). NativeWind 5 is still a release candidate.
- Config: `babel.config.js` (`jsxImportSource: 'nativewind'` + `nativewind/babel`), `metro.config.js`
  (`withNativeWind`, input `src/global.css`), `tailwind.config.js`, `nativewind-env.d.ts`.
- **Single source of truth for colours:** every Tailwind colour is a CSS variable (`bg-surface`,
  `text-ink`, `text-credit`…). `src/theme/v4-tokens.ts` builds the variables from the token JSON
  (shared with the older StyleSheet code) plus the V4 glass / dock values, and `ThemeProvider` sets them
  on the root view with `vars()`, so light and dark switch without changing any class name.
- `global.css` must be imported **after** Expo's own modules in `src/app/_layout.tsx`. Imported first,
  it loaded the NativeWind runtime before Expo's native modules were installed and the app crashed on
  start ("Cannot find native module 'ExpoSQLite'").
- New and redesigned UI uses Tailwind classes only. Screens not in the brief (customer page, detailed entry
  screen, products, trash, activity) keep their StyleSheet code for now and pick up the new colours
  through the shared tokens.

## What changed
| Brief | Implementation |
|---|---|
| Tokens: porcelain light / obsidian dark, no gradients | Token JSON + `v4-tokens.ts`; glass = translucent surface + 1 px specular top edge |
| Floating smoked-glass dock + detached FAB | `components/v4/floating-dock.tsx` (expo-blur), 4 tabs; the old "+" tab route was removed; screens pad by 112 px |
| Accueil | Store badge, live offline dot, debtor chip, glass hero with "% encaissé" pill and **inline privacy eye**, 2-column today split, unified activity panel with "Masquer annulées" (cancelled moved to the bottom, struck through). Quick-action squares removed |
| Clients | Count + live advance total, "+" → **Nouveau client** sheet (name, phone, old debt, contacts import), live search, 4-state segmented control, unified glass list. **Tap = operation sheet pre-selected**; long-press or "Fiche client ›" in the sheet opens the customer page |
| Rapports | Recovery health (%, bar, left to recover, plain-language age note), 2 monthly KPI tiles, "À encaisser maintenant" with inline **Encaisser**, forgiveness footnote. Donut and age buckets removed |
| Plus | Identity card + "Éditer", groups BOUTIQUE / SÉCURITÉ & DONNÉES (34 px tinted badges, subtitles, 15/16 px padding, 20 px gaps), isolated Corbeille with danger badge |
| PIN lock / recovery code | Store crest, fingerprint quick-unlock (expo-local-authentication; the PIN stays the key), recovery code in **JetBrains Mono**, tap-to-copy |
| Nouvelle opération | `components/v4/operation-sheet.tsx`: Crédit (+) / Paiement (−), client chips, method chips (Espèces / Wave / Orange Money) only for payments, numpad 1–9 · 000 · 0 · ⌫, "Valider l'opération" |
| Sync across screens | `ledgerVersion` in the Zustand session store; `useLedgerReload` reloads Accueil, Clients and Rapports after any sheet write (a sheet does not change screen focus) |

## Where the brief was adapted (and why)
- **Muted text `#828C9A` / `#667085` and light credit `#B85D19` are below WCAG AA (3.1–4.4 : 1).** Kept as
  specified for meta text, icons and large figures; small amounts use `creditDeep` / `paymentDeep`
  (≥ 4.5 : 1). The token test now checks AA for body text and amounts and 3 : 1 for these.
- Tapping a client opens the operation sheet as asked, but the customer page (history, cancel, forgive,
  trash) must stay reachable: long-press, and a "Fiche client ›" link in the sheet.
- The operation sheet keeps a "With products from the shop" link to the detailed entry screen, so goods
  credit with the product catalogue is not lost.
- Recovery code copy: the toast asks to write it on paper and clear the clipboard (a copied secret can leak).
- "Remove debug artifacts": the floating gear and "Refreshing…" banner belong to **Expo Go / Metro**, not to
  Daftar; they disappear in a real build (EAS) and cannot be removed from app code.
- Bundling with NativeWind is much slower on this Windows machine (first cold build ~8 min vs ~30 s).
