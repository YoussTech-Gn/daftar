import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { ICON_SCALE, type LucideIcon } from '@/components/icons';
import { useApp } from '@/state/use-app';
import { getFontFamily, NUMERIC_TEXT_STYLE, usePressScale, useTheme } from '@/theme';

export type DaftarButtonVariant =
  | 'primary'
  | 'secondary'
  | 'credit'
  | 'payment'
  | 'forgiven'
  | 'danger'
  | 'dangerSoft'
  | 'whatsapp'
  | 'ghost';

export interface DaftarButtonProps {
  label: string;
  onPress: () => void;
  variant?: DaftarButtonVariant;
  icon?: LucideIcon;
  amountText?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** Tactile Indigo Atelier button (>= 48dp touch target, 70ms Weighted Magnetic press). */
export function DaftarButton({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  amountText,
  disabled,
  loading,
  style,
  accessibilityLabel,
}: DaftarButtonProps) {
  const { colors, shadows } = useTheme();
  const { isRTL, settings } = useApp();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale({
    scaleTo: 0.96,
    opacityTo: 0.92,
    haptic: 'light',
  });

  const paletteMap: Record<
    DaftarButtonVariant,
    { bg: string; fg: string; border: string; useShadow: boolean }
  > = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary, useShadow: true },
    secondary: { bg: colors.surface, fg: colors.text, border: colors.borderStrong, useShadow: true },
    credit: { bg: colors.credit, fg: colors.onCredit, border: colors.credit, useShadow: true },
    payment: { bg: colors.payment, fg: colors.onPayment, border: colors.payment, useShadow: true },
    forgiven: { bg: colors.forgivenSoft, fg: colors.forgiven, border: colors.forgiven, useShadow: false },
    danger: { bg: colors.danger, fg: colors.onDanger, border: colors.danger, useShadow: true },
    dangerSoft: { bg: colors.dangerSoft, fg: colors.danger, border: colors.danger, useShadow: false },
    whatsapp: { bg: colors.whatsapp, fg: colors.onWhatsapp, border: colors.whatsapp, useShadow: true },
    ghost: { bg: 'transparent', fg: colors.textSecondary, border: 'transparent', useShadow: false },
  };

  const tone = paletteMap[variant];
  const isBlocked = Boolean(disabled || loading);

  return (
    <Animated.View style={[animatedStyle, isBlocked && styles.disabled, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        disabled={isBlocked}
        onPress={onPress}
        onPressIn={isBlocked ? undefined : onPressIn}
        onPressOut={isBlocked ? undefined : onPressOut}
        style={[
          styles.button,
          tone.useShadow && !isBlocked ? shadows.button : undefined,
          {
            backgroundColor: tone.bg,
            borderColor: tone.border,
          },
        ]}>
        {loading ? (
          <ActivityIndicator color={tone.fg} />
        ) : amountText ? (
          <View
            style={[
              styles.splitRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}>
            <View style={[styles.labelGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {Icon ? <Icon size={ICON_SCALE.sm.size} color={tone.fg} strokeWidth={ICON_SCALE.sm.strokeWidth} /> : null}
              <Text
                numberOfLines={1}
                style={[
                  styles.labelText,
                  {
                    color: tone.fg,
                    fontFamily: getFontFamily(settings.language, '600'),
                    letterSpacing: settings.language === 'ar' ? 0 : 0.1,
                  },
                ]}>
                {label}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.amountText,
                NUMERIC_TEXT_STYLE,
                {
                  color: tone.fg,
                  fontFamily: getFontFamily(settings.language, '700'),
                },
              ]}>
              {`\u2066${amountText}\u2069`}
            </Text>
          </View>
        ) : (
          <View style={[styles.centerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {Icon ? <Icon size={ICON_SCALE.sm.size} color={tone.fg} strokeWidth={ICON_SCALE.sm.strokeWidth} /> : null}
            <Text
              numberOfLines={2}
              style={[
                styles.labelText,
                {
                  color: tone.fg,
                  fontFamily: getFontFamily(settings.language, '600'),
                  letterSpacing: settings.language === 'ar' ? 0 : 0.1,
                  textAlign: 'center',
                },
              ]}>
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export const Button = DaftarButton;

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.48,
  },
  centerRow: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  splitRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  labelGroup: {
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  labelText: {
    fontSize: 15,
    lineHeight: 20,
    flexShrink: 1,
  },
  amountText: {
    fontSize: 15,
    lineHeight: 20,
    flexShrink: 0,
  },
});
