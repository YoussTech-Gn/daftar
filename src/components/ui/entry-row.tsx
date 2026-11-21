import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  Ban,
  HeartHandshake,
  ICON_SCALE,
  ShoppingBag,
  type LucideIcon,
} from '@/components/icons';
import { itemLabel } from '@/domain/calc';
import type { EntryItem, EntryKind, CreditType, PaymentMethod } from '@/domain/types';
import { useApp } from '@/state/use-app';
import { DURATION, EASING, usePressScale, useTheme } from '@/theme';
import { AmountDisplay } from './amount-display';
import { DaftarText, Row } from './text';

export interface EntryRowProps {
  title: string;
  kind: EntryKind;
  creditType?: CreditType | null;
  method?: PaymentMethod;
  amount: number;
  timestampLabel: string;
  note?: string | null;
  items?: EntryItem[];
  cancelled?: boolean;
  /** Shows explicit method badge (on payments) or grace label (on forgiven) */
  badgeLabel?: string;
  /** Optional one-shot motion highlight after saving an entry */
  highlightMode?: 'credit' | 'payment' | 'forgiven' | null;
  onPress?: () => void;
  onLongPress?: () => void;
}

/**
 * Ledger EntryRow supporting all 5 semantic states:
 * Credit (Money), Credit (Goods with itemized lines), Payment, Forgiven, and Cancelled (animated strikethrough).
 */
export function EntryRow({
  title,
  kind,
  creditType,
  amount,
  timestampLabel,
  note,
  items,
  cancelled = false,
  badgeLabel,
  highlightMode = null,
  onPress,
  onLongPress,
}: EntryRowProps) {
  const { colors, shadows } = useTheme();
  const { t, isRTL } = useApp();
  const reducedMotion = useReducedMotion();
  const { animatedStyle: pressStyle, onPressIn, onPressOut } = usePressScale({
    scaleTo: 0.985,
    opacityTo: 0.94,
  });

  // Animated strikethrough transition when entry becomes cancelled
  const wasCancelledRef = useRef(cancelled);
  const strikeProgress = useSharedValue(cancelled ? 1 : 0);
  const rowOpacity = useSharedValue(cancelled ? 0.8 : 1);

  useEffect(() => {
    const changed = wasCancelledRef.current !== cancelled;
    wasCancelledRef.current = cancelled;

    if (reducedMotion || !changed) {
      strikeProgress.value = cancelled ? 1 : 0;
      rowOpacity.value = cancelled ? 0.8 : 1;
      return;
    }

    strikeProgress.value = withTiming(cancelled ? 1 : 0, {
      duration: DURATION.cancelStrike,
      easing: EASING.quadOut,
    });
    rowOpacity.value = withTiming(cancelled ? 0.8 : 1, {
      duration: DURATION.cancelStrike,
      easing: EASING.quadOut,
    });
  }, [cancelled, reducedMotion, rowOpacity, strikeProgress]);

  // Directional entry highlight animation (Money Out / Money In / Forgive Grace)
  const translateY = useSharedValue(0);
  const washProgress = useSharedValue(0);

  useEffect(() => {
    if (!highlightMode) return;
    if (reducedMotion) {
      washProgress.value = 1;
      washProgress.value = withTiming(0, { duration: 160, easing: EASING.cubicOut });
      return;
    }

    if (highlightMode === 'credit') {
      translateY.value = withSequence(
        withTiming(-6, { duration: 160, easing: EASING.enter }),
        withTiming(0, { duration: 220, easing: EASING.enter }),
      );
      washProgress.value = 1;
      washProgress.value = withTiming(0, { duration: DURATION.moneyFlow, easing: EASING.enter });
    } else if (highlightMode === 'payment') {
      translateY.value = -8;
      translateY.value = withTiming(0, { duration: DURATION.moneyFlow, easing: EASING.enter });
      washProgress.value = 1;
      washProgress.value = withTiming(0, { duration: DURATION.moneyFlow, easing: EASING.enter });
    } else if (highlightMode === 'forgiven') {
      translateY.value = 4;
      translateY.value = withTiming(0, { duration: DURATION.forgive, easing: EASING.cubicOut });
      washProgress.value = 1;
      washProgress.value = withTiming(0, { duration: DURATION.forgive, easing: EASING.cubicOut });
    }
  }, [highlightMode, reducedMotion, translateY, washProgress]);

  const washTarget =
    highlightMode === 'credit'
      ? colors.creditSoft
      : highlightMode === 'payment'
        ? colors.paymentSoft
        : highlightMode === 'forgiven'
          ? colors.forgivenSoft
          : colors.surface;

  const baseBg = cancelled ? colors.cancelledSoft : colors.surface;

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: rowOpacity.value,
    backgroundColor: interpolateColor(washProgress.value, [0, 1], [baseBg, washTarget]),
  }));

  const strikeStyle = useAnimatedStyle(() => ({
    width: `${strikeProgress.value * 100}%`,
  }));

  let Icon: LucideIcon = ArrowUpRight;
  let iconBg = colors.creditSoft;
  let iconColor = colors.creditDeep;
  let amountColor = colors.creditDeep;
  let sign: '' | '+' | '−' = '+';

  if (cancelled) {
    Icon = Ban;
    iconBg = colors.border;
    iconColor = colors.cancelled;
    amountColor = colors.cancelled;
    sign = '';
  } else if (kind === 'forgiven') {
    Icon = HeartHandshake;
    iconBg = colors.forgivenSoft;
    iconColor = colors.forgiven;
    amountColor = colors.forgiven;
    sign = '−';
  } else if (kind === 'payment') {
    Icon = ArrowDownLeft;
    iconBg = colors.paymentSoft;
    iconColor = colors.paymentDeep;
    amountColor = colors.paymentDeep;
    sign = '−';
  } else if (creditType === 'opening') {
    Icon = BookOpen;
    iconBg = colors.surfaceSunken;
    iconColor = colors.textSecondary;
    amountColor = colors.creditDeep;
    sign = '+';
  } else if (creditType === 'goods') {
    Icon = ShoppingBag;
    iconBg = colors.creditSoft;
    iconColor = colors.creditDeep;
    amountColor = colors.creditDeep;
    sign = '+';
  }

  const effectiveBadge = cancelled
    ? t('cancelled')
    : badgeLabel ?? (kind === 'forgiven' ? t('forgivenGrace') : undefined);

  const badgeColors = cancelled
    ? { bg: colors.border, fg: colors.cancelled }
    : kind === 'forgiven'
      ? { bg: colors.forgivenSoft, fg: colors.forgiven }
      : kind === 'payment'
        ? { bg: colors.paymentSoft, fg: colors.paymentDeep }
        : { bg: colors.creditSoft, fg: colors.creditDeep };

  const interactive = Boolean(onPress || onLongPress);

  return (
    <Animated.View style={pressStyle}>
      <Pressable
        disabled={!interactive}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={interactive ? onPressIn : undefined}
        onPressOut={interactive ? onPressOut : undefined}
        delayLongPress={400}>
        <Animated.View style={[styles.card, shadows.card, containerAnimatedStyle]}>
          <Row gap={12} style={{ alignItems: 'flex-start' }}>
            <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
              <Icon size={ICON_SCALE.sm.size} color={iconColor} strokeWidth={ICON_SCALE.sm.strokeWidth} />
            </View>

            <View style={styles.contentCol}>
              <View style={[styles.titleWrap, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
                <DaftarText
                  role="body"
                  weight="600"
                  tone={cancelled ? 'cancelled' : 'default'}
                  numberOfLines={2}>
                  {title}
                </DaftarText>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.strikeLine,
                    { backgroundColor: colors.cancelled },
                    isRTL ? { right: 0 } : { left: 0 },
                    strikeStyle,
                  ]}
                />
              </View>

              {effectiveBadge ? (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: badgeColors.bg,
                      alignSelf: isRTL ? 'flex-end' : 'flex-start',
                    },
                  ]}>
                  <DaftarText
                    role="caption"
                    weight="600"
                    style={{ color: badgeColors.fg }}
                    numberOfLines={2}>
                    {effectiveBadge}
                  </DaftarText>
                </View>
              ) : null}

              {items && items.length > 0 ? (
                <View style={styles.itemsList}>
                  {items.map((line, idx) => (
                    <Row key={`${line.name}-${idx}`} style={styles.itemLine} gap={8}>
                      <DaftarText
                        role="caption"
                        tone={cancelled ? 'cancelled' : 'secondary'}
                        numberOfLines={1}
                        style={{ flex: 1 }}>
                        {itemLabel({
                          name: line.name,
                          price: line.unitPrice,
                          qty: line.qty,
                          unit: line.unit,
                        })}
                      </DaftarText>
                      <AmountDisplay
                        amount={line.total}
                        size="caption"
                        color={cancelled ? colors.cancelled : colors.textSecondary}
                      />
                    </Row>
                  ))}
                </View>
              ) : null}

              {note ? (
                <DaftarText role="caption" tone={cancelled ? 'cancelled' : 'secondary'} numberOfLines={2}>
                  {note}
                </DaftarText>
              ) : null}

              <DaftarText role="caption" tone="muted" numberOfLines={1}>
                {timestampLabel}
              </DaftarText>
            </View>

            <View style={[styles.amountCol, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}>
              <View style={styles.amountWrap}>
                <AmountDisplay amount={amount} sign={sign} size="label" color={amountColor} />
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.strikeLine,
                    { backgroundColor: colors.cancelled, left: 0 },
                    strikeStyle,
                  ]}
                />
              </View>
            </View>
          </Row>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  contentCol: {
    flex: 1,
    gap: 4,
  },
  titleWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  itemsList: {
    gap: 2,
    paddingTop: 2,
  },
  itemLine: {
    justifyContent: 'space-between',
  },
  amountCol: {
    flexShrink: 0,
    paddingTop: 2,
  },
  amountWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  strikeLine: {
    position: 'absolute',
    top: '50%',
    height: 1.5,
    borderRadius: 1,
  },
});
