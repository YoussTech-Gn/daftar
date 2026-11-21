import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ICON_SCALE, LockKeyhole } from '@/components/icons';
import { PinPad } from '@/components/pin-pad';
import { DaftarText } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import { verifyPin } from '@/security/pin';
import { useApp } from '@/state/use-app';
import { useTheme } from '@/theme';

/** 15 · Lock Screen: Lock icon, Shop name, Enter PIN, 4 dots (shake on error), 3x4 keypad. */
export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { t, settings } = useApp();
  const { colors } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [errorNonce, setErrorNonce] = useState(0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.brandHeader}>
        <View style={[styles.lockMedallion, { backgroundColor: colors.primarySoft }]}>
          <LockKeyhole size={ICON_SCALE.lg.size} color={colors.primary} strokeWidth={ICON_SCALE.lg.strokeWidth} />
        </View>
        <DaftarText role="title" tone="primary" weight="700" align="center" style={{ fontSize: 24, lineHeight: 30 }}>
          {settings.shopName || t('appName')}
        </DaftarText>
      </View>

      <PinPad
        title={t('enterPin')}
        error={error}
        errorNonce={errorNonce}
        onComplete={async (pin) => {
          if (await verifyPin(pin)) {
            haptic.success();
            onUnlock();
            return true;
          }
          setError(t('wrongPin'));
          setErrorNonce((n) => n + 1);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 24,
  },
  brandHeader: {
    alignItems: 'center',
    gap: 12,
  },
  lockMedallion: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
