import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PinSetupFlow } from '@/components/pin-setup-flow';
import { useSessionStore } from '@/state/session-store';
import { useApp } from '@/state/use-app';
import { useTheme } from '@/theme';

/** 16 · PIN Setup (Modal): Choose → Confirm → recovery code shown once (decision 0017). */
export default function PinSetupScreen() {
  const { t } = useApp();
  const { colors } = useTheme();
  const showToast = useSessionStore((s) => s.showToast);

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: colors.bg }]}>
      <PinSetupFlow
        onDone={() => {
          showToast(t('pinSaved'));
          router.back();
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
  },
});
