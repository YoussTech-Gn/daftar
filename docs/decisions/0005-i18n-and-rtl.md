# Decision 0005 — Lightweight typed i18n, RTL via layout helpers

**Status:** Accepted · **Date:** 2026-11-21

**Decision:** No i18n library. `src/i18n/translations.ts` holds FR/AR/EN dictionaries; FR and AR are
typed against the EN keys, so a missing translation is a compile error. Language switches live.
RTL is handled by the `Txt` (writingDirection/textAlign) and `Row` (row-reverse) components rather
than `I18nManager.forceRTL`, which would require an app restart.

**Consequences:** Instant language switching. The native header and back arrow do not flip for
Arabic yet — planned for Night 2.
