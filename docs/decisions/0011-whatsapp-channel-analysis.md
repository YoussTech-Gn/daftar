# Decision 0011 — Shopkeepers who only use WhatsApp (analysis + recommendation)

**Status:** Proposed (not built) · **Date:** 2026-11-21

## The question
Some shopkeepers like the idea but don't want another app; they live in WhatsApp.
Could they record debts by sending WhatsApp messages?

## Two very different things
| | For the **customer** | For the **shopkeeper** |
|---|---|---|
| What | Receives receipts / balance on WhatsApp | Records debts by chatting to a WhatsApp number |
| Needs app? | No | No |
| Needs our server? | **No** — `wa.me` links, already built | **Yes** — a bot backend |
| Cost to us | 0 | Hosting + Meta fees + support |
| Status | ✅ Done (Night 2 receipts) | Proposal |

## What a WhatsApp bot for shopkeepers requires
1. **WhatsApp Business Platform (Cloud API)** from Meta: a verified Meta Business account and a dedicated
   phone number for the bot. Personal WhatsApp cannot be automated (it violates WhatsApp's terms and
   numbers get banned).
2. **A backend** (webhook + database), e.g. serverless functions + Postgres. The phone app would then
   **sync** with it (today Daftar has no server at all — decision 0002).
3. **A message grammar**, e.g. `Mamadou 100000`, `Mamadou riz 1/2`, `Awa paid 50000`, `balance Mamadou`,
   with confirmation replies ("✅ Mamadou: +100 000 → balance 650 000. Reply UNDO to cancel").
   Voice notes would need speech-to-text (extra cost, accents, Pular/Wolof/Darija are hard).
4. **Pricing:** Meta charges per message for business-initiated *template* messages; replies to a
   user's own message inside the 24-hour customer-service window have been free. Meta changed its
   pricing model in 2025, so **check the current rate card per country before committing**.
   With the shopkeeper always writing first, most traffic would fall in the free window.
5. **Offline:** WhatsApp itself queues messages offline and sends them when the network returns,
   so the "save now, upload later" behaviour comes for free on the shopkeeper's side.

## Risks
- Meta policy changes / account suspension = the whole product stops.
- Parsing free text in 3+ languages → wrong amounts on someone's debt (trust killer). Needs a confirm step.
- Privacy: debt records leave the phone and live on our server (encryption, data-protection law).
- Turns a zero-cost offline app into a hosted service with running costs and support.

## Recommendation
1. **Now (free):** keep the app offline-first and lean on WhatsApp for the *customer* side:
   receipts (done), statement PDF on WhatsApp (next), reminder messages.
2. **Validate first:** interview ~10 shopkeepers; count how many refuse the app *only* because it's an app.
3. **If ≥ 30–40 % would use WhatsApp instead:** build a **pilot bot** for 5–10 shops on the Cloud API,
   commands only (no voice), every entry confirmed by reply, data synced into the app via a small backend.
   This also becomes the paid "Pro / cloud backup" tier — the server cost is then covered by revenue.
4. Don't build the bot before the app has proven shopkeepers keep using a digital ledger at all.
