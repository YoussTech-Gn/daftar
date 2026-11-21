import { router } from 'expo-router';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ICON, Plus, Search } from '@/components/icons';
import { Avatar, Card, Row, Txt } from '@/components/ui';
import { daysAgo } from '@/domain/time';
import type { CustomerWithBalance } from '@/domain/types';
import { useApp } from '@/state/use-app';
import { usePalette } from '@/theme';

/** One customer: name, description / phone, last activity, balance. Used in the list and the picker. */
export function CustomerRow({
  customer,
  onPress,
  showQuickCredit = true,
}: {
  customer: CustomerWithBalance;
  /** Defaults to opening the customer page. */
  onPress?: () => void;
  showQuickCredit?: boolean;
}) {
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
      onPress={
        onPress ?? (() => router.push({ pathname: '/customer/[id]', params: { id: String(customer.id) } }))
      }>
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
              <Txt weight="800" numberOfLines={1} style={{ color }}>
                {money(Math.abs(customer.balance))}
              </Txt>
              {showQuickCredit ? (
                <Pressable
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() =>
                    router.push({
                      pathname: '/entry/new',
                      params: { customerId: String(customer.id), kind: 'credit' },
                    })
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
              ) : null}
            </View>
          </Row>
        </Card>
      )}
    </Pressable>
  );
}

export function SearchBox({
  value,
  onChangeText,
  autoFocus,
}: {
  value: string;
  onChangeText: (v: string) => void;
  autoFocus?: boolean;
}) {
  const { t, isRTL } = useApp();
  const palette = usePalette();
  return (
    <Row gap={8} style={[styles.search, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <Search size={ICON.md} color={palette.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoFocus={autoFocus}
        placeholder={t('searchCustomers')}
        placeholderTextColor={palette.muted}
        style={{ flex: 1, color: palette.text, fontSize: 16, textAlign: isRTL ? 'right' : 'left' }}
      />
    </Row>
  );
}

const styles = StyleSheet.create({
  search: { minHeight: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14 },
  quick: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
});
