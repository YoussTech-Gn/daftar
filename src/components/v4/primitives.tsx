import type { ReactNode } from 'react';
import { Modal, Pressable, Text, View, type TextProps, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Delete, ICON_SCALE } from '@/components/icons';
import { haptic } from '@/lib/haptics';
import { useApp } from '@/state/use-app';
import { getFontFamily, NUMERIC_TEXT_STYLE, useTheme, type FontWeightKey } from '@/theme';

/**
 * V4 "Équilibre Visuel" primitives (decision 0018). Styling is Tailwind (NativeWind) classes only;
 * colours resolve through the CSS variables set by ThemeProvider.
 */

/** Text with the right font face for the language and weight (Android needs one face per weight). */
export function Txt({
  className,
  weight = '500',
  numeric = false,
  style,
  ...props
}: TextProps & { className?: string; weight?: FontWeightKey; numeric?: boolean }) {
  const { settings } = useApp();
  // Default colour only when the caller gave none: two text-* colours would fight over class order.
  const hasColor = /(^|\s)text-(ink|credit|payment|plum|danger|accent|fab-|surface)/.test(className ?? '');
  return (
    <Text
      {...props}
      className={`${hasColor ? '' : 'text-ink '}${className ?? ''}`}
      style={[{ fontFamily: getFontFamily(settings.language, weight) }, numeric && NUMERIC_TEXT_STYLE, style]}
    />
  );
}

/** Frosted / smoked glass panel with a 1px specular top edge. */
export function Glass({ className, children, ...props }: ViewProps & { className?: string; children?: ReactNode }) {
  return (
    <View {...props} className={`overflow-hidden rounded-card border border-line bg-surface ${className ?? ''}`}>
      <View pointerEvents="none" className="absolute left-4 right-4 top-0 h-px bg-specular" />
      {children}
    </View>
  );
}

/** Small pill label. */
export function Pill({ label, className, textClassName }: { label: string; className?: string; textClassName?: string }) {
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${className ?? 'bg-surface-muted'}`}>
      <Txt weight="600" className={`text-xs ${textClassName ?? 'text-ink-2'}`} numberOfLines={1}>
        {label}
      </Txt>
    </View>
  );
}

/** Segmented control: equal segments, the active one raised on a solid surface. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; activeClassName?: string }[];
  onChange: (v: T) => void;
}) {
  const { isRTL } = useApp();
  return (
    <View className={`rounded-2xl border border-line bg-surface-muted p-1 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) haptic.selection();
              onChange(o.value);
            }}
            className={`min-h-[44px] flex-1 items-center justify-center rounded-xl px-2 ${active ? 'bg-surface-solid' : ''}`}>
            <Txt
              weight={active ? '700' : '500'}
              numberOfLines={1}
              className={`text-sm ${active ? (o.activeClassName ?? 'text-ink') : 'text-ink-2'}`}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Bottom sheet on a dimmed backdrop. Android Back closes it. */
export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable accessibilityLabel="close" className="absolute inset-0 bg-black/40" onPress={onClose} />
        <View
          className="rounded-t-[28px] border border-line bg-surface-solid px-4 pt-2"
          style={{ paddingBottom: Math.max(insets.bottom, 12) + 8 }}>
          <View className="mb-2 h-1 w-10 self-center rounded-full bg-surface-muted" />
          {title ? (
            <Txt weight="700" className="mb-3 text-lg">
              {title}
            </Txt>
          ) : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}

/** Primary CTA, 54dp. */
export function PrimaryButton({
  label,
  onPress,
  disabled,
  className,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={() => {
        haptic.medium();
        onPress();
      }}
      className={`min-h-[54px] items-center justify-center rounded-2xl px-4 ${disabled ? 'bg-surface-muted' : 'bg-fab-bg'} ${className ?? ''}`}>
      <Txt weight="700" className={`text-base ${disabled ? 'text-ink-3' : 'text-fab-fg'}`}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** Tactile numpad: 1–9, 000, 0, ⌫. */
export function Numpad({ onKey }: { onKey: (key: string) => void }) {
  const { colors } = useTheme();
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['000', '0', 'back'],
  ];
  return (
    <View className="gap-2">
      {rows.map((row) => (
        <View key={row.join()} className="flex-row gap-2">
          {row.map((k) => (
            <Pressable
              key={k}
              accessibilityRole="button"
              accessibilityLabel={k === 'back' ? 'delete' : k}
              onPress={() => {
                haptic.light();
                onKey(k);
              }}
              className="h-[54px] flex-1 items-center justify-center rounded-2xl border border-line bg-surface active:bg-surface-muted">
              {k === 'back' ? (
                <Delete size={ICON_SCALE.md.size} color={colors.text} strokeWidth={ICON_SCALE.md.strokeWidth} />
              ) : (
                <Txt weight="600" numeric className="text-xl">
                  {k}
                </Txt>
              )}
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}
