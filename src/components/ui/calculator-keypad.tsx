import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Delete, ICON_SCALE, Plus } from '@/components/icons';
import type { CalcKey } from '@/domain/calc';
import { useApp } from '@/state/use-app';
import { getFontFamily, NUMERIC_TEXT_STYLE, usePressScale, useTheme } from '@/theme';

function KeypadKey({
  calcKey,
  flex = 1,
  onPress,
}: {
  calcKey: CalcKey;
  flex?: number;
  onPress: (key: CalcKey) => void;
}) {
  const { colors, shadows } = useTheme();
  const { settings } = useApp();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale({
    scaleTo: 0.94,
    opacityTo: 0.9,
    haptic: 'light',
  });

  const isOperator = calcKey === 'back' || calcKey === 'clear' || calcKey === '+';

  return (
    <Animated.View style={[{ flex }, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={calcKey}
        onPress={() => onPress(calcKey)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          styles.key,
          shadows.button,
          {
            backgroundColor: isOperator ? colors.surfaceRaised : colors.surface,
            borderColor: colors.border,
          },
        ]}>
        {calcKey === 'back' ? (
          <Delete size={ICON_SCALE.md.size} color={colors.primary} strokeWidth={ICON_SCALE.md.strokeWidth} />
        ) : calcKey === '+' ? (
          <Plus size={ICON_SCALE.md.size} color={colors.primary} strokeWidth={2.2} />
        ) : calcKey === 'clear' ? (
          <Text
            style={[
              styles.opLabel,
              {
                color: colors.primary,
                fontFamily: getFontFamily(settings.language, '700'),
              },
            ]}>
            C
          </Text>
        ) : (
          <Text
            style={[
              styles.digitLabel,
              NUMERIC_TEXT_STYLE,
              {
                color: colors.text,
                fontFamily: getFontFamily(settings.language, '700'),
              },
            ]}>
            {calcKey}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

/**
 * Always-LTR 4-column calculator keypad inside a `surfaceSunken` well.
 * Row 1: 7 8 9 ⌫ | Row 2: 4 5 6 C | Row 3: 1 2 3 + | Row 4: [0 / ,] [000]
 */
export function CalculatorKeypad({
  onKey,
  allowDecimal,
}: {
  onKey: (key: CalcKey) => void;
  allowDecimal: boolean;
}) {
  const { colors } = useTheme();
  const standardRows: CalcKey[][] = [
    ['7', '8', '9', 'back'],
    ['4', '5', '6', 'clear'],
    ['1', '2', '3', '+'],
  ];

  return (
    <View style={[styles.well, { backgroundColor: colors.surfaceSunken, borderColor: colors.border }]}>
      {standardRows.map((row, idx) => (
        <View key={idx} style={styles.row}>
          {row.map((k) => (
            <KeypadKey key={k} calcKey={k} onPress={onKey} />
          ))}
        </View>
      ))}

      <View style={styles.row}>
        {allowDecimal ? (
          <View style={styles.splitHalf}>
            <KeypadKey calcKey="," onPress={onKey} />
            <KeypadKey calcKey="0" onPress={onKey} />
          </View>
        ) : (
          <KeypadKey calcKey="0" onPress={onKey} />
        )}
        <KeypadKey calcKey="000" onPress={onKey} />
      </View>
    </View>
  );
}

export const CalcKeypad = CalculatorKeypad;

const styles = StyleSheet.create({
  well: {
    padding: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    direction: 'ltr',
  },
  row: {
    flexDirection: 'row',
    gap: 6,
    direction: 'ltr',
  },
  splitHalf: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    direction: 'ltr',
  },
  key: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitLabel: {
    fontSize: 20,
    lineHeight: 24,
  },
  opLabel: {
    fontSize: 18,
    lineHeight: 22,
  },
});
