import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Delete, ICON_SCALE } from '@/components/icons';
import { DaftarText } from '@/components/ui/text';
import { haptic } from '@/lib/haptics';
import { useApp } from '@/state/use-app';
import { getFontFamily, NUMERIC_TEXT_STYLE, usePressScale, useTheme } from '@/theme';

const BACK = 'back';
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', BACK];
export const PIN_LENGTH = 4;

function PinKey({
  value,
  onPress,
}: {
  value: string;
  onPress: (key: string) => void;
}) {
  const { colors, shadows } = useTheme();
  const { settings } = useApp();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale({
    scaleTo: 0.94,
    opacityTo: 0.9,
    haptic: 'light',
  });

  if (!value) {
    return <View style={styles.emptyKey} />;
  }

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={value === BACK ? 'delete' : value}
        onPress={() => onPress(value)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          styles.key,
          shadows.button,
          {
            backgroundColor: value === BACK ? colors.surfaceRaised : colors.surface,
            borderColor: colors.border,
          },
        ]}>
        {value === BACK ? (
          <Delete size={ICON_SCALE.lg.size} color={colors.primary} strokeWidth={ICON_SCALE.lg.strokeWidth} />
        ) : (
          <Text
            style={[
              styles.keyLabel,
              NUMERIC_TEXT_STYLE,
              {
                color: colors.text,
                fontFamily: getFontFamily(settings.language, '600'),
              },
            ]}>
            {value}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

/**
 * Always-LTR 3x4 PIN pad with 4 status dots and 320ms horizontal shake + warning haptic on mismatch/error.
 */
export function PinPad({
  title,
  error,
  errorNonce = 0,
  onComplete,
}: {
  title: string;
  error?: string | null;
  errorNonce?: number;
  onComplete: (pin: string) => Promise<boolean | void> | boolean | void;
}) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const [pin, setPin] = useState('');
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (!error || errorNonce <= 0) return;
    haptic.warning();
    if (reducedMotion) return;

    shakeX.value = withSequence(
      withTiming(-6, { duration: 55 }),
      withTiming(6, { duration: 55 }),
      withTiming(-4, { duration: 55 }),
      withTiming(4, { duration: 55 }),
      withTiming(0, { duration: 100 }),
    );
  }, [error, errorNonce, reducedMotion, shakeX]);

  const dotsStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  async function press(key: string) {
    if (key === BACK) {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (!key || pin.length >= PIN_LENGTH) return;
    const next = pin + key;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      const keep = await onComplete(next);
      if (keep !== true) setPin('');
    }
  }

  const showErrorDots = Boolean(error && pin.length === 0);

  return (
    <View style={styles.container}>
      <DaftarText role="title" weight="700" align="center">
        {title}
      </DaftarText>

      <Animated.View style={[styles.dots, dotsStyle]}>
        {Array.from({ length: PIN_LENGTH }, (_, i) => {
          const filled = i < pin.length;
          const borderColor = showErrorDots ? colors.danger : colors.primary;
          const backgroundColor = showErrorDots
            ? colors.dangerSoft
            : filled
              ? colors.primary
              : 'transparent';
          return <View key={i} style={[styles.dot, { borderColor, backgroundColor }]} />;
        })}
      </Animated.View>

      <View style={styles.errorSlot}>
        {error ? (
          <DaftarText role="caption" tone="danger" weight="600" align="center">
            {error}
          </DaftarText>
        ) : null}
      </View>

      <View style={styles.grid}>
        {KEYS.map((key, i) => (
          <PinKey key={`${key}-${i}`} value={key} onPress={press} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 14,
    width: '100%',
  },
  dots: {
    flexDirection: 'row',
    direction: 'ltr',
    gap: 18,
    marginTop: 6,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  errorSlot: {
    minHeight: 22,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    direction: 'ltr',
    width: 282,
    gap: 12,
    justifyContent: 'center',
  },
  emptyKey: {
    width: 82,
    height: 60,
  },
  key: {
    width: 82,
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyLabel: {
    fontSize: 24,
    lineHeight: 28,
  },
});
