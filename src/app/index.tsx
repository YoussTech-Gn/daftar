import { Link, router, Stack, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';
import { BackHandler, FlatList, Platform, Pressable, StyleSheet, TextInput, ToastAndroid, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookOpen, ICON, Package, Plus, Search, Settings } from '@/components/icons';
import { Avatar, Button, Card, Chip, ChipRow, Row, Txt } from '@/components/ui';
import { getSummary, listCustomers } from '@/db/repository';
import { daysAgo } from '@/domain/time';
import type { CustomerWithBalance, Summary } from '@/domain/types';
import { useApp } from '@/state/use-app';
import { usePalette } from '@/theme';

type Filter = 'all' | 'owes' | 'settled';

/** Android: first Back shows a hint, a second Back within 2 s exits. */
function useDoubleBackToExit(message: string) {
  const lastPress = useRef(0);
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        const now = Date.now();
        if (now - lastPress.current < 2000) return false;
        lastPress.current = now;
        ToastAndroid.show(message, ToastAndroid.SHORT);
        return true;
      });
      return () => sub.remove();
    }, [message]),
  );
}

export default function HomeScreen() {
  const db = useSQLiteContext();
  const { t, money, isRTL } = useApp();
  const palette = usePalette();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [customers, setCustomers] = useState<CustomerWithBalance[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  useDoubleBackToExit(t('pressBackAgain'));

  const load = useCallback(async () => {
    const [list, sum] = await Promise.all([listCustomers(db, search), getSummary(db)]);
    setCustomers(list);
    setSummary(sum);
  }, [db, search]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const visible = customers.filter((c) =>
    filter === 'owes' ? c.balance > 0 : filter === 'settled' ? c.balance <= 0 : true,
  );

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Link href="/settings" asChild>
              <Pressable accessibilityRole="button" accessibilityLabel={t('settings')} hitSlop={12}>
                <Settings size={ICON.lg} color={palette.text} />
              </Pressable>
            </Link>
          ),
        }}
      />
      <FlatList
        data={visible}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 4 }}>
            <Card style={{ backgroundColor: palette.primary, borderColor: palette.primary, gap: 4 }}>
              <Txt size={14} style={{ color: palette.primaryText, opacity: 0.85 }}>
                {t('totalOwed')}
              </Txt>
              <Txt size={32} weight="800" style={{ color: palette.primaryText }}>
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
                <Txt size={18} weight="700" style={{ color: palette.credit }}>
                  {money(summary?.creditToday ?? 0)}
                </Txt>
              </Card>
              <Card style={[styles.stat, { backgroundColor: palette.paymentSoft, borderColor: palette.paymentSoft }]}>
                <Txt size={13} muted>
                  {t('today')} · {t('receivedToday')}
                </Txt>
                <Txt size={18} weight="700" style={{ color: palette.payment }}>
                  {money(summary?.paymentsToday ?? 0)}
                </Txt>
              </Card>
            </Row>
            <Row gap={10}>
              <Button
                label={t('products')}
                icon={Package}
                variant="secondary"
                onPress={() => router.push('/products')}
                style={styles.smallButton}
              />
              <Button
                label={t('settings')}
                icon={Settings}
                variant="secondary"
                onPress={() => router.push('/settings')}
                style={styles.smallButton}
              />
            </Row>
            <Row gap={8} style={[styles.search, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <Search size={ICON.md} color={palette.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t('searchCustomers')}
                placeholderTextColor={palette.muted}
                style={{ flex: 1, color: palette.text, fontSize: 16, textAlign: isRTL ? 'right' : 'left' }}
              />
            </Row>
            <ChipRow>
              <Chip label={t('filterAll')} selected={filter === 'all'} onPress={() => setFilter('all')} />
              <Chip label={t('filterOwes')} selected={filter === 'owes'} onPress={() => setFilter('owes')} />
              <Chip label={t('filterSettled')} selected={filter === 'settled'} onPress={() => setFilter('settled')} />
            </ChipRow>
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', gap: 6, paddingVertical: 48 }}>
            <BookOpen size={ICON.xl} color={palette.primary} strokeWidth={1.75} />
            <Txt weight="700" style={{ textAlign: 'center' }}>
              {t('noCustomers')}
            </Txt>
            <Txt muted style={{ textAlign: 'center' }}>
              {t('noCustomersHint')}
            </Txt>
          </View>
        }
        renderItem={({ item }) => <CustomerRow customer={item} />}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/customer/form')}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: palette.primary, opacity: pressed ? 0.85 : 1 },
          isRTL ? { left: 20 } : { right: 20 },
        ]}>
        <Row gap={8}>
          <Plus size={ICON.md} color={palette.primaryText} strokeWidth={2.5} />
          <Txt weight="700" style={{ color: palette.primaryText }}>
            {t('addCustomer')}
          </Txt>
        </Row>
      </Pressable>
    </SafeAreaView>
  );
}

function CustomerRow({ customer }: { customer: CustomerWithBalance }) {
  const { t, money, isRTL } = useApp();
  const palette = usePalette();
  const owes = customer.balance > 0;
  const advance = customer.balance < 0;
  const color = owes ? palette.credit : advance ? palette.payment : palette.muted;
  const days = customer.lastActivityAt === null ? null : daysAgo(customer.lastActivityAt);
  const activity =
    days === null
      ? t('noActivity')
      : days === 0
        ? t('lastToday')
        : days === 1
          ? t('lastYesterday')
          : t('lastDaysAgo', { n: days });
  const details = [customer.note, customer.phone].filter(Boolean).join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/customer/[id]', params: { id: String(customer.id) } })}>
      {({ pressed }) => (
        <Card style={{ opacity: pressed ? 0.85 : 1, paddingVertical: 12, gap: 10 }}>
          <Row gap={12}>
            <Avatar name={customer.name} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt weight="700" numberOfLines={1}>
                {customer.name}
              </Txt>
              {details ? (
                <Txt size={13} muted numberOfLines={1}>
                  {details}
                </Txt>
              ) : null}
              <Txt size={12} muted numberOfLines={1}>
                {activity}
              </Txt>
            </View>
            <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end', gap: 6 }}>
              <Txt weight="800" style={{ color }}>
                {money(Math.abs(customer.balance))}
              </Txt>
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() =>
                  router.push({ pathname: '/entry/new', params: { customerId: String(customer.id), kind: 'credit' } })
                }
                style={({ pressed }) => [
                  styles.quick,
                  { backgroundColor: palette.creditSoft, opacity: pressed ? 0.7 : 1 },
                ]}>
                <Row gap={4}>
                  <Plus size={ICON.sm} color={palette.credit} strokeWidth={2.75} />
                  <Txt size={13} weight="700" style={{ color: palette.credit }}>
                    {t('quickCredit')}
                  </Txt>
                </Row>
              </Pressable>
            </View>
          </Row>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stat: { flex: 1, gap: 4, padding: 12 },
  smallButton: { flex: 1, minHeight: 44 },
  search: { minHeight: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  quick: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  fab: {
    position: 'absolute',
    bottom: 32,
    paddingHorizontal: 20,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
