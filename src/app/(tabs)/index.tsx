import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  ArrowDown,
  ArrowUp,
  Ban,
  Banknote,
  HandHeart,
  ICON,
  ShoppingCart,
  UserPlus,
  type LucideIcon,
} from '@/components/icons';
import { Card, Row, Txt } from '@/components/ui';
import { getSummary, listRecentEntries, type RecentEntry } from '@/db/repository';
import { dayGroup } from '@/domain/report';
import type { Summary } from '@/domain/types';
import { useDoubleBackToExit } from '@/lib/use-double-back';
import { useApp } from '@/state/use-app';
import { usePalette, type Palette } from '@/theme';

function entryVisual(e: RecentEntry, palette: Palette): { Icon: LucideIcon; color: string; sign: string } {
  if (e.cancelledAt) return { Icon: Ban, color: palette.muted, sign: '' };
  if (e.kind === 'forgiven') return { Icon: HandHeart, color: palette.primary, sign: '−' };
  if (e.kind === 'payment') return { Icon: ArrowDown, color: palette.payment, sign: '−' };
  const Icon = e.creditType === 'cash' ? Banknote : e.creditType === 'goods' ? ShoppingCart : ArrowUp;
  return { Icon, color: palette.credit, sign: '+' };
}

/** Home tab (analysis 0002): totals, three quick actions, recent activity grouped by day. */
export default function HomeScreen() {
  const db = useSQLiteContext();
  const { t, money, settings } = useApp();
  const palette = usePalette();
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

  const groups: { key: 'today' | 'yesterday' | 'earlier'; items: RecentEntry[] }[] = [];
  for (const e of recent) {
    const key = dayGroup(e.createdAt, now);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(e);
    else groups.push({ key, items: [e] });
  }

  const actions: { label: string; Icon: LucideIcon; color: string; soft: string; onPress: () => void }[] = [
    {
      label: t('newCredit'),
      Icon: ArrowUp,
      color: palette.credit,
      soft: palette.creditSoft,
      onPress: () => router.push({ pathname: '/pick-customer', params: { kind: 'credit' } }),
    },
    {
      label: t('newPayment'),
      Icon: ArrowDown,
      color: palette.payment,
      soft: palette.paymentSoft,
      onPress: () => router.push({ pathname: '/pick-customer', params: { kind: 'payment' } }),
    },
    {
      label: t('addCustomer'),
      Icon: UserPlus,
      color: palette.primary,
      soft: palette.paymentSoft,
      onPress: () => router.push('/customer/form'),
    },
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}>
      <Card style={{ backgroundColor: palette.primary, borderColor: palette.primary, gap: 4 }}>
        <Txt size={14} style={{ color: palette.primaryText, opacity: 0.85 }}>
          {t('totalOwed')}
        </Txt>
        <Txt size={32} weight="800" numberOfLines={1} style={{ color: palette.primaryText }}>
          {money(summary?.totalOwed ?? 0)}
        </Txt>
        <Txt size={14} style={{ color: palette.primaryText, opacity: 0.85 }}>
          {t('customersInDebt', { count: summary?.customersInDebt ?? 0 })}
        </Txt>
      </Card>

      <Row gap={10}>
        <Card style={[styles.stat, { backgroundColor: palette.creditSoft, borderColor: palette.creditSoft }]}>
          <Txt size={13} muted>
            {t('today')} · {t('givenToday')}
          </Txt>
          <Txt size={18} weight="700" numberOfLines={1} style={{ color: palette.credit }}>
            {money(summary?.creditToday ?? 0)}
          </Txt>
        </Card>
        <Card style={[styles.stat, { backgroundColor: palette.paymentSoft, borderColor: palette.paymentSoft }]}>
          <Txt size={13} muted>
            {t('today')} · {t('receivedToday')}
          </Txt>
          <Txt size={18} weight="700" numberOfLines={1} style={{ color: palette.payment }}>
            {money(summary?.paymentsToday ?? 0)}
          </Txt>
        </Card>
      </Row>

      <Row gap={10}>
        {actions.map((a) => (
          <Pressable
            key={a.label}
            accessibilityRole="button"
            onPress={a.onPress}
            style={({ pressed }) => [
              styles.action,
              { backgroundColor: palette.card, borderColor: palette.border, opacity: pressed ? 0.8 : 1 },
            ]}>
            <View style={[styles.actionIcon, { backgroundColor: a.soft }]}>
              <a.Icon size={ICON.lg} color={a.color} strokeWidth={2.25} />
            </View>
            <Txt size={13} weight="700" numberOfLines={2} style={{ textAlign: 'center' }}>
              {a.label}
            </Txt>
          </Pressable>
        ))}
      </Row>

      <Txt size={18} weight="700" style={{ marginTop: 4 }}>
        {t('recentActivity')}
      </Txt>
      {recent.length === 0 ? <Txt muted>{t('noRecent')}</Txt> : null}
      {groups.map((g, gi) => (
        <View key={`${g.key}-${gi}`} style={{ gap: 8 }}>
          <Txt size={13} muted weight="700">
            {t(g.key)}
          </Txt>
          {g.items.map((e) => {
            const v = entryVisual(e, palette);
            return (
              <Pressable
                key={e.id}
                onPress={() => router.push({ pathname: '/customer/[id]', params: { id: String(e.customerId) } })}>
                <Card style={{ paddingVertical: 10, opacity: e.cancelledAt ? 0.55 : 1 }}>
                  <Row gap={12}>
                    <v.Icon size={ICON.md} color={v.color} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Txt weight="700" numberOfLines={1}>
                        {e.customerName}
                      </Txt>
                      <Txt size={12} muted numberOfLines={1}>
                        {new Date(e.createdAt).toLocaleTimeString(settings.language, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {e.note ? ` · ${e.note}` : ''}
                      </Txt>
                    </View>
                    <Txt
                      weight="800"
                      numberOfLines={1}
                      style={{
                        flexShrink: 0,
                        color: v.color,
                        textDecorationLine: e.cancelledAt ? 'line-through' : 'none',
                      }}>
                      {money(e.amount, v.sign)}
                    </Txt>
                  </Row>
                </Card>
              </Pressable>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  stat: { flex: 1, gap: 4, padding: 12 },
  action: {
    flex: 1,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
});
