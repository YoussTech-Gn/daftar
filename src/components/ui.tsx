import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { useApp } from '@/state/app-context';
import { usePalette } from '@/theme';

/** Text that follows the app language direction (RTL for Arabic). */
export function Txt({
  style,
  muted,
  size = 16,
  weight = '400',
  ...props
}: TextProps & { muted?: boolean; size?: number; weight?: TextStyle['fontWeight'] }) {
  const palette = usePalette();
  const { isRTL } = useApp();
  return (
    <Text
      {...props}
      style={[
        {
          color: muted ? palette.muted : palette.text,
          fontSize: size,
          fontWeight: weight,
          writingDirection: isRTL ? 'rtl' : 'ltr',
          textAlign: isRTL ? 'right' : 'left',
        },
        style,
      ]}
    />
  );
}

/** Horizontal row that flips for RTL languages. */
export function Row({ children, style, gap = 8 }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  const { isRTL } = useApp();
  return (
    <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap }, style]}>{children}</View>
  );
}

/** Wrapping row of chips that starts from the right in RTL languages. */
export function ChipRow({ children }: { children: ReactNode }) {
  const { isRTL } = useApp();
  return <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8 }}>{children}</View>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const palette = usePalette();
  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }, style]}>{children}</View>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'credit' | 'payment' | 'danger' | 'whatsapp';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = usePalette();
  const colors: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: palette.primary, fg: palette.primaryText },
    secondary: { bg: palette.card, fg: palette.text, border: palette.border },
    credit: { bg: palette.credit, fg: palette.onAccent },
    payment: { bg: palette.payment, fg: palette.onAccent },
    danger: { bg: palette.card, fg: palette.danger, border: palette.danger },
    whatsapp: { bg: palette.whatsapp, fg: '#06250F' },
  };
  const c = colors[variant];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: c.bg,
          borderColor: c.border ?? c.bg,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={c.fg} />
      ) : (
        <Text style={[styles.buttonText, { color: c.fg }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Field({ label, style, ...props }: TextInputProps & { label: string }) {
  const palette = usePalette();
  const { isRTL } = useApp();
  return (
    <View style={{ gap: 6 }}>
      <Txt size={14} muted weight="600">
        {label}
      </Txt>
      <TextInput
        placeholderTextColor={palette.muted}
        {...props}
        style={[
          styles.input,
          {
            color: palette.text,
            backgroundColor: palette.card,
            borderColor: palette.border,
            textAlign: isRTL ? 'right' : 'left',
          },
          style,
        ]}
      />
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  onLongPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const palette = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? palette.primary : palette.card,
          borderColor: selected ? palette.primary : palette.border,
        },
      ]}>
      <Text style={{ color: selected ? palette.primaryText : palette.text, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const palette = usePalette();
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: palette.paymentSoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ color: palette.primary, fontWeight: '700', fontSize: size * 0.38 }}>{initials || '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  button: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 17,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
});
