import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ICON_SCALE, Undo2 } from '@/components/icons';
import { haptic } from '@/lib/haptics';
import { useApp } from '@/state/use-app';
import { DARK_COLORS, DURATION, EASING, useTheme } from '@/theme';
import { DaftarText, Row } from './text';

/**
 * Floating dark-ink 5-second Undo bar with a shrinking bottom progress indicator in Sahel Indigo.
 */
export function UndoBar5s({
  message,
  onUndo,
  onHide,
  duration = 5000,
  bottomOffset = 20,
}: {
  message: string;
  onUndo: () => void;
  onHide: () => void;
  duration?: number;
  bottomOffset?: number;
}) {
  const { colors, isDark, shadows } = useTheme();
  const { t } = useApp();
  const reducedMotion = useReducedMotion();

  const progress = useSharedValue(1);
  const translateY = useSharedValue(reducedMotion ? 0 : 14);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: reducedMotion ? 160 : DURATION.enter, easing: EASING.enter });
    translateY.value = withTiming(0, { duration: DURATION.enter, easing: EASING.enter });

    progress.value = 1;
    progress.value = withTiming(0, { duration, easing: Easing.linear });

    const timer = setTimeout(onHide, duration);
    return () => clearTimeout(timer);
  }, [duration, message, onHide, opacity, progress, reducedMotion, translateY]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const barBg = isDark ? colors.surfaceRaised : colors.text;
  const barFg = isDark ? colors.text : colors.bg;
  const actionColor = DARK_COLORS.primary;

  return (
    <Animated.View
      style={[
        styles.bar,
        shadows.card,
        containerStyle,
        {
          backgroundColor: barBg,
          borderColor: isDark ? colors.borderStrong : barBg,
          bottom: bottomOffset,
        },
      ]}>
      <Row style={styles.content} gap={12}>
        <DaftarText role="body" weight="600" style={{ color: barFg, flex: 1 }} numberOfLines={2}>
          {message}
        </DaftarText>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('undo')}
          hitSlop={10}
          onPress={() => {
            haptic.light();
            onUndo();
            onHide();
          }}
          style={styles.undoButton}>
          <Row gap={6}>
            <Undo2 size={ICON_SCALE.sm.size} color={actionColor} strokeWidth={ICON_SCALE.sm.strokeWidth} />
            <DaftarText role="label" weight="700" style={{ color: actionColor }}>
              {t('undo')}
            </DaftarText>
          </Row>
        </Pressable>
      </Row>

      <View style={[styles.track, { backgroundColor: colors.borderStrong }]}>
        <Animated.View style={[styles.fill, { backgroundColor: colors.primary }, progressStyle]} />
      </View>
    </Animated.View>
  );
}

export const UndoBar = UndoBar5s;

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'space-between',
  },
  undoButton: {
    minHeight: 36,
    justifyContent: 'center',
  },
  track: {
    height: 3,
    width: '100%',
  },
  fill: {
    height: 3,
  },
});
