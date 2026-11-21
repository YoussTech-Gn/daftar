import { zodResolver } from '@hookform/resolvers/zod';
import { Contact, requestPermissionsAsync } from 'expo-contacts';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, ScrollView } from 'react-native';

import { FormField } from '@/components/form-field';
import { ContactRound } from '@/components/icons';
import { Button, Txt } from '@/components/ui';
import { countCustomers, createCustomer, getCustomer, updateCustomer } from '@/db/repository';
import { ENFORCE_FREE_LIMIT, FREE_CUSTOMER_LIMIT } from '@/domain/plan';
import { customerSchema, type CustomerFormValues } from '@/domain/schemas';
import { useApp } from '@/state/use-app';
import { usePalette } from '@/theme';

/** Create a customer (optionally from phone contacts), or edit one when an `id` param is given. */
export default function CustomerFormScreen() {
  const db = useSQLiteContext();
  const { t } = useApp();
  const palette = usePalette();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = id ? Number(id) : null;
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, reset, setValue, formState } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: '', phone: '', note: '' },
  });

  useEffect(() => {
    if (editingId === null) return;
    getCustomer(db, editingId).then((c) => {
      if (c) reset({ name: c.name, phone: c.phone ?? '', note: c.note ?? '' });
    });
  }, [db, editingId, reset]);

  async function pickContact() {
    try {
      const { granted } = await requestPermissionsAsync();
      if (!granted) {
        Alert.alert(t('contactsDenied'));
        return;
      }
      const contact = await Contact.presentPicker();
      if (!contact) return;
      const [fullName, phones] = await Promise.all([contact.getFullName(), contact.getPhones()]);
      if (fullName) setValue('name', fullName, { shouldValidate: true });
      const number = phones.find((p) => p.number)?.number;
      if (number) setValue('phone', number, { shouldValidate: true });
    } catch {
      Alert.alert(t('error'));
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      if (editingId !== null) {
        await updateCustomer(db, editingId, values);
        router.back();
        return;
      }
      if (ENFORCE_FREE_LIMIT && (await countCustomers(db)) >= FREE_CUSTOMER_LIMIT) {
        Alert.alert(t('appName'), t('freeLimitReached', { limit: FREE_CUSTOMER_LIMIT }));
        return;
      }
      const newId = await createCustomer(db, values);
      router.replace({ pathname: '/customer/[id]', params: { id: String(newId) } });
    } catch {
      setError(t('error'));
    }
  });

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: editingId !== null ? t('edit') : t('addCustomer') }} />
      {editingId === null ? (
        <Button label={t('importContact')} icon={ContactRound} variant="secondary" onPress={pickContact} />
      ) : null}
      <FormField control={control} name="name" label={t('customerName')} autoCapitalize="words" />
      <FormField control={control} name="phone" label={t('phoneOptional')} keyboardType="phone-pad" />
      <FormField
        control={control}
        name="note"
        label={t('description')}
        placeholder={t('descriptionPlaceholder')}
      />
      {error ? <Txt style={{ color: palette.danger }}>{error}</Txt> : null}
      <Button label={t('save')} onPress={onSubmit} loading={formState.isSubmitting} />
    </ScrollView>
  );
}
