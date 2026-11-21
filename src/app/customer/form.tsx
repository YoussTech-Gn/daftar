import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, ScrollView } from 'react-native';

import { Button, Field, Txt } from '@/components/ui';
import { countCustomers, createCustomer, getCustomer, updateCustomer } from '@/db/repository';
import { ENFORCE_FREE_LIMIT, FREE_CUSTOMER_LIMIT } from '@/domain/plan';
import { useApp } from '@/state/app-context';
import { usePalette } from '@/theme';

/** Create a customer, or edit one when an `id` param is given. */
export default function CustomerFormScreen() {
  const db = useSQLiteContext();
  const { t } = useApp();
  const palette = usePalette();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = id ? Number(id) : null;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingId === null) return;
    getCustomer(db, editingId).then((c) => {
      if (!c) return;
      setName(c.name);
      setPhone(c.phone ?? '');
    });
  }, [db, editingId]);

  async function save() {
    if (!name.trim()) {
      setError(t('nameRequired'));
      return;
    }
    setSaving(true);
    try {
      if (editingId !== null) {
        await updateCustomer(db, editingId, name, phone);
        router.back();
        return;
      }
      if (ENFORCE_FREE_LIMIT && (await countCustomers(db)) >= FREE_CUSTOMER_LIMIT) {
        Alert.alert(t('appName'), t('freeLimitReached', { limit: FREE_CUSTOMER_LIMIT }));
        return;
      }
      const newId = await createCustomer(db, name, phone);
      router.replace({ pathname: '/customer/[id]', params: { id: String(newId) } });
    } catch {
      setError(t('error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: editingId !== null ? t('edit') : t('addCustomer') }} />
      <Field
        label={t('customerName')}
        value={name}
        onChangeText={(v) => {
          setName(v);
          setError(null);
        }}
        autoFocus
        autoCapitalize="words"
      />
      <Field label={t('phoneOptional')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      {error ? <Txt style={{ color: palette.danger }}>{error}</Txt> : null}
      <Button label={t('save')} onPress={save} loading={saving} />
    </ScrollView>
  );
}
