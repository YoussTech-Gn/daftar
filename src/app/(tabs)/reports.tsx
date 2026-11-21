import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Donut } from '@/components/donut';
import { AmountDisplay, Card, DaftarText, EmptyState, ReportsSkeleton, Row } from '@/components/ui';
import { getPeriodReport, listDebtAges, type DebtAge, type PeriodReport } from '@/db/repository';
import { AGE_BUCKETS, bucketDebts, collectedRatio, monthRange } from '@/domain/report';
import { useApp } from '@/state/use-app';
import { useTheme } from '@/theme';

/** 03 · Reports: 3-KPI month row, Ring Chart, Debts by age, Top 5 debtors. */
export default function ReportsScreen() {
  const db = useSQLiteContext();
  const { t } = useApp();
  const { colors, shadows } = useTheme();
  const [report, setReport] = useState<PeriodReport | null>(null);
  const [ages, setAges] = useState<DebtAge[]>([]);
  const [now, setNow] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const current = Date.now();
      const [from, to] = monthRange(current);
      Promise.all([getPeriodReport(db, from, to), listDebtAges(db)]).then(([r, a]) => {
        setReport(r);
        setAges(a);
        setNow(current);
      });
    }, [db]),
  );

  const ratio = report ? collectedRatio(report.totalCollected, report.outstanding) : 0;
  const buckets = bucketDebts(ages, now);
  const maxBucket = Math.max(1, ...AGE_BUCKETS.map((b) => buckets[b].amount));
  const bucketColors = [colors.payment, colors.primary, colors.credit, colors.creditDeep];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <DaftarText role="title" weight="700">
          {t('tabReports')}
        </DaftarText>
      </View>

      {!report ? (
        <ReportsSkeleton />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <DaftarText role="heading" weight="700">
            {t('thisMonth')}
          </DaftarText>

          <Row gap={8} style={{ alignItems: 'stretch' }}>
            <Card style={styles.kpiCard}>
              <DaftarText role="caption" tone="muted" numberOfLines={2}>
                {t('creditGivenMonth')}
              </DaftarText>
              <AmountDisplay
                amount={report.creditGiven}
                size="label"
                color={colors.creditDeep}
                style={styles.kpiAmount}
              />
            </Card>
            <Card style={styles.kpiCard}>
              <DaftarText role="caption" tone="muted" numberOfLines={2}>
                {t('collectedMonth')}
              </DaftarText>
              <AmountDisplay
                amount={report.collected}
                size="label"
                color={colors.paymentDeep}
                style={styles.kpiAmount}
              />
            </Card>
            <Card style={styles.kpiCard}>
              <DaftarText role="caption" tone="muted" numberOfLines={2}>
                {t('forgivenMonth')}
              </DaftarText>
              <AmountDisplay
                amount={report.forgiven}
                size="label"
                color={colors.forgiven}
                style={styles.kpiAmount}
              />
            </Card>
          </Row>

          <Card style={styles.donutCard}>
            <Donut
              ratio={ratio}
              color={colors.payment}
              track={colors.surfaceSunken}
              label={`${Math.round(ratio * 100)}%`}
              sublabel={t('collectedShare')}
            />
            <Row gap={14} style={styles.legendRow}>
              <View style={styles.legendCol}>
                <Row gap={6} style={{ justifyContent: 'center' }}>
                  <View style={[styles.legendDot, { backgroundColor: colors.payment }]} />
                  <DaftarText role="caption" tone="muted" numberOfLines={1}>
                    {t('collectedAllTime')}
                  </DaftarText>
                </Row>
                <AmountDisplay amount={report.totalCollected} size="heading" color={colors.paymentDeep} align="center" />
              </View>

              <View style={[styles.legendDivider, { backgroundColor: colors.border }]} />

              <View style={styles.legendCol}>
                <Row gap={6} style={{ justifyContent: 'center' }}>
                  <View style={[styles.legendDot, { backgroundColor: colors.credit }]} />
                  <DaftarText role="caption" tone="muted" numberOfLines={1}>
                    {t('outstanding')}
                  </DaftarText>
                </Row>
                <AmountDisplay amount={report.outstanding} size="heading" color={colors.creditDeep} align="center" />
              </View>
            </Row>
          </Card>

          <DaftarText role="heading" weight="700" style={{ marginTop: 4 }}>
            {t('oldDebts')}
          </DaftarText>
          <Card style={{ gap: 14 }}>
            {AGE_BUCKETS.map((b, i) => (
              <View key={b} style={{ gap: 6 }}>
                <Row style={{ justifyContent: 'space-between' }} gap={8}>
                  <Row gap={8} style={{ flexShrink: 1 }}>
                    <DaftarText role="label" weight="600" numberOfLines={1}>
                      {t(`age_${b}`)}
                    </DaftarText>
                    <View style={[styles.bucketCountPill, { backgroundColor: colors.surfaceSunken }]}>
                      <DaftarText role="caption" tone="secondary" numeric>
                        {String(buckets[b].count)}
                      </DaftarText>
                    </View>
                  </Row>
                  <AmountDisplay amount={buckets[b].amount} size="label" color={colors.text} />
                </Row>
                <View style={[styles.track, { backgroundColor: colors.surfaceSunken }]}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${(buckets[b].amount / maxBucket) * 100}%`,
                        backgroundColor: bucketColors[i],
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </Card>

          <DaftarText role="heading" weight="700" style={{ marginTop: 4 }}>
            {t('topDebtors')}
          </DaftarText>

          {ages.length === 0 ? (
            <EmptyState variant="activity" title={t('noRecent')} />
          ) : (
            ages.slice(0, 5).map((d, i) => (
              <Pressable
                key={d.customerId}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/customer/[id]', params: { id: String(d.customerId) } })}>
                <View style={[styles.debtorRow, shadows.card, { backgroundColor: colors.surface }]}>
                  <Row gap={12}>
                    <View style={[styles.rankBadge, { backgroundColor: colors.primarySoft }]}>
                      <DaftarText role="label" tone="primary" weight="700" numeric align="center">
                        {String(i + 1)}
                      </DaftarText>
                    </View>
                    <DaftarText role="body" weight="600" numberOfLines={1} style={{ flex: 1 }}>
                      {d.name}
                    </DaftarText>
                    <AmountDisplay amount={d.balance} size="label" color={colors.creditDeep} />
                  </Row>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 4,
    gap: 14,
    paddingBottom: 32,
  },
  kpiCard: {
    flex: 1,
    padding: 12,
    gap: 6,
    justifyContent: 'space-between',
  },
  kpiAmount: {
    fontSize: 14,
    lineHeight: 19,
  },
  donutCard: {
    alignItems: 'center',
    gap: 16,
    borderRadius: 20,
    paddingVertical: 20,
  },
  legendRow: {
    width: '100%',
    alignItems: 'stretch',
  },
  legendCol: {
    flex: 1,
    gap: 4,
    alignItems: 'center',
  },
  legendDivider: {
    width: 1,
    marginVertical: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bucketCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
  debtorRow: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 58,
    justifyContent: 'center',
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
