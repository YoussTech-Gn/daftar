import { Link, router, Stack, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Card, Row, Txt } from '@/components/ui';
import { getSummary, listCustomers } from '@/db/repository';
import type { CustomerWithBalance, Summary } from '@/domain/types';
import { useApp } from '@/state/app-context';
import { usePalette } from '@/theme';

export default function HomeScreen() {
  const db = useSQLiteContext();
  const { t, money, isRTL } = useApp();
  const palette = usePalette();
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<CustomerWithBalance[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

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

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Link href="/settings" asChild>
              <Pressable accessibilityRole="button" hitSlop={12}>
                <Txt size={22}>⚙️</Txt>
              </Pressable>
            </Link>
          ),
        }}
      />
      <FlatList
        data={customers}
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
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={`🔍  ${t('searchCustomers')}`}
              placeholderTextColor={palette.muted}
              style={[
                styles.search,
                {
                  backgroundColor: palette.card,
                  borderColor: palette.border,
                  color: palette.text,
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
            />
          </View>
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', gap: 6, paddingVertical: 48 }}>
            <Txt size={40}>📒</Txt>
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
        <Txt weight="700" style={{ color: palette.primaryText }}>
          ＋ {t('addCustomer')}
        </Txt>
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
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/customer/[id]', params: { id: String(customer.id) } })}>
      {({ pressed }) => (
        <Card style={{ opacity: pressed ? 0.85 : 1, paddingVertical: 12 }}>
          <Row gap={12}>
            <Avatar name={customer.name} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt weight="700" numberOfLines={1}>
                {customer.name}
              </Txt>
              {customer.phone ? (
                <Txt size={13} muted numberOfLines={1}>
                  {customer.phone}
                </Txt>
              ) : null}
            </View>
            <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end' }}>
              <Txt weight="800" style={{ color }}>
                {money(Math.abs(customer.balance))}
              </Txt>
              <Txt size={12} style={{ color }}>
                {owes ? t('owes') : advance ? t('advance') : t('settled')}
              </Txt>
            </View>
          </Row>
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stat: { flex: 1, gap: 4, padding: 12 },
  search: { minHeight: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 16 },
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
