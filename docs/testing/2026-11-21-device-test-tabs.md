# Device test — Bottom tabs (2026-11-21)

**Device:** Android phone (A142), Expo Go 58 · **Language:** English · **Currency:** FCFA · dark
**Customer used:** the test customer only.

| Step | Result |
|---|---|
| App opens on **Home** tab | ✅ totals, today's credit / payments, 3 quick actions, recent activity "Today" with icons per kind |
| Credit amounts in history / recent activity | ✅ "+10 000 FCFA" — the clipped-currency fix (sign inside the isolate) is confirmed |
| **Customers** tab | ✅ search, filters, "2 customers", list |
| **Reports** tab | ✅ this month, forgiven line, donut %, debts by age, top debtors |
| Centre **[+]** | ✅ opens "New credit · Choose a customer", most recent first |
| Pick customer → keypad 20 000 → Save | ✅ receipt dialog with **Not now / SMS / WhatsApp** |
| SMS | ✅ Android offers Messages / WhatsApp for the `sms:` link (not opened, nothing sent) |
| Reports after the credit | ✅ credit given +20 000, 99 %, 1 customer in 0–30 days, top debtor listed |
| **More** tab | ✅ Products & prices, shop, language… |
| Customer page | ✅ "Last credit: Nov 21 · Last payment: Nov 21" |

## Fixed after the test
- The donut's "Collected" label showed an **all-time** total under a **this month** heading →
  renamed "Collected (all time)" (FR / AR too).

## Not tested on device
- Arabic tab order (not mirrored — known limitation), haptics feel, Payment quick action from Home.
