# Decision 0016 — Acting on the external UI / UX review

**Status:** Accepted · **Date:** 2026-11-21
**Source:** an external reviewer read the code after the Indigo Atelier redesign (decision 0015) and listed
UI, UX and motion gaps. Each claim was checked against the code before acting (prompt 0012).

## Verdict per claim

| Claim | Checked | Action |
|---|---|---|
| Credit red `#B83B3B` ≈ danger `#A62B2B`, debt feels like punishment | ✅ true (hue 0° vs 0°) | **Fixed:** credit is now a warm amber/terracotta (`#A3591A` light, `#E8A25E` dark); danger stays red for destructive actions only |
| Muted text below contrast threshold; cancelled entry barely readable | ✅ true (muted 4.27:1, cancelled 3.44:1 + 58 % opacity) | **Fixed:** muted `#5E6673` (≥ 4.5:1), cancelled `#646A75`, cancelled row opacity 0.8 |
| Avatar colour is random, a paid-up customer can get a red avatar | ✅ true (hash over credit/payment tints) | **Fixed:** 4 neutral identity tints (indigo, slate, teal, lilac), never money colours |
| Dark-mode green looks neon, card borders invisible, hero number small | ✅ true (`#4ADE80`, border 1.24:1, 34 sp) | **Fixed:** green `#56C48A`, stronger borders, display amount 38 sp |
| Large amounts cut in Reports, bars not mirrored in Arabic | ✅ true (only `display` size auto-shrank; bars always grew from the left) | **Fixed:** every one-line amount shrinks to fit; bars grow from the right in Arabic |
| Missing plural rules ("1 زبائن") | ✅ true | **Fixed:** CLDR plural rules for AR (zero/one/two/few/many/other), FR, EN in `src/i18n/plural.ts` |
| New-entry keypad and Save can scroll off screen | ✅ true (inside the ScrollView) | **Fixed:** keypad + Save pinned in a footer, products/notes scroll above |
| No way to record an old debt / opening balance | ✅ true — the most important gap | **Fixed:** "Already owes (paper notebook)" on the new-customer form → a credit entry with `creditType = 'opening'`, shown as "Old debt", **excluded** from "credit given today" and period reports, still counted in the balance |
| No hide-amounts button | ✅ true | **Fixed:** eye toggle on Home masks every balance (••••). Amount being typed, stamp and confirmation dialogs stay visible. Resets on restart |
| Save errors not handled | ✅ true for the entry screen | **Fixed:** failed write → toast "Not saved, nothing was recorded", amount kept for retry; product-order bump can no longer turn a saved entry into an error |
| "Last payment" counts forgiveness | ✅ true | **Fixed:** only `payment` entries |
| Touch targets 32–36 dp | ✅ mostly true (some had hitSlop) | **Fixed:** chips 44, text buttons 48, undo 48, close buttons + hitSlop |
| Two extra steps after every save (stamp + receipt) | ⚠️ partly | Stamp is automatic (~340 ms, no tap). Receipt sheet already only appears when the customer has a phone. Kept; an "ask for receipt" setting can come later |
| No entry detail screen / visible edit | ⚠️ partly | Editing is replaced on purpose by *cancel + re-enter* (trust core, decision 0013). A read-only detail sheet is a good next step → roadmap |
| Forgot-PIN has no solution | ✅ true | Deferred: an offline app has no account to reset from; needs a recovery-code design → roadmap |
| Motion: tab indicator doesn't slide, money direction not felt, forgive reuses save stamp, no list→detail transition | ✅ true | Deferred (polish) → roadmap |
| Screenshots in `docs/screenshots` are old | ✅ true | Device test of this round: `../testing/2026-11-21-device-test-review-fixes.md` |

## Notes
- Token tests no longer pin hex values; they assert the rules instead (AA contrast for text tones in
  both modes; credit hue is amber, danger hue is red).
- No database migration: `credit_type` is a free TEXT column; `'opening'` is a new value.
