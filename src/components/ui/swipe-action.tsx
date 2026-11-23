import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Swipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { ICON_SCALE, RotateCcw, Trash2 } from '@/components/icons';
import { rowShortcut } from '@/domain/reading';
import { useApp } from '@/state/use-app';
import { useTheme } from '@/theme';
import { DaftarText } from './text';

/** Fixed action strip — same height as the row (flex: 1), never taller than the line. */
const ACTION_WIDTH = 88;

function ActionStrip({
  progress,
  label,
  backgroundColor,
  color,
  Icon,
  onPress,
}: {
  progress: SharedValue<number>;
  label: string;
  backgroundColor: string;
  color: string;
  Icon: typeof Trash2;
  onPress: () => void;
}) {
  const fade = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  return (
    <Animated.View style={[styles.strip, fade]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={[styles.button, { backgroundColor }]}>
        <Icon size={ICON_SCALE.sm.size} color={color} strokeWidth={ICON_SCALE.sm.strokeWidth} />
        <DaftarText role="caption" weight="700" style={{ color }} numberOfLines={1}>
          {label}
        </DaftarText>
      </Pressable>
    </Animated.View>
  );
}

/**
 * One swipe shortcut per ledger row (RNGH ReanimatedSwipeable).
 * LTR: pull from the left → delete/restore. RTL: pull from the right.
 * Children sit on an opaque surface so the action never bleeds through closed rows
 * (V4 `bg-surface` is translucent glass — that was the ghost trash icon bug).
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
  const { t, isRTL } = useApp();
  const { colors } = useTheme();
  const action = rowShortcut(cancelled);
  const label = action === 'delete' ? t('delete') : t('restore');
  const backgroundColor = action === 'delete' ? colors.danger : colors.primary;
  const color = action === 'delete' ? colors.onDanger : colors.onPrimary;
  const Icon = action === 'delete' ? Trash2 : RotateCcw;

  function renderActions(
    progress: SharedValue<number>,
    _translation: SharedValue<number>,
    methods: SwipeableMethods,
  ) {
    return (
      <ActionStrip
        progress={progress}
        label={label}
        backgroundColor={backgroundColor}
        color={color}
        Icon={Icon}
        onPress={() => {
          methods.close();
          onAction();
        }}
      />
    );
  }

  return (
    <Swipeable
      overshootLeft={false}
      overshootRight={false}
      leftThreshold={ACTION_WIDTH * 0.55}
      rightThreshold={ACTION_WIDTH * 0.55}
      friction={2}
      enableTrackpadTwoFingerGesture
      containerStyle={styles.container}
      childrenContainerStyle={{ backgroundColor: colors.surface }}
      renderLeftActions={isRTL ? undefined : renderActions}
      renderRightActions={isRTL ? renderActions : undefined}>
      <View style={{ backgroundColor: colors.surface }}>{children}</View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  strip: {
    width: ACTION_WIDTH,
    alignSelf: 'stretch',
  },
  button: {
    flex: 1,
    width: ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
});
