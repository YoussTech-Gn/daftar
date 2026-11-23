# Daftar Plan by Grok

English working plan for the Arabic design review (`daftar-review-ar.md`) and the six-phase fix plan (`daftar-plan-ar.md`), plus the owner’s new feedback. Guidance, not a restyle prescription.

**Constraints kept throughout:** Indigo Atelier / V4 Équilibre Visuel tokens (`src/theme/daftar-indigo-atelier-tokens.json`), Manrope + Readex Pro, the existing component library (`src/components/ui/*` and `src/components/v4/*`), RTL, FR/AR/EN for every new string, dark mode, integer minor units for money. Refine and reorganize. Do not delete features. Do not restyle the app into a different product.

**Status values:** `planned` · `done in this PR` · `deferred`.

Statuses below are the inventory at the start of the work. They are updated at the end of the PR once each item has been implemented, confirmed already correct, or explicitly left for later.

**Baseline note:** Decision 0016 already acted on an earlier pass of this review, and decision 0018 (V4) then changed several of those tokens and the Home / Clients / Reports layouts. Each item is judged against the code on `night-1-mvp`, not against the line numbers in the review (those lines have moved).

---

## Owner feedback (highest priority)

These three complaints outrank the phase list. They are about reading money, not about adding features.

1. **Too many numbers, scattered, hard to read.** When someone is looking at what is owed or what was just paid, one amount has to dominate. Home currently puts a recovery percentage, the hero total, and two more “today” amounts in the same card. The customer page adds last-credit and last-payment dates beside the balance.
   - **Status:** planned
2. **The list of people who owe money is hard to scan.** One clear balance per person, a clear hierarchy (name, then amount), secondary facts demoted or removed, sorted sensibly (biggest debt first, then the debt that has been quiet the longest).
   - **Status:** planned
3. **The customer screen has no sequence.** Balance first, then the obvious next actions (record a payment, add credit), then secondary actions grouped (reminder / message, forgive, call, settle all), then history. Actions that matter at the counter stay on screen while the history scrolls.
   - **Status:** planned

---

## Phase 1 — Trust, colour, and quick reading bugs

From the Arabic plan, checked against the review’s UI section.

1. **Credit colour is warm, not danger red.** Review §2.1 and recommendation 1. Debt must not read as an alarm. `danger` stays the only red. Current tokens are already amber (`credit` `#B85D19` / `#E38B4B`, hue ~25°) and the token test locks that. Keep them; do not shift the palette.
   - **Status:** planned
2. **Avatar colours are deterministic and never mean money.** Review §2.2. Neutral tints only (no credit red, payment green, or forgiven plum). The review and the owner both ask for a **hash of the customer id**, not the name, so renaming someone does not recolour them and two people with the same name do not share a colour.
   - **Status:** planned
3. **Report age treatment does not escalate toward an alarm, and bars follow Arabic.** Review §2.11, §2.12. V4 removed the green/red age buckets and replaced them with one plain-language age note. The recovery bar already starts from the right in RTL (`alignSelf`).
   - **Status:** planned
4. **Sunlight contrast.**
   - **4a. `textMuted` to WCAG AA, aiming at 5.5:1.** Review §2.4. V4 set light `#828C9A` (~3.1:1 on `bg`) and dark `#667085` (~3.5:1 on `surface`) on purpose for “meta” text. That fails AA for 12sp captions used as group labels, timestamps, and tab-adjacent copy. Darken light muted and lighten dark muted, staying quieter than `textSecondary`.
   - **4b. Cancelled entries stay readable.** Review §2.5 and §2.6. A cancelled row still fades (opacity 0.8) and draws one strikethrough at `top: 50%`, which misses a two-line title. Use a real `line-through` on the text, drop the opacity wash, keep the row on `surface`.
   - **4c. Clearer card edges.** Review §2.8. `border` on `surface` is about 1.2:1, so cards dissolve in sun. Nudge `border` inside the existing cool-gray family. Do not invent a new outline style.
   - **4d. Calmer dark-mode payment green.** Review §2.3. Dark `payment` `#34C79B` is highly saturated (chroma ~0.74) and `paymentDeep` `#5AD6B0` is brighter still. Desaturate both, keep contrast at least 4.5:1 and preferably 7:1 for amounts, and keep the hue green.
   - **4e. Hero amount between 40 and 44sp.** Review §2.9. `displayAmount` is 38sp. Raise it into that range; currency stays in the same line via `AmountDisplay`. Long amounts still step down.
   - **Status:** planned
5. **“Last payment” must not count forgiveness.** Review §3.2, around the customer screen. The screen already filters `kind === 'payment'`. Lock that rule in a pure function with tests so a future edit cannot treat forgiveness as money received. Do not count cancelled payments either.
   - **Status:** planned
6. **Plural forms, no “1 زبائن”.** Review §3.5. CLDR categories for EN/FR/AR already cover customers-in-debt, customer count, days left, last-activity days, and PIN tries. `productsSaved` (“{n} منتجات محفوظة”) still has no singular. Add it in all three languages.
   - **Status:** planned
7. **Touch targets at least 48dp.** Review §3.4. Still short: product chips 44, operation-sheet method chips 40 and links 36, report “collect” 40, segmented control 44, customer quick-credit pill 36, new-customer contact row 46, the Home “hide cancelled” chip 36. Icon badges that are not themselves buttons (the 32dp tint in More) stay as icons. Raise real controls to 48dp minimum.
   - **Status:** planned

### Other review UI notes folded into phase 1 where they are the same contrast pass

8. **Forgiven amounts should reach AAA where practical.** Review §2.7. Light `forgiven` on `surface` is already ~6.7:1. A separate `forgivenDeep` is only worth adding if a check shows a real miss. Do not add a token just to add a token.
   - **Status:** planned
9. **Report KPI amounts must not truncate.** Review §2.10. V4 replaced the three cramped cards with two tiles plus `adjustsFontSizeToFit` on every one-line amount.
   - **Status:** planned
10. **Hero amount alignment in Arabic.** Review §2.13. Home already passes `align={isRTL ? 'right' : 'left'}`.
    - **Status:** planned
11. **Minimum type size.** Review §2.14. Tab labels are still 11sp in the floating dock. Raise labels that carry meaning to at least 12sp. Do not restyle the dock.
    - **Status:** planned
12. **System font scaling.** Review §2.15. Prefer `minHeight` on keypads over a fixed `height`, and cap keypad `maxFontSizeMultiplier` so digits do not explode. A full font-scale audit of every fixed height is later work.
    - **Status:** planned
13. **Thousands separators must not wrap.** Review §2.17. `formatDisplayAmount` already uses `\u202F`.
    - **Status:** planned

---

## Phase 2 — Speed at the counter

1. **New credit / payment screen: keypad and Save stay pinned.** Review §3.1 and recommendation 2. Already true: products, note, and method chips scroll; `CalculatorKeypad` and Save sit in a footer. Raise keypad keys from 48 toward 56dp (`minHeight`) so they meet the review without a new layout. Keep the 7-8-9 order (the brief asks for it). Keep the keypad LTR.
   - **Status:** planned
2. **The system keyboard must not cover the keypad.** Review §3.1. The note field still uses `autoFocus`, so the OS keyboard opens on top of the pinned keypad. Quantity “other” still uses the decimal system keyboard (`quantity-bottom-sheet.tsx`).
   - **Status:** planned
3. **After save, fewer blocking steps.** Review §3.1 and recommendation 8. The stamp is already ~340ms and non-interactive. The receipt sheet appears only when the customer has a phone. A remembered preference (“always ask / always WhatsApp / don’t ask”) is a new setting.
   - **Status:** planned
4. **New customer opened from a credit flow should land on the new entry, not the customer page.** Review §3.1. V4 adds customers from a sheet on Clients and from the operation sheet, which is a different path than `pick-customer` → `customer/form`.
   - **Status:** planned
5. **Customer page: primary actions fixed at the bottom.** Review §3.4 and the owner’s third complaint. “Gave credit” and “Received payment” scroll away today. Pin them. Group reminder, forgive, call, and settle-all above the history.
   - **Status:** planned
6. **Payment for a customer who is already settled (an advance).** Review §3.1. `pick-customer` still filters the payment path to `balance > 0`, and the empty state can say there are no customers when there are only settled ones.
   - **Status:** planned
7. **Customer picker: show the likely person before the keyboard covers the list.** Review §3.1. Search still autofocuses.
   - **Status:** planned

---

## Phase 3 — What the shopkeeper is missing

1. **Opening balance / old paper debt.** Review §4 high item 1 and recommendation 3. New-customer forms already write a credit with `creditType: 'opening'`, excluded from “credit given today”. A date on an arbitrary later entry (`addEntry` still uses `Date.now()`) is the remaining gap.
   - **Status:** planned
2. **Entry detail on a normal tap.** Review §3.2 and recommendation 4. History rows still do nothing on tap; cancel/restore is a long-press. Decision 0013 replaced editing with cancel-and-reenter. A read-only detail sheet (items, method, time, cancel, send receipt again) is the missing piece. Do not add silent editing of a posted amount.
   - **Status:** planned
3. **Hide amounts.** Review §2.19, §3.5, recommendation 6. The eye on Home already masks every `AmountDisplay` (session-wide, including the customer list and the customer page) and leaves an amount being typed visible. The customer page itself has no eye, so the shopkeeper cannot turn it on while a customer is looking at that screen.
   - **Status:** planned
4. **“Sent with Daftar” optional and off by default.** Review §3.5. Receipt and reminder templates still carry the sign-off.
   - **Status:** planned
5. **Ranking numbers on “biggest debtors”.** Review §3.5. V4 reports no longer number 1–5. The list is “to collect now”.
   - **Status:** planned

---

## Phase 4 — Safety and resilience

1. **Save failures and a real error state.** Review §3.2 and §3.3. `entry/new` already catches a failed `addEntry`, clears `saving`, and toasts “not saved”. There is still no screen-level error state, and a failed database migration in `_layout.tsx` has no UI.
   - **Status:** planned
2. **Backup reminder with “last backup: N days ago” on More.** Review §4 high item 7. Not built.
   - **Status:** planned
3. **Forgotten PIN.** Review §3.2 and §4 high item 8. A recovery code exists (decision 0017). The lock screen still needs a visible way to use it, and onboarding should say plainly that forgetting the PIN without the code means the notebook cannot be opened.
   - **Status:** planned
4. **Confirm before renaming the currency.** Review §3.2. Changing GNF to MAD re-labels every integer and does not convert.
   - **Status:** planned

---

## Phase 5 — Motion and haptics

Review §5. Do these without a new animation language.

1. **List haptics on `onPress`, not `onPressIn`.** `usePressScale` fires on press-in, so starting a scroll on a customer row buzzes. Keypads can keep press-in.
   - **Status:** planned
2. **Amount roll on the UI thread.** `AmountDisplay` calls `setState` every frame via `scheduleOnRN`.
   - **Status:** planned
3. **One tab indicator that slides.** The dock scales a pill per tab. There is no shared `translateX` indicator. The FAB does not rotate or breathe.
   - **Status:** planned
4. **Money direction and a distinct forgive moment.** Credit and payment both nudge a few pixels. Forgiveness reuses the save stamp.
   - **Status:** planned
5. **One `BottomSheet` for every sheet.** Quantity and receipt track the finger. More’s sheets are a fading `Modal`.
   - **Status:** planned
6. **Stagger lists once per screen, not on every search keystroke.** `StaggerItem` can replay inside a filtered `FlatList`.
   - **Status:** planned
7. **Motion token names.** Review §5 row 1. Durations still live in both the JSON and `motion.tsx`, and a few components hard-code 140 / 180 / 750 / 1800.
   - **Status:** planned
8. **Reduced motion.** Already respected. No gap.
   - **Status:** planned

---

## Phase 6 — Proof

1. **New screenshots** of the current UI (the files in `docs/screenshots` are the old teal/orange build). Light, dark, and Arabic of Home and the customer screen, before and after this PR, attached as artifacts when the web build runs.
   - **Status:** planned
2. **Update README and decision 0014** where they still describe the pre-tab or pre-RTL layout. Decision 0014 says tabs do not mirror in Arabic; `bottom-tab-bar` / the dock now reverse.
   - **Status:** planned
3. **Device pass the review asked for:** cheap Android, sunlight, light mode, French, Arabic. This environment can run the web build and unit tests. It cannot stand in for that phone.
   - **Status:** planned

---

## Later — medium and low (Arabic plan “لاحقًا”, review §4)

1. **Payment promises, due dates, and “to follow up today”.** Analysis 0001 / roadmap.
   - **Status:** planned
2. **Customer statement (PDF or image) sent on WhatsApp.**
   - **Status:** planned
3. **Partial forgiveness.** Forgive currently clears the whole balance. A small remainder is common at the counter.
   - **Status:** planned
4. **End-of-day cash-up by channel** (cash / Wave / Orange Money / MTN).
   - **Status:** planned
5. **Appearance (system / light / dark) and a type-size option.** Review §2.23. The app follows the system only. “Always light” matters in the sun.
   - **Status:** planned
6. **Duplicate customer warning** (same name or phone). Review §3.2.
   - **Status:** planned
7. **Per-customer credit limit and an optional photo.** Roadmap.
   - **Status:** planned
8. **Customer language for reminders**, separate from the shopkeeper’s UI language. Review §3.5.
   - **Status:** planned
9. **More report periods** (week, previous months). Only “this month” exists.
   - **Status:** planned
10. **Pulaar, Wolof, and Darija labels.** Roadmap.
    - **Status:** planned
11. **Overpayment warning.** A payment larger than the balance silently becomes an advance. Show “balance X → after payment Y” and a quiet note if it goes negative. Review §3.2.
    - **Status:** planned
12. **“Settle all” should be labelled as a mode** on the payment screen, not only a prefilled amount. Review §3.2.
    - **Status:** planned
13. **Product edit happens off-screen.** The product form stays at the top of the list, so editing a lower row looks like nothing happened. Review §3.2.
    - **Status:** planned
14. **Empty, loading, and error copy.**
    - Filter or search with no hits must not say “no customers yet” and offer “add a customer”. Review §3.3. V4 Clients uses `noMatch` when the shop already has customers; confirm the other empty states.
    - Home activity empty state has no action. Review §3.3.
    - Reports empty “biggest debtors” used the activity illustration; V4 uses a sentence instead.
    - Trash empty state repeats `trashHint` in the banner and the empty message. Review §3.3.
    - “Earlier” activity shows a time with no date, the home list is capped, and there is no “see all”. Review §3.3. V4 `entryTime` now includes a short date for older rows. Activity screen grouping and filters are still open.
    - **Status:** planned
15. **Home “100% offline” badge occupies the best spot** and is repeated. Review §2.19. V4 replaced that badge with a small offline dot plus the debtor chip. The eye is already in the hero.
    - **Status:** planned
16. **Trash banner uses danger red and an alarm icon** for a reversible state. Review §2.20. Prefer a neutral or indigo banner, a tray or clock icon, and “N days left”.
    - **Status:** planned
17. **Customer name is repeated** in the navigation header and the hero card. Review §2.21.
    - **Status:** planned
18. **More “soul” in the hero only:** ruled lines, a margin, a round stamp instead of a Stamp icon in a square. Review §2.22. Easy to over-style. Do not add this if it changes the V4 glass language.
    - **Status:** planned
19. **Hard-coded French placeholders** (“Riz”, “25000”, “224”). Review §2.24. Move them into translations.
    - **Status:** planned
20. **One date-time format.** Review §2.18. Dates go through `toLocaleString`, so Arabic can show different digits and the customer history can include seconds. A single “21 Nov · 13:28” formatter, no seconds, stable digits.
    - **Status:** planned
21. **Accessibility labels.** Review §3.4. Keypad keys announce “back”, “clear”, and “+” in English. PIN delete announces “delete”. Customer and entry rows have no label that combines name, amount, and state. The dock’s round “+” has a label; the tab glyphs rely on the tab label.
    - **Status:** planned
22. **Reminder when there is no phone.** Review §3.4. The customer page shows WhatsApp even with no number, then toasts an error, while Call is hidden. Either hide it or open the form to add a number.
    - **Status:** planned
23. **Understand the row before reading.** Review §3.4. Customer filters are text-only. Report figures are text-only. Do not add icons everywhere; the debtor list’s balance colour and the entry-row icons already carry the meaning.
    - **Status:** planned
24. **More screen group titles and finger-following sheets.** Review §4 medium items 16–17. V4 More already groups Boutique and Security. The sheets still do not follow the finger (phase 5).
    - **Status:** planned
25. **Home activity should show the items summary, not only the note, and “days since last payment” under the balance.** Review §4 “what already matches”, the two gaps called out at the end of that section.
    - **Status:** planned
26. **Haptic map documentation.** Review §5. `medium` is used on the FAB. Not a product bug. Write it down only if a decision file is already being touched.
    - **Status:** planned
27. **Shared-element transition from the list to the customer page.** Review §5.
    - **Status:** planned
28. **Keypad order and size consistency with the PIN pad.** Review §2.16. PIN keys are 60dp and start at 1-2-3. Calculator starts at 7-8-9 by spec. Unifying the *size* is the phase 2 keypad change. Do not reorder the PIN pad in this pass.
    - **Status:** planned

---

## What the review said is already in the product

Kept on purpose. Not work items: 16 screens, WhatsApp/SMS receipt, four confirmation dialogs, 5-second undo, double-back-to-exit, stamp, four empty states, four skeletons, trust model (cancel strikes through, trash keeps a customer 30 days, forgiveness is its own entry kind), reduced motion, LTR isolation for amounts and keypads, narrow no-break spaces, tabular numbers, quiet shadows, paper-not-pure-white background, shopkeeper always presses Send.

---

## Design calls for this PR

Made while implementing, inside the constraints above.

- **Reading beats a second dashboard.** Home keeps every figure it has today. The total owed stays the only display-size number. The recovery percentage and the two “today” amounts drop to label size so they stop competing.
- **The debtor list is a list of balances.** Tap opens the customer file (that is what the owner means by “when I tap a customer”). Long-press still opens the operation sheet, and the FAB still starts a new operation, so the counter shortcut is not removed. One amount per row. Note and phone collapse to a single muted line. Settled rows say “settled” instead of showing 0. Advances keep the amount in the payment colour plus one word, because a positive-looking number would otherwise be read as debt.
- **The customer page is a sequence.** The header already has the name, so the card leads with the balance. One context line (last real payment, or “no payment yet”). Reminder, forgive, call, and settle-all sit in one secondary group. Gave credit / received payment are pinned to the bottom. History scrolls underneath. The eye from Home is available on this screen because hide-amounts is already global.
- **Colour edits stay inside the token file.** No new theme. Amber credit is left alone. Muted text, dark payment green, borders, cancelled ink, and the hero size move only as far as the contrast rules require.

---

## End-of-PR status

Updated after implementation. See the status line on each item above.
