import { type ReactNode } from 'react';
import { Pressable } from 'react-native';
import Swipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

import { ICON_SCALE, RotateCcw, Trash2 } from '@/components/icons';
import { rowShortcut } from '@/domain/reading';
import { useApp } from '@/state/use-app';
import { useTheme } from '@/theme';
import { DaftarText } from './text';

/**
 * Pull the row from the left edge and one action appears.
 * Live rows show Delete. Cancelled rows show Restore. Never both.
 */
export function SwipeActionRow({
  cancelled,
  onAction,
  children,
}: {
  cancelled: boolean;
  onAction: () => void;
  children: ReactNode;
}) {
  const { t } = useApp();
  const { colors } = useTheme();
  const action = rowShortcut(cancelled);
  const label = action === 'delete' ? t('delete') : t('restore');
  const backgroundColor = action === 'delete' ? colors.danger : colors.primary;
  const color = action === 'delete' ? colors.onDanger : colors.onPrimary;
  const Icon = action === 'delete' ? Trash2 : RotateCcw;

  return (
    <Swipeable
      overshootLeft={false}
      overshootRight={false}
      leftThreshold={56}
      friction={2}
      renderLeftActions={(_progress, _translation, methods: SwipeableMethods) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={() => {
            methods.close();
            onAction();
          }}
          style={{
            width: 104,
            minHeight: 64,
            backgroundColor,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}>
          <Icon size={ICON_SCALE.sm.size} color={color} strokeWidth={ICON_SCALE.sm.strokeWidth} />
          <DaftarText role="caption" weight="700" style={{ color }} numberOfLines={1}>
            {label}
          </DaftarText>
        </Pressable>
      )}>
      {children}
    </Swipeable>
  );
}
