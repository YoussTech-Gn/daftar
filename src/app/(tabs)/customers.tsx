import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ICON_SCALE, Plus, Search, UserPlus, X } from '@/components/icons';
import { AmountDisplay, Avatar } from '@/components/ui';
import { DOCK_SPACE } from '@/components/v4/floating-dock';
import { Segmented, Txt } from '@/components/v4/primitives';
import { listCustomers } from '@/db/repository';
import { compareByDebt } from '@/domain/reading';
import type { CustomerWithBalance } from '@/domain/types';
import { haptic } from '@/lib/haptics';
import { useSessionStore } from '@/state/session-store';
import { useApp } from '@/state/use-app';
import { useLedgerReload } from '@/state/use-ledger-reload';
import { getFontFamily, useTheme, v4 } from '@/theme';

type Filter = 'all' | 'owes' | 'settled' | 'advance';

function matches(c: CustomerWithBalance, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  return [c.name, c.phone ?? '', c.note ?? ''].some((v) => v.toLowerCase().includes(needle));
}

/** 02 · Clients (V4, decision 0018): live count + advance total, search, 4-state filter, unified glass list. */
export default function CustomersScreen() {
  const db = useSQLiteContext();
  const { t, settings, isRTL, money } = useApp();
  const { colors, scheme } = useTheme();
  const openOperation = useSessionStore((s) => s.openOperation);
  const setNewCustomerOpen = useSessionStore((s) => s.setNewCustomerOpen);

  const [all, setAll] = useState<CustomerWithBalance[] | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => setAll(await listCustomers(db)), [db]);
  useLedgerReload(load);

  const visible = useMemo(
    () =>
      (all ?? [])
        .filter(
          (c) =>
            matches(c, search.trim()) &&
            (filter === 'owes' ? c.balance > 0 : filter === 'settled' ? c.balance === 0 : filter === 'advance' ? c.balance < 0 : true),
        )
        .slice()
        .sort(compareByDebt),
    [all, search, filter],
  );

  const dir = isRTL ? 'flex-row-reverse' : 'flex-row';
  const count = all?.length ?? 0;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <FlatList
        data={visible}
        keyExtractor={(c) => String(c.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: DOCK_SPACE }}
        ListHeaderComponent={
          <View className="mb-3 gap-3">
            <View className={`items-center gap-3 ${dir}`}>
              <View className="flex-1 gap-0.5">
                <Txt weight="700" className="text-2xl" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {t('tabCustomers')}
                </Txt>
                <Txt className="text-xs text-ink-2" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {t('customersCount', { n: count })}
                </Txt>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('addCustomer')}
                onPress={() => {
                  haptic.selection();
                  setNewCustomerOpen(true);
                }}
                className="h-12 w-12 items-center justify-center rounded-2xl bg-fab-bg active:opacity-80">
                <Plus size={ICON_SCALE.md.size} color={v4(scheme, 'fab-fg')} strokeWidth={2.4} />
              </Pressable>
            </View>

            <View className={`min-h-[48px] items-center gap-2 rounded-2xl border border-line bg-surface px-4 ${dir}`}>
              <Search size={ICON_SCALE.sm.size} color={v4(scheme, 'text-muted')} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t('searchCustomers')}
                placeholderTextColor={v4(scheme, 'text-muted')}
                className="flex-1 py-3 text-base text-ink"
                style={{ fontFamily: getFontFamily(settings.language, '500'), textAlign: isRTL ? 'right' : 'left' }}
              />
              {search ? (
                <Pressable accessibilityRole="button" accessibilityLabel={t('cancel')} hitSlop={10} onPress={() => setSearch('')}>
                  <X size={ICON_SCALE.sm.size} color={v4(scheme, 'text-secondary')} />
                </Pressable>
              ) : null}
            </View>

            <Segmented
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: t('filterAll') },
                { value: 'owes', label: t('filterOwesShort'), activeClassName: 'text-credit' },
                { value: 'settled', label: t('filterSettled') },
                { value: 'advance', label: t('filterAdvance'), activeClassName: 'text-payment' },
              ]}
            />
          </View>
        }
        ListEmptyComponent={
          all === null ? undefined : (
            <View className="items-center gap-3 rounded-card border border-line bg-surface px-6 py-10">
              <UserPlus size={ICON_SCALE.lg.size} color={v4(scheme, 'text-muted')} />
              <Txt className="text-center text-sm text-ink-2">{count === 0 ? t('noCustomers') : t('noMatch')}</Txt>
            </View>
          )
        }
        renderItem={({ item: c, index }) => {
          const first = index === 0;
          const last = index === visible.length - 1;
          const owes = c.balance > 0;
          const advance = c.balance < 0;
          const hint = (c.note ?? '').trim() || c.phone || '';
          const amountLabel =
            c.balance === 0
              ? t('settled')
              : advance
                ? `${t('advanceLabel')} ${money(Math.abs(c.balance))}`
                : money(c.balance);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${c.name}. ${amountLabel}`}
              onPress={() => {
                haptic.selection();
                router.push({ pathname: '/customer/[id]', params: { id: String(c.id) } });
              }}
              onLongPress={() => {
                haptic.selection();
                openOperation({ kind: owes ? 'payment' : 'credit', customerId: c.id });
              }}
              className={`min-h-[68px] items-center gap-3 border-x border-line bg-surface px-4 py-3 active:bg-surface-muted ${first ? 'rounded-t-card border-t' : ''} ${last ? 'rounded-b-card border-b' : 'border-b'} ${dir}`}>
              <Avatar name={c.name} id={c.id} size={42} />
              <View className="flex-1 gap-0.5">
                <Txt weight="600" numberOfLines={1} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {c.name}
                </Txt>
                {hint ? (
                  <Txt numberOfLines={1} className="text-xs text-ink-3" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {hint}
                  </Txt>
                ) : null}
              </View>
              <View className={`gap-0.5 ${isRTL ? 'items-start' : 'items-end'}`}>
                {c.balance === 0 ? (
                  <Txt weight="600" className="text-sm text-ink-3">
                    {t('settled')}
                  </Txt>
                ) : (
                  <>
                    <AmountDisplay
                      amount={Math.abs(c.balance)}
                      size="heading"
                      color={advance ? colors.paymentDeep : colors.creditDeep}
                    />
                    {advance ? <Txt className="text-xs text-payment">{t('advanceLabel')}</Txt> : null}
                  </>
                )}
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
