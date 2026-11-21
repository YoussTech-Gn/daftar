import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Linking, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ArrowDown,
  ArrowUp,
  Banknote,
  ICON,
  MessageCircle,
  Pencil,
  Phone,
  ShoppingCart,
  Trash2,
} from '@/components/icons';
import { Button, Card, Row, Txt } from '@/components/ui';
import { deleteCustomer, deleteEntry, getCustomer, listEntries } from '@/db/repository';
import { itemLabel, itemsToNote } from '@/domain/calc';
import { buildWhatsAppLink } from '@/domain/reminder';
import type { CustomerWithBalance, Entry } from '@/domain/types';
import { useApp } from '@/state/use-app';
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

  function entryTitle(e: Entry): string {
    if (e.kind === 'payment') return `${t('paymentEntry')} · ${t(`method_${e.method}`)}`;
    if (e.creditType === 'cash') return t('creditCash');
    if (e.creditType === 'goods') return t('creditGoods');
    return t('creditEntry');
  }

  /** The free note without the auto-generated item summary (already shown line by line). */
  function extraNote(e: Entry): string {
    if (!e.note) return '';
    const items = e.items ?? [];
    if (items.length === 0) return e.note;
    const summary = itemsToNote(items.map((i) => ({ name: i.name, price: i.unitPrice, qty: i.qty, unit: i.unit })));
    return e.note.startsWith(summary) ? e.note.slice(summary.length).replace(/^\s*—\s*/, '') : e.note;
  }

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
              <Row gap={6}>
                <Pencil size={ICON.sm} color={palette.primary} />
                <Txt weight="600" style={{ color: palette.primary }}>
                  {t('edit')}
                </Txt>
              </Row>
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
              {customer.note || customer.phone ? (
                <Txt size={13} muted style={{ textAlign: 'center' }}>
                  {[customer.note, customer.phone].filter(Boolean).join(' · ')}
                </Txt>
              ) : null}
            </Card>
            <Row gap={10}>
              <Button
                label={t('gaveCredit')}
                icon={ArrowUp}
                variant="credit"
                onPress={() => openEntry('credit')}
                style={{ flex: 1 }}
              />
              <Button
                label={t('receivedPayment')}
                icon={ArrowDown}
                variant="payment"
                onPress={() => openEntry('payment')}
                style={{ flex: 1 }}
              />
            </Row>
            <Row gap={10}>
              <Button label={t('remind')} icon={MessageCircle} variant="whatsapp" onPress={remind} style={{ flex: 1 }} />
              {customer.phone ? (
                <Button
                  label={t('call')}
                  icon={Phone}
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
                  {(() => {
                    const EntryIcon =
                      item.kind === 'payment'
                        ? ArrowDown
                        : item.creditType === 'cash'
                          ? Banknote
                          : item.creditType === 'goods'
                            ? ShoppingCart
                            : ArrowUp;
                    return (
                      <EntryIcon size={ICON.md} color={item.kind === 'credit' ? palette.credit : palette.payment} />
                    );
                  })()}
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt weight="600">{entryTitle(item)}</Txt>
                  {(item.items ?? []).map((line, i) => (
                    <Row key={i} style={{ justifyContent: 'space-between' }}>
                      <Txt size={13} numberOfLines={1} style={{ flexShrink: 1 }}>
                        {itemLabel({ name: line.name, price: line.unitPrice, qty: line.qty, unit: line.unit })}
                      </Txt>
                      <Txt size={13} muted>
                        {money(line.total)}
                      </Txt>
                    </Row>
                  ))}
                  {extraNote(item) ? (
                    <Txt size={13} muted numberOfLines={2}>
                      {extraNote(item)}
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
          <Button
            label={t('delete')}
            icon={Trash2}
            variant="danger"
            onPress={confirmDeleteCustomer}
            style={{ marginTop: 24 }}
          />
        }
      />
    </SafeAreaView>
  );
}
