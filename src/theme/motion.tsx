import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { haptic } from '@/lib/haptics';
import { TOKENS } from './tokens';

export const DURATION = {
  ...TOKENS.motion.duration,
  moneyFlow: 380,
  cancelStrike: 260,
  staggerItem: 220,
  staggerStep: 30,
  pinShake: 320,
} as const;

export const EASING = {
  enter: Easing.bezier(0.16, 1, 0.3, 1),
  exit: Easing.bezier(0.4, 0, 1, 1),
  tap: Easing.bezier(0.2, 0, 0, 1),
  cubicOut: Easing.out(Easing.cubic),
  quadOut: Easing.out(Easing.quad),
} as const;

export const SPRING = TOKENS.motion.spring;

export type PressHaptic = 'light' | 'selection' | 'medium';

/** Weighted Magnetic tactile press hook with global Reduce Motion fallback. */
export function usePressScale(options?: {
  scaleTo?: number;
  opacityTo?: number;
  haptic?: PressHaptic;
}) {
  const scaleTo = options?.scaleTo ?? 0.96;
  const opacityTo = options?.opacityTo ?? 0.92;
  const hapticKind = options?.haptic;
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const onPressIn = () => {
    if (hapticKind === 'light') haptic.light();
    else if (hapticKind === 'selection') haptic.selection();
    else if (hapticKind === 'medium') haptic.medium();

    if (reducedMotion) {
      opacity.set(withTiming(0.85, { duration: DURATION.tap, easing: EASING.tap }));
      return;
    }
    scale.set(withTiming(scaleTo, { duration: DURATION.tap, easing: EASING.tap }));
    opacity.set(withTiming(opacityTo, { duration: DURATION.tap, easing: EASING.tap }));
  };

  const onPressOut = () => {
    if (reducedMotion) {
      opacity.set(withTiming(1, { duration: DURATION.exit, easing: EASING.cubicOut }));
      return;
    }
    scale.set(withTiming(1, { duration: DURATION.exit, easing: EASING.cubicOut }));
    opacity.set(withTiming(1, { duration: DURATION.exit, easing: EASING.cubicOut }));
  };

  return { animatedStyle, onPressIn, onPressOut };
}

/**
 * First-mount list stagger (items 0..7, 30ms step, 220ms enter).
 * Never replays on pull-to-refresh or subsequent data updates, and renders immediately under Reduce Motion.
 */
export function StaggerItem({
  index,
  enabled = true,
  children,
  style,
}: {
  index: number;
  enabled?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const reducedMotion = useReducedMotion();
  const shouldStagger = enabled && !reducedMotion && index < 8;
  const didAnimateRef = useRef(!shouldStagger);
  const translateY = useSharedValue(shouldStagger ? 10 : 0);
  const opacity = useSharedValue(shouldStagger ? 0 : 1);

  useEffect(() => {
    if (didAnimateRef.current || !shouldStagger) {
      translateY.value = 0;
      opacity.value = 1;
      return;
    }
    didAnimateRef.current = true;
    const delayMs = index * DURATION.staggerStep;
    translateY.value = withDelay(
      delayMs,
      withTiming(0, { duration: DURATION.staggerItem, easing: EASING.enter }),
    );
    opacity.value = withDelay(
      delayMs,
      withTiming(1, { duration: DURATION.staggerItem, easing: EASING.enter }),
    );
  }, [index, opacity, shouldStagger, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}
