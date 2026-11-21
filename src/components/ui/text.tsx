import type { ReactNode } from 'react';
import { Text, View, type StyleProp, type TextProps, type TextStyle, type ViewStyle } from 'react-native';

import { useApp } from '@/state/use-app';
import {
  getFontFamily,
  getTextStyle,
  NUMERIC_TEXT_STYLE,
  useTheme,
  type FontWeightKey,
  type TypographyRole,
} from '@/theme';

export type TextTone =
  | 'default'
  | 'secondary'
  | 'muted'
  | 'primary'
  | 'onPrimary'
  | 'credit'
  | 'creditDeep'
  | 'payment'
  | 'paymentDeep'
  | 'forgiven'
  | 'danger'
  | 'cancelled';

export interface DaftarTextProps extends Omit<TextProps, 'role'> {
  role?: TypographyRole;
  tone?: TextTone;
  muted?: boolean;
  size?: number;
  weight?: FontWeightKey;
  align?: TextStyle['textAlign'];
  numeric?: boolean;
}

/** Language-aware typography text component using Manrope (Latin) and Readex Pro (Arabic). */
export function DaftarText({
  style,
  role = 'body',
  tone,
  muted,
  size,
  weight,
  align,
  numeric,
  ...props
}: DaftarTextProps) {
  const { colors } = useTheme();
  const { isRTL, settings } = useApp();

  const resolvedTone: TextTone = tone ?? (muted ? 'muted' : 'default');
  const toneColorMap: Record<TextTone, string> = {
    default: colors.text,
    secondary: colors.textSecondary,
    muted: colors.textMuted,
    primary: colors.primary,
    onPrimary: colors.onPrimary,
    credit: colors.credit,
    creditDeep: colors.creditDeep,
    payment: colors.payment,
    paymentDeep: colors.paymentDeep,
    forgiven: colors.forgiven,
    danger: colors.danger,
    cancelled: colors.cancelled,
  };

  const baseRoleStyle = getTextStyle(role, settings.language, weight ? { weight } : undefined);
  const customSizeStyle: TextStyle | undefined = size
    ? {
        fontSize: size,
        lineHeight: Math.round(size * 1.32),
        fontFamily: weight ? getFontFamily(settings.language, weight) : baseRoleStyle.fontFamily,
      }
    : undefined;

  return (
    <Text
      {...props}
      style={[
        baseRoleStyle,
        customSizeStyle,
        {
          color: toneColorMap[resolvedTone],
          writingDirection: numeric ? 'ltr' : isRTL ? 'rtl' : 'ltr',
          textAlign: align ?? (isRTL ? 'right' : 'left'),
        },
        numeric ? NUMERIC_TEXT_STYLE : undefined,
        style,
      ]}
    />
  );
}

/** Alias kept ergonomic across screens. */
export const Txt = DaftarText;

/** Horizontal row that automatically mirrors in RTL languages. */
export function Row({
  children,
  style,
  gap = 8,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  gap?: number;
}) {
  const { isRTL } = useApp();
  return (
    <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap }, style]}>
      {children}
    </View>
  );
}

/** Wrapping row of chips that starts from the leading edge (right in RTL, left in LTR). */
export function ChipRow({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { isRTL } = useApp();
  return (
    <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8 }, style]}>
      {children}
    </View>
  );
}

/** Strategic Off-White surface card with Indigo Ambient quiet shadow and 1dp hairline border. */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors, shadows } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 16,
        },
        shadows.card,
        style,
      ]}>
      {children}
    </View>
  );
}

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Deterministic initials avatar with soft semantic Indigo Atelier surface tint (zero remote images). */
export function Avatar({ name, size = 42 }: { name: string; size?: number }) {
  const { isDark } = useTheme();
  const { settings } = useApp();

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  // Neutral identity tints only: credit / payment / forgiven colours carry meaning (money state),
  // so an avatar must never borrow them (a customer who paid would otherwise look "in debt").
  const tints = isDark
    ? [
        { bg: '#1B2B42', fg: '#9CC0EA' },
        { bg: '#2A2F3A', fg: '#C9CFDA' },
        { bg: '#1E3236', fg: '#9ED0D6' },
        { bg: '#2E2A38', fg: '#C8BEDD' },
      ]
    : [
        { bg: '#E6EDF5', fg: '#1E3A5F' },
        { bg: '#E8E4DC', fg: '#3B4250' },
        { bg: '#E1EEF0', fg: '#1F5560' },
        { bg: '#ECE8F2', fg: '#4A3F66' },
      ];
  const palette = tints[hashName(name.trim() || '?') % tints.length];
  const radius = Math.round((size / 42) * 13);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: palette.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text
        style={{
          color: palette.fg,
          fontFamily: getFontFamily(settings.language, '700'),
          fontSize: Math.round(size * 0.37),
          letterSpacing: 0,
        }}>
        {initials || '?'}
      </Text>
    </View>
  );
}
