import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Donut } from '@/components/donut';
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

/** One labelled bar. Width is the share of the larger of the two month totals. */
function MonthBar({
  label,
  amount,
  max,
  color,
  amountColor,
  isRTL,
}: {
  label: string;
  amount: number;
  max: number;
  color: string;
  amountColor: string;
  isRTL: boolean;
}) {
  const width = `${Math.max(6, Math.round((amount / max) * 100))}%`;
  const dir = isRTL ? 'flex-row-reverse' : 'flex-row';
  const align = isRTL ? 'right' : 'left';
  return (
    <View className="gap-1.5">
      <View className={`items-center justify-between ${dir}`}>
        <Txt weight="600" className="text-sm" style={{ textAlign: align }}>
          {label}
        </Txt>
        <AmountDisplay amount={amount} size="label" color={amountColor} />
      </View>
      <View className="h-3 overflow-hidden rounded-full bg-surface-muted">
        <View className="h-full rounded-full" style={{ width, backgroundColor: color, alignSelf: isRTL ? 'flex-end' : 'flex-start' }} />
      </View>
    </View>
  );
}

/**
 * 03 · Rapports — recovery ring plus this month as two bars on one scale.
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

        {/* 1 · Recovery chart — the ring already used by the app, not a new visual language. */}
        <Glass className="items-center gap-4 p-5">
          <Donut
            ratio={ratio}
            size={156}
            stroke={16}
            color={colors.payment}
            track={colors.surfaceSunken}
            label={`${Math.round(ratio * 100)}%`}
            sublabel={t('moneyRecovered')}
          />
          <View className={`w-full items-center justify-between ${dir}`}>
            <Txt className="text-sm text-ink-2">{t('leftToRecover')}</Txt>
            <AmountDisplay amount={report?.outstanding ?? 0} size="heading" color={colors.creditDeep} />
          </View>
          {ageKey ? (
            <Txt className="text-xs text-ink-3" style={{ textAlign: align }}>
              {t(`ageNote_${ageKey}`)}
            </Txt>
          ) : null}
        </Glass>

        {/* 2 · This month, as two bars on one scale */}
        <Glass className="gap-4 p-5">
          <Txt weight="700" className="text-base" style={{ textAlign: align }}>
            {t('thisMonth')}
          </Txt>
          <MonthBar
            label={t('kpiGiven')}
            amount={report?.creditGiven ?? 0}
            max={Math.max(report?.creditGiven ?? 0, report?.collected ?? 0, 1)}
            color={colors.credit}
            amountColor={colors.creditDeep}
            isRTL={isRTL}
          />
          <MonthBar
            label={t('kpiCollected')}
            amount={report?.collected ?? 0}
            max={Math.max(report?.creditGiven ?? 0, report?.collected ?? 0, 1)}
            color={colors.payment}
            amountColor={colors.paymentDeep}
            isRTL={isRTL}
          />
        </Glass>

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
                <Avatar name={d.name} id={d.customerId} size={38} />
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
                  className="min-h-[48px] justify-center rounded-full bg-payment-soft px-4 active:opacity-80">
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
