import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { CustomerRow, SearchBox } from '@/components/customer-row';
import { BookOpen, ICON, UserPlus } from '@/components/icons';
import { Chip, ChipRow, Row, Txt } from '@/components/ui';
import { listCustomers } from '@/db/repository';
import type { CustomerWithBalance } from '@/domain/types';
import { useApp } from '@/state/use-app';
import { usePalette } from '@/theme';

type Filter = 'all' | 'owes' | 'settled';

/** Customers tab: search, filters, list, add customer. */
export default function CustomersScreen() {
  const db = useSQLiteContext();
  const { t, isRTL } = useApp();
  const palette = usePalette();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [customers, setCustomers] = useState<CustomerWithBalance[]>([]);

  const load = useCallback(async () => setCustomers(await listCustomers(db, search)), [db, search]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const visible = customers.filter((c) =>
    filter === 'owes' ? c.balance > 0 : filter === 'settled' ? c.balance <= 0 : true,
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={visible}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 110 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 4 }}>
            <SearchBox value={search} onChangeText={setSearch} />
            <ChipRow>
              <Chip label={t('filterAll')} selected={filter === 'all'} onPress={() => setFilter('all')} />
              <Chip label={t('filterOwes')} selected={filter === 'owes'} onPress={() => setFilter('owes')} />
              <Chip label={t('filterSettled')} selected={filter === 'settled'} onPress={() => setFilter('settled')} />
            </ChipRow>
            <Txt size={13} muted>
              {t('customersCount', { n: visible.length })}
            </Txt>
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
          <UserPlus size={ICON.md} color={palette.primaryText} strokeWidth={2.5} />
          <Txt weight="700" style={{ color: palette.primaryText }}>
            {t('addCustomer')}
          </Txt>
        </Row>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 20,
    paddingHorizontal: 20,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
