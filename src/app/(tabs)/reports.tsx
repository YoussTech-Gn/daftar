import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmountDisplay, Avatar } from '@/components/ui';
import { DOCK_SPACE } from '@/components/v4/floating-dock';
import { Glass, Txt } from '@/components/v4/primitives';
import { getPeriodReport, listDebtAges, type DebtAge, type PeriodReport } from '@/db/repository';
import { ageBucket, collectedRatio, monthRange } from '@/domain/report';
import { daysAgo } from '@/domain/time';
import { haptic } from '@/lib/haptics';
import { useSessionStore } from '@/state/session-store';
import { useApp } from '@/state/use-app';
import { useLedgerReload } from '@/state/use-ledger-reload';
import { useTheme } from '@/theme';

/**
 * 03 · Rapports — simplified merchant view (V4, decision 0018):
 * recovery health, two monthly KPIs, "to collect now" list with inline Encaisser, forgiveness footnote.
 */
export default function ReportsScreen() {
  const db = useSQLiteContext();
  const { t, isRTL } = useApp();
  const { colors } = useTheme();
  const openOperation = useSessionStore((s) => s.openOperation);

  const [report, setReport] = useState<PeriodReport | null>(null);
  const [debts, setDebts] = useState<DebtAge[]>([]);
  const [now, setNow] = useState(0);

  const load = useCallback(async () => {
    const current = Date.now();
    const [from, to] = monthRange(current);
    const [r, d] = await Promise.all([getPeriodReport(db, from, to), listDebtAges(db)]);
    setReport(r);
    setDebts(d);
    setNow(current);
  }, [db]);
  useLedgerReload(load);

  const ratio = report ? collectedRatio(report.totalCollected, report.outstanding) : 0;
  const oldest = debts.reduce<number | null>((min, d) => (min === null || d.sinceAt < min ? d.sinceAt : min), null);
  const ageKey = oldest === null ? null : ageBucket(daysAgo(oldest, now));
  const dir = isRTL ? 'flex-row-reverse' : 'flex-row';
  const align = isRTL ? 'right' : 'left';

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: DOCK_SPACE, gap: 16 }}>
        <Txt weight="700" className="text-2xl" style={{ textAlign: align }}>
          {t('tabReports')}
        </Txt>

        {/* 1 · Recovery health */}
        <Glass className="gap-3 p-5">
          <View className={`items-end justify-between ${dir}`}>
            <Txt weight="600" className="text-sm text-ink-2">
              {t('moneyRecovered')}
            </Txt>
            <Txt weight="800" numeric className="text-3xl text-payment">
              {`${Math.round(ratio * 100)}%`}
            </Txt>
          </View>
          <View className="h-2.5 overflow-hidden rounded-full bg-surface-muted">
            <View
              className="h-full rounded-full bg-payment"
              style={{ width: `${Math.round(ratio * 100)}%`, alignSelf: isRTL ? 'flex-end' : 'flex-start' }}
            />
          </View>
          <View className={`items-center justify-between ${dir}`}>
            <Txt className="text-sm text-ink-2">{t('leftToRecover')}</Txt>
            <AmountDisplay amount={report?.outstanding ?? 0} size="heading" color={colors.creditDeep} />
          </View>
          {ageKey ? (
            <Txt className="text-xs text-ink-3" style={{ textAlign: align }}>
              {t(`ageNote_${ageKey}`)}
            </Txt>
          ) : null}
        </Glass>

        {/* 2 · Monthly KPIs */}
        <View className={`gap-3 ${dir}`}>
          <Glass className="flex-1 gap-1.5 p-4">
            <Txt weight="600" className="text-xs text-credit" style={{ textAlign: align }}>
              {t('kpiGiven')}
            </Txt>
            <AmountDisplay amount={report?.creditGiven ?? 0} size="heading" color={colors.creditDeep} align={align} />
            <Txt className="text-[11px] text-ink-3" style={{ textAlign: align }}>
              {t('thisMonth')}
            </Txt>
          </Glass>
          <Glass className="flex-1 gap-1.5 p-4">
            <Txt weight="600" className="text-xs text-payment" style={{ textAlign: align }}>
              {t('kpiCollected')}
            </Txt>
            <AmountDisplay amount={report?.collected ?? 0} size="heading" color={colors.paymentDeep} align={align} />
            <Txt className="text-[11px] text-ink-3" style={{ textAlign: align }}>
              {t('thisMonth')}
            </Txt>
          </Glass>
        </View>

        {/* 3 · To collect now */}
        <Glass>
          <Txt weight="700" className="px-4 pb-2 pt-4 text-base" style={{ textAlign: align }}>
            {t('toCollectNow')}
          </Txt>
          {debts.length === 0 ? (
            <Txt className="px-4 pb-5 text-sm text-ink-2" style={{ textAlign: align }}>
              {t('nothingToCollect')}
            </Txt>
          ) : (
            debts.map((d, i) => (
              <View
                key={d.customerId}
                className={`min-h-[64px] items-center gap-3 px-4 py-3 ${i === debts.length - 1 ? '' : 'border-b border-line'} ${dir}`}>
                <Avatar name={d.name} size={38} />
                <View className="flex-1 gap-0.5">
                  <Txt weight="600" numberOfLines={1} style={{ textAlign: align }}>
                    {d.name}
                  </Txt>
                  <AmountDisplay amount={d.balance} size="label" color={colors.creditDeep} align={align} />
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t('collect')} ${d.name}`}
                  onPress={() => {
                    haptic.selection();
                    openOperation({ kind: 'payment', customerId: d.customerId });
                  }}
                  className="min-h-[40px] justify-center rounded-full bg-payment-soft px-4 active:opacity-80">
                  <Txt weight="700" className="text-sm text-payment">
                    {t('collect')}
                  </Txt>
                </Pressable>
              </View>
            ))
          )}
        </Glass>

        {/* 4 · Forgiveness footnote */}
        <View className={`items-center justify-center gap-1.5 ${dir}`}>
          <Txt className="text-xs text-ink-3">{t('forgivenThisMonth')}</Txt>
          <AmountDisplay amount={report?.forgiven ?? 0} size="caption" color={colors.forgiven} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
