import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';

import { migrate } from '@/db/migrations';
import { LockScreen } from '@/screens/lock-screen';
import { OnboardingScreen } from '@/screens/onboarding-screen';
import { hasPin } from '@/security/pin';
import { AppProvider, useApp } from '@/state/app-context';
import { usePalette } from '@/theme';

/** Lock again if the app stayed in background longer than this. */
const RELOCK_AFTER_MS = 30_000;

function Gate() {
  const { ready, settings, t } = useApp();
  const palette = usePalette();
  const [locked, setLocked] = useState<boolean | null>(null);
  const backgroundAt = useRef<number | null>(null);

  useEffect(() => {
    hasPin().then(setLocked);
    const sub = AppState.addEventListener('change', async (state) => {
      if (state === 'background') backgroundAt.current = Date.now();
      if (state === 'active' && backgroundAt.current !== null) {
        const away = Date.now() - backgroundAt.current;
        backgroundAt.current = null;
        if (away > RELOCK_AFTER_MS && (await hasPin())) setLocked(true);
      }
    });
    return () => sub.remove();
  }, []);

  if (!ready || locked === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background }}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }
  if (!settings.onboarded) return <OnboardingScreen />;
  if (locked) return <LockScreen onUnlock={() => setLocked(false)} />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.background },
        headerTintColor: palette.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: palette.background },
      }}>
      <Stack.Screen name="index" options={{ title: settings.shopName || t('appName') }} />
      <Stack.Screen name="customer/[id]" options={{ title: '' }} />
      <Stack.Screen name="customer/form" options={{ presentation: 'modal', title: t('addCustomer') }} />
      <Stack.Screen name="entry/new" options={{ presentation: 'modal', title: '' }} />
      <Stack.Screen name="settings" options={{ title: t('settings') }} />
      <Stack.Screen name="pin-setup" options={{ presentation: 'modal', title: t('security') }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="daftar.db" onInit={migrate}>
      <AppProvider>
        <StatusBar style="auto" />
        <Gate />
      </AppProvider>
    </SQLiteProvider>
  );
}
