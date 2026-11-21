# Analysis 0001 — Payment promises, smart reminders, settling, and protection

**Status:** Proposal — not implemented · **Date:** 2026-11-21
**Prompt:** `../../../prompts/0006-promises-reminders-protection-and-report.md`

---

## 1. Think like the shopkeeper first

A credit in a neighbourhood shop is not a bank loan. It is a **relationship** and a matter of **honour**:

- The shopkeeper wants his money back **without losing the customer** and without looking greedy.
- The customer wants to pay **without being shamed**. Asking for credit is already uncomfortable;
  being reminded in front of others is humiliating. Discretion (الستر) matters.
- Some debts must **never be chased**: a close friend, family, an imam, a neighbour in hardship.
- Most problems are not fraud — they are **forgetting**: the shopkeeper forgets who promised what,
  the customer "forgets" for three months, and the debt quietly becomes a loss.

So the app should behave like a **discreet, good memory** for the shopkeeper — never like a debt collector.
Three rules follow:

1. **Nothing is ever sent to a customer automatically.** The app prepares; the shopkeeper decides and taps.
2. **Reminders go to the shopkeeper**, in one calm daily summary — not a stream of alarms.
3. **Nothing is ever really erased.** Mistakes are corrected visibly, so trust is never in doubt.

---

## 2. The situations the user described — and how the app should treat each

| Situation | What the shopkeeper feels | Proposed behaviour |
|---|---|---|
| Close friend / family | "I won't chase him" | Mark the customer **Trusted (no pressure)**: never in reminders or "late" lists; still counted in totals. |
| "I'll pay next week" | "I must remember" | One-tap **promise** when saving the credit: *End of week*. The app reminds the shopkeeper that day. |
| Fixed date ("the 30th", "payday") | Same | Promise *Pick a date* or *Payday* (a day of the month remembered per customer). |
| No date given | "He'll pay sometime" | Default. After **30 days** with no payment, the debt appears in the daily summary (adjustable: 15 / 30 / 60 days). |
| "When I can" — hardship | Compassion | Mark **Give time (hardship)** with an optional review date. Paused from reminders until then. |
| Customer disappears | Worry | After 60 / 90 days the debt is flagged **old** (stronger colour), and the app suggests sending a statement. |

**Is the user's idea good?** Yes — and the strongest part is the instinct that *not every debt should be
chased*. Most ledger apps (Khatabook, OkCredit) only know "remind everyone". Building **"no pressure"** and
**"give time"** into the app is what makes it feel human, and it is rare.

### Promise options (one tap, never required)
`No date` (default) · `End of week` · `End of month` · `Payday` · `Pick a date` · `When he can`

Stored **on the customer** (a running balance has one current promise), with a short history so the app can
say privately: *"kept 3 of his last 4 promises"*. That line helps the shopkeeper decide whether to give more
credit — but it is **only shown to the shopkeeper**, never sent.

---

## 3. Smart reminders — for the shopkeeper only

- **One daily summary** as a local notification at a time he chooses (e.g. 20:00, at closing):
  > *Today: 2 promises due (Ali 50 000, Awa 20 000) · 3 customers with no payment for 30+ days.*
- Tapping it opens a **"To follow up"** screen. For each person: amount, age of the debt, last promise,
  and buttons **Remind on WhatsApp** · **Call** · **Give time** · **Mark as trusted**.
- **Message tone** chosen by the shopkeeper: *Gentle* (default) · *Normal* · *Firm*. Gentle example:
  > *"Salam Ali, I hope you are well. Just a small note from Boutique Diallo: your balance is 50 000.
  > No hurry — when you can. Thank you."*
- **Never** interest or late fees. It would break trust, and in many of these communities it is
  religiously forbidden (riba). The app should say so plainly.
- Works **offline** (local notifications, no server). *To verify:* local notifications in Expo Go on SDK 58.

---

## 4. "He paid everything" — never delete

| Action | What happens | Why |
|---|---|---|
| **Settle all** (button on the customer page) | Records one payment equal to the whole balance (choose cash / Wave / OM / MTN). Balance → 0, customer moves to *Settled*. History kept. Optional "account clear, thank you" WhatsApp receipt. | Proof for both sides; nothing disappears. |
| **Partial payment** | Normal payment (exists today). | — |
| **Forgive the debt** (سامحته) | A third entry type, *forgiven*, that clears the balance but is recorded as forgiveness — not as money received. Reports show "forgiven this year". | Forgiving a debtor in hardship is a respected act; today the shopkeeper would have to fake a payment or delete history. |
| **Archive customer** | Settled, inactive customers leave the main list; searchable; never erased. | A clean list without losing proof. |

The **forgive** action is, in my view, the most original idea here: it turns the app from a debt tracker into
something that respects how people actually live.

---

## 5. Protection — against tampering *and* against mistakes

**Who are we protecting against?** In order of likelihood:
1. The shopkeeper's **own mistakes** (wrong customer, wrong amount, accidental delete).
2. **Someone else using the shop phone** — a helper, a child, a relative.
3. A customer grabbing the phone or reading the screen over the counter.
4. A **lost or stolen** phone.

**Principle: the ledger is append-only, like an accountant's book.**
- "Delete entry" becomes **Cancel entry**: it stays in the history, struck through, with an optional reason;
  the balance ignores it. An *Undo* bar appears for 5 seconds after any change.
- "Delete customer" becomes **Archive**; a real delete only happens from a **Trash** after 30 days.
- An **Activity log** lists every add / cancel / edit / settle / forgive with date and time.

**Protection levels (Settings → Security), so a simple shopkeeper is never annoyed:**

| Level | For whom | What it asks |
|---|---|---|
| **Simple** (default) | One person, his own phone | Nothing extra. Cancels go through *Undo* + Trash. |
| **Protected** | Phone shared with family / a helper | PIN only for **sensitive** actions: cancel, edit, settle, forgive, export, restore, settings. **Never** for adding a credit or payment. |
| **Owner + helper** (later) | Shop with staff | Helper PIN can add entries only; owner PIN for everything; the log shows who did what. |

Asking the PIN only for sensitive actions is what keeps protection invisible in daily use.

**Discretion on screen:** an **eye button** on the home screen hides all amounts (••••) until tapped —
customers standing at the counter cannot read who owes what.

**Lost phone:** a weekly reminder to make a backup (share the file to himself on WhatsApp);
encrypted cloud backup later (paid tier).

---

## 6. Recommended order of work

1. **Trust core:** Settle all · Forgive · Cancel instead of delete · Undo · Trash · Activity log.
2. **Promises & relationships:** promise chips on credit; customer modes *Normal / Trusted / Give time*.
3. **Follow-ups:** "To follow up" screen + daily summary notification + message tones.
4. **Protection levels** + hide-amounts eye + backup reminder.

### Data model sketch
- `customers`: `mode` (`normal` | `trusted` | `hardship`), `promise_at`, `promise_kind`, `hardship_until`,
  `payday`, `archived_at`.
- `entries`: `kind` gains `forgiven`; `cancelled_at`, `cancel_reason`.
- New `activity_log` (action, entity, amount, at, actor).
- Settings: `protection_level`, `reminder_hour`, `stale_after_days`, `message_tone`.

### Open questions for the user
1. Default "no payment" delay: 30 days?
2. Should *Trusted* customers still get a gentle summary once a quarter, or never?
3. Should forgiven amounts appear in the home totals, or only in a yearly summary?
