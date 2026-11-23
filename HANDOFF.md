# Handoff — device test (local notifications + swipe)

**Date:** 2026-11-23 (Atlantic/Reykjavik)  
**Branch:** `cursor/daily-local-notifications-d4d5`  
**PR:** https://github.com/YoussTech-Gn/daftar/pull/2

## Running now

- Expo Metro + ngrok tunnel is up on port `8081`
- Connect in Expo Go:

```text
exp://mv4ysoc-anonymous-8081.exp.direct
```

- Or open: https://mv4ysoc-anonymous-8081.exp.direct

> Tunnel URLs are temporary. If this one dies, re-run:
> `npx expo start --tunnel ngrok --port 8081`
> (needs `@expo/ngrok` available; Expo account login is not required for the ngrok path).

## Connection status (at handoff time)

- Server and tunnel were ready
- Phone had **not** connected yet (zero tunnel hits)
- Once Expo Go opens the URL, watch the Expo terminal for an Android/iOS bundle

## Already verified on this branch

- Daily local notifications (`expo-notifications`) + More → Reminders settings
- Swipe-delete ghost-icon fix (`ReanimatedSwipeable` + opaque row background)
- Unit tests, lint, and typecheck passed earlier

## What to check on the phone

1. Home feed — swipe a row: trash/restore action should be proportional, no ghost icons behind closed rows
2. More → Reminders — enable daily reminder, pick hour, send test notification
3. Grant notification permission when prompted; confirm the test notification appears

## Ignore for phone testing

Web-only noise already seen in logs (not from a physical device):

- `Invalid style property of "direction". Did you mean "writingDirection"?`
- `[expo-notifications] Listening to push token changes is not yet fully supported on web`

## Notes from this session

- No source file changes during the live Expo start; only the Expo process + a local ngrok helper for the tunnel
- Default Expo `--tunnel` failed without Expo login; `npx expo start --tunnel ngrok` worked after installing `@expo/ngrok` outside the repo and symlinking into `node_modules/@expo/ngrok`

## Related docs

- `docs/decisions/0020-local-notifications.md`
- `docs/testing/2026-11-23-notifications-and-swipe.md`
- `AGENTS.md` — expo-notifications notes
