import { zodResolver } from '@hookform/resolvers/zod';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/form-field';
import { ICON_SCALE, Plus, Trash2 } from '@/components/icons';
import {
  AmountDisplay,
  Card,
  ChipRow,
  ConfirmationDialog,
  DaftarButton,
  DaftarChip,
  DaftarText,
  EmptyState,
  Row,
} from '@/components/ui';
import { createProduct, deleteProduct, listProducts, updateProduct } from '@/db/repository';
import { formatAmount, getCurrency, parseAmount } from '@/domain/currency';
import { productSchema, type ProductFormValues } from '@/domain/schemas';
import { isFractionalUnit, PRODUCT_UNITS, type Product } from '@/domain/types';
import { haptic } from '@/lib/haptics';
import { useApp } from '@/state/use-app';
import { useTheme } from '@/theme';

const EMPTY: ProductFormValues = { name: '', price: '', unit: 'piece' };

/** 11 · Products: Add/Edit card (name, unit chips, price, save) + product list with delete confirmation. */
export default function ProductsScreen() {
  const db = useSQLiteContext();
  const { t, settings } = useApp();
  const { colors, shadows } = useTheme();

  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

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
    const input = {
      name: values.name,
      price: parseAmount(values.price, settings.currency) ?? 0,
      unit: values.unit,
    };
    if (editingId === null) await createProduct(db, input);
    else await updateProduct(db, editingId, input);
    haptic.success();
    resetForm();
    load();
  });

  function startEdit(p: Product) {
    haptic.selection();
    setEditingId(p.id);
    reset({
      name: p.name,
      price: formatAmount(p.price, settings.currency, false).replace(/\s/g, ''),
      unit: p.unit,
    });
  }

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={products}
        keyExtractor={(p) => String(p.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Card style={styles.formCard}>
            <DaftarText role="caption" tone="muted">
              {t('productsHint')}
            </DaftarText>

            <FormField control={control} name="name" label={t('productName')} placeholder="Riz" />

            <View style={{ gap: 8 }}>
              <DaftarText role="label" tone="secondary" weight="600">
                {t('soldBy')}
              </DaftarText>
              <Controller
                control={control}
                name="unit"
                render={({ field }) => (
                  <ChipRow>
                    {PRODUCT_UNITS.map((u) => (
                      <DaftarChip
                        key={u}
                        variant="filter"
                        label={t(`unit_${u}`)}
                        selected={field.value === u}
                        onPress={() => field.onChange(u)}
                      />
                    ))}
                  </ChipRow>
                )}
              />
            </View>

            <FormField
              control={control}
              name="price"
              label={`${t('productPrice')} (${getCurrency(settings.currency).symbol})`}
              keyboardType="decimal-pad"
              placeholder="25000"
            />

            <Row gap={10}>
              <DaftarButton
                label={editingId === null ? t('addProduct') : t('save')}
                icon={editingId === null ? Plus : undefined}
                onPress={onSubmit}
                loading={formState.isSubmitting}
                style={{ flex: 1 }}
              />
              {editingId !== null ? (
                <DaftarButton label={t('cancel')} variant="secondary" onPress={resetForm} style={{ flex: 1 }} />
              ) : null}
            </Row>
          </Card>
        }
        ListEmptyComponent={<EmptyState variant="products" title={t('noProducts')} hint={t('productsHint')} />}
        renderItem={({ item }) => {
          const isEditing = editingId === item.id;
          const unitSuffix =
            isFractionalUnit(item.unit) || item.unit === 'pack' ? ` / ${t(`unit_${item.unit}`)}` : '';
          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => startEdit(item)}
              onLongPress={() => setDeletingProduct(item)}>
              <View
                style={[
                  styles.productRow,
                  shadows.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isEditing ? colors.primary : colors.border,
                    borderWidth: isEditing ? 1.5 : 1,
                  },
                ]}>
                <Row gap={10} style={{ justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <DaftarText role="body" weight="600" numberOfLines={1}>
                      {item.name}
                    </DaftarText>
                    <Row gap={4}>
                      <AmountDisplay amount={item.price} size="label" color={colors.primary} />
                      {unitSuffix ? (
                        <DaftarText role="caption" tone="muted">
                          {unitSuffix}
                        </DaftarText>
                      ) : null}
                    </Row>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('delete')}
                    hitSlop={8}
                    onPress={() => {
                      haptic.selection();
                      setDeletingProduct(item);
                    }}
                    style={[styles.deleteBtn, { backgroundColor: colors.dangerSoft }]}>
                    <Trash2 size={ICON_SCALE.sm.size} color={colors.danger} strokeWidth={ICON_SCALE.sm.strokeWidth} />
                  </Pressable>
                </Row>
              </View>
            </Pressable>
          );
        }}
      />

      <ConfirmationDialog
        visible={deletingProduct !== null}
        title={deletingProduct ? t('deleteProductTitle', { name: deletingProduct.name }) : ''}
        body={t('deleteProductBody')}
        confirmLabel={t('delete')}
        tone="danger"
        icon="trash"
        onCancel={() => setDeletingProduct(null)}
        onConfirm={async () => {
          const target = deletingProduct;
          setDeletingProduct(null);
          if (!target) return;
          await deleteProduct(db, target.id);
          haptic.warning();
          if (editingId === target.id) resetForm();
          load();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 40,
  },
  formCard: {
    gap: 14,
    marginBottom: 6,
  },
  productRow: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 62,
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
