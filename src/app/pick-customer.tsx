import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';

import { CustomerRow, SearchBox } from '@/components/customer-row';
import { ICON, UserPlus } from '@/components/icons';
import { Button, Txt } from '@/components/ui';
import { listCustomers } from '@/db/repository';
import type { CustomerWithBalance } from '@/domain/types';
import { useApp } from '@/state/use-app';

/**
 * First step of "New credit" / "Payment" from Home or the centre tab button:
 * choose the customer (most recent activity first), then go to the entry screen.
 */
export default function PickCustomerScreen() {
  const db = useSQLiteContext();
  const { t } = useApp();
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const entryKind = kind === 'payment' ? 'payment' : 'credit';
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<CustomerWithBalance[]>([]);

  useFocusEffect(
    useCallback(() => {
      listCustomers(db, search).then((list) => {
        // Most recently active first: the customer standing at the counter is usually one of them.
        const sorted = [...list].sort((a, b) => (b.lastActivityAt ?? b.createdAt) - (a.lastActivityAt ?? a.createdAt));
        setCustomers(entryKind === 'payment' ? sorted.filter((c) => c.balance > 0) : sorted);
      });
    }, [db, search, entryKind]),
  );

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: `${entryKind === 'payment' ? t('newPayment') : t('newCredit')} · ${t('pickCustomer')}` }} />
      <FlatList
        data={customers}
        keyExtractor={(c) => String(c.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 4 }}>
            <SearchBox value={search} onChangeText={setSearch} autoFocus />
            <Button
              label={t('addCustomer')}
              icon={UserPlus}
              variant="secondary"
              onPress={() => router.replace('/customer/form')}
            />
          </View>
        }
        ListEmptyComponent={
          <Txt muted style={{ textAlign: 'center', marginTop: ICON.lg }}>
            {t('noCustomers')}
          </Txt>
        }
        renderItem={({ item }) => (
          <CustomerRow
            customer={item}
            showQuickCredit={false}
            onPress={() =>
              router.replace({ pathname: '/entry/new', params: { customerId: String(item.id), kind: entryKind } })
            }
          />
        )}
      />
    </View>
  );
}
