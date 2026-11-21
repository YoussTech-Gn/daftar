# Device test — PIN brute-force protection (2026-11-21, decision 0019)

**Device:** Android phone, Expo Go 58 · French · dark mode. Wrong PIN used: 1357.

| Step | Result |
|---|---|
| Wrong tries 1–2 | "Code incorrect, réessayez." |
| Wrong try 3 | "… Encore 1 essai avant une pause." ⚠️ see note |
| Wrong try 4 | "… Encore une erreur et la saisie sera mise en pause." |
| Wrong try 5 | Keypad replaced by "Trop de codes incorrects" + countdown **0:30**; taps on the old keypad area do nothing; fingerprint and "Code PIN oublié ?" still there |
| App force-closed, reopened after the pause ended, **one** wrong try | Countdown **1:00** at once → the counter survived the restart and the delay grew |

## Note
The warning after try 3 says "1 try left" while 2 tries remain (try 4 is still free, try 5 locks).
The counter is right; `attemptsBeforeLock` counts tries before the locking one. Wording to align:
"1 try left before a pause" means one more free try, which is true. Kept.

## Not tested on device
Restart *during* a pause (the user took the phone back); covered by the restart-after-failure test
above and by unit tests. Recovery-code limit (same code path, own counter).
