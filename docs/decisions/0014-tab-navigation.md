# Decision 0014 — Bottom tab navigation (Home · Customers · + · Reports · More)

**Status:** Accepted · **Date:** 2026-11-21 · **From:** `../analysis/0002-learning-from-musaed-case-study.md`

## Decision
- Expo Router `(tabs)` group with standard bottom tabs:
  **Home** (`index`) · **Customers** · **[+]** · **Reports** · **More**.
- The centre **[+]** is a custom `tabBarButton` (not a real tab): it opens **New credit** →
  `pick-customer` (most recently active customers first, search, "add customer") → `entry/new`.
  The placeholder route `(tabs)/new` only redirects if reached by a link.
- **Home:** total owed · today's credit / payments · 3 quick actions (New credit, Payment, Add customer) ·
  recent activity grouped *Today / Yesterday / Earlier* (tap → customer page).
- **Customers:** search, filters, list (shared `CustomerRow` / `SearchBox` components), add-customer button.
- **Reports:** this month (credit given, collected, forgiven), all-time collected vs still owed (donut,
  `react-native-svg`), debts by age since last payment (0–30 / 31–60 / 61–90 / 90+), top 5 debtors.
- **More:** Products, shop & language, security, data, activity, trash (the former Settings screen).
- Stack screens (customer page, products, trash, activity) and modals (entry, customer form, picker, PIN)
  stay above the tabs; root `initialRouteName` is `(tabs)` so Back never leaves the app from an inner screen.
- Also in this step: last credit / last payment dates on the customer page, **SMS receipt** option next to
  WhatsApp (direction marks stripped to keep SMS in the cheap encoding), haptics on save / cancel / forgive / undo.

## Known limitation
- In Arabic the tab order is not mirrored (needs full `I18nManager` RTL — already on the roadmap).
