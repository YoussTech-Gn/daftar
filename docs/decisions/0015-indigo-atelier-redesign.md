# Decision 0015 — "Indigo Atelier" redesign

**Status:** Accepted (implemented by the designer, reviewed) · **Date:** 2026-11-21
**Brief:** `../design/REDESIGN-PROMPT.md`

## What changed
- **Design tokens** in `src/theme/daftar-indigo-atelier-tokens.json` (light + dark colours, typography,
  spacing, radius, quiet shadows, motion durations / springs, icon scale), typed in `src/theme/tokens.ts`,
  exposed by `ThemeProvider` / `useTheme()` (`src/theme/index.tsx`). Old `src/theme.ts` removed.
- **Fonts:** Manrope (Latin) and Readex Pro (Arabic), loaded before the splash screen hides.
- **Component library** `src/components/ui/`: DaftarText, DaftarButton, DaftarChip, DaftarInput,
  AmountDisplay (animated), CalculatorKeypad, CustomerRow, EntryRow, LedgerHeroCard, BottomTabBar with the
  centre FAB, QuantityBottomSheet, ReceiptPromptSheet, ConfirmationDialog, UndoBar, ExitToast, EmptyState,
  skeletons, StampSaveOverlay ("saved" stamp moment).
- **Motion** (`src/theme/motion.tsx`): press scale, first-mount list stagger, all with a Reduce Motion fallback.
- System `Alert`s replaced by designed dialogs and sheets; session toasts / saved-entry highlight in
  `src/state/session-store.ts` (Zustand).
- Tab bar now **mirrors in Arabic** (previous known limitation fixed).

## Review notes (2026-11-21)
- Business logic (repository, migrations, domain) unchanged; typecheck, lint, 42 tests, Android bundle,
  expo-doctor all pass.
- Fixed during review: `onRequestClose` on the stamp modal (Android), `unstable_settings.anchor`
  instead of the deprecated `initialRouteName`, "Today ·" restored on the hero card's credit / payment
  figures (they are today's totals), singular "1 client vous doit" (new key `customersInDebtOne`).
- Device test: `../testing/2026-11-21-device-test-redesign.md`.
- Open design point: the **credit** colour (`#B83B3B`) is a brick red close to **danger** (`#A62B2B`);
  the brief asked to avoid alarming red for debts and to keep danger for destructive actions only.
