import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { ChevronRight, ICON_SCALE, ShoppingBag } from '@/components/icons';
import { AmountDisplay, ReceiptPromptSheet } from '@/components/ui';
import { addEntry, getCustomer, listCustomers } from '@/db/repository';
import { parseAmount } from '@/domain/currency';
import type { CustomerWithBalance, PaymentMethod } from '@/domain/types';
import { haptic } from '@/lib/haptics';
import { buildReceiptPayload, type ReceiptPayload } from '@/lib/receipt';
import { useSessionStore, type OperationSheetState } from '@/state/session-store';
import { useApp } from '@/state/use-app';
import { useTheme, v4 } from '@/theme';
import { Numpad, PrimaryButton, Segmented, Sheet, Txt } from './primitives';

/** Quick methods shown in the sheet (the full list stays on the detailed entry screen). */
const QUICK_METHODS: PaymentMethod[] = ['cash', 'wave', 'orange_money'];

/**
 * "Nouvelle opération" — numpad-first bottom sheet (decision 0018).
 * Crédit (+) / Paiement (−), client chips, payment method chips (payment only), numpad, Valider.
 * Saving bumps `ledgerVersion` so Accueil, Clients and Rapports re-render at once.
 */
export function OperationSheet() {
  const { t } = useApp();
  const operation = useSessionStore((s) => s.operation);
  const closeOperation = useSessionStore((s) => s.closeOperation);
  const [receipt, setReceipt] = useState<ReceiptPayload | null>(null);

  return (
    <>
      <Sheet visible={operation !== null} onClose={closeOperation} title={t('newOperation')}>
        {/* Keyed by the opening time: every opening starts from a fresh form. */}
        {operation ? <OperationForm key={operation.openedAt} initial={operation} onReceipt={setReceipt} /> : null}
      </Sheet>
      <ReceiptPromptSheet payload={receipt} onDone={() => setReceipt(null)} />
    </>
  );
}

function OperationForm({
  initial,
  onReceipt,
}: {
  initial: OperationSheetState;
  onReceipt: (receipt: ReceiptPayload | null) => void;
}) {
  const db = useSQLiteContext();
  const { t, settings, money, isRTL } = useApp();
  const { colors, scheme } = useTheme();
  const closeOperation = useSessionStore((s) => s.closeOperation);
  const bumpLedger = useSessionStore((s) => s.bumpLedger);
  const showToast = useSessionStore((s) => s.showToast);

  const [kind, setKind] = useState<'credit' | 'payment'>(initial.kind);
  const [customerId, setCustomerId] = useState<number | null>(initial.customerId);
  const [digits, setDigits] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [customers, setCustomers] = useState<CustomerWithBalance[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listCustomers(db).then((list) =>
      setCustomers([...list].sort((a, b) => (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0))),
    );
  }, [db]);

  // The pre-selected client comes first so it is always visible in the chip row.
  const chips = useMemo(() => {
    const picked = customers.find((c) => c.id === customerId);
    return picked ? [picked, ...customers.filter((c) => c.id !== customerId)] : customers;
  }, [customers, customerId]);
  const selected = customers.find((c) => c.id === customerId) ?? null;

  const amount = digits ? (parseAmount(digits, settings.currency) ?? 0) : 0;

  function onKey(key: string) {
    setDigits((d) => {
      if (key === 'back') return d.slice(0, -1);
      const next = (d + key).replace(/^0+/, '');
      return next.length > 12 ? d : next;
    });
  }

  async function submit() {
    if (!selected || amount <= 0 || saving) return;
    setSaving(true);
    try {
      await addEntry(db, {
        customerId: selected.id,
        kind,
        amount,
        method: kind === 'payment' ? method : 'cash',
        note: null,
        creditType: kind === 'credit' ? 'cash' : null,
        settlesAll: kind === 'payment' && amount === selected.balance,
      });
    } catch {
      haptic.warning();
      showToast(t('saveFailed'));
      setSaving(false);
      return;
    }
    haptic.success();
    bumpLedger();
    closeOperation();
    setSaving(false);
    showToast(t('opSaved', { amount: money(amount), name: selected.name }));
    const updated = await getCustomer(db, selected.id).catch(() => null);
    onReceipt(
      buildReceiptPayload({
        t,
        money,
        shopName: settings.shopName,
        countryCode: settings.countryCode,
        customer: selected,
        kind,
        amount,
        items: '',
        newBalance: updated?.balance ?? 0,
      }),
    );
  }

  const amountColor = kind === 'credit' ? colors.creditDeep : colors.paymentDeep;

  return (
    <View className="gap-3">
      <Segmented
        value={kind}
        onChange={setKind}
        options={[
          { value: 'credit', label: t('opCredit'), activeClassName: 'text-credit' },
          { value: 'payment', label: t('opPayment'), activeClassName: 'text-payment' },
        ]}
      />

      {customers.length === 0 ? (
        <Txt className="text-sm text-ink-2">{t('opNoClients')}</Txt>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName={`grow gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {chips.map((c) => {
            const active = c.id === customerId;
            return (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  haptic.selection();
                  setCustomerId(c.id);
                }}
                className={`min-h-[48px] justify-center rounded-full border px-4 ${active ? 'border-accent bg-accent-soft' : 'border-line bg-surface'}`}>
                <Txt weight={active ? '700' : '500'} numberOfLines={1} className={active ? 'text-accent' : 'text-ink'}>
                  {c.name}
                </Txt>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {selected ? (
        <View className={`items-center justify-between ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (kind === 'payment' && selected.balance > 0) {
                haptic.selection();
                setDigits(String(selected.balance));
              }
            }}>
            <Txt className="text-xs text-ink-2">
              {selected.balance > 0
                ? `${t('opOwes')} ${money(selected.balance)}${kind === 'payment' ? ` · ${t('opTapToFill')}` : ''}`
                : t('opSettled')}
            </Txt>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            hitSlop={8}
            onPress={() => {
              closeOperation();
              router.push({ pathname: '/customer/[id]', params: { id: String(selected.id) } });
            }}
            className={`min-h-[48px] items-center gap-1 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
            <Txt weight="600" className="text-xs text-accent">
              {t('opOpenFile')}
            </Txt>
            <ChevronRight size={14} color={v4(scheme, 'accent')} />
          </Pressable>
        </View>
      ) : null}

      {kind === 'payment' ? (
        <View className={`gap-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
          {QUICK_METHODS.map((m) => {
            const active = m === method;
            return (
              <Pressable
                key={m}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  haptic.selection();
                  setMethod(m);
                }}
                className={`min-h-[48px] flex-1 items-center justify-center rounded-xl border ${active ? 'border-payment bg-payment-soft' : 'border-line bg-surface'}`}>
                <Txt weight={active ? '700' : '500'} numberOfLines={1} className={`text-sm ${active ? 'text-payment' : 'text-ink-2'}`}>
                  {t(`method_${m}`)}
                </Txt>
              </Pressable>
            );
          })}
        </View>
      ) : selected ? (
        <Pressable
          accessibilityRole="link"
          onPress={() => {
            closeOperation();
            router.push({ pathname: '/entry/new', params: { customerId: String(selected.id), kind: 'credit' } });
          }}
          className={`min-h-[48px] items-center gap-1.5 self-start ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
          <ShoppingBag size={ICON_SCALE.xs.size} color={v4(scheme, 'text-secondary')} />
          <Txt className="text-xs text-ink-2">{t('opWithProducts')}</Txt>
        </Pressable>
      ) : null}

      <View className="items-center rounded-2xl bg-surface-muted py-3">
        <AmountDisplay amount={amount} size="display" alwaysVisible color={amountColor} align="center" />
      </View>

      <Numpad onKey={onKey} />

      <PrimaryButton
        label={t('opValidate')}
        onPress={submit}
        disabled={!selected || amount <= 0 || saving}
      />
    </View>
  );
}
