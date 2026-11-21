import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChevronLeft, ChevronRight, ICON_SCALE, UserPlus, X } from '@/components/icons';
import {
  Card,
  CustomerRow,
  CustomersSkeleton,
  DaftarText,
  EmptyState,
  Row,
  SearchBox,
} from '@/components/ui';
import { listCustomers } from '@/db/repository';
import type { CustomerWithBalance } from '@/domain/types';
import { haptic } from '@/lib/haptics';
import { useApp } from '@/state/use-app';
import { useTheme } from '@/theme';

/** 05 · Customer Picker (Modal): auto-focused search, Add customer row, recent-first list. */
export default function PickCustomerScreen() {
  const db = useSQLiteContext();
  const { t, isRTL } = useApp();
  const { colors } = useTheme();
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const entryKind = kind === 'payment' ? 'payment' : 'credit';

  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<CustomerWithBalance[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      listCustomers(db, search).then((list) => {
        // Most recently active first: the customer standing at the counter is usually one of them.
        const sorted = [...list].sort((a, b) => (b.lastActivityAt ?? b.createdAt) - (a.lastActivityAt ?? a.createdAt));
        setCustomers(entryKind === 'payment' ? sorted.filter((c) => c.balance > 0) : sorted);
      });
    }, [db, search, entryKind]),
  );

  const Chevron = isRTL ? ChevronLeft : ChevronRight;
  const headerTitle = `${entryKind === 'payment' ? t('newPayment') : t('newCredit')} · ${t('pickCustomer')}`;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Row style={[styles.header, { borderBottomColor: colors.border }]} gap={10}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('cancel')}
          hitSlop={6}
          onPress={() => {
            haptic.selection();
            router.back();
          }}
          style={[styles.closeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <X size={ICON_SCALE.md.size} color={colors.text} strokeWidth={ICON_SCALE.md.strokeWidth} />
        </Pressable>
        <DaftarText role="heading" weight="700" numberOfLines={1} style={{ flex: 1 }}>
          {headerTitle}
        </DaftarText>
      </Row>

      {customers === null ? (
        <CustomersSkeleton />
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(c) => String(c.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <SearchBox value={search} onChangeText={setSearch} autoFocus />

              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  haptic.selection();
                  router.replace('/customer/form');
                }}>
                <Card style={styles.addRowCard}>
                  <Row gap={12} style={{ justifyContent: 'space-between' }}>
                    <Row gap={12} style={{ flex: 1 }}>
                      <View style={[styles.addIconBox, { backgroundColor: colors.primarySoft }]}>
                        <UserPlus size={ICON_SCALE.sm.size} color={colors.primary} strokeWidth={ICON_SCALE.sm.strokeWidth} />
                      </View>
                      <DaftarText role="body" tone="primary" weight="600">
                        {t('addCustomer')}
                      </DaftarText>
                    </Row>
                    <Chevron size={ICON_SCALE.sm.size} color={colors.primary} strokeWidth={ICON_SCALE.sm.strokeWidth} />
                  </Row>
                </Card>
              </Pressable>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              variant="customers"
              title={t('noCustomers')}
              hint={entryKind === 'payment' ? undefined : t('noCustomersHint')}
              actionLabel={t('addCustomer')}
              onAction={() => router.replace('/customer/form')}
            />
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 32,
  },
  listHeader: {
    gap: 12,
    marginBottom: 4,
  },
  addRowCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  addIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
