import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CalcKey } from '@/domain/calc';
import { usePalette } from '@/theme';

const LABELS: Partial<Record<CalcKey, string>> = { back: '⌫', clear: 'C', '+': '+' };

/** Calculator keypad used instead of the system keyboard for amounts. */
export function CalcKeypad({ onKey, allowDecimal }: { onKey: (key: CalcKey) => void; allowDecimal: boolean }) {
  const palette = usePalette();
  const rows: CalcKey[][] = [
    ['7', '8', '9', 'back'],
    ['4', '5', '6', 'clear'],
    ['1', '2', '3', '+'],
    allowDecimal ? [',', '0', '000'] : ['0', '000'],
  ];

  return (
    <View style={styles.pad}>
      {rows.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((key) => {
            const isOp = key === 'back' || key === 'clear' || key === '+';
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={key}
                onPress={() => onKey(key)}
                style={({ pressed }) => [
                  styles.key,
                  {
                    backgroundColor: pressed ? palette.border : isOp ? palette.paymentSoft : palette.card,
                    borderColor: palette.border,
                  },
                ]}>
                <Text style={[styles.label, { color: isOp ? palette.primary : palette.text }]}>{LABELS[key] ?? key}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  key: {
    flex: 1,
    height: 58,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 24, fontWeight: '700' },
});
