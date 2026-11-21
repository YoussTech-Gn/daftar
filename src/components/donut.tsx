import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Txt } from '@/components/ui';

/** Ring showing a 0–1 ratio, with a label in the middle. */
export function Donut({
  ratio,
  size = 150,
  stroke = 18,
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
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(ratio, 0), 1);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * clamped} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Txt size={26} weight="800" style={{ textAlign: 'center' }}>
        {label}
      </Txt>
      {sublabel ? (
        <Txt size={12} muted style={{ textAlign: 'center' }}>
          {sublabel}
        </Txt>
      ) : null}
    </View>
  );
}
