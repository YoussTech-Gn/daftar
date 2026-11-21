import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Field, Row, Txt } from '@/components/ui';
import { createProduct, deleteProduct, listProducts, updateProduct } from '@/db/repository';
import { formatAmount, getCurrency, parseAmount } from '@/domain/currency';
import type { Product } from '@/domain/types';
import { useApp } from '@/state/app-context';
import { usePalette } from '@/theme';

/** Product catalog: name + price, used for quick-tap credit entry. Tap a row to edit it. */
export default function ProductsScreen() {
  const db = useSQLiteContext();
  const { t, money, settings } = useApp();
  const palette = usePalette();
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => setProducts(await listProducts(db)), [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function resetForm() {
    setEditingId(null);
    setName('');
    setPrice('');
    setError(null);
  }

  async function save() {
    const minor = parseAmount(price, settings.currency);
    if (!name.trim()) return setError(t('nameRequired'));
    if (minor === null) return setError(t('invalidAmount'));
    if (editingId === null) await createProduct(db, name, minor);
    else await updateProduct(db, editingId, name, minor);
    resetForm();
    load();
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
            <Field label={t('productName')} value={name} onChangeText={setName} placeholder="Riz 25kg" />
            <Field
              label={`${t('productPrice')} (${getCurrency(settings.currency).symbol})`}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              placeholder="250000"
            />
            {error ? <Txt style={{ color: palette.danger }}>{error}</Txt> : null}
            <Row gap={10}>
              <Button label={editingId === null ? t('addProduct') : t('save')} onPress={save} style={{ flex: 1 }} />
              {editingId !== null ? (
                <Button label={t('cancel')} variant="secondary" onPress={resetForm} style={{ flex: 1 }} />
              ) : null}
            </Row>
          </Card>
        }
        ListEmptyComponent={<Txt muted>{t('noProducts')}</Txt>}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              setEditingId(item.id);
              setName(item.name);
              setPrice(formatAmount(item.price, settings.currency, false).replace(/\s/g, ''));
              setError(null);
            }}
            onLongPress={() => confirmDelete(item)}>
            <Card style={{ paddingVertical: 12, borderColor: editingId === item.id ? palette.primary : palette.border }}>
              <Row>
                <View style={{ flex: 1 }}>
                  <Txt weight="700">{item.name}</Txt>
                </View>
                <Txt weight="700" style={{ color: palette.primary }}>
                  {money(item.price)}
                </Txt>
                <Pressable hitSlop={10} onPress={() => confirmDelete(item)} accessibilityLabel={t('delete')}>
                  <Txt muted size={18}>
                    ✕
                  </Txt>
                </Pressable>
              </Row>
            </Card>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
