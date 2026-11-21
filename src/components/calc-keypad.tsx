import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Delete, Eraser, ICON, Plus, type LucideIcon } from '@/components/icons';
import type { CalcKey } from '@/domain/calc';
import { usePalette } from '@/theme';

/** Operator keys are drawn with Lucide icons; digits stay as text. */
const KEY_ICONS: Partial<Record<CalcKey, LucideIcon>> = { back: Delete, clear: Eraser, '+': Plus };

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
            const KeyIcon = KEY_ICONS[key];
            const isOp = KeyIcon !== undefined;
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
                {KeyIcon ? (
                  <KeyIcon size={ICON.lg} color={palette.primary} strokeWidth={2.25} />
                ) : (
                  <Text style={[styles.label, { color: palette.text }]}>{key}</Text>
                )}
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
