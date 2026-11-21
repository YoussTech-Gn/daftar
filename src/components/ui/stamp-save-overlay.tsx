import { useEffect } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ICON_SCALE, Stamp } from '@/components/icons';
import { useApp } from '@/state/use-app';
import { EASING, useTheme } from '@/theme';
import { AmountDisplay } from './amount-display';
import { DaftarText } from './text';

/**
 * Centered Indigo Atelier confirmation stamp shown for 750ms after recording a ledger entry.
 * Plays Magnetic Stamp drop (`1.22 -> 0.98 -> 1`, 340ms), or a 160ms static fade under Reduce Motion.
 */
export function StampSaveOverlay({
  visible,
  amount,
  onFinish,
}: {
  visible: boolean;
  amount: number;
  onFinish: () => void;
}) {
  const { colors, shadows } = useTheme();
  const { t } = useApp();
  const reducedMotion = useReducedMotion();

  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    if (reducedMotion) {
      scale.value = 1;
      opacity.value = withTiming(1, { duration: 160, easing: EASING.enter });
    } else {
      opacity.value = withTiming(1, { duration: 180, easing: EASING.enter });
      scale.value = 1.22;
      scale.value = withSequence(
        withTiming(0.98, { duration: 220, easing: EASING.enter }),
        withTiming(1, { duration: 120, easing: EASING.cubicOut }),
      );
    }

    const timer = setTimeout(onFinish, 750);
    return () => clearTimeout(timer);
  }, [onFinish, opacity, reducedMotion, scale, visible]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    // Back is ignored during the 750 ms stamp; onFinish always closes it (Android requires onRequestClose).
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={() => undefined}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <Animated.View
          style={[
            styles.card,
            shadows.card,
            cardStyle,
            {
              backgroundColor: colors.surfaceRaised,
              borderColor: colors.primary,
            },
          ]}>
          <View style={[styles.seal, { backgroundColor: colors.primarySoft }]}>
            <Stamp size={ICON_SCALE.xl.size} color={colors.primary} strokeWidth={ICON_SCALE.xl.strokeWidth} />
          </View>
          <DaftarText role="heading" weight="700" tone="primary" align="center">
            {t('stampSaved')}
          </DaftarText>
          <AmountDisplay amount={amount} size="title" alwaysVisible color={colors.text} align="center" />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 20,
    borderWidth: 2,
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 12,
  },
  seal: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
