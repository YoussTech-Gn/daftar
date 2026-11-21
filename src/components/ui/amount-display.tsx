import { useEffect, useRef, useState } from 'react';
import { type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { formatAmount } from '@/domain/currency';
import { useApp } from '@/state/use-app';
import { DURATION, getFontFamily, getTextStyle, NUMERIC_TEXT_STYLE, useTheme, type FontWeightKey } from '@/theme';

export type AmountSize = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';

const ROLE_MAP = {
  display: 'displayAmount',
  title: 'title',
  heading: 'heading',
  body: 'body',
  label: 'label',
  caption: 'caption',
} as const;

const WEIGHT_MAP: Record<AmountSize, FontWeightKey> = {
  display: '700',
  title: '700',
  heading: '700',
  body: '600',
  label: '700',
  caption: '600',
};

/**
 * Formats integer amounts with narrow non-breaking spaces (`\u202F`), isolated LTR direction,
 * and tabular-nums. Auto-steps display size from 34sp to 28sp when longer than 12 characters.
 */
export function formatDisplayAmount(minor: number, currency: string, sign: '' | '+' | '−' = ''): string {
  const formatted = formatAmount(minor, currency).replace(/ /g, '\u202F');
  return `\u2066${sign}${formatted}\u2069`;
}

export function AmountDisplay({
  amount,
  currency,
  sign = '',
  size = 'body',
  color,
  animate = false,
  align,
  numberOfLines = 1,
  strikeThrough = false,
  style,
}: {
  amount: number;
  currency?: string;
  sign?: '' | '+' | '−';
  size?: AmountSize;
  color?: string;
  animate?: boolean;
  align?: TextStyle['textAlign'];
  numberOfLines?: number;
  strikeThrough?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  const { colors } = useTheme();
  const { settings } = useApp();
  const reducedMotion = useReducedMotion();
  const resolvedCurrency = currency ?? settings.currency;

  const [shownMinor, setShownMinor] = useState(amount);
  const prevAmountRef = useRef(amount);
  const animatedMinor = useSharedValue(amount);
  const pulse = useSharedValue(1);
  const fade = useSharedValue(1);

  useEffect(() => {
    const changed = prevAmountRef.current !== amount;
    prevAmountRef.current = amount;

    if (!animate) {
      animatedMinor.set(amount);
      return;
    }

    if (reducedMotion) {
      animatedMinor.set(amount);
      if (changed) {
        fade.set(0.72);
        fade.set(withTiming(1, { duration: 120, easing: Easing.out(Easing.cubic) }));
      }
      return;
    }

    animatedMinor.set(
      withTiming(amount, {
        duration: DURATION.amountRoll,
        easing: Easing.out(Easing.cubic),
      }),
    );
    if (changed) {
      pulse.set(
        withSequence(
          withTiming(1.025, { duration: 140, easing: Easing.out(Easing.cubic) }),
          withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) }),
        ),
      );
    }
  }, [amount, animate, animatedMinor, fade, pulse, reducedMotion]);

  useAnimatedReaction(
    () => Math.round(animatedMinor.value),
    (next, prev) => {
      if (animate && !reducedMotion && next !== prev) {
        scheduleOnRN(setShownMinor, next);
      }
    },
    [animate, reducedMotion],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: fade.value,
  }));

  const targetFormatted = formatDisplayAmount(amount, resolvedCurrency, sign);
  const visibleFormatted = formatDisplayAmount(animate && !reducedMotion ? shownMinor : amount, resolvedCurrency, sign);

  // Exclude isolate markers from length measurement so >12 visible chars triggers 28sp compact scale.
  const visibleCharCount = targetFormatted.replace(/[\u2066\u2069]/g, '').length;
  const compact = size === 'display' && visibleCharCount > 12;
  const weight = WEIGHT_MAP[size];
  const roleStyle = getTextStyle(ROLE_MAP[size], settings.language, { compact, weight });

  return (
    <Animated.Text
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={size === 'display'}
      minimumFontScale={0.78}
      style={[
        roleStyle,
        NUMERIC_TEXT_STYLE,
        {
          fontFamily: getFontFamily(settings.language, weight),
          color: color ?? colors.text,
          textAlign: align,
          textDecorationLine: strikeThrough ? 'line-through' : 'none',
        },
        animatedStyle,
        style,
      ]}>
      {visibleFormatted}
    </Animated.Text>
  );
}
