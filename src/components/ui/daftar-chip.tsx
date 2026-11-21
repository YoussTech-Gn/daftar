import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useApp } from '@/state/use-app';
import { getFontFamily, NUMERIC_TEXT_STYLE, usePressScale, useTheme } from '@/theme';

export type DaftarChipVariant = 'filter' | 'product' | 'paymentMethod';

export interface DaftarChipProps {
  label: string;
  selected: boolean;
  variant?: DaftarChipVariant;
  badge?: string;
  secondaryLabel?: string;
  onPress: () => void;
  onLongPress?: () => void;
}

/** Tactile Indigo Atelier pill chip (>= 36dp visual height, 48dp hit area via hitSlop, 70ms press). */
export function DaftarChip({
  label,
  selected,
  variant = 'filter',
  badge,
  secondaryLabel,
  onPress,
  onLongPress,
}: DaftarChipProps) {
  const { colors } = useTheme();
  const { isRTL, settings } = useApp();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale({
    scaleTo: 0.96,
    opacityTo: 0.92,
    haptic: 'selection',
  });

  let bg = colors.surface;
  let border = colors.border;
  let fg = colors.text;
  let secondaryFg = colors.textMuted;
  let badgeBg = colors.credit;
  let badgeFg = colors.onCredit;

  if (selected) {
    if (variant === 'filter') {
      bg = colors.primary;
      border = colors.primary;
      fg = colors.onPrimary;
      secondaryFg = colors.onPrimary;
    } else if (variant === 'product') {
      bg = colors.creditSoft;
      border = colors.credit;
      fg = colors.creditDeep;
      secondaryFg = colors.creditDeep;
      badgeBg = colors.credit;
      badgeFg = colors.onCredit;
    } else {
      bg = colors.paymentSoft;
      border = colors.payment;
      fg = colors.paymentDeep;
      secondaryFg = colors.paymentDeep;
    }
  }

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        hitSlop={6}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        delayLongPress={350}
        style={[
          styles.chip,
          {
            backgroundColor: bg,
            borderColor: border,
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
        ]}>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            <Text
              style={[
                styles.badgeText,
                NUMERIC_TEXT_STYLE,
                {
                  color: badgeFg,
                  fontFamily: getFontFamily(settings.language, '700'),
                },
              ]}>
              {badge}
            </Text>
          </View>
        ) : null}

        <Text
          numberOfLines={1}
          style={[
            styles.label,
            {
              color: fg,
              fontFamily: getFontFamily(settings.language, selected ? '600' : '500'),
              letterSpacing: settings.language === 'ar' ? 0 : 0.1,
            },
          ]}>
          {label}
        </Text>

        {secondaryLabel ? (
          <Text
            numberOfLines={1}
            style={[
              styles.secondaryLabel,
              NUMERIC_TEXT_STYLE,
              {
                color: secondaryFg,
                fontFamily: getFontFamily(settings.language, '500'),
              },
            ]}>
            {`\u2066${secondaryLabel}\u2069`}
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export const Chip = DaftarChip;

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
  },
  secondaryLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  badge: {
    minWidth: 22,
    height: 20,
    borderRadius: 9999,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 14,
  },
});
