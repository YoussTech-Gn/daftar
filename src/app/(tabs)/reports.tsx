import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Donut } from '@/components/donut';
import { Card, Row, Txt } from '@/components/ui';
import { getPeriodReport, listDebtAges, type DebtAge, type PeriodReport } from '@/db/repository';
import { AGE_BUCKETS, bucketDebts, collectedRatio, monthRange } from '@/domain/report';
import { useApp } from '@/state/use-app';
import { usePalette } from '@/theme';

/** Reports tab (analysis 0002): this month, collected vs still owed, top debtors, debts by age. */
export default function ReportsScreen() {
  const db = useSQLiteContext();
  const { t, money } = useApp();
  const palette = usePalette();
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

  if (!report) return null;

  const ratio = collectedRatio(report.totalCollected, report.outstanding);
  const buckets = bucketDebts(ages, now);
  const maxBucket = Math.max(1, ...AGE_BUCKETS.map((b) => buckets[b].amount));
  const bucketColors = [palette.payment, palette.primary, palette.credit, palette.danger];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}>
      <Txt size={18} weight="700">
        {t('thisMonth')}
      </Txt>
      <Row gap={10}>
        <Card style={{ flex: 1, gap: 4, padding: 12 }}>
          <Txt size={13} muted>
            {t('creditGivenMonth')}
          </Txt>
          <Txt size={17} weight="800" numberOfLines={1} style={{ color: palette.credit }}>
            {money(report.creditGiven)}
          </Txt>
        </Card>
        <Card style={{ flex: 1, gap: 4, padding: 12 }}>
          <Txt size={13} muted>
            {t('collectedMonth')}
          </Txt>
          <Txt size={17} weight="800" numberOfLines={1} style={{ color: palette.payment }}>
            {money(report.collected)}
          </Txt>
        </Card>
      </Row>
      {report.forgiven > 0 ? (
        <Txt size={13} muted>
          {t('forgivenMonth')}: {money(report.forgiven)}
        </Txt>
      ) : null}

      <Card style={{ alignItems: 'center', gap: 14 }}>
        <Donut
          ratio={ratio}
          color={palette.payment}
          track={palette.creditSoft}
          label={`${Math.round(ratio * 100)}%`}
          sublabel={t('collectedShare')}
        />
        <Row gap={18}>
          <View style={{ alignItems: 'center' }}>
            <Txt size={12} muted>
              {t('collectedAllTime')}
            </Txt>
            <Txt weight="800" style={{ color: palette.payment }}>
              {money(report.totalCollected)}
            </Txt>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Txt size={12} muted>
              {t('outstanding')}
            </Txt>
            <Txt weight="800" style={{ color: palette.credit }}>
              {money(report.outstanding)}
            </Txt>
          </View>
        </Row>
      </Card>

      <Txt size={18} weight="700">
        {t('oldDebts')}
      </Txt>
      <Card style={{ gap: 12 }}>
        {AGE_BUCKETS.map((b, i) => (
          <View key={b} style={{ gap: 6 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt size={14} weight="600">
                {t(`age_${b}`)} · {buckets[b].count}
              </Txt>
              <Txt size={14} weight="700">
                {money(buckets[b].amount)}
              </Txt>
            </Row>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: palette.border }}>
              <View
                style={{
                  width: `${(buckets[b].amount / maxBucket) * 100}%`,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: bucketColors[i],
                }}
              />
            </View>
          </View>
        ))}
      </Card>

      <Txt size={18} weight="700">
        {t('topDebtors')}
      </Txt>
      {ages.length === 0 ? <Txt muted>{t('noRecent')}</Txt> : null}
      {ages.slice(0, 5).map((d, i) => (
        <Pressable
          key={d.customerId}
          onPress={() => router.push({ pathname: '/customer/[id]', params: { id: String(d.customerId) } })}>
          <Card style={{ paddingVertical: 12 }}>
            <Row gap={12}>
              <Txt weight="800" muted>
                {i + 1}
              </Txt>
              <Txt weight="700" numberOfLines={1} style={{ flex: 1 }}>
                {d.name}
              </Txt>
              <Txt weight="800" numberOfLines={1} style={{ color: palette.credit }}>
                {money(d.balance)}
              </Txt>
            </Row>
          </Card>
        </Pressable>
      ))}
    </ScrollView>
  );
}
