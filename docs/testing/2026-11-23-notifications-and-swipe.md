# Device / agent test — notifications + swipe (2026-11-23)

**Runner:** Cloud agent VM · **SDK:** Expo 58 · **expo-notifications:** 58.1.9  
**Branch:** `cursor/daily-local-notifications-d4d5`

## What was tested here

| Check | Result |
|---|---|
| Unit: daily summary copy + stale debt count | ✅ `src/domain/__tests__/notifications.test.ts` |
| Unit: schedule / cancel / test call shape (channelId on trigger, DAILY + TIME_INTERVAL) | ✅ `src/lib/__tests__/notifications.test.ts` |
| Lint + `tsc --noEmit` after swipe + notifications fixes | ✅ |
| OS notification tray on a real phone | ❌ Not available in this VM (no Android emulator / adb device) |
| Expo web “test notification” | ⚠️ Expected `unsupported` — `expo-notifications` is Android/iOS only |

## Why you did not see a notification on Accueil

Local notifications are **not** an in-app banner on Accueil. They appear in the **phone notification tray** after:

1. **More › Reminders** → enable “Notify me every day” → allow OS permission  
2. Wait until the chosen hour, **or** tap **Send a test notification** (fires in ~2 s)

If Reminders was never turned on, nothing is scheduled. Push/remote notifications are intentionally off.

## Swipe “Supprimer” bug (from your screenshots)

**Cause:** V4 `bg-surface` is translucent glass (`rgba(..., 0.78)`). RNGH `ReanimatedSwipeable` paints the delete strip under every row with `absoluteFill`, so the trash icon showed through closed rows (ghost icons) and the strip looked oversized.

**Fix:** Opaque row fill (`colors.surface` / `bg-surface-solid`), fixed 88 dp action strip with `flex: 1` height, fade with swipe progress, RTL uses right-side actions. Still `react-native-gesture-handler/ReanimatedSwipeable`.

## What you should verify on the phone (Expo Go)

1. Pull this branch / reload.  
2. Accueil → swipe one activity row: only **that** row shows a proportional **Supprimer**; no ghost trash on neighbours.  
3. More › Reminders → enable → allow → **Send a test notification** → leave the app or pull down the tray → Daftar summary appears in ~2 s.  
4. Tap it → Customers tab.
