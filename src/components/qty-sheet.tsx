import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button, Chip, ChipRow, Row, Txt } from '@/components/ui';
import { formatQty } from '@/domain/calc';
import type { ProductUnit } from '@/domain/types';
import { useApp } from '@/state/use-app';
import { usePalette } from '@/theme';

const PRESETS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 5];

/** Bottom sheet to choose a quantity (¼, ½, 1, 2… or a custom value). */
export function QtySheet({
  visible,
  name,
  unit,
  current,
  onPick,
  onRemove,
  onClose,
}: {
  visible: boolean;
  name: string;
  unit: ProductUnit;
  current: number;
  onPick: (qty: number) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const { t, isRTL } = useApp();
  const palette = usePalette();
  // The sheet is mounted fresh for each product, so this starts empty every time.
  const [custom, setCustom] = useState('');

  const customQty = Number(custom.replace(',', '.'));
  const customValid = custom !== '' && Number.isFinite(customQty) && customQty > 0 && customQty <= 1000;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('cancel')} />
      <View style={[styles.sheet, { backgroundColor: palette.background, borderColor: palette.border }]}>
        <Txt size={18} weight="800">
          {t('howMuch', { name })} ({t(`unit_${unit}`)})
        </Txt>
        <ChipRow>
          {PRESETS.map((q) => (
            <Chip key={q} label={formatQty(q)} selected={current === q} onPress={() => onPick(q)} />
          ))}
        </ChipRow>
        <Row gap={10}>
          <TextInput
            value={custom}
            onChangeText={setCustom}
            keyboardType="decimal-pad"
            placeholder={t('otherQty')}
            placeholderTextColor={palette.muted}
            style={[
              styles.input,
              {
                color: palette.text,
                backgroundColor: palette.card,
                borderColor: palette.border,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
          />
          <Button label={t('add')} onPress={() => onPick(customQty)} disabled={!customValid} style={{ flex: 1 }} />
        </Row>
        {current > 0 ? <Button label={t('remove')} variant="danger" onPress={onRemove} /> : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    padding: 20,
    paddingBottom: 32,
    gap: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 2, minHeight: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 17 },
});
