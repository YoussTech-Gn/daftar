import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  ReadexPro_400Regular,
  ReadexPro_500Medium,
  ReadexPro_600SemiBold,
  ReadexPro_700Bold,
} from '@expo-google-fonts/readex-pro';
import { JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ExitToast } from '@/components/ui';
import { migrate } from '@/db/migrations';
import { purgeExpiredTrash } from '@/db/repository';
import { LockScreen } from '@/screens/lock-screen';
import { OnboardingScreen } from '@/screens/onboarding-screen';
import { hasPin } from '@/security/pin';
import { AppProvider, useApp } from '@/state/use-app';
import { getFontFamily, ThemeProvider, useTheme } from '@/theme';

// Tailwind (NativeWind) styles — imported after Expo's own modules so the native runtime is ready first.
import '../global.css';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** Opening any screen directly (deep link, notification) keeps Home underneath, so Back never exits. */
export const unstable_settings = { anchor: '(tabs)' };

/** Migrate, then permanently remove customers that stayed in the trash over 30 days (decision 0013). */
async function initDatabase(db: SQLiteDatabase): Promise<void> {
  await migrate(db);
  await purgeExpiredTrash(db);
}

/** Lock again if the app stayed in background longer than this. */
const RELOCK_AFTER_MS = 30_000;

function Gate({ fontsReady }: { fontsReady: boolean }) {
  const { ready, settings, t } = useApp();
  const { colors, isDark } = useTheme();
  const [locked, setLocked] = useState<boolean | null>(null);
  const backgroundAt = useRef<number | null>(null);

  useEffect(() => {
    // Web's SecureStore stub throws. Treat that as "no PIN" so the shell can open.
    // On a phone, a store failure must not skip the lock.
    hasPin()
      .then(setLocked)
      .catch(() => {
        if (Platform.OS === 'web') setLocked(false);
      });
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

  const appReady = fontsReady && ready && locked !== null;

  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [appReady]);

  if (!appReady) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {!settings.onboarded ? (
        <OnboardingScreen />
      ) : locked ? (
        <LockScreen onUnlock={() => setLocked(false)} />
      ) : (
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            headerTitleStyle: {
              fontFamily: getFontFamily(settings.language, '700'),
              fontSize: 17,
              color: colors.text,
            },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="customer/[id]" options={{ title: '' }} />
          <Stack.Screen name="customer/form" options={{ presentation: 'modal', title: t('addCustomer') }} />
          <Stack.Screen name="entry/new" options={{ presentation: 'modal', title: '' }} />
          <Stack.Screen name="pick-customer" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="products" options={{ title: t('products') }} />
          <Stack.Screen name="trash" options={{ title: t('trash') }} />
          <Stack.Screen name="activity" options={{ title: t('activity') }} />
          <Stack.Screen name="pin-setup" options={{ presentation: 'modal', title: t('security') }} />
          <Stack.Screen name="recovery-code" options={{ presentation: 'modal', title: t('security') }} />
        </Stack>
      )}
      <ExitToast />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ReadexPro_400Regular,
    ReadexPro_500Medium,
    ReadexPro_600SemiBold,
    ReadexPro_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    JetBrainsMono_700Bold,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider databaseName="daftar.db" onInit={initDatabase}>
        <AppProvider>
          <ThemeProvider>
            <Gate fontsReady={fontsLoaded || Boolean(fontError)} />
          </ThemeProvider>
        </AppProvider>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
