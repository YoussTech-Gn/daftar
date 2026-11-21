import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Linking, Platform, Pressable, ToastAndroid, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  Ban,
  Banknote,
  CheckCheck,
  HandHeart,
  ICON,
  MessageCircle,
  Pencil,
  Phone,
  ShoppingCart,
  Trash2,
  type LucideIcon,
} from '@/components/icons';
import { Button, Card, Row, Txt } from '@/components/ui';
import { UndoBar } from '@/components/undo-bar';
import {
  addEntry,
  cancelEntry,
  getCustomer,
  listEntries,
  restoreCustomer,
  restoreEntry,
  trashCustomer,
} from '@/db/repository';
import { itemLabel, itemsToNote } from '@/domain/calc';
import { buildWhatsAppLink } from '@/domain/reminder';
import type { CustomerWithBalance, Entry } from '@/domain/types';
import { offerReceipt } from '@/lib/receipt';
import { useApp } from '@/state/use-app';
import { usePalette, type Palette } from '@/theme';

function entryLook(e: Entry, palette: Palette): { Icon: LucideIcon; color: string; soft: string; sign: string } {
  if (e.kind === 'forgiven') return { Icon: HandHeart, color: palette.primary, soft: palette.paymentSoft, sign: '−' };
  if (e.kind === 'payment') return { Icon: ArrowDown, color: palette.payment, soft: palette.paymentSoft, sign: '−' };
  const Icon = e.creditType === 'cash' ? Banknote : e.creditType === 'goods' ? ShoppingCart : ArrowUp;
  return { Icon, color: palette.credit, soft: palette.creditSoft, sign: '+' };
}

export default function CustomerScreen() {
  const db = useSQLiteContext();
  const { t, money, settings, isRTL } = useApp();
  const palette = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const customerId = Number(id);
  const [customer, setCustomer] = useState<CustomerWithBalance | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [undo, setUndo] = useState<{ message: string; run: () => Promise<void> } | null>(null);

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

  const hideUndo = useCallback(() => setUndo(null), []);

  if (!customer) return null;

  const owes = customer.balance > 0;
  const inTrash = customer.deletedAt != null;
  const balanceColor = owes ? palette.credit : customer.balance < 0 ? palette.payment : palette.muted;

  function entryTitle(e: Entry): string {
    if (e.kind === 'forgiven') return t('forgiven');
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

  function openEntry(kind: 'credit' | 'payment', settle = false) {
    router.push({
      pathname: '/entry/new',
      params: { customerId: String(customerId), kind, ...(settle ? { settle: '1' } : {}) },
    });
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

  function confirmForgive() {
    if (!customer || customer.balance <= 0) return;
    const c = customer;
    Alert.alert(t('forgiveTitle', { name: c.name }), t('forgiveBody', { amount: money(c.balance) }), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('forgive'),
        onPress: async () => {
          await addEntry(db, {
            customerId,
            kind: 'forgiven',
            amount: c.balance,
            method: 'other',
            note: null,
          });
          await load();
          offerReceipt(
            {
              t,
              money,
              shopName: settings.shopName,
              countryCode: settings.countryCode,
              customer: c,
              kind: 'forgiven',
              amount: c.balance,
              items: '',
              newBalance: 0,
            },
            () => undefined,
          );
        },
      },
    ]);
  }

  function confirmTrash() {
    Alert.alert(t('trashCustomerTitle'), t('trashCustomerBody'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('moveToTrash'),
        style: 'destructive',
        onPress: async () => {
          await trashCustomer(db, customerId);
          if (Platform.OS === 'android') ToastAndroid.show(t('movedToTrash'), ToastAndroid.LONG);
          router.back();
        },
      },
    ]);
  }

  function onEntryLongPress(entry: Entry) {
    if (entry.cancelledAt) {
      Alert.alert(t('restoreEntryTitle'), t('restoreEntryBody'), [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('restore'),
          onPress: async () => {
            await restoreEntry(db, entry);
            load();
          },
        },
      ]);
      return;
    }
    Alert.alert(t('cancelEntryTitle'), t('cancelEntryBody'), [
      { text: t('keep'), style: 'cancel' },
      {
        text: t('cancelEntry'),
        style: 'destructive',
        onPress: async () => {
          await cancelEntry(db, entry);
          await load();
          setUndo({
            message: t('entryCancelled'),
            run: async () => {
              await restoreEntry(db, entry);
              await load();
            },
          });
        },
      },
    ]);
  }

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: customer.name,
          headerRight: inTrash
            ? undefined
            : () => (
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
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 8 }}>
            {inTrash ? (
              <Card style={{ gap: 10, borderColor: palette.danger }}>
                <Txt weight="700" style={{ color: palette.danger }}>
                  {t('inTrashBanner')}
                </Txt>
                <Button
                  label={t('restore')}
                  icon={ArchiveRestore}
                  variant="secondary"
                  onPress={async () => {
                    await restoreCustomer(db, customerId);
                    load();
                  }}
                />
              </Card>
            ) : null}
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
            {!inTrash ? (
              <>
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
                {owes ? (
                  <Row gap={10}>
                    <Button
                      label={t('settleAll')}
                      icon={CheckCheck}
                      variant="secondary"
                      onPress={() => openEntry('payment', true)}
                      style={{ flex: 1 }}
                    />
                    <Button
                      label={t('forgive')}
                      icon={HandHeart}
                      variant="secondary"
                      onPress={confirmForgive}
                      style={{ flex: 1 }}
                    />
                  </Row>
                ) : null}
                <Row gap={10}>
                  <Button
                    label={t('remind')}
                    icon={MessageCircle}
                    variant="whatsapp"
                    onPress={remind}
                    style={{ flex: 1 }}
                  />
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
              </>
            ) : null}
            <Txt weight="700" size={18} style={{ marginTop: 8 }}>
              {t('history')}
            </Txt>
          </View>
        }
        ListEmptyComponent={<Txt muted>{t('noEntries')}</Txt>}
        renderItem={({ item }) => {
          const look = entryLook(item, palette);
          const cancelled = item.cancelledAt != null;
          return (
            <Pressable onLongPress={() => !inTrash && onEntryLongPress(item)} delayLongPress={400}>
              <Card style={{ paddingVertical: 12, opacity: cancelled ? 0.55 : 1 }}>
                <Row gap={12}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: cancelled ? palette.border : look.soft,
                    }}>
                    {cancelled ? (
                      <Ban size={ICON.md} color={palette.muted} />
                    ) : (
                      <look.Icon size={ICON.md} color={look.color} />
                    )}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt weight="600">
                      {entryTitle(item)}
                      {cancelled ? ` · ${t('cancelled')}` : ''}
                    </Txt>
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
                    numberOfLines={1}
                    style={{
                      flexShrink: 0,
                      color: cancelled ? palette.muted : look.color,
                      textAlign: isRTL ? 'left' : 'right',
                      textDecorationLine: cancelled ? 'line-through' : 'none',
                    }}>
                    {money(item.amount, look.sign)}
                  </Txt>
                </Row>
              </Card>
            </Pressable>
          );
        }}
        ListFooterComponent={
          inTrash ? undefined : (
            <Button
              label={t('moveToTrash')}
              icon={Trash2}
              variant="danger"
              onPress={confirmTrash}
              style={{ marginTop: 24 }}
            />
          )
        }
      />
      {undo ? <UndoBar message={undo.message} onUndo={() => undo.run()} onHide={hideUndo} /> : null}
    </SafeAreaView>
  );
}
