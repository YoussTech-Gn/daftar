import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalcKeypad } from '@/components/calc-keypad';
import { Banknote, ICON, Pencil, ShoppingCart, StickyNote } from '@/components/icons';
import { QtySheet } from '@/components/qty-sheet';
import { Button, Chip, ChipRow, Row, Txt } from '@/components/ui';
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
import { getCurrency } from '@/domain/currency';
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
import { offerReceipt } from '@/lib/receipt';
import { useApp } from '@/state/use-app';
import { usePalette } from '@/theme';

type Picked = PickedItem & { id: number };

export default function NewEntryScreen() {
  const db = useSQLiteContext();
  const { t, settings, money, isRTL } = useApp();
  const palette = usePalette();
  const params = useLocalSearchParams<{ customerId: string; kind: EntryKind; settle?: string }>();
  // "Settle all" (decision 0013): the payment screen opens pre-filled with the whole balance.
  const settle = params.settle === '1';
  const prefilled = useRef(false);
  const customerId = Number(params.customerId);
  const kind: EntryKind = params.kind === 'payment' ? 'payment' : 'credit';
  const color = kind === 'credit' ? palette.credit : palette.payment;
  const decimals = getCurrency(settings.currency).decimals;

  const [customer, setCustomer] = useState<CustomerWithBalance | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  // Decision 0009: a cash loan is the default; goods is one tap away.
  const [creditType, setCreditType] = useState<CreditType>('cash');
  const [picked, setPicked] = useState<Picked[]>([]);
  const [qtyFor, setQtyFor] = useState<Product | null>(null);
  const [expr, setExpr] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [saving, setSaving] = useState(false);

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
    if (total <= 0 || typed === null || !customer) return;
    setSaving(true);
    const fullNote = [itemsNote, note.trim()].filter(Boolean).join(' — ');
    await addEntry(db, {
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
    await bumpProductUse(
      db,
      activeItems.map((p) => p.id),
    );
    const updated = await getCustomer(db, customerId);
    offerReceipt(
      {
        t,
        money,
        shopName: settings.shopName,
        countryCode: settings.countryCode,
        customer,
        kind,
        amount: total,
        items: itemsNote,
        newBalance: updated?.balance ?? 0,
      },
      () => router.back(),
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: `${kind === 'credit' ? t('gaveCredit') : t('receivedPayment')}${customer ? ` · ${customer.name}` : ''}`,
        }}
      />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
        {kind === 'credit' ? (
          <Row gap={10}>
            <Button
              label={t('creditCash')}
              icon={Banknote}
              variant={creditType === 'cash' ? 'credit' : 'secondary'}
              onPress={() => setCreditType('cash')}
              style={{ flex: 1, minHeight: 46 }}
            />
            <Button
              label={t('creditGoods')}
              icon={ShoppingCart}
              variant={creditType === 'goods' ? 'credit' : 'secondary'}
              onPress={() => setCreditType('goods')}
              style={{ flex: 1, minHeight: 46 }}
            />
          </Row>
        ) : null}

        <View style={{ alignItems: 'center', gap: 2 }}>
          <Txt size={13} muted style={{ textAlign: 'center' }}>
            {t('total')}
          </Txt>
          <Txt size={40} weight="800" style={{ color, textAlign: 'center' }}>
            {money(total)}
          </Txt>
          <Txt size={14} muted numberOfLines={3} style={{ textAlign: 'center', minHeight: 20 }}>
            {breakdown || (isGoods ? t('tapItemsHint') : kind === 'credit' ? t('cashHint') : '')}
          </Txt>
        </View>

        {isGoods ? (
          <View style={{ gap: 8 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt size={14} weight="700">
                {t('products')}
              </Txt>
              <Pressable hitSlop={10} onPress={() => router.push('/products')}>
                <Row gap={6}>
                  <Pencil size={ICON.sm} color={palette.primary} />
                  <Txt size={14} weight="600" style={{ color: palette.primary }}>
                    {t('editProducts')}
                  </Txt>
                </Row>
              </Pressable>
            </Row>
            {products.length === 0 ? (
              <Pressable onPress={() => router.push('/products')}>
                <Txt size={13} muted>
                  {t('productsHint')}
                </Txt>
              </Pressable>
            ) : (
              <ChipRow>
                {products.map((p) => {
                  const qty = qtyOf(p.id);
                  const unitLabel = isFractionalUnit(p.unit) ? `/${t(`unit_${p.unit}`)}` : '';
                  return (
                    <Chip
                      key={p.id}
                      label={`${qty > 0 ? `${formatQty(qty)} × ` : ''}${p.name} · ${money(p.price)}${unitLabel}`}
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
              <Chip key={m} label={t(`method_${m}`)} selected={method === m} onPress={() => setMethod(m)} />
            ))}
          </ChipRow>
        ) : null}

        {showNote ? (
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t('notePlaceholder')}
            placeholderTextColor={palette.muted}
            autoFocus
            style={{
              minHeight: 46,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: palette.border,
              backgroundColor: palette.card,
              color: palette.text,
              paddingHorizontal: 14,
              fontSize: 16,
              textAlign: isRTL ? 'right' : 'left',
            }}
          />
        ) : (
          <Pressable onPress={() => setShowNote(true)} hitSlop={8}>
            <Row gap={6}>
              <StickyNote size={ICON.sm} color={palette.primary} />
              <Txt size={14} weight="600" style={{ color: palette.primary }}>
                {t('addNote')}
              </Txt>
            </Row>
          </Pressable>
        )}

        <CalcKeypad onKey={onKey} allowDecimal={decimals > 0} />
        <Button
          label={`${t('save')} · ${money(total)}`}
          variant={kind}
          onPress={save}
          loading={saving}
          disabled={total <= 0 || typed === null}
        />
      </ScrollView>

      {qtyFor ? (
        <QtySheet
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
    </SafeAreaView>
  );
}
