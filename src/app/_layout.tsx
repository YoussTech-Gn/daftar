import { Stack } from 'expo-router';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, View } from 'react-native';

import { migrate } from '@/db/migrations';
import { purgeExpiredTrash } from '@/db/repository';
import { LockScreen } from '@/screens/lock-screen';
import { OnboardingScreen } from '@/screens/onboarding-screen';
import { hasPin } from '@/security/pin';
import { AppProvider, useApp } from '@/state/use-app';
import { usePalette } from '@/theme';

/** Opening any screen directly (deep link, notification) keeps Home underneath, so Back never exits. */
export const unstable_settings = { initialRouteName: '(tabs)' };

/** Migrate, then permanently remove customers that stayed in the trash over 30 days (decision 0013). */
async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await migrate(db);
  await purgeExpiredTrash(db);
}

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
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="customer/[id]" options={{ title: '' }} />
      <Stack.Screen name="customer/form" options={{ presentation: 'modal', title: t('addCustomer') }} />
      <Stack.Screen name="entry/new" options={{ presentation: 'modal', title: '' }} />
      <Stack.Screen name="pick-customer" options={{ presentation: 'modal', title: t('pickCustomer') }} />
      <Stack.Screen name="products" options={{ title: t('products') }} />
      <Stack.Screen name="trash" options={{ title: t('trash') }} />
      <Stack.Screen name="activity" options={{ title: t('activity') }} />
      <Stack.Screen name="pin-setup" options={{ presentation: 'modal', title: t('security') }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="daftar.db" onInit={initDatabase}>
      <AppProvider>
        <StatusBar style="auto" />
        <Gate />
      </AppProvider>
    </SQLiteProvider>
  );
}
