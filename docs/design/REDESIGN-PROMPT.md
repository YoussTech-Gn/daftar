# Redesign brief — Daftar

> Copy everything below this line and give it to the designer (human or AI).

---

You are redesigning **Daftar**, a mobile app that is already built and working. I am not asking you to
invent features. I am asking for a design with **soul**: unique, premium, calm, trustworthy, alive through
motion — a product people feel proud to open in front of their customers. Not a template. Not a generic
fintech dashboard. Not "clean but empty". Every colour, shape and movement must mean something.

Read the whole brief before you start. The screen list in §6 is exact: design **all** of it.

## 1. What Daftar is

**Daftar** ("notebook" in Arabic) is the credit notebook of a small shop, in the shopkeeper's pocket.
In corner shops of **Guinea, Senegal, Mali, Côte d'Ivoire** (and the Maghreb), customers take goods or borrow
money and pay later. Today this lives in a paper notebook that gets lost, wet or disputed. Daftar replaces it.

- Works **fully offline**, no account, data stays on the phone.
- **Never moves money** — it only records it.
- Languages: **French (main), Arabic (right-to-left), English.** Currencies: GNF, FCFA (XOF/XAF), MAD, etc.
- Money in local currencies is **big**: `1 411 388 FCFA` is a normal number. Design for 7–10 digit amounts.

## 2. Who uses it — design for these people

- **The shopkeeper:** 25–60 years old, behind a counter, often standing, one hand busy, other customers waiting.
  Cheap or mid-range **Android** phone, bright daylight or a dim shop at night. Reading level varies — he must
  understand the screen from **icons, numbers and colour** before reading words.
- **The customer (indirectly):** sometimes looks at the screen over the counter. He receives receipts by
  SMS / WhatsApp. He may be a neighbour, a friend, family. **Debt is sensitive** — the design must never feel
  like shaming, punishing or a collection agency.

## 3. How it must feel

1. **Trust & safety** — like a solid ledger and a respected shop, not a casino or a crypto app.
   The shopkeeper must feel: *my records are safe, nothing disappears, I'm in control.*
2. **Premium** — restraint, precise typography, generous space, beautiful numbers, subtle depth.
   Premium is not gold and gradients; it is care in every detail.
3. **Warm & human** — West African warmth, dignity, respect. Credit is a relationship, not a crime.
4. **Fast** — the main action (record a credit) is always one thumb away; nothing slows the counter.
5. **Alive** — motion explains what happened (money in, money out, saved, undone). Never decoration for its own sake.

## 4. Colour psychology (define the palette — don't copy anyone)

Build a **semantic** palette, light and dark, where colour carries meaning:

| Meaning | Feeling to create | Notes |
|---|---|---|
| **Brand / primary** | trust, growth, stability, calm | Anchor of the identity. |
| **Credit / "owes"** | attention, warmth — *not alarm* | Debts are normal. Avoid aggressive red. |
| **Payment / "received"** | relief, success, money coming home | Must read instantly as positive. |
| **Forgiven** | generosity, grace | Forgiving a debt is a respected act — give it a dignified colour of its own. |
| **Cancelled** | neutral, inactive | Crossed out but visible (nothing is erased). |
| **Danger** | real destructive actions only | Move to trash, remove PIN. Rare. |
| **Surfaces / text** | paper, ink, quiet | Readable in direct sunlight (contrast ≥ WCAG AA, numbers AAA). |

Give a short rationale for each colour. Both **light** and **dark** themes are required and equally finished.

## 5. Design tokens to deliver (they go straight into code)

Deliver a token set (JSON or a table) with names I can map 1:1 to React Native:

- **color**: semantic names (e.g. `bg`, `surface`, `surfaceRaised`, `text`, `textMuted`, `border`, `primary`,
  `onPrimary`, `credit`, `creditSoft`, `onCredit`, `payment`, `paymentSoft`, `onPayment`, `forgiven`,
  `forgivenSoft`, `cancelled`, `danger`, `focus`, `overlay`) — light + dark.
- **typography**: one family that supports **Latin and Arabic** well (or a matched pair), with **tabular
  numerals** for amounts. Scale: display amount, title, heading, body, label, caption — size, line height, weight.
- **spacing**: 4-pt scale. **radius**: small / medium / large / pill. **elevation**: 0–3 levels
  (must look good on Android without heavy blur).
- **motion**: durations (instant / fast / normal / slow), easings and spring configs, named by purpose
  (e.g. `press`, `enter`, `exit`, `amountChange`, `success`).
- **haptics**: which interaction gets which feedback (selection, light, success, warning).
- **icon**: size scale. Icons are **Lucide** (outline) — keep that family; you may set stroke width per size.

## 6. Screens to design — all of them (16 screens + overlays)

Navigation: bottom tab bar — **Home · Customers · [ + ] · Reports · More**. The centre **[+]** is a raised
button (not a tab) that starts *New credit*. Other screens open on top of the tabs.

**Tabs**
1. **Home** — total owed to me (hero number) + number of customers who owe · today: credit given / payments
   received · 3 quick actions: New credit, Payment, Add customer · recent activity grouped Today / Yesterday /
   Earlier (customer, time, items summary, signed amount, kind icon; cancelled entries crossed out).
2. **Customers** — search, filters (All / Owe me / Settled), count, list rows (initials avatar, name,
   description · phone, "last activity", balance, small "+ Credit" shortcut), add-customer button.
3. **Reports** — this month (credit given, collected, forgiven) · ring: collected vs still owed (all time) ·
   debts by age since last payment (0–30 / 31–60 / 61–90 / 90+ days, amount + count) · top 5 debtors.
4. **More** — Products & prices · shop name, phone country code, language (FR/AR/EN), currency · security
   (PIN on/off/change) · data (export spreadsheet, backup, restore, activity log, trash) · about/version.

**Flows**
5. **Customer picker** (modal) — search (auto-focused), "Add customer", list sorted by most recent activity.
6. **New credit** (modal) — toggle **Money** (default: cash lent, nothing taken) / **Goods** · total amount
   (big, live) + breakdown line ("½ kg Rice, Oil ×2 + 5000") · in Goods: product chips with price and unit,
   selected ones show quantity · "Add a note" · **calculator keypad** (7-8-9-⌫ / 4-5-6-clear / 1-2-3-+ /
   0, 000) · Save button showing the amount.
7. **Payment** (same screen, payment mode) — method chips: Cash, Wave, Orange Money, MTN MoMo, Other ·
   keypad · also opened pre-filled by **Settle all**.
8. **Quantity sheet** (bottom sheet) — "How much Rice? (Kg)": ¼ ½ ¾ 1 1½ 2 3 5 + custom value + Remove.
9. **Customer page** — balance hero (owes / advance / settled) · description · phone · last credit / last
   payment dates · actions: Gave credit, Received payment, **Settle all**, **Forgive**, WhatsApp reminder,
   Call · history: credit (money / goods with item lines and prices), payment (with method), forgiven,
   cancelled (crossed out) · Move to trash. Variant: **customer in trash** banner with Restore.
10. **Customer form** (modal) — Pick from contacts · name · phone (optional) · description
    ("tailor, street 10, cousin of Ali") · inline validation errors.
11. **Products** — add/edit form (name, unit: piece / kg / liter / pack, price) · list (tap = edit,
    delete icon).
12. **Activity log** — every change with icon, label, customer, time, amount.
13. **Trash** — customers with "N days left" and Restore; explanation that they are deleted after 30 days.
14. **Onboarding** (single screen) — welcome, language, currency, shop name, phone country code, Start.
15. **Lock screen** — shop name, "Enter your PIN", 4 dots, numeric pad, error state.
16. **PIN setup** (modal) — choose then confirm a 4-digit PIN, mismatch error.

**Overlays & system moments** (design them, they are part of the experience)
- **Receipt prompt** after saving: "Send the receipt?" → Not now · SMS · WhatsApp.
- Confirmations: cancel entry, restore entry, forgive (shows amount, explains it is not money received),
  move to trash.
- **Undo bar** (5 s) after a cancel · toast "Press back again to exit" · success feedback after save.
- **Empty states** (no customers, no activity, empty trash, no products) — warm, helpful, no stock photos.
- **Loading** (skeletons) and error state.

## 7. Motion & interaction — this is where the soul is

Design the motion with intent; specify each one (trigger → what moves → duration/easing → haptic):

- **Tab bar:** pressing a tab must feel tactile (press response, active indicator that moves with physics,
  icon state change). The centre **[+]** has its own personality — it is the heart of the app.
- **Money direction:** credit = money/goods **going out** to the customer; payment = money **coming back**.
  Let motion and colour express that direction (subtly).
- **Amounts:** when a total or balance changes, it animates (count / roll), never just snaps.
- **Keypad:** every key press is felt (visual + haptic); the breakdown line builds up as items are tapped.
- **Save:** a short, satisfying confirmation (the "notebook closes / stamp" kind of moment — your idea).
- **Cancel / Undo:** the strike-through and fade should *show* that nothing is erased; Undo restores with
  the reverse motion.
- **Forgive:** a softer, graceful moment — different from a payment.
- **Navigation:** list → customer page continuity (e.g. shared avatar/name/balance), sheets that follow the
  finger, modals that feel light.
- **Lists:** gentle entrance (stagger) the first time, never on every refresh.
- Respect **Reduce Motion**: every animation has a calm fallback.

## 8. Constraints (non-negotiable)

- Built with **React Native / Expo** (Reanimated, Gesture Handler, react-native-svg, Lucide icons,
  expo-haptics). Everything must be buildable with these — no After-Effects-only magic, no Lottie-heavy files.
- **60 fps on a budget Android phone.** Avoid large blurs, heavy shadows, full-screen video, big images.
- **RTL:** every screen must work mirrored in Arabic (show at least Home, Customer page, New credit in Arabic).
- **French strings are long** — layouts must survive "Paiement reçu · Orange Money" and long names.
- Touch targets ≥ 48 dp; the main actions reachable by the thumb at the bottom of the screen.
- Offline app: no avatars from the internet — initials or the shopkeeper's own choices.

## 9. Avoid

Generic fintech template · purple-blue gradients · glassmorphism everywhere · neon · emoji as icons ·
stock 3D illustrations · aggressive red for debts · tiny grey text on grey · decorative motion that slows
the counter · copying any existing app's identity (including the "Musaed" case study we studied).

## 10. Deliverables

1. **Design tokens** (§5) as JSON + a one-page rationale (colour psychology, type, motion).
2. **Component library:** buttons (primary, secondary, credit, payment, danger, WhatsApp), chips, inputs,
   amount display, keypad, list rows, entry rows (all kinds and the cancelled state), tab bar + centre button,
   sheets, dialogs, undo bar, toasts, empty states, skeletons.
3. **All 16 screens + overlays**, light and dark; Home, Customer page and New credit also in **Arabic (RTL)**.
4. **Motion spec** for every interaction in §7: trigger, properties, duration, easing/spring, haptic.
5. **Prototype** of the core flow: Home → [+] → pick customer → Goods → tap products / ½ kg →
   Save → receipt prompt → back to Home with the new activity animating in.

The goal: when a shopkeeper in Conakry or Dakar opens Daftar, he should feel **respected, safe and fast** —
and want to show it to the shop next door.
