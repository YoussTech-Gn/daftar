# Analysis 0002 — What we learn from the "Musaed" case study (and what we don't take)

**Status:** Proposal · **Date:** 2026-11-21 · **Prompt:** `../../../prompts/0008-learn-from-musaed-case-study.md`
**Source:** a public Behance UI/UX case study of *Musaed* ("مساعد"), a debt & collection app designed for Yemen
(Figma concept, not a shipped product as far as the case study shows).

> We learn from the **thinking**, not the branding. Its research (120 survey answers, 8 interviews) was done in
> Yemen with Arabic speakers and cannot be verified — we treat its numbers as hypotheses, not facts.
> Its visual identity (logo, exact colours, name) belongs to its author and is **not** copied.

---

## 1. What the designer did well (method)

1. **Started from problems, not screens:** paper notebooks, hard tracking, no reports, forgetting.
   *Same as our research — good confirmation.*
2. **"How might we" questions** that guide every screen. Theirs are almost ours:
   record a debt in the fewest steps · remind **without embarrassing** anyone · document the debt so it
   can't be denied · give the shopkeeper the full picture at a glance.
   → We adopt these four as **our design checklist** (they match analysis 0001).
3. **Two personas** (merchant / debtor) with goals, pains and habits — a useful format to copy for *our* users
   (a Conakry shopkeeper, a Dakar market seller), from *our* interviews.
4. **Clear UX principles:** simplicity first · fewest steps · data clarity (big numbers) · accessibility ·
   one-hand use · instant feedback (loading states, skeletons, **haptics**).
5. **Fixed bottom navigation with a central action button** — the most-used action is always one thumb away.

## 2. What fits us — adopt (adapted to West Africa)

| From the case study | Our version |
|---|---|
| Bottom tab bar (Home · Reports · ● · Customers · Settings) | **Home · Customers · [+] · Reports · More** — the centre **[+]** is *New credit*, not an AI assistant. |
| Home: totals card + quick actions grid + recent transactions | Totals card (owed to me, collected this month) · 3 big quick actions: **Credit**, **Payment**, **New customer** · recent activity grouped *Today / Yesterday*. Products & Settings move to the **More** tab (no more buttons crowding Home). |
| Customer details: "last debt date", status | Add **last credit date** and **days since last payment** under the balance. |
| Reports tab: donut collected vs outstanding, monthly totals, top debtors | **Reports**: this month — credit given, collected, outstanding, % collected (donut), **top debtors**, **old debts (30 / 60 / 90 days)**. One currency (the shop's). |
| Debt "invoice" detail screen with share | **Entry detail** screen (items, payment method, time, cancelled or not) + later share as image/PDF. |
| Haptics & skeletons | `expo-haptics` on save / cancel / undo; skeleton rows while loading. |
| "Separation of modes" principle | Keep the **merchant** app focused; a "my own debts" mode is a later idea, not now. |

## 3. What we drop or postpone — and why

| Feature in Musaed | Decision | Why |
|---|---|---|
| Login / sign-up / account | **Postpone** | Works fully offline with no account today. Add only when cloud backup or multi-device sync exists — and after real shopkeepers ask for it. |
| AI assistant (chat, GPT) & voice input | **Drop for now** | Needs internet, costs money per use, French/Arabic/Pular/Wolof voice is unreliable, and it adds no value to the core loop. |
| Multi-currency at once (YER / SAR / USD) | **Drop** | Yemen-specific. A shop in Guinea or Senegal counts in one currency (GNF or FCFA). |
| QR code to link accounts | **Drop** | Needs the customer to have the app and a server. |
| Debtor mode (customer has his own app) | **Postpone** | Needs a backend and two-sided adoption. Our customers get WhatsApp/SMS receipts instead. |
| Team accounts, web dashboard, integrations, AI predictions (their Q1–Q4 roadmap) | **Postpone** | Business-tier features; only after the single-shop app is proven. Team accounts ≈ our "Owner + helper" protection level. |
| Payment & subscription screen with Yemeni wallets | **Adapt later** | For our Pro plan: Wave / Orange Money — when Pro exists. |
| Onboarding hero with stock photos | **Skip** | Our onboarding is 1 screen (language, currency, shop). Faster is better. |

## 4. What Musaed doesn't cover — and our market needs

1. **French first**, plus Arabic; later Pular / Wolof / Malinké labels. Literacy varies → **icons, big numbers,
   colour meaning** (orange = owes, green = paid) matter more than text.
2. **Mobile money is central:** Wave, Orange Money, MTN MoMo. Later: a "daily close" per channel.
3. **Many customers have basic phones (no WhatsApp):** add **SMS receipts** as well as WhatsApp
   (`expo-sms` opens the SMS app pre-filled; still sent by the shopkeeper).
4. **Cash loans vs goods, ½ kg, payday promises, forgiveness, "no pressure" customers** — our own findings
   (decisions 0009, 0013, analysis 0001), not in Musaed.
5. **Cheap Android phones, expensive data:** offline, small app, no heavy images.

## 5. Proposed next build (navigation & structure)

```
Tabs:  Home  |  Customers  |  ( + )  |  Reports  |  More
                              │
                              └─ New credit → pick customer (recent first, search) → keypad / products
```

- **Home:** totals · 3 quick actions · recent activity (Today / Yesterday).
- **Customers:** today's list, search, filters (moved from Home).
- **[+]:** customer picker sheet, then the existing credit screen.
- **Reports:** month summary, donut, top debtors, old debts.
- **More:** Products, Shop & language, Security, Data (backup / CSV / restore), Activity, Trash.
- Plus: haptics, entry detail screen, last-credit / last-payment dates on the customer page, SMS receipt option.

Expo Router supports this with a `(tabs)` layout group; modals (entry, customer form, PIN) stay on top.

## 6. Open questions for the user
1. Tab names in French first: *Accueil · Clients · + · Rapports · Plus* — OK?
2. Should the centre **[+]** open *New credit* directly, or a small menu (Credit / Payment / Customer)?
3. Reports: is "this month" enough, or also "this week" for daily traders?
