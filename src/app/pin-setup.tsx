import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { PinPad } from '@/components/pin-pad';
import { savePin } from '@/security/pin';
import { useApp } from '@/state/use-app';

/** Two-step PIN creation: choose, then confirm. */
export default function PinSetupScreen() {
  const { t } = useApp();
  const [first, setFirst] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <PinPad
        key={first === null ? 'choose' : 'confirm'}
        title={first === null ? t('newPin') : t('confirmPin')}
        error={error}
        onComplete={async (pin) => {
          if (first === null) {
            setFirst(pin);
            setError(null);
            return;
          }
          if (pin !== first) {
            setFirst(null);
            setError(t('pinMismatch'));
            return;
          }
          await savePin(pin);
          Alert.alert(t('pinSaved'));
          router.back();
          return true;
        }}
      />
    </View>
  );
}
