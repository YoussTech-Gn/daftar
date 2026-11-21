import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSessionStore } from '@/state/session-store';
import { DURATION, EASING, useTheme } from '@/theme';
import { DaftarText } from './text';

/** Global floating pill toast used for "Appuyez encore pour quitter" and confirmations. */
export function ExitToast() {
  const toast = useSessionStore((s) => s.toast);
  const clearToast = useSessionStore((s) => s.clearToast);
  const { colors, isDark, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    if (!toast) return;

    opacity.value = withTiming(1, { duration: reducedMotion ? 140 : DURATION.enter, easing: EASING.enter });
    translateY.value = reducedMotion
      ? 0
      : withTiming(0, { duration: DURATION.enter, easing: EASING.enter });

    const hideTimer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: DURATION.exit, easing: EASING.exit });
    }, 1800);
    const clearTimer = setTimeout(clearToast, 2000);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(clearTimer);
    };
  }, [clearToast, opacity, reducedMotion, toast, translateY]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!toast) return null;

  const pillBg = isDark ? colors.surfaceRaised : colors.text;
  const pillFg = isDark ? colors.text : colors.bg;

  return (
    <View pointerEvents="none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 16) + 84 }]}>
      <Animated.View
        style={[
          styles.pill,
          shadows.card,
          pillStyle,
          {
            backgroundColor: pillBg,
            borderColor: isDark ? colors.borderStrong : pillBg,
          },
        ]}>
        <DaftarText role="label" align="center" style={{ color: pillFg }}>
          {toast.message}
        </DaftarText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
    zIndex: 50,
  },
  pill: {
    borderRadius: 9999,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
});
