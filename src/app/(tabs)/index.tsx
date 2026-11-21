import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ArrowDownLeft,
  ArrowUpRight,
  ICON_SCALE,
  ShieldCheck,
  UserPlus,
  type LucideIcon,
} from '@/components/icons';
import {
  DaftarText,
  EmptyState,
  EntryRow,
  HomeSkeleton,
  LedgerHeroCard,
  Row,
} from '@/components/ui';
import { getSummary, listRecentEntries, type RecentEntry } from '@/db/repository';
import { dayGroup } from '@/domain/report';
import type { Summary } from '@/domain/types';
import { useDoubleBackToExit } from '@/lib/use-double-back';
import { useSessionStore } from '@/state/session-store';
import { useApp } from '@/state/use-app';
import { StaggerItem, usePressScale, useTheme } from '@/theme';

function QuickActionCard({
  label,
  Icon,
  iconColor,
  iconBg,
  onPress,
}: {
  label: string;
  Icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  onPress: () => void;
}) {
  const { colors, shadows } = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale({
    scaleTo: 0.96,
    opacityTo: 0.92,
    haptic: 'light',
  });

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[
          styles.actionCard,
          shadows.card,
          { backgroundColor: colors.surface },
        ]}>
        <View style={[styles.actionIconBox, { backgroundColor: iconBg }]}>
          <Icon size={ICON_SCALE.md.size} color={iconColor} strokeWidth={ICON_SCALE.md.strokeWidth} />
        </View>
        <DaftarText role="label" weight="600" numberOfLines={2} align="center" style={{ fontSize: 13, lineHeight: 17 }}>
          {label}
        </DaftarText>
      </Pressable>
    </Animated.View>
  );
}

/** 01 · Home: Shop name + offline shield badge, LedgerHeroCard, 3 quick actions, grouped activity. */
export default function HomeScreen() {
  const db = useSQLiteContext();
  const { t, settings } = useApp();
  const { colors } = useTheme();
  const lastSavedEntry = useSessionStore((s) => s.lastSavedEntry);
  const clearSavedEntry = useSessionStore((s) => s.clearSavedEntry);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const [now, setNow] = useState(0);

  useDoubleBackToExit(t('pressBackAgain'));

  useFocusEffect(
    useCallback(() => {
      Promise.all([getSummary(db), listRecentEntries(db, 15)]).then(([s, r]) => {
        setSummary(s);
        setRecent(r);
        setNow(Date.now());
      });
    }, [db]),
  );

  useEffect(() => {
    if (!lastSavedEntry) return;
    const timer = setTimeout(clearSavedEntry, 600);
    return () => clearTimeout(timer);
  }, [clearSavedEntry, lastSavedEntry]);

  const groups: { key: 'today' | 'yesterday' | 'earlier'; items: RecentEntry[] }[] = [];
  for (const e of recent) {
    const key = dayGroup(e.createdAt, now);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(e);
    else groups.push({ key, items: [e] });
  }

  let flatIndex = 0;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Row style={styles.topBar} gap={10}>
        <DaftarText role="title" weight="700" numberOfLines={1} style={{ flex: 1 }}>
          {settings.shopName || t('appName')}
        </DaftarText>
        <View style={[styles.offlinePill, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}>
          <Row gap={5}>
            <ShieldCheck size={ICON_SCALE.xs.size} color={colors.primary} strokeWidth={ICON_SCALE.xs.strokeWidth} />
            <DaftarText role="caption" tone="primary" weight="600" numberOfLines={1}>
              {t('offlineBadge')}
            </DaftarText>
          </Row>
        </View>
      </Row>

      {summary === null ? (
        <HomeSkeleton />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <LedgerHeroCard
            totalOwed={summary.totalOwed}
            customersInDebt={summary.customersInDebt}
            creditToday={summary.creditToday}
            paymentsToday={summary.paymentsToday}
          />

          <Row gap={10} style={{ alignItems: 'stretch' }}>
            <QuickActionCard
              label={t('newCredit')}
              Icon={ArrowUpRight}
              iconColor={colors.creditDeep}
              iconBg={colors.creditSoft}
              onPress={() => router.push({ pathname: '/pick-customer', params: { kind: 'credit' } })}
            />
            <QuickActionCard
              label={t('newPayment')}
              Icon={ArrowDownLeft}
              iconColor={colors.paymentDeep}
              iconBg={colors.paymentSoft}
              onPress={() => router.push({ pathname: '/pick-customer', params: { kind: 'payment' } })}
            />
            <QuickActionCard
              label={t('addCustomer')}
              Icon={UserPlus}
              iconColor={colors.primary}
              iconBg={colors.primarySoft}
              onPress={() => router.push('/customer/form')}
            />
          </Row>

          <View style={styles.sectionHeader}>
            <DaftarText role="heading" weight="700">
              {t('recentActivity')}
            </DaftarText>
          </View>

          {recent.length === 0 ? (
            <EmptyState variant="activity" title={t('noRecent')} hint={t('noCustomersHint')} />
          ) : (
            groups.map((g, gi) => (
              <View key={`${g.key}-${gi}`} style={styles.groupBlock}>
                <DaftarText role="caption" tone="muted" weight="600">
                  {t(g.key)}
                </DaftarText>
                {g.items.map((e) => {
                  const idx = flatIndex;
                  flatIndex += 1;
                  const timeStr = new Date(e.createdAt).toLocaleTimeString(settings.language, {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const badge =
                    e.kind === 'payment'
                      ? `${t('paymentEntry')} · ${t(`method_${e.method}`)}`
                      : e.kind === 'forgiven'
                        ? t('forgivenGrace')
                        : undefined;
                  const highlightMode = lastSavedEntry?.id === e.id ? lastSavedEntry.kind : null;

                  return (
                    <StaggerItem key={e.id} index={idx}>
                      <EntryRow
                        title={e.customerName}
                        kind={e.kind}
                        creditType={e.creditType}
                        method={e.method}
                        amount={e.amount}
                        note={e.note}
                        badgeLabel={badge}
                        timestampLabel={timeStr}
                        cancelled={e.cancelledAt != null}
                        highlightMode={highlightMode}
                        onPress={() =>
                          router.push({ pathname: '/customer/[id]', params: { id: String(e.customerId) } })
                        }
                      />
                    </StaggerItem>
                  );
                })}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    justifyContent: 'space-between',
  },
  offlinePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    flexShrink: 0,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 6,
    gap: 14,
    paddingBottom: 32,
  },
  actionCard: {
    flex: 1,
    minHeight: 96,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    marginTop: 4,
  },
  groupBlock: {
    gap: 8,
  },
});
