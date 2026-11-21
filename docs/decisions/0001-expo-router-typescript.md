# Decision 0001 — Expo SDK 58 + Expo Router + strict TypeScript

**Status:** Accepted · **Date:** 2026-11-21

**Context:** The user wants React Native scaffolded by the CLI, runnable in Expo Go, always TypeScript.

**Decision:** `npx create-expo-app@latest daftar --template default`, then `npm run reset-project`
to remove the example screens. Navigation uses Expo Router (`src/app/`) with `strict: true`.
Only modules bundled in Expo Go are used (expo-sqlite, expo-secure-store, expo-crypto,
expo-file-system, expo-sharing, expo-localization), all added with `npx expo install`.

**Consequences:** No custom native code. The app runs in Expo Go today and can be built with EAS later.
