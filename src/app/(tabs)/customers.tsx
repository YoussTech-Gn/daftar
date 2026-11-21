import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UserPlus } from '@/components/icons';
import {
  ChipRow,
  CustomerRow,
  CustomersSkeleton,
  DaftarButton,
  DaftarChip,
  DaftarText,
  EmptyState,
  Row,
  SearchBox,
} from '@/components/ui';
import { listCustomers } from '@/db/repository';
import type { CustomerWithBalance } from '@/domain/types';
import { useApp } from '@/state/use-app';
import { StaggerItem, useTheme } from '@/theme';

type Filter = 'all' | 'owes' | 'settled';

/** 02 · Customers: header with live count + Add Customer CTA, search, filter chips, FlatList. */
export default function CustomersScreen() {
  const db = useSQLiteContext();
  const { t } = useApp();
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [customers, setCustomers] = useState<CustomerWithBalance[] | null>(null);

  const load = useCallback(async () => {
    setCustomers(await listCustomers(db, search));
  }, [db, search]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const visible = (customers ?? []).filter((c) =>
    filter === 'owes' ? c.balance > 0 : filter === 'settled' ? c.balance <= 0 : true,
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Row style={styles.header} gap={10}>
        <Row gap={8} style={{ flexShrink: 1 }}>
          <DaftarText role="title" weight="700" numberOfLines={1}>
            {t('tabCustomers')}
          </DaftarText>
          {customers !== null ? (
            <View style={[styles.countBadge, { backgroundColor: colors.primarySoft }]}>
              <DaftarText role="caption" tone="primary" weight="700" numeric>
                {String(visible.length)}
              </DaftarText>
            </View>
          ) : null}
        </Row>
        <DaftarButton
          label={t('addCustomer')}
          icon={UserPlus}
          variant="primary"
          onPress={() => router.push('/customer/form')}
          style={{ flexShrink: 1 }}
        />
      </Row>

      {customers === null ? (
        <CustomersSkeleton />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <SearchBox value={search} onChangeText={setSearch} />
              <ChipRow>
                <DaftarChip
                  label={t('filterAll')}
                  variant="filter"
                  selected={filter === 'all'}
                  onPress={() => setFilter('all')}
                />
                <DaftarChip
                  label={t('filterOwes')}
                  variant="filter"
                  selected={filter === 'owes'}
                  onPress={() => setFilter('owes')}
                />
                <DaftarChip
                  label={t('filterSettled')}
                  variant="filter"
                  selected={filter === 'settled'}
                  onPress={() => setFilter('settled')}
                />
              </ChipRow>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              variant="customers"
              title={t('noCustomers')}
              hint={t('noCustomersHint')}
              actionLabel={search === '' ? t('addCustomer') : undefined}
              onAction={search === '' ? () => router.push('/customer/form') : undefined}
            />
          }
          renderItem={({ item, index }) => (
            <StaggerItem index={index}>
              <CustomerRow customer={item} />
            </StaggerItem>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  countBadge: {
    minWidth: 28,
    height: 26,
    paddingHorizontal: 8,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    gap: 10,
    paddingBottom: 32,
  },
  listHeader: {
    gap: 12,
    marginBottom: 4,
  },
});
