import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PinPad } from '@/components/pin-pad';
import { DaftarText, Row } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import { savePin } from '@/security/pin';
import { useSessionStore } from '@/state/session-store';
import { useApp } from '@/state/use-app';
import { useTheme } from '@/theme';

/** 16 · PIN Setup (Modal): 2-step indicator (Choose -> Confirm), 4 dots + error shake + 3x4 keypad. */
export default function PinSetupScreen() {
  const { t } = useApp();
  const { colors } = useTheme();
  const showToast = useSessionStore((s) => s.showToast);

  const [first, setFirst] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorNonce, setErrorNonce] = useState(0);

  const step = first === null ? 1 : 2;

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.bg }]}>
      <Row gap={8}>
        <View
          style={[
            styles.stepPill,
            { backgroundColor: step === 1 ? colors.primary : colors.primarySoft },
          ]}>
          <DaftarText
            role="caption"
            weight="700"
            style={{ color: step === 1 ? colors.onPrimary : colors.primary }}>
            {t('pinStepChoose')}
          </DaftarText>
        </View>
        <View
          style={[
            styles.stepPill,
            { backgroundColor: step === 2 ? colors.primary : colors.surfaceSunken },
          ]}>
          <DaftarText
            role="caption"
            weight="700"
            style={{ color: step === 2 ? colors.onPrimary : colors.textMuted }}>
            {t('pinStepConfirm')}
          </DaftarText>
        </View>
      </Row>

      <PinPad
        key={first === null ? 'choose' : 'confirm'}
        title={first === null ? t('newPin') : t('confirmPin')}
        error={error}
        errorNonce={errorNonce}
        onComplete={async (pin) => {
          if (first === null) {
            haptic.selection();
            setFirst(pin);
            setError(null);
            return;
          }
          if (pin !== first) {
            setFirst(null);
            setError(t('pinMismatch'));
            setErrorNonce((n) => n + 1);
            return;
          }
          await savePin(pin);
          haptic.success();
          showToast(t('pinSaved'));
          router.back();
          return true;
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
  stepPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
  },
});
