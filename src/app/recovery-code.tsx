import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecoveryCodeCard } from '@/components/recovery-code-card';
import { createRecoveryCode } from '@/security/pin';
import { useSessionStore } from '@/state/session-store';
import { useApp } from '@/state/use-app';
import { useTheme } from '@/theme';

/** More › Security › New recovery code: for PINs created before decision 0017, or a lost paper. */
export default function RecoveryCodeScreen() {
  const { t } = useApp();
  const { colors } = useTheme();
  const showToast = useSessionStore((s) => s.showToast);
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    createRecoveryCode()
      .then(setCode)
      .catch(() => {
        showToast(t('error'));
        router.back();
      });
  }, [showToast, t]);

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.bg }]}>
      {code === null ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <RecoveryCodeCard code={code} onConfirm={() => router.back()} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
