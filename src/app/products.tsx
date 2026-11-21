import { zodResolver } from '@hookform/resolvers/zod';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/form-field';
import { ICON, Plus, Trash2 } from '@/components/icons';
import { Button, Card, Chip, ChipRow, Row, Txt } from '@/components/ui';
import { createProduct, deleteProduct, listProducts, updateProduct } from '@/db/repository';
import { formatAmount, getCurrency, parseAmount } from '@/domain/currency';
import { productSchema, type ProductFormValues } from '@/domain/schemas';
import { isFractionalUnit, PRODUCT_UNITS, type Product } from '@/domain/types';
import { useApp } from '@/state/use-app';
import { usePalette } from '@/theme';

const EMPTY: ProductFormValues = { name: '', price: '', unit: 'piece' };

/** Product catalog: name, price and unit, used for quick-tap credit entry. Tap a row to edit it. */
export default function ProductsScreen() {
  const db = useSQLiteContext();
  const { t, money, settings } = useApp();
  const palette = usePalette();
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const schema = useMemo(() => productSchema(settings.currency), [settings.currency]);
  const { control, handleSubmit, reset, formState } = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  const load = useCallback(async () => setProducts(await listProducts(db)), [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function resetForm() {
    setEditingId(null);
    reset(EMPTY);
  }

  const onSubmit = handleSubmit(async (values) => {
    const input = { name: values.name, price: parseAmount(values.price, settings.currency) ?? 0, unit: values.unit };
    if (editingId === null) await createProduct(db, input);
    else await updateProduct(db, editingId, input);
    resetForm();
    load();
  });

  function startEdit(p: Product) {
    setEditingId(p.id);
    reset({
      name: p.name,
      price: formatAmount(p.price, settings.currency, false).replace(/\s/g, ''),
      unit: p.unit,
    });
  }

  function confirmDelete(p: Product) {
    Alert.alert(p.name, undefined, [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteProduct(db, p.id);
          if (editingId === p.id) resetForm();
          load();
        },
      },
    ]);
  }

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <FlatList
        data={products}
        keyExtractor={(p) => String(p.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 40 }}
        ListHeaderComponent={
          <Card style={{ gap: 12, marginBottom: 8 }}>
            <Txt muted size={14}>
              {t('productsHint')}
            </Txt>
            <FormField control={control} name="name" label={t('productName')} placeholder="Riz" />
            <Txt size={14} muted weight="600">
              {t('soldBy')}
            </Txt>
            <Controller
              control={control}
              name="unit"
              render={({ field }) => (
                <ChipRow>
                  {PRODUCT_UNITS.map((u) => (
                    <Chip key={u} label={t(`unit_${u}`)} selected={field.value === u} onPress={() => field.onChange(u)} />
                  ))}
                </ChipRow>
              )}
            />
            <FormField
              control={control}
              name="price"
              label={`${t('productPrice')} (${getCurrency(settings.currency).symbol})`}
              keyboardType="decimal-pad"
              placeholder="25000"
            />
            <Row gap={10}>
              <Button
                label={editingId === null ? t('addProduct') : t('save')}
                icon={editingId === null ? Plus : undefined}
                onPress={onSubmit}
                loading={formState.isSubmitting}
                style={{ flex: 1 }}
              />
              {editingId !== null ? (
                <Button label={t('cancel')} variant="secondary" onPress={resetForm} style={{ flex: 1 }} />
              ) : null}
            </Row>
          </Card>
        }
        ListEmptyComponent={<Txt muted>{t('noProducts')}</Txt>}
        renderItem={({ item }) => (
          <Pressable onPress={() => startEdit(item)} onLongPress={() => confirmDelete(item)}>
            <Card style={{ paddingVertical: 12, borderColor: editingId === item.id ? palette.primary : palette.border }}>
              <Row>
                <View style={{ flex: 1 }}>
                  <Txt weight="700">{item.name}</Txt>
                </View>
                <Txt weight="700" style={{ color: palette.primary }}>
                  {money(item.price)}
                  {isFractionalUnit(item.unit) || item.unit === 'pack' ? ` / ${t(`unit_${item.unit}`)}` : ''}
                </Txt>
                <Pressable hitSlop={10} onPress={() => confirmDelete(item)} accessibilityLabel={t('delete')}>
                  <Trash2 size={ICON.md} color={palette.muted} />
                </Pressable>
              </Row>
            </Card>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
