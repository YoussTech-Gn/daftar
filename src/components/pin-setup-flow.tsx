import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PinPad } from '@/components/pin-pad';
import { RecoveryCodeCard } from '@/components/recovery-code-card';
import { DaftarText, Row } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import { createRecoveryCode, savePin } from '@/security/pin';
import { useApp } from '@/state/use-app';
import { useTheme } from '@/theme';

/**
 * Choose PIN → confirm PIN → show the recovery code once (decision 0017).
 * Used by the PIN setup screen and by the lock screen after a successful recovery.
 */
export function PinSetupFlow({ onDone, notice }: { onDone: () => void; notice?: string }) {
  const { t } = useApp();
  const { colors } = useTheme();

  const [first, setFirst] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorNonce, setErrorNonce] = useState(0);
  const [code, setCode] = useState<string | null>(null);

  if (code !== null) {
    return <RecoveryCodeCard code={code} onConfirm={onDone} />;
  }

  const step = first === null ? 1 : 2;

  return (
    <View style={styles.wrap}>
      {notice ? (
        <View style={[styles.notice, { backgroundColor: colors.paymentSoft }]}>
          <DaftarText role="label" tone="paymentDeep" weight="600" align="center">
            {notice}
          </DaftarText>
        </View>
      ) : null}

      <Row gap={8}>
        <View style={[styles.stepPill, { backgroundColor: step === 1 ? colors.primary : colors.primarySoft }]}>
          <DaftarText role="caption" weight="700" style={{ color: step === 1 ? colors.onPrimary : colors.primary }}>
            {t('pinStepChoose')}
          </DaftarText>
        </View>
        <View style={[styles.stepPill, { backgroundColor: step === 2 ? colors.primary : colors.surfaceSunken }]}>
          <DaftarText role="caption" weight="700" style={{ color: step === 2 ? colors.onPrimary : colors.textMuted }}>
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
          // A new PIN always comes with a new recovery code; the previous code stops working.
          setCode(await createRecoveryCode());
          haptic.success();
          return true;
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 24,
    width: '100%',
  },
  notice: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'stretch',
  },
  stepPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
  },
});
