# Device test — Forgot PIN recovery code (2026-11-21, decision 0017)

**Device:** Android phone, Expo Go 58 · French · dark mode · PIN set before this feature.

| Step | Result |
|---|---|
| Lock screen shows "Code PIN oublié ?" under the keypad | ✅ |
| Tap it with no recovery code yet → honest message (data safe, reinstall + restore backup), "Retour au code PIN" | ✅ |
| Plus › Sécurité (after the user unlocked): hint "Pas encore de code de secours…" + highlighted "Nouveau code de secours" | ✅ |
| Tap it → code shown once as XXXX-XXXX-XXXX in a dashed box, explanation, "Je l'ai noté" | ✅ |
| Reopen Plus › Sécurité → hint gone, button back to secondary (code stored) | ✅ |

The code generated during the test was seen by the tester, so the user was asked to create a fresh one.

## Not tested on device
Entering the code on the lock screen and choosing a new PIN (would have changed the user's real PIN);
covered by unit tests for code parsing, and by code review of the flow. Arabic and light mode.
