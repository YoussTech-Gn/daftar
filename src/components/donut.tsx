import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { DaftarText } from '@/components/ui/text';
import { NUMERIC_TEXT_STYLE, useTheme } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Indigo Atelier ring chart showing a 0–1 ratio with smooth Reanimated arc fill and tabular percentage. */
export function Donut({
  ratio,
  size = 156,
  stroke = 16,
  color,
  track,
  label,
  sublabel,
}: {
  ratio: number;
  size?: number;
  stroke?: number;
  color: string;
  track: string;
  label: string;
  sublabel?: string;
}) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(ratio, 0), 1);
  const targetOffset = c * (1 - clamped);

  const dashOffset = useSharedValue(reducedMotion ? targetOffset : c);

  useEffect(() => {
    if (reducedMotion) {
      dashOffset.value = targetOffset;
      return;
    }
    dashOffset.value = withTiming(targetOffset, {
      duration: 460,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  }, [dashOffset, reducedMotion, targetOffset]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        {clamped > 0 ? (
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            animatedProps={animatedProps}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      <DaftarText
        role="title"
        weight="700"
        numeric
        align="center"
        style={[NUMERIC_TEXT_STYLE, { color: colors.text }]}>
        {`\u2066${label}\u2069`}
      </DaftarText>
      {sublabel ? (
        <DaftarText role="caption" tone="muted" align="center">
          {sublabel}
        </DaftarText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
