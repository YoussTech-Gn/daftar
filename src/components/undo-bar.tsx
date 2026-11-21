import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ICON, Undo2 } from '@/components/icons';
import { Row, Txt } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import { useApp } from '@/state/use-app';
import { usePalette } from '@/theme';

/** Bottom bar shown for a few seconds after a change, with an Undo button. */
export function UndoBar({
  message,
  onUndo,
  onHide,
  duration = 5000,
}: {
  message: string;
  onUndo: () => void;
  onHide: () => void;
  duration?: number;
}) {
  const { t } = useApp();
  const palette = usePalette();

  useEffect(() => {
    const timer = setTimeout(onHide, duration);
    return () => clearTimeout(timer);
  }, [onHide, duration, message]);

  return (
    <View style={[styles.bar, { backgroundColor: palette.text }]}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt weight="600" style={{ color: palette.background, flexShrink: 1 }}>
          {message}
        </Txt>
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => {
            haptic.tap();
            onUndo();
            onHide();
          }}>
          <Row gap={6}>
            <Undo2 size={ICON.md} color={palette.primary} />
            <Txt weight="800" style={{ color: palette.primary }}>
              {t('undo')}
            </Txt>
          </Row>
        </Pressable>
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
