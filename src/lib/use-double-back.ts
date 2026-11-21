import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { BackHandler, Platform, ToastAndroid } from 'react-native';

/** Android: on the focused screen, first Back shows a hint; a second Back within 2 s exits. */
export function useDoubleBackToExit(message: string): void {
  const lastPress = useRef(0);
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        const now = Date.now();
        if (now - lastPress.current < 2000) return false;
        lastPress.current = now;
        ToastAndroid.show(message, ToastAndroid.SHORT);
        return true;
      });
      return () => sub.remove();
    }, [message]),
  );
}
