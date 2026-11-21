import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme';

/** Calm tonal shimmer block (`surfaceSunken` -> `border`); static under Reduce Motion. */
export function SkeletonBox({
  width = '100%',
  height,
  borderRadius = 12,
  style,
}: {
  width?: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 750 }), withTiming(0, { duration: 750 })),
      -1,
      false,
    );
  }, [pulse, reducedMotion]);

  const animStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(pulse.value, [0, 1], [colors.surfaceSunken, colors.border]),
  }));

  return <Animated.View style={[{ width, height, borderRadius }, animStyle, style]} />;
}

export function HomeSkeleton() {
  return (
    <View style={styles.pad}>
      <SkeletonBox height={164} borderRadius={20} />
      <View style={styles.row3}>
        <SkeletonBox height={96} borderRadius={16} style={{ flex: 1 }} />
        <SkeletonBox height={96} borderRadius={16} style={{ flex: 1 }} />
        <SkeletonBox height={96} borderRadius={16} style={{ flex: 1 }} />
      </View>
      <SkeletonBox width={140} height={20} borderRadius={8} style={{ marginTop: 6 }} />
      <SkeletonBox height={72} borderRadius={16} />
      <SkeletonBox height={72} borderRadius={16} />
      <SkeletonBox height={72} borderRadius={16} />
    </View>
  );
}

export function CustomersSkeleton() {
  return (
    <View style={styles.pad}>
      <SkeletonBox height={48} borderRadius={14} />
      <View style={styles.chipRow}>
        <SkeletonBox width={68} height={36} borderRadius={9999} />
        <SkeletonBox width={96} height={36} borderRadius={9999} />
        <SkeletonBox width={82} height={36} borderRadius={9999} />
      </View>
      <SkeletonBox height={74} borderRadius={16} />
      <SkeletonBox height={74} borderRadius={16} />
      <SkeletonBox height={74} borderRadius={16} />
      <SkeletonBox height={74} borderRadius={16} />
    </View>
  );
}

export function ReportsSkeleton() {
  return (
    <View style={styles.pad}>
      <View style={styles.row3}>
        <SkeletonBox height={80} borderRadius={16} style={{ flex: 1 }} />
        <SkeletonBox height={80} borderRadius={16} style={{ flex: 1 }} />
        <SkeletonBox height={80} borderRadius={16} style={{ flex: 1 }} />
      </View>
      <SkeletonBox height={230} borderRadius={20} />
      <SkeletonBox height={190} borderRadius={16} />
    </View>
  );
}

export function CustomerDetailSkeleton() {
  return (
    <View style={styles.pad}>
      <SkeletonBox height={180} borderRadius={20} />
      <View style={styles.row2}>
        <SkeletonBox height={48} borderRadius={14} style={{ flex: 1 }} />
        <SkeletonBox height={48} borderRadius={14} style={{ flex: 1 }} />
      </View>
      <View style={styles.row2}>
        <SkeletonBox height={48} borderRadius={14} style={{ flex: 1 }} />
        <SkeletonBox height={48} borderRadius={14} style={{ flex: 1 }} />
      </View>
      <SkeletonBox height={76} borderRadius={16} />
      <SkeletonBox height={76} borderRadius={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    padding: 16,
    gap: 14,
  },
  row3: {
    flexDirection: 'row',
    gap: 10,
  },
  row2: {
    flexDirection: 'row',
    gap: 10,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
