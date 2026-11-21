import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ICON_SCALE, KeyRound, LockKeyhole } from '@/components/icons';
import { PinPad } from '@/components/pin-pad';
import { PinSetupFlow } from '@/components/pin-setup-flow';
import { DaftarButton, DaftarInput, DaftarText } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import { hasRecoveryCode, verifyPin, verifyRecoveryCode } from '@/security/pin';
import { useApp } from '@/state/use-app';
import { useTheme } from '@/theme';

type Mode = 'pin' | 'recover' | 'noCode' | 'newPin';

/**
 * 15 · Lock Screen: enter PIN; "Forgot PIN?" → recovery code → choose a new PIN (decision 0017).
 * The ledger is never wiped from here: without a recovery code the only way out is the backup file.
 */
export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { t, settings } = useApp();
  const { colors } = useTheme();
  const [mode, setMode] = useState<Mode>('pin');
  const [error, setError] = useState<string | null>(null);
  const [errorNonce, setErrorNonce] = useState(0);
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);

  async function openRecovery() {
    haptic.selection();
    setError(null);
    setMode((await hasRecoveryCode()) ? 'recover' : 'noCode');
  }

  async function submitCode() {
    if (checking) return;
    setChecking(true);
    const ok = await verifyRecoveryCode(code);
    setChecking(false);
    if (ok) {
      haptic.success();
      setCode('');
      setError(null);
      setMode('newPin');
      return;
    }
    haptic.warning();
    setError(t('recoveryWrong'));
  }

  if (mode === 'newPin') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <PinSetupFlow notice={t('recoveryNewPinTitle')} onDone={onUnlock} />
      </SafeAreaView>
    );
  }

  const header = (
    <View style={styles.brandHeader}>
      <View style={[styles.lockMedallion, { backgroundColor: colors.primarySoft }]}>
        {mode === 'pin' ? (
          <LockKeyhole size={ICON_SCALE.lg.size} color={colors.primary} strokeWidth={ICON_SCALE.lg.strokeWidth} />
        ) : (
          <KeyRound size={ICON_SCALE.lg.size} color={colors.primary} strokeWidth={ICON_SCALE.lg.strokeWidth} />
        )}
      </View>
      <DaftarText role="title" tone="primary" weight="700" align="center" style={{ fontSize: 24, lineHeight: 30 }}>
        {settings.shopName || t('appName')}
      </DaftarText>
    </View>
  );

  if (mode === 'pin') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        {header}
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
        <Pressable accessibilityRole="button" onPress={openRecovery} style={styles.linkBtn}>
          <DaftarText role="label" tone="primary" weight="600">
            {t('forgotPin')}
          </DaftarText>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          {header}
          {mode === 'recover' ? (
            <View style={styles.form}>
              <DaftarText role="heading" weight="700" align="center">
                {t('recoveryEnterTitle')}
              </DaftarText>
              <DaftarText role="body" tone="secondary" align="center">
                {t('recoveryEnterHint')}
              </DaftarText>
              <DaftarInput
                value={code}
                onChangeText={(v) => {
                  setCode(v);
                  if (error) setError(null);
                }}
                placeholder="XXXX-XXXX-XXXX"
                autoCapitalize="characters"
                autoCorrect={false}
                autoComplete="off"
                autoFocus
                maxLength={20}
                error={error ?? undefined}
                onSubmitEditing={submitCode}
                style={{ textAlign: 'center', letterSpacing: 2, writingDirection: 'ltr' }}
              />
              <DaftarButton
                label={t('recoveryUnlock')}
                onPress={submitCode}
                loading={checking}
                disabled={code.trim().length < 12}
              />
            </View>
          ) : (
            <View style={[styles.noCodeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <DaftarText role="body" tone="secondary" align="center">
                {t('recoveryNone')}
              </DaftarText>
            </View>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMode('pin');
              setError(null);
              setCode('');
            }}
            style={styles.linkBtn}>
            <DaftarText role="label" tone="primary" weight="600">
              {t('backToPin')}
            </DaftarText>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContainer: {
    flexGrow: 1,
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
  form: {
    width: '100%',
    maxWidth: 420,
    gap: 16,
  },
  noCodeCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  linkBtn: {
    minHeight: 48,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
