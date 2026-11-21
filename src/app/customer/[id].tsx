import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AlertCircle,
  ArchiveRestore,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCheck,
  HeartHandshake,
  ICON_SCALE,
  MessageCircle,
  Pencil,
  Phone,
  Trash2,
} from '@/components/icons';
import {
  AmountDisplay,
  Avatar,
  ConfirmationDialog,
  CustomerDetailSkeleton,
  DaftarButton,
  DaftarText,
  EmptyState,
  EntryRow,
  ReceiptPromptSheet,
  Row,
  StampSaveOverlay,
  UndoBar5s,
} from '@/components/ui';
import {
  addEntry,
  cancelEntry,
  getCustomer,
  listEntries,
  restoreCustomer,
  restoreEntry,
  trashCustomer,
  TRASH_RETENTION_MS,
} from '@/db/repository';
import { itemsToNote } from '@/domain/calc';
import { buildWhatsAppLink, stripDirectionMarks } from '@/domain/reminder';
import type { CustomerWithBalance, Entry } from '@/domain/types';
import { haptic } from '@/lib/haptics';
import { buildReceiptPayload, type ReceiptPayload } from '@/lib/receipt';
import { useSessionStore } from '@/state/session-store';
import { useApp } from '@/state/use-app';
import { useTheme } from '@/theme';

const DAY_MS = 24 * 60 * 60 * 1000;

/** 09 · Customer Page (+ Trash variant): balance hero, CTAs, chronological EntryRow history, dialogs & 5s Undo. */
export default function CustomerScreen() {
  const db = useSQLiteContext();
  const { t, money, settings, isRTL } = useApp();
  const { colors, shadows } = useTheme();
  const showToast = useSessionStore((s) => s.showToast);
  const lastSavedEntry = useSessionStore((s) => s.lastSavedEntry);
  const clearSavedEntry = useSessionStore((s) => s.clearSavedEntry);

  const { id } = useLocalSearchParams<{ id: string }>();
  const customerId = Number(id);

  const [customer, setCustomer] = useState<CustomerWithBalance | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [now, setNow] = useState(0);
  const [undo, setUndo] = useState<{ message: string; run: () => Promise<void> } | null>(null);

  const [forgiveDialogOpen, setForgiveDialogOpen] = useState(false);
  const [trashDialogOpen, setTrashDialogOpen] = useState(false);
  const [entryDialog, setEntryDialog] = useState<{ entry: Entry; mode: 'cancel' | 'restore' } | null>(null);

  const [forgiveHighlightId, setForgiveHighlightId] = useState<number | null>(null);
  const [stampAmount, setStampAmount] = useState<number | null>(null);
  const [pendingReceipt, setPendingReceipt] = useState<ReceiptPayload | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<ReceiptPayload | null>(null);

  const load = useCallback(async () => {
    const [c, e] = await Promise.all([getCustomer(db, customerId), listEntries(db, customerId)]);
    setCustomer(c);
    setEntries(e);
    setNow(Date.now());
  }, [db, customerId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    if (!lastSavedEntry) return;
    const timer = setTimeout(clearSavedEntry, 600);
    return () => clearTimeout(timer);
  }, [clearSavedEntry, lastSavedEntry]);

  const hideUndo = useCallback(() => setUndo(null), []);

  const handleStampFinish = useCallback(() => {
    setStampAmount(null);
    if (pendingReceipt) {
      setActiveReceipt(pendingReceipt);
      setPendingReceipt(null);
    }
  }, [pendingReceipt]);

  const handleReceiptDone = useCallback(() => {
    setActiveReceipt(null);
  }, []);

  if (!customer) {
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
        <CustomerDetailSkeleton />
      </SafeAreaView>
    );
  }

  const owes = customer.balance > 0;
  const advance = customer.balance < 0;
  const inTrash = customer.deletedAt != null;
  const daysLeft =
    inTrash && now > 0
      ? Math.max(0, Math.ceil(((customer.deletedAt ?? 0) + TRASH_RETENTION_MS - now) / DAY_MS))
      : 0;

  const lastCredit = entries.find((e) => e.kind === 'credit' && !e.cancelledAt);
  const lastPayment = entries.find((e) => e.kind !== 'credit' && !e.cancelledAt);
  const shortDate = (ts: number) =>
    new Date(ts).toLocaleDateString(settings.language, { day: 'numeric', month: 'short' });

  const balanceColor = owes ? colors.creditDeep : colors.paymentDeep;
  const statusBg = owes ? colors.creditSoft : colors.paymentSoft;
  const barColor = owes ? colors.credit : colors.payment;

  function entryTitle(e: Entry): string {
    if (e.kind === 'forgiven') return t('forgiven');
    if (e.kind === 'payment') return t('paymentEntry');
    if (e.creditType === 'cash') return t('creditCash');
    if (e.creditType === 'goods') return t('creditGoods');
    return t('creditEntry');
  }

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
      showToast(t('noPhone'));
      return;
    }
    const rawMessage = t('reminderTemplate', {
      name: customer.name,
      shop: settings.shopName || t('appName'),
      amount: money(Math.max(customer.balance, 0)),
    });
    const message = stripDirectionMarks(rawMessage);
    Linking.openURL(buildWhatsAppLink(customer.phone, message, settings.countryCode)).catch(() =>
      showToast(t('error')),
    );
  }

  async function executeForgive() {
    if (!customer || customer.balance <= 0) return;
    const c = customer;
    const forgivenAmount = c.balance;
    setForgiveDialogOpen(false);
    const entryId = await addEntry(db, {
      customerId,
      kind: 'forgiven',
      amount: forgivenAmount,
      method: 'other',
      note: null,
    });
    haptic.success();
    setForgiveHighlightId(entryId);
    await load();
    setTimeout(() => setForgiveHighlightId(null), 700);

    const receipt = buildReceiptPayload({
      t,
      money,
      shopName: settings.shopName,
      countryCode: settings.countryCode,
      customer: c,
      kind: 'forgiven',
      amount: forgivenAmount,
      items: '',
      newBalance: 0,
    });
    setPendingReceipt(receipt);
    setStampAmount(forgivenAmount);
  }

  async function executeTrash() {
    setTrashDialogOpen(false);
    await trashCustomer(db, customerId);
    haptic.warning();
    showToast(t('movedToTrash'));
    router.back();
  }

  async function executeEntryDialog() {
    if (!entryDialog) return;
    const { entry, mode } = entryDialog;
    setEntryDialog(null);

    if (mode === 'restore') {
      await restoreEntry(db, entry);
      haptic.success();
      await load();
      return;
    }

    await cancelEntry(db, entry);
    haptic.warning();
    await load();
    setUndo({
      message: t('entryCancelled'),
      run: async () => {
        await restoreEntry(db, entry);
        await load();
      },
    });
  }

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen
        options={{
          title: customer.name,
          headerRight: inTrash
            ? undefined
            : () => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('edit')}
                  hitSlop={12}
                  onPress={() => router.push({ pathname: '/customer/form', params: { id: String(customerId) } })}
                  style={styles.headerEditBtn}>
                  <Row gap={6}>
                    <Pencil size={ICON_SCALE.sm.size} color={colors.primary} strokeWidth={ICON_SCALE.sm.strokeWidth} />
                    <DaftarText role="label" tone="primary" weight="600">
                      {t('edit')}
                    </DaftarText>
                  </Row>
                </Pressable>
              ),
        }}
      />

      <FlatList
        data={entries}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            {inTrash ? (
              <View
                style={[
                  styles.trashBanner,
                  { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
                ]}>
                <Row gap={10}>
                  <AlertCircle size={ICON_SCALE.md.size} color={colors.danger} strokeWidth={ICON_SCALE.md.strokeWidth} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <DaftarText role="label" tone="danger" weight="700">
                      {t('inTrashBanner')}
                    </DaftarText>
                    <DaftarText role="caption" tone="danger">
                      {t('daysLeft', { n: daysLeft })}
                    </DaftarText>
                  </View>
                </Row>
                <DaftarButton
                  label={t('restore')}
                  icon={ArchiveRestore}
                  variant="secondary"
                  onPress={async () => {
                    await restoreCustomer(db, customerId);
                    haptic.success();
                    load();
                  }}
                />
              </View>
            ) : null}

            {/* Balance Hero Card */}
            <View
              style={[
                styles.heroCard,
                shadows.card,
                { backgroundColor: colors.surface, paddingStart: 20, paddingEnd: 16 },
              ]}>
              <View
                style={[
                  styles.heroAccentBar,
                  { backgroundColor: barColor },
                  isRTL ? { right: 0 } : { left: 0 },
                ]}
              />

              <Row gap={12}>
                <Avatar name={customer.name} size={46} />
                <View style={{ flex: 1, gap: 2 }}>
                  <DaftarText role="title" weight="700" numberOfLines={1}>
                    {customer.name}
                  </DaftarText>
                  {customer.note || customer.phone ? (
                    <DaftarText role="caption" tone="secondary" numberOfLines={2}>
                      {[customer.note, customer.phone].filter(Boolean).join(' · ')}
                    </DaftarText>
                  ) : null}
                </View>
                <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
                  <DaftarText role="caption" weight="700" style={{ color: balanceColor }}>
                    {owes ? t('owes') : advance ? t('advance') : t('settled')}
                  </DaftarText>
                </View>
              </Row>

              <View style={styles.balanceCenter}>
                <DaftarText role="caption" tone="muted" align="center">
                  {t('balance')}
                </DaftarText>
                <AmountDisplay
                  amount={Math.abs(customer.balance)}
                  size="display"
                  animate
                  color={balanceColor}
                  align="center"
                />
              </View>

              {lastCredit || lastPayment ? (
                <DaftarText role="caption" tone="muted" align="center">
                  {[
                    lastCredit ? t('lastCredit', { date: shortDate(lastCredit.createdAt) }) : null,
                    lastPayment ? t('lastPayment', { date: shortDate(lastPayment.createdAt) }) : t('neverPaid'),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </DaftarText>
              ) : null}
            </View>

            {/* Primary & Secondary CTAs */}
            {!inTrash ? (
              <View style={{ gap: 10 }}>
                <Row gap={10}>
                  <DaftarButton
                    label={t('gaveCredit')}
                    icon={ArrowUpRight}
                    variant="credit"
                    onPress={() => openEntry('credit')}
                    style={{ flex: 1 }}
                  />
                  <DaftarButton
                    label={t('receivedPayment')}
                    icon={ArrowDownLeft}
                    variant="payment"
                    onPress={() => openEntry('payment')}
                    style={{ flex: 1 }}
                  />
                </Row>

                {owes ? (
                  <Row gap={10}>
                    <DaftarButton
                      label={t('settleAll')}
                      icon={CheckCheck}
                      variant="secondary"
                      onPress={() => openEntry('payment', true)}
                      style={{ flex: 1 }}
                    />
                    <DaftarButton
                      label={t('forgive')}
                      icon={HeartHandshake}
                      variant="forgiven"
                      onPress={() => setForgiveDialogOpen(true)}
                      style={{ flex: 1 }}
                    />
                  </Row>
                ) : null}

                <Row gap={10}>
                  <DaftarButton
                    label={t('remind')}
                    icon={MessageCircle}
                    variant="whatsapp"
                    onPress={remind}
                    style={{ flex: 1 }}
                  />
                  {customer.phone ? (
                    <DaftarButton
                      label={t('call')}
                      icon={Phone}
                      variant="secondary"
                      onPress={() => Linking.openURL(`tel:${customer.phone}`).catch(() => undefined)}
                      style={{ flex: 1 }}
                    />
                  ) : null}
                </Row>
              </View>
            ) : null}

            <DaftarText role="heading" weight="700" style={{ marginTop: 6 }}>
              {t('history')}
            </DaftarText>
          </View>
        }
        ListEmptyComponent={<EmptyState variant="activity" title={t('noEntries')} />}
        renderItem={({ item }) => {
          const highlightMode =
            forgiveHighlightId === item.id
              ? 'forgiven'
              : lastSavedEntry?.id === item.id
                ? lastSavedEntry.kind
                : null;

          const badge =
            item.kind === 'payment'
              ? t(`method_${item.method}`)
              : item.kind === 'forgiven'
                ? t('forgivenGrace')
                : undefined;

          return (
            <EntryRow
              title={entryTitle(item)}
              kind={item.kind}
              creditType={item.creditType}
              method={item.method}
              amount={item.amount}
              items={item.items}
              note={extraNote(item)}
              badgeLabel={badge}
              timestampLabel={new Date(item.createdAt).toLocaleString(settings.language)}
              cancelled={item.cancelledAt != null}
              highlightMode={highlightMode}
              onLongPress={
                inTrash
                  ? undefined
                  : () => {
                      haptic.selection();
                      setEntryDialog({
                        entry: item,
                        mode: item.cancelledAt ? 'restore' : 'cancel',
                      });
                    }
              }
            />
          );
        }}
        ListFooterComponent={
          inTrash ? undefined : (
            <View style={{ marginTop: 18 }}>
              <DaftarButton
                label={t('moveToTrash')}
                icon={Trash2}
                variant="dangerSoft"
                onPress={() => setTrashDialogOpen(true)}
              />
            </View>
          )
        }
      />

      {undo ? <UndoBar5s message={undo.message} onUndo={() => undo.run()} onHide={hideUndo} /> : null}

      <ConfirmationDialog
        visible={forgiveDialogOpen}
        title={t('forgiveTitle', { name: customer.name })}
        body={t('forgiveBody', { amount: money(customer.balance) })}
        confirmLabel={t('forgive')}
        tone="forgiven"
        icon="forgive"
        amount={customer.balance}
        onCancel={() => setForgiveDialogOpen(false)}
        onConfirm={executeForgive}
      />

      <ConfirmationDialog
        visible={trashDialogOpen}
        title={t('trashCustomerTitle')}
        body={t('trashCustomerBody')}
        confirmLabel={t('moveToTrash')}
        tone="danger"
        icon="trash"
        onCancel={() => setTrashDialogOpen(false)}
        onConfirm={executeTrash}
      />

      <ConfirmationDialog
        visible={entryDialog !== null}
        title={entryDialog?.mode === 'restore' ? t('restoreEntryTitle') : t('cancelEntryTitle')}
        body={entryDialog?.mode === 'restore' ? t('restoreEntryBody') : t('cancelEntryBody')}
        confirmLabel={entryDialog?.mode === 'restore' ? t('restore') : t('cancelEntry')}
        cancelLabel={entryDialog?.mode === 'restore' ? t('cancel') : t('keep')}
        tone={entryDialog?.mode === 'restore' ? 'primary' : 'danger'}
        icon={entryDialog?.mode === 'restore' ? 'restore' : 'cancel'}
        onCancel={() => setEntryDialog(null)}
        onConfirm={executeEntryDialog}
      />

      <StampSaveOverlay
        visible={stampAmount !== null}
        amount={stampAmount ?? 0}
        onFinish={handleStampFinish}
      />

      <ReceiptPromptSheet payload={activeReceipt} onDone={handleReceiptDone} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerEditBtn: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  listContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 96,
  },
  headerBlock: {
    gap: 14,
    marginBottom: 4,
  },
  trashBanner: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
  },
  heroCard: {
    borderRadius: 20,
    paddingVertical: 18,
    gap: 14,
    position: 'relative',
  },
  heroAccentBar: {
    position: 'absolute',
    top: 16,
    bottom: 16,
    width: 4,
    borderRadius: 4,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    flexShrink: 0,
  },
  balanceCenter: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: 2,
  },
});
