import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { GestureDetector, GestureHandlerRootView, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { formatQty } from '@/domain/calc';
import type { ProductUnit } from '@/domain/types';
import { haptic } from '@/lib/haptics';
import { useApp } from '@/state/use-app';
import { DURATION, EASING, NUMERIC_TEXT_STYLE, SPRING, usePressScale, useTheme } from '@/theme';
import { DaftarButton } from './daftar-button';
import { DaftarInput } from './daftar-input';
import { DaftarText, Row } from './text';

const ROW_ONE = [0.25, 0.5, 0.75, 1];
const ROW_TWO = [1.5, 2, 3, 5];

function FractionKey({
  qty,
  selected,
  onPress,
}: {
  qty: number;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, shadows } = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale({
    scaleTo: 0.95,
    opacityTo: 0.9,
    haptic: 'selection',
  });

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          styles.fractionKey,
          selected ? undefined : shadows.button,
          {
            backgroundColor: selected ? colors.creditSoft : colors.surface,
            borderColor: selected ? colors.credit : colors.borderStrong,
          },
        ]}>
        <DaftarText
          role="heading"
          weight="700"
          numeric
          align="center"
          style={[NUMERIC_TEXT_STYLE, { color: selected ? colors.creditDeep : colors.text }]}>
          {formatQty(qty)}
        </DaftarText>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Draggable bottom sheet to choose a quantity (4x2 fraction grid ¼ ½ ¾ 1 / 1½ 2 3 5,
 * custom numeric input, and Remove button).
 */
export function QuantityBottomSheet({
  visible,
  name,
  unit,
  current,
  onPick,
  onRemove,
  onClose,
}: {
  visible: boolean;
  name: string;
  unit: ProductUnit;
  current: number;
  onPick: (qty: number) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useApp();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [custom, setCustom] = useState('');

  const translateY = useSharedValue(380);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    if (reducedMotion) {
      translateY.set(0);
      backdropOpacity.set(withTiming(1, { duration: 160, easing: EASING.enter }));
      return;
    }
    translateY.set(380);
    backdropOpacity.set(withTiming(1, { duration: DURATION.enter, easing: EASING.enter }));
    translateY.set(withSpring(0, SPRING.sheet));
  }, [backdropOpacity, reducedMotion, translateY, visible]);

  const dismiss = useCallback(() => {
    if (reducedMotion) {
      backdropOpacity.set(
        withTiming(0, { duration: 110, easing: EASING.exit }, (finished) => {
          if (finished) scheduleOnRN(onClose);
        }),
      );
      return;
    }
    backdropOpacity.set(withTiming(0, { duration: DURATION.exit, easing: EASING.exit }));
    translateY.set(
      withTiming(400, { duration: DURATION.exit, easing: EASING.exit }, (finished) => {
        if (finished) scheduleOnRN(onClose);
      }),
    );
  }, [backdropOpacity, onClose, reducedMotion, translateY]);

  const pan = usePanGesture({
    onUpdate: (event) => {
      if (event.translationY > 0) {
        translateY.set(event.translationY);
      }
    },
    onDeactivate: (event) => {
      if (event.translationY > 80 || event.velocityY > 600) {
        if (reducedMotion) {
          scheduleOnRN(onClose);
          return;
        }
        backdropOpacity.set(withTiming(0, { duration: DURATION.exit, easing: EASING.exit }));
        translateY.set(
          withTiming(420, { duration: DURATION.exit, easing: EASING.exit }, (finished) => {
            if (finished) scheduleOnRN(onClose);
          }),
        );
      } else {
        translateY.set(withSpring(0, SPRING.sheet));
      }
    },
  });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const customQty = Number(custom.replace(',', '.'));
  const customValid = custom !== '' && Number.isFinite(customQty) && customQty > 0 && customQty <= 1000;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss} statusBarTranslucent>
      <GestureHandlerRootView style={styles.root}>
        <KeyboardAvoidingView
          style={styles.root}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View style={[styles.backdrop, { backgroundColor: colors.overlay }, backdropStyle]}>
            <Pressable style={styles.backdropTap} onPress={dismiss} accessibilityLabel={t('cancel')} />
          </Animated.View>

          <GestureDetector gesture={pan}>
            <Animated.View
              style={[
                styles.sheet,
                sheetStyle,
                {
                  backgroundColor: colors.surfaceRaised,
                  borderColor: colors.border,
                  paddingBottom: Math.max(insets.bottom, 20) + 12,
                },
              ]}>
              <View style={[styles.handle, { backgroundColor: colors.borderStrong }]} />

              <DaftarText role="heading" weight="700">
                {`${t('howMuch', { name })} (${t(`unit_${unit}`)})`}
              </DaftarText>

              <View style={styles.grid}>
                <View style={styles.gridRow}>
                  {ROW_ONE.map((q) => (
                    <FractionKey
                      key={q}
                      qty={q}
                      selected={current === q}
                      onPress={() => {
                        haptic.selection();
                        onPick(q);
                      }}
                    />
                  ))}
                </View>
                <View style={styles.gridRow}>
                  {ROW_TWO.map((q) => (
                    <FractionKey
                      key={q}
                      qty={q}
                      selected={current === q}
                      onPress={() => {
                        haptic.selection();
                        onPick(q);
                      }}
                    />
                  ))}
                </View>
              </View>

              <Row gap={10} style={{ alignItems: 'flex-end' }}>
                <View style={{ flex: 2 }}>
                  <DaftarInput
                    value={custom}
                    onChangeText={setCustom}
                    keyboardType="decimal-pad"
                    placeholder={t('otherQty')}
                  />
                </View>
                <DaftarButton
                  label={t('add')}
                  onPress={() => onPick(customQty)}
                  disabled={!customValid}
                  style={{ flex: 1 }}
                />
              </Row>

              {current > 0 ? (
                <DaftarButton label={t('remove')} variant="dangerSoft" onPress={onRemove} />
              ) : null}
            </Animated.View>
          </GestureDetector>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

export const QtySheet = QuantityBottomSheet;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  backdropTap: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 16,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 9999,
    alignSelf: 'center',
    marginBottom: 4,
  },
  grid: {
    gap: 8,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
    direction: 'ltr',
  },
  fractionKey: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
