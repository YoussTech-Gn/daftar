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
  const { colors } = useTheme();
  const { settings } = useApp();

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

  const tints = [
    { bg: colors.primarySoft, fg: colors.primary },
    { bg: colors.creditSoft, fg: colors.creditDeep },
    { bg: colors.paymentSoft, fg: colors.paymentDeep },
    { bg: colors.forgivenSoft, fg: colors.forgiven },
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
