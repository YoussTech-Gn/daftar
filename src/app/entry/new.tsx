import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CalcKeypad } from '@/components/calc-keypad';
import { Button, Chip, ChipRow, Row, Txt } from '@/components/ui';
import { addEntry, bumpProductUse, getCustomer, listProducts } from '@/db/repository';
import { applyKey, itemsToNote, itemsTotal, sumExpression, type CalcKey, type PickedItem } from '@/domain/calc';
import { getCurrency } from '@/domain/currency';
import { PAYMENT_METHODS, type CustomerWithBalance, type EntryKind, type PaymentMethod, type Product } from '@/domain/types';
import { offerReceipt } from '@/lib/receipt';
import { useApp } from '@/state/app-context';
import { usePalette } from '@/theme';

type Picked = PickedItem & { id: number };

export default function NewEntryScreen() {
  const db = useSQLiteContext();
  const { t, settings, money, isRTL } = useApp();
  const palette = usePalette();
  const params = useLocalSearchParams<{ customerId: string; kind: EntryKind }>();
  const customerId = Number(params.customerId);
  const kind: EntryKind = params.kind === 'payment' ? 'payment' : 'credit';
  const color = kind === 'credit' ? palette.credit : palette.payment;
  const decimals = getCurrency(settings.currency).decimals;

  const [customer, setCustomer] = useState<CustomerWithBalance | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [picked, setPicked] = useState<Picked[]>([]);
  const [expr, setExpr] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getCustomer(db, customerId).then(setCustomer);
      if (kind === 'credit') listProducts(db).then(setProducts);
    }, [db, customerId, kind]),
  );

  const typed = sumExpression(expr, settings.currency);
  const total = (typed ?? 0) + itemsTotal(picked);
  const itemsNote = itemsToNote(picked);
  const breakdown = useMemo(() => {
    const parts: string[] = [];
    if (itemsNote) parts.push(itemsNote);
    if (expr) parts.push(expr.replace(/\+/g, ' + '));
    return parts.join(' + ');
  }, [itemsNote, expr]);

  function addProduct(p: Product) {
    setPicked((prev) => {
      const found = prev.find((i) => i.id === p.id);
      if (found) return prev.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1 }];
    });
  }

  function removeOne(id: number) {
    setPicked((prev) =>
      prev.flatMap((i) => (i.id !== id ? [i] : i.qty > 1 ? [{ ...i, qty: i.qty - 1 }] : [])),
    );
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
    });
    await bumpProductUse(db, picked.map((p) => ({ id: p.id, qty: p.qty })));
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
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Txt size={13} muted style={{ textAlign: 'center' }}>
            {t('total')}
          </Txt>
          <Txt size={40} weight="800" style={{ color, textAlign: 'center' }}>
            {money(total)}
          </Txt>
          <Txt size={14} muted numberOfLines={2} style={{ textAlign: 'center', minHeight: 20 }}>
            {breakdown || t('tapItemsHint')}
          </Txt>
        </View>

        {kind === 'credit' ? (
          <View style={{ gap: 8 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt size={14} weight="700">
                {t('products')}
              </Txt>
              <Pressable hitSlop={10} onPress={() => router.push('/products')}>
                <Txt size={14} weight="600" style={{ color: palette.primary }}>
                  {t('editProducts')}
                </Txt>
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
                  const qty = picked.find((i) => i.id === p.id)?.qty ?? 0;
                  return (
                    <Chip
                      key={p.id}
                      label={`${qty > 0 ? `${qty} × ` : ''}${p.name} · ${money(p.price)}`}
                      selected={qty > 0}
                      onPress={() => addProduct(p)}
                      onLongPress={() => removeOne(p.id)}
                    />
                  );
                })}
              </ChipRow>
            )}
          </View>
        ) : (
          <ChipRow>
            {PAYMENT_METHODS.map((m) => (
              <Chip key={m} label={t(`method_${m}`)} selected={method === m} onPress={() => setMethod(m)} />
            ))}
          </ChipRow>
        )}

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
            <Txt size={14} weight="600" style={{ color: palette.primary }}>
              {t('addNote')}
            </Txt>
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
    </SafeAreaView>
  );
}
