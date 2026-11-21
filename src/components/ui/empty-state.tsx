import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/theme';
import { DaftarButton } from './daftar-button';
import { DaftarText } from './text';

export type EmptyVariant = 'customers' | 'activity' | 'trash' | 'products';

/** Custom lightweight Sahel Indigo & Burnished Copper ledger emblem (used in Onboarding & About). */
export function DaftarEmblem({ size = 56 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <Rect x={8} y={6} width={38} height={44} rx={8} fill={colors.primarySoft} stroke={colors.primary} strokeWidth={2.2} />
      <Line x1={16} y1={6} x2={16} y2={50} stroke={colors.primary} strokeWidth={2} />
      <Path d="M35 6V20L39 17L43 20V6" fill={colors.credit} />
      <Line x1={22} y1={24} x2={38} y2={24} stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
      <Line x1={22} y1={31} x2={34} y2={31} stroke={colors.borderStrong} strokeWidth={2} strokeLinecap="round" />
      <Line x1={22} y1={38} x2={31} y2={38} stroke={colors.credit} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function EmptyIllustration({ variant }: { variant: EmptyVariant }) {
  const { colors } = useTheme();

  if (variant === 'customers') {
    return (
      <Svg width={112} height={96} viewBox="0 0 112 96" fill="none">
        <Rect x={20} y={14} width={72} height={68} rx={12} fill={colors.primarySoft} stroke={colors.primary} strokeWidth={2} />
        <Line x1={34} y1={14} x2={34} y2={82} stroke={colors.primary} strokeWidth={1.8} />
        <Circle cx={60} cy={38} r={9} stroke={colors.primary} strokeWidth={2} fill={colors.surface} />
        <Path d="M46 62C46 54.8 52.3 50 60 50C67.7 50 74 54.8 74 62" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
        <Circle cx={84} cy={22} r={10} fill={colors.creditSoft} stroke={colors.credit} strokeWidth={1.8} />
        <Line x1={84} y1={17} x2={84} y2={27} stroke={colors.credit} strokeWidth={2} strokeLinecap="round" />
        <Line x1={79} y1={22} x2={89} y2={22} stroke={colors.credit} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    );
  }

  if (variant === 'activity') {
    return (
      <Svg width={112} height={96} viewBox="0 0 112 96" fill="none">
        <Rect x={18} y={18} width={76} height={60} rx={12} fill={colors.surface} stroke={colors.primary} strokeWidth={2} />
        <Rect x={28} y={30} width={22} height={14} rx={5} fill={colors.creditSoft} stroke={colors.credit} strokeWidth={1.6} />
        <Line x1={58} y1={35} x2={82} y2={35} stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
        <Line x1={58} y1={42} x2={74} y2={42} stroke={colors.borderStrong} strokeWidth={2} strokeLinecap="round" />
        <Line x1={28} y1={56} x2={82} y2={56} stroke={colors.border} strokeWidth={1.5} strokeDasharray="4 4" />
        <Line x1={28} y1={66} x2={64} y2={66} stroke={colors.borderStrong} strokeWidth={2} strokeLinecap="round" />
        <Circle cx={80} cy={66} r={5} fill={colors.primarySoft} stroke={colors.primary} strokeWidth={1.8} />
      </Svg>
    );
  }

  if (variant === 'trash') {
    return (
      <Svg width={112} height={96} viewBox="0 0 112 96" fill="none">
        <Path d="M36 28H76" stroke={colors.primary} strokeWidth={2.2} strokeLinecap="round" />
        <Path d="M46 28V22C46 20.3 47.3 19 49 19H63C64.7 19 66 20.3 66 22V28" stroke={colors.primary} strokeWidth={2} />
        <Path d="M38 28L42 74C42.2 76.2 44 78 46.2 78H65.8C68 78 69.8 76.2 70 74L74 28" fill={colors.primarySoft} stroke={colors.primary} strokeWidth={2} />
        <Line x1={50} y1={40} x2={51} y2={66} stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" />
        <Line x1={62} y1={40} x2={61} y2={66} stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" />
        <Circle cx={82} cy={68} r={9} fill={colors.creditSoft} stroke={colors.credit} strokeWidth={1.8} />
        <Path d="M78 68L81 71L86 65" stroke={colors.credit} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  return (
    <Svg width={112} height={96} viewBox="0 0 112 96" fill="none">
      <Path d="M26 30L56 16L86 30V66L56 80L26 66V30Z" fill={colors.primarySoft} stroke={colors.primary} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M26 30L56 44L86 30" stroke={colors.primary} strokeWidth={2} strokeLinejoin="round" />
      <Line x1={56} y1={44} x2={56} y2={80} stroke={colors.primary} strokeWidth={2} />
      <Path d="M41 23L71 37" stroke={colors.credit} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

/** Calm Indigo Atelier empty state with custom line-art illustration and optional action CTA. */
export function EmptyState({
  variant,
  title,
  hint,
  actionLabel,
  onAction,
}: {
  variant: EmptyVariant;
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.container}>
      <EmptyIllustration variant={variant} />
      <View style={styles.copy}>
        <DaftarText role="heading" weight="700" align="center">
          {title}
        </DaftarText>
        {hint ? (
          <DaftarText role="body" tone="muted" align="center">
            {hint}
          </DaftarText>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <DaftarButton label={actionLabel} onPress={onAction} variant="primary" style={styles.cta} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    gap: 14,
  },
  copy: {
    gap: 6,
    alignItems: 'center',
  },
  cta: {
    minWidth: 180,
    marginTop: 4,
  },
});
