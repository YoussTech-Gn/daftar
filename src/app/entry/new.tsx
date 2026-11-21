import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banknote, ICON_SCALE, Pencil, ShoppingBag, StickyNote } from '@/components/icons';
import {
  AmountDisplay,
  CalculatorKeypad,
  ChipRow,
  DaftarButton,
  DaftarChip,
  DaftarInput,
  DaftarText,
  QuantityBottomSheet,
  ReceiptPromptSheet,
  Row,
  StampSaveOverlay,
} from '@/components/ui';
import { addEntry, bumpProductUse, getCustomer, listProducts } from '@/db/repository';
import {
  amountToExpr,
  applyKey,
  formatQty,
  itemsToNote,
  itemsTotal,
  lineTotal,
  sumExpression,
  type CalcKey,
  type PickedItem,
} from '@/domain/calc';
import { formatAmount, getCurrency } from '@/domain/currency';
import {
  isFractionalUnit,
  PAYMENT_METHODS,
  type CreditType,
  type CustomerWithBalance,
  type EntryKind,
  type PaymentMethod,
  type Product,
} from '@/domain/types';
import { haptic } from '@/lib/haptics';
import { buildReceiptPayload, type ReceiptPayload } from '@/lib/receipt';
import { useSessionStore } from '@/state/session-store';
import { useApp } from '@/state/use-app';
import { useTheme } from '@/theme';

type Picked = PickedItem & { id: number };

/** 06 · New Credit & 07 · Payment: Money/Goods segmented toggle, Goods chips, QuantityBottomSheet, Keypad, StampSaveOverlay, ReceiptPromptSheet. */
export default function NewEntryScreen() {
  const db = useSQLiteContext();
  const { t, settings, money } = useApp();
  const { colors, shadows } = useTheme();
  const markSavedEntry = useSessionStore((s) => s.markSavedEntry);

  const params = useLocalSearchParams<{ customerId: string; kind: EntryKind; settle?: string }>();
  const settle = params.settle === '1';
  const prefilled = useRef(false);
  const customerId = Number(params.customerId);
  const kind: EntryKind = params.kind === 'payment' ? 'payment' : 'credit';
  const decimals = getCurrency(settings.currency).decimals;

  const [customer, setCustomer] = useState<CustomerWithBalance | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [creditType, setCreditType] = useState<CreditType>('cash');
  const [picked, setPicked] = useState<Picked[]>([]);
  const [qtyFor, setQtyFor] = useState<Product | null>(null);
  const [expr, setExpr] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [saving, setSaving] = useState(false);

  const [stampAmount, setStampAmount] = useState<number | null>(null);
  const [pendingReceipt, setPendingReceipt] = useState<ReceiptPayload | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<ReceiptPayload | null>(null);

  useFocusEffect(
    useCallback(() => {
      getCustomer(db, customerId).then((c) => {
        setCustomer(c);
        if (settle && c && c.balance > 0 && !prefilled.current) {
          prefilled.current = true;
          setExpr(amountToExpr(c.balance, settings.currency));
        }
      });
      if (kind === 'credit') listProducts(db).then(setProducts);
    }, [db, customerId, kind, settle, settings.currency]),
  );

  const isGoods = kind === 'credit' && creditType === 'goods';
  const activeItems = isGoods ? picked : [];
  const typed = sumExpression(expr, settings.currency);
  const total = (typed ?? 0) + itemsTotal(activeItems);
  const itemsNote = itemsToNote(activeItems);

  const breakdown = useMemo(() => {
    const parts: string[] = [];
    if (itemsNote) parts.push(itemsNote);
    if (expr) parts.push(expr.replace(/\+/g, ' + '));
    return parts.join(' + ');
  }, [itemsNote, expr]);

  function qtyOf(id: number): number {
    return picked.find((i) => i.id === id)?.qty ?? 0;
  }

  function setQty(p: Product, qty: number) {
    setPicked((prev) => {
      const rest = prev.filter((i) => i.id !== p.id);
      if (qty <= 0) return rest;
      const existing = prev.find((i) => i.id === p.id);
      const item: Picked = { id: p.id, name: p.name, price: p.price, unit: p.unit, qty };
      return existing ? prev.map((i) => (i.id === p.id ? item : i)) : [...rest, item];
    });
  }

  function onProductPress(p: Product) {
    if (isFractionalUnit(p.unit)) setQtyFor(p);
    else setQty(p, qtyOf(p.id) + 1);
  }

  function onProductLongPress(p: Product) {
    if (isFractionalUnit(p.unit)) setQtyFor(p);
    else setQty(p, qtyOf(p.id) - 1);
  }

  function onKey(key: CalcKey) {
    if (key === 'clear') setPicked([]);
    setExpr((e) => applyKey(e, key, settings.currency));
  }

  async function save() {
    if (total <= 0 || typed === null || !customer || saving) return;
    setSaving(true);
    const fullNote = [itemsNote, note.trim()].filter(Boolean).join(' — ');
    const entryId = await addEntry(db, {
      customerId,
      kind,
      amount: total,
      method: kind === 'payment' ? method : 'cash',
      note: fullNote || null,
      creditType: kind === 'credit' ? creditType : null,
      settlesAll: kind === 'payment' && total === customer.balance,
      items: activeItems.map((i) => ({
        productId: i.id,
        name: i.name,
        unit: i.unit ?? 'piece',
        qty: i.qty,
        unitPrice: i.price,
        total: lineTotal(i),
      })),
    });
    haptic.success();
    markSavedEntry({ id: entryId, kind, customerId });
    await bumpProductUse(
      db,
      activeItems.map((p) => p.id),
    );
    const updated = await getCustomer(db, customerId);
    const receipt = buildReceiptPayload({
      t,
      money,
      shopName: settings.shopName,
      countryCode: settings.countryCode,
      customer,
      kind,
      amount: total,
      items: itemsNote,
      newBalance: updated?.balance ?? 0,
    });
    setPendingReceipt(receipt);
    setStampAmount(total);
  }

  const handleStampFinish = useCallback(() => {
    setStampAmount(null);
    if (pendingReceipt) {
      setActiveReceipt(pendingReceipt);
      setPendingReceipt(null);
    } else {
      router.back();
    }
  }, [pendingReceipt]);

  const handleReceiptDone = useCallback(() => {
    setActiveReceipt(null);
    router.back();
  }, []);

  const heroBg = kind === 'credit' ? colors.creditSoft : colors.paymentSoft;
  const heroColor = kind === 'credit' ? colors.creditDeep : colors.paymentDeep;
  const formattedTotal = formatAmount(total, settings.currency).replace(/ /g, '\u202F');

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen
        options={{
          title: `${kind === 'credit' ? t('gaveCredit') : t('receivedPayment')}${customer ? ` · ${customer.name}` : ''}`,
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {kind === 'credit' ? (
          <View style={[styles.segmentedTrack, { backgroundColor: colors.surfaceSunken, borderColor: colors.border }]}>
            <Row gap={4}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: creditType === 'cash' }}
                onPress={() => {
                  haptic.selection();
                  setCreditType('cash');
                }}
                style={[
                  styles.segment,
                  creditType === 'cash'
                    ? [styles.segmentActive, shadows.button, { backgroundColor: colors.surface }]
                    : undefined,
                ]}>
                <Row gap={8} style={{ justifyContent: 'center' }}>
                  <Banknote
                    size={ICON_SCALE.sm.size}
                    color={creditType === 'cash' ? colors.creditDeep : colors.textSecondary}
                    strokeWidth={ICON_SCALE.sm.strokeWidth}
                  />
                  <DaftarText
                    role="label"
                    weight={creditType === 'cash' ? '700' : '500'}
                    style={{ color: creditType === 'cash' ? colors.creditDeep : colors.textSecondary }}>
                    {t('creditCash')}
                  </DaftarText>
                </Row>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: creditType === 'goods' }}
                onPress={() => {
                  haptic.selection();
                  setCreditType('goods');
                }}
                style={[
                  styles.segment,
                  creditType === 'goods'
                    ? [styles.segmentActive, shadows.button, { backgroundColor: colors.surface }]
                    : undefined,
                ]}>
                <Row gap={8} style={{ justifyContent: 'center' }}>
                  <ShoppingBag
                    size={ICON_SCALE.sm.size}
                    color={creditType === 'goods' ? colors.creditDeep : colors.textSecondary}
                    strokeWidth={ICON_SCALE.sm.strokeWidth}
                  />
                  <DaftarText
                    role="label"
                    weight={creditType === 'goods' ? '700' : '500'}
                    style={{ color: creditType === 'goods' ? colors.creditDeep : colors.textSecondary }}>
                    {t('creditGoods')}
                  </DaftarText>
                </Row>
              </Pressable>
            </Row>
          </View>
        ) : null}

        <View style={[styles.heroBox, { backgroundColor: heroBg, borderColor: colors.border }]}>
          <DaftarText role="caption" tone="secondary" weight="600" align="center">
            {t('total')}
          </DaftarText>
          <AmountDisplay amount={total} size="display" animate color={heroColor} align="center" />
          <DaftarText role="caption" tone="secondary" numberOfLines={3} align="center" style={styles.breakdown}>
            {breakdown || (isGoods ? t('tapItemsHint') : kind === 'credit' ? t('cashHint') : '')}
          </DaftarText>
        </View>

        {isGoods ? (
          <View style={{ gap: 8 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <DaftarText role="label" weight="700">
                {t('products')}
              </DaftarText>
              <Pressable hitSlop={10} onPress={() => router.push('/products')} style={styles.editProductsBtn}>
                <Row gap={6}>
                  <Pencil size={ICON_SCALE.xs.size} color={colors.primary} strokeWidth={ICON_SCALE.xs.strokeWidth} />
                  <DaftarText role="label" tone="primary" weight="600">
                    {t('editProducts')}
                  </DaftarText>
                </Row>
              </Pressable>
            </Row>
            {products.length === 0 ? (
              <Pressable onPress={() => router.push('/products')}>
                <DaftarText role="caption" tone="muted">
                  {t('productsHint')}
                </DaftarText>
              </Pressable>
            ) : (
              <ChipRow>
                {products.map((p) => {
                  const qty = qtyOf(p.id);
                  const unitLabel = isFractionalUnit(p.unit) ? `/${t(`unit_${p.unit}`)}` : '';
                  const qtyBadge =
                    qty > 0
                      ? isFractionalUnit(p.unit)
                        ? formatQty(qty)
                        : `×${formatQty(qty)}`
                      : undefined;
                  return (
                    <DaftarChip
                      key={p.id}
                      variant="product"
                      label={p.name}
                      secondaryLabel={`${formatAmount(p.price, settings.currency)}${unitLabel}`}
                      badge={qtyBadge}
                      selected={qty > 0}
                      onPress={() => onProductPress(p)}
                      onLongPress={() => onProductLongPress(p)}
                    />
                  );
                })}
              </ChipRow>
            )}
          </View>
        ) : null}

        {kind === 'payment' ? (
          <ChipRow>
            {PAYMENT_METHODS.map((m) => (
              <DaftarChip
                key={m}
                variant="paymentMethod"
                label={t(`method_${m}`)}
                selected={method === m}
                onPress={() => setMethod(m)}
              />
            ))}
          </ChipRow>
        ) : null}

        {showNote ? (
          <DaftarInput
            value={note}
            onChangeText={setNote}
            placeholder={t('notePlaceholder')}
            autoFocus
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              haptic.selection();
              setShowNote(true);
            }}
            hitSlop={8}
            style={styles.addNoteBtn}>
            <Row gap={8}>
              <StickyNote size={ICON_SCALE.sm.size} color={colors.primary} strokeWidth={ICON_SCALE.sm.strokeWidth} />
              <DaftarText role="label" tone="primary" weight="600">
                {t('addNote')}
              </DaftarText>
            </Row>
          </Pressable>
        )}

        <CalculatorKeypad onKey={onKey} allowDecimal={decimals > 0} />

        <DaftarButton
          label={t('save')}
          amountText={formattedTotal}
          variant={kind}
          onPress={save}
          loading={saving}
          disabled={total <= 0 || typed === null}
        />
      </ScrollView>

      {qtyFor ? (
        <QuantityBottomSheet
          key={qtyFor.id}
          visible
          name={qtyFor.name}
          unit={qtyFor.unit}
          current={qtyOf(qtyFor.id)}
          onPick={(q) => {
            setQty(qtyFor, q);
            setQtyFor(null);
          }}
          onRemove={() => {
            setQty(qtyFor, 0);
            setQtyFor(null);
          }}
          onClose={() => setQtyFor(null)}
        />
      ) : null}

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
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 28,
  },
  segmentedTrack: {
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  segmentActive: {},
  heroBox: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  breakdown: {
    minHeight: 18,
  },
  editProductsBtn: {
    minHeight: 32,
    justifyContent: 'center',
  },
  addNoteBtn: {
    minHeight: 36,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
});
