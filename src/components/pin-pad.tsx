import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Delete, ICON } from '@/components/icons';
import { Txt } from '@/components/ui';
import { usePalette } from '@/theme';

const BACK = 'back';
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', BACK];
export const PIN_LENGTH = 4;

/** Numeric keypad that calls onComplete once PIN_LENGTH digits are entered. */
export function PinPad({
  title,
  error,
  onComplete,
}: {
  title: string;
  error?: string | null;
  onComplete: (pin: string) => Promise<boolean | void> | boolean | void;
}) {
  const palette = usePalette();
  const [pin, setPin] = useState('');

  async function press(key: string) {
    if (key === BACK) {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (!key || pin.length >= PIN_LENGTH) return;
    const next = pin + key;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      const keep = await onComplete(next);
      if (keep !== true) setPin('');
    }
  }

  return (
    <View style={styles.container}>
      <Txt size={20} weight="700" style={{ textAlign: 'center' }}>
        {title}
      </Txt>
      <View style={styles.dots}>
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { borderColor: palette.primary, backgroundColor: i < pin.length ? palette.primary : 'transparent' },
            ]}
          />
        ))}
      </View>
      <Txt size={14} style={{ color: palette.danger, textAlign: 'center', minHeight: 20 }}>
        {error ?? ''}
      </Txt>
      <View style={styles.grid}>
        {KEYS.map((key, i) => (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityLabel={key === BACK ? 'delete' : key}
            disabled={!key}
            onPress={() => press(key)}
            style={({ pressed }) => [
              styles.key,
              { backgroundColor: key ? (pressed ? palette.border : palette.card) : 'transparent' },
            ]}>
            {key === BACK ? (
              <Delete size={ICON.lg} color={palette.text} />
            ) : (
              <Text style={{ fontSize: 26, fontWeight: '600', color: palette.text }}>{key}</Text>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 16, width: '100%' },
  dots: { flexDirection: 'row', gap: 16, marginTop: 8 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 288, gap: 12, justifyContent: 'center' },
  key: { width: 84, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
