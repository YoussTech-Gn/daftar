import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PinPad } from '@/components/pin-pad';
import { Txt } from '@/components/ui';
import { verifyPin } from '@/security/pin';
import { useApp } from '@/state/app-context';
import { usePalette } from '@/theme';

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { t, settings } = useApp();
  const palette = usePalette();
  const [error, setError] = useState<string | null>(null);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: palette.background, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
      <Txt size={28} weight="800" style={{ textAlign: 'center', color: palette.primary }}>
        {settings.shopName || t('appName')}
      </Txt>
      <PinPad
        title={t('enterPin')}
        error={error}
        onComplete={async (pin) => {
          if (await verifyPin(pin)) {
            onUnlock();
            return true;
          }
          setError(t('wrongPin'));
        }}
      />
    </SafeAreaView>
  );
}
