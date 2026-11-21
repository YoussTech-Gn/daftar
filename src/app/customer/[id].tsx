import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Linking, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Row, Txt } from '@/components/ui';
import { deleteCustomer, deleteEntry, getCustomer, listEntries } from '@/db/repository';
import { buildWhatsAppLink } from '@/domain/reminder';
import type { CustomerWithBalance, Entry } from '@/domain/types';
import { useApp } from '@/state/app-context';
import { usePalette } from '@/theme';

export default function CustomerScreen() {
  const db = useSQLiteContext();
  const { t, money, settings, isRTL } = useApp();
  const palette = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const customerId = Number(id);
  const [customer, setCustomer] = useState<CustomerWithBalance | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);

  const load = useCallback(async () => {
    const [c, e] = await Promise.all([getCustomer(db, customerId), listEntries(db, customerId)]);
    setCustomer(c);
    setEntries(e);
  }, [db, customerId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!customer) return null;

  const owes = customer.balance > 0;
  const balanceColor = owes ? palette.credit : customer.balance < 0 ? palette.payment : palette.muted;

  function openEntry(kind: 'credit' | 'payment') {
    router.push({ pathname: '/entry/new', params: { customerId: String(customerId), kind } });
  }

  function remind() {
    if (!customer?.phone) {
      Alert.alert(t('remind'), t('noPhone'));
      return;
    }
    const message = t('reminderTemplate', {
      name: customer.name,
      shop: settings.shopName || t('appName'),
      amount: money(Math.max(customer.balance, 0)),
    });
    Linking.openURL(buildWhatsAppLink(customer.phone, message, settings.countryCode)).catch(() =>
      Alert.alert(t('error')),
    );
  }

  function confirmDeleteCustomer() {
    Alert.alert(t('deleteCustomerTitle'), t('deleteCustomerBody'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteCustomer(db, customerId);
          router.back();
        },
      },
    ]);
  }

  function confirmDeleteEntry(entry: Entry) {
    Alert.alert(t('deleteEntryTitle'), t('deleteEntryBody'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteEntry(db, entry.id);
          load();
        },
      },
    ]);
  }

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: customer.name,
          headerRight: () => (
            <Pressable
              hitSlop={12}
              onPress={() => router.push({ pathname: '/customer/form', params: { id: String(customerId) } })}>
              <Txt weight="600" style={{ color: palette.primary }}>
                {t('edit')}
              </Txt>
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={entries}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 40 }}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 8 }}>
            <Card style={{ alignItems: 'center', gap: 4 }}>
              <Txt muted style={{ textAlign: 'center' }}>
                {t('balance')}
              </Txt>
              <Txt size={34} weight="800" style={{ color: balanceColor, textAlign: 'center' }}>
                {money(Math.abs(customer.balance))}
              </Txt>
              <Txt weight="600" style={{ color: balanceColor, textAlign: 'center' }}>
                {owes ? t('owes') : customer.balance < 0 ? t('advance') : t('settled')}
              </Txt>
            </Card>
            <Row gap={10}>
              <Button label={`↑ ${t('gaveCredit')}`} variant="credit" onPress={() => openEntry('credit')} style={{ flex: 1 }} />
              <Button
                label={`↓ ${t('receivedPayment')}`}
                variant="payment"
                onPress={() => openEntry('payment')}
                style={{ flex: 1 }}
              />
            </Row>
            <Row gap={10}>
              <Button label={t('remind')} variant="whatsapp" onPress={remind} style={{ flex: 1 }} />
              {customer.phone ? (
                <Button
                  label={t('call')}
                  variant="secondary"
                  onPress={() => Linking.openURL(`tel:${customer.phone}`)}
                  style={{ flex: 1 }}
                />
              ) : null}
            </Row>
            <Txt weight="700" size={18} style={{ marginTop: 8 }}>
              {t('history')}
            </Txt>
          </View>
        }
        ListEmptyComponent={<Txt muted>{t('noEntries')}</Txt>}
        renderItem={({ item }) => (
          <Pressable onLongPress={() => confirmDeleteEntry(item)} delayLongPress={400}>
            <Card style={{ paddingVertical: 12 }}>
              <Row gap={12}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: item.kind === 'credit' ? palette.creditSoft : palette.paymentSoft,
                  }}>
                  <Txt weight="800" style={{ color: item.kind === 'credit' ? palette.credit : palette.payment }}>
                    {item.kind === 'credit' ? '↑' : '↓'}
                  </Txt>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt weight="600">
                    {item.kind === 'credit' ? t('creditEntry') : `${t('paymentEntry')} · ${t(`method_${item.method}`)}`}
                  </Txt>
                  {item.note ? (
                    <Txt size={13} muted numberOfLines={2}>
                      {item.note}
                    </Txt>
                  ) : null}
                  <Txt size={12} muted>
                    {new Date(item.createdAt).toLocaleString(settings.language)}
                  </Txt>
                </View>
                <Txt
                  weight="800"
                  style={{ color: item.kind === 'credit' ? palette.credit : palette.payment, textAlign: isRTL ? 'left' : 'right' }}>
                  {item.kind === 'credit' ? '+' : '−'}
                  {money(item.amount)}
                </Txt>
              </Row>
            </Card>
          </Pressable>
        )}
        ListFooterComponent={
          <Button label={t('delete')} variant="danger" onPress={confirmDeleteCustomer} style={{ marginTop: 24 }} />
        }
      />
    </SafeAreaView>
  );
}
