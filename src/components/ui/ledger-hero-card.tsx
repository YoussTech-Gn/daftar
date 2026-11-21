import { StyleSheet, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { ArrowDownLeft, ArrowUpRight, ICON_SCALE } from '@/components/icons';
import { useApp } from '@/state/use-app';
import { useTheme } from '@/theme';
import { AmountDisplay } from './amount-display';
import { DaftarText, Row } from './text';

/**
 * Primary Home ledger hero card:
 * Strategic Off-White surface + Indigo Ambient shadow + 4dp Sahel Indigo accent bar on start edge +
 * dashed 1dp SVG ledger line + 2-column today summary.
 */
export function LedgerHeroCard({
  totalOwed,
  customersInDebt,
  creditToday,
  paymentsToday,
}: {
  totalOwed: number;
  customersInDebt: number;
  creditToday: number;
  paymentsToday: number;
}) {
  const { colors, shadows } = useTheme();
  const { t, isRTL } = useApp();

  return (
    <View
      style={[
        styles.card,
        shadows.card,
        {
          backgroundColor: colors.surface,
          paddingStart: 20,
          paddingEnd: 16,
        },
      ]}>
      {/* 4dp vertical Sahel Indigo accent bar anchored to start */}
      <View
        style={[
          styles.accentBar,
          { backgroundColor: colors.primary },
          isRTL ? { right: 0 } : { left: 0 },
        ]}
      />

      <Row style={styles.headerRow}>
        <DaftarText role="label" tone="secondary" style={{ flexShrink: 1 }}>
          {t('totalOwed')}
        </DaftarText>
        <View style={[styles.countPill, { backgroundColor: colors.primarySoft }]}>
          <DaftarText role="caption" tone="primary" weight="600" numberOfLines={1}>
            {customersInDebt === 1 ? t('customersInDebtOne') : t('customersInDebt', { count: customersInDebt })}
          </DaftarText>
        </View>
      </Row>

      <View style={styles.heroAmountWrap}>
        <AmountDisplay amount={totalOwed} size="display" animate color={colors.text} />
      </View>

      {/* Dashed 1dp SVG divider (works identically on Android & iOS) */}
      <View style={styles.dashedWrap}>
        <Svg height={2} width="100%">
          <Line
            x1="0"
            y1="1"
            x2="100%"
            y2="1"
            stroke={colors.border}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        </Svg>
      </View>

      <View style={[styles.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={styles.summaryCol}>
          <Row gap={6}>
            <View style={[styles.dotBadge, { backgroundColor: colors.creditSoft }]}>
              <ArrowUpRight
                size={ICON_SCALE.xs.size}
                color={colors.creditDeep}
                strokeWidth={ICON_SCALE.xs.strokeWidth}
              />
            </View>
            <DaftarText role="caption" tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
              {t('today')} · {t('givenToday')}
            </DaftarText>
          </Row>
          <AmountDisplay amount={creditToday} size="heading" animate color={colors.creditDeep} />
        </View>

        <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />

        <View style={styles.summaryCol}>
          <Row gap={6}>
            <View style={[styles.dotBadge, { backgroundColor: colors.paymentSoft }]}>
              <ArrowDownLeft
                size={ICON_SCALE.xs.size}
                color={colors.paymentDeep}
                strokeWidth={ICON_SCALE.xs.strokeWidth}
              />
            </View>
            <DaftarText role="caption" tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
              {t('today')} · {t('receivedToday')}
            </DaftarText>
          </Row>
          <AmountDisplay amount={paymentsToday} size="heading" animate color={colors.paymentDeep} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    paddingVertical: 18,
    gap: 12,
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    top: 16,
    bottom: 16,
    width: 4,
    borderRadius: 4,
  },
  headerRow: {
    justifyContent: 'space-between',
    gap: 8,
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    flexShrink: 0,
  },
  heroAmountWrap: {
    paddingVertical: 2,
  },
  dashedWrap: {
    width: '100%',
    height: 2,
    justifyContent: 'center',
  },
  summaryRow: {
    alignItems: 'stretch',
    gap: 12,
    paddingTop: 2,
  },
  summaryCol: {
    flex: 1,
    gap: 6,
  },
  verticalDivider: {
    width: 1,
    marginVertical: 2,
  },
  dotBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
