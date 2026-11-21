import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AmountDisplay } from '@/components/ui';
import { DOCK_SPACE } from '@/components/v4/floating-dock';
import { ActivityRow, PrivacyEye } from '@/components/v4/ledger-bits';
import { Glass, Pill, Txt } from '@/components/v4/primitives';
import { getPeriodReport, getSummary, listRecentEntries, type RecentEntry } from '@/db/repository';
import { collectedRatio, monthRange } from '@/domain/report';
import type { Summary } from '@/domain/types';
import { haptic } from '@/lib/haptics';
import { useDoubleBackToExit } from '@/lib/use-double-back';
import { useApp } from '@/state/use-app';
import { useLedgerReload } from '@/state/use-ledger-reload';
import { useTheme } from '@/theme';

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || 'D'
  );
}

/** 01 · Accueil (V4, decision 0018): store bar, glass hero with inline privacy eye, unified activity panel. */
export default function HomeScreen() {
  const db = useSQLiteContext();
  const { t, settings, isRTL } = useApp();
  const { colors } = useTheme();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [ratio, setRatio] = useState(0);
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const [hideCancelled, setHideCancelled] = useState(false);

  useDoubleBackToExit(t('pressBackAgain'));

  const load = useCallback(async () => {
    const [from, to] = monthRange();
    const [s, r, report] = await Promise.all([getSummary(db), listRecentEntries(db, 20), getPeriodReport(db, from, to)]);
    setSummary(s);
    setRecent(r);
    setRatio(collectedRatio(report.totalCollected, report.outstanding));
  }, [db]);
  useLedgerReload(load);

  // Active entries first (newest first), cancelled ones moved to the bottom.
  const rows = useMemo(() => {
    const active = recent.filter((e) => e.cancelledAt === null);
    const cancelled = recent.filter((e) => e.cancelledAt !== null);
    return hideCancelled ? active : [...active, ...cancelled];
  }, [recent, hideCancelled]);
  const cancelledCount = recent.length - recent.filter((e) => e.cancelledAt === null).length;

  const shop = settings.shopName || t('appName');
  const dir = isRTL ? 'flex-row-reverse' : 'flex-row';

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: DOCK_SPACE, gap: 16 }}>
        {/* Top bar: store badge, name, live offline dot, debtor chip */}
        <View className={`items-center gap-3 ${dir}`}>
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-accent">
            <Txt weight="800" className="text-base text-surface-solid">
              {initials(shop)}
            </Txt>
          </View>
          <View className="flex-1 gap-0.5">
            <Txt weight="700" numberOfLines={1} className="text-lg" style={{ textAlign: isRTL ? 'right' : 'left' }}>
              {shop}
            </Txt>
            <View className={`items-center gap-1.5 ${dir}`}>
              <View className="h-2 w-2 rounded-full bg-payment" />
              <Txt className="text-xs text-ink-2">{t('offlineBadge')}</Txt>
            </View>
          </View>
          {summary && summary.customersInDebt > 0 ? (
            <Pill
              label={t('customersInDebt', { count: summary.customersInDebt })}
              className="bg-credit-soft"
              textClassName="text-credit"
            />
          ) : null}
        </View>

        {/* Hero */}
        <Glass className="gap-4 p-5">
          <View className={`items-center justify-between ${dir}`}>
            <Txt weight="600" className="text-sm text-ink-2">
              {t('totalOwed')}
            </Txt>
            <Pill
              label={t('recoveredPill', { pct: Math.round(ratio * 100) })}
              className="bg-payment-soft"
              textClassName="text-payment"
            />
          </View>
          <View className={`items-center gap-3 ${dir}`}>
            <View className="flex-1">
              <AmountDisplay amount={summary?.totalOwed ?? 0} size="display" animate color={colors.text} align={isRTL ? 'right' : 'left'} />
            </View>
            <PrivacyEye />
          </View>
          <View className="h-px bg-line" />
          <View className={`gap-4 ${dir}`}>
            <View className="flex-1 gap-1">
              <Txt weight="600" className="text-xs text-credit">
                {t('creditsToday')}
              </Txt>
              <AmountDisplay amount={summary?.creditToday ?? 0} size="heading" color={colors.creditDeep} />
            </View>
            <View className="w-px bg-line" />
            <View className="flex-1 gap-1">
              <Txt weight="600" className="text-xs text-payment">
                {t('receivedToday2')}
              </Txt>
              <AmountDisplay amount={summary?.paymentsToday ?? 0} size="heading" color={colors.paymentDeep} />
            </View>
          </View>
        </Glass>

        {/* Unified activity panel */}
        <Glass>
          <View className={`items-center justify-between px-4 pb-2 pt-4 ${dir}`}>
            <Txt weight="700" className="text-base">
              {t('recentActivity')}
            </Txt>
            {cancelledCount > 0 ? (
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: hideCancelled }}
                onPress={() => {
                  haptic.selection();
                  setHideCancelled((v) => !v);
                }}
                className={`min-h-[36px] justify-center rounded-full px-3 ${hideCancelled ? 'bg-accent-soft' : 'bg-surface-muted'}`}>
                <Txt weight="600" className={`text-xs ${hideCancelled ? 'text-accent' : 'text-ink-2'}`}>
                  {hideCancelled ? t('showCancelled') : t('hideCancelled')}
                </Txt>
              </Pressable>
            ) : null}
          </View>
          {rows.length === 0 ? (
            <Txt className="px-4 pb-5 pt-2 text-sm text-ink-2">{t('noRecent')}</Txt>
          ) : (
            rows.map((e, i) => (
              <ActivityRow
                key={e.id}
                entry={e}
                last={i === rows.length - 1}
                onPress={() => router.push({ pathname: '/customer/[id]', params: { id: String(e.customerId) } })}
              />
            ))
          )}
        </Glass>
      </ScrollView>
    </SafeAreaView>
  );
}
