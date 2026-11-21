import { zodResolver } from '@hookform/resolvers/zod';
import { Contact, requestPermissionsAsync } from 'expo-contacts';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/form-field';
import { AlertCircle, ContactRound, ICON_SCALE } from '@/components/icons';
import { Card, DaftarButton, DaftarText, Row } from '@/components/ui';
import { addEntry, countCustomers, createCustomer, getCustomer, updateCustomer } from '@/db/repository';
import { parseAmount } from '@/domain/currency';
import { ENFORCE_FREE_LIMIT, FREE_CUSTOMER_LIMIT } from '@/domain/plan';
import { newCustomerSchema, type NewCustomerFormValues } from '@/domain/schemas';
import { haptic } from '@/lib/haptics';
import { useSessionStore } from '@/state/session-store';
import { useApp } from '@/state/use-app';
import { useTheme } from '@/theme';

/** 10 · Customer Form (Modal): Pick from contacts, Name, Phone (prefixed), Description, Save. */
export default function CustomerFormScreen() {
  const db = useSQLiteContext();
  const { t, settings } = useApp();
  const { colors } = useTheme();
  const showToast = useSessionStore((s) => s.showToast);

  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = id ? Number(id) : null;
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, reset, setValue, formState } = useForm<NewCustomerFormValues>({
    resolver: zodResolver(newCustomerSchema(settings.currency)),
    defaultValues: { name: '', phone: '', note: '', openingBalance: '' },
  });

  useEffect(() => {
    if (editingId === null) return;
    getCustomer(db, editingId).then((c) => {
      if (c) reset({ name: c.name, phone: c.phone ?? '', note: c.note ?? '', openingBalance: '' });
    });
  }, [db, editingId, reset]);

  async function pickContact() {
    try {
      const { granted } = await requestPermissionsAsync();
      if (!granted) {
        showToast(t('contactsDenied'));
        return;
      }
      const contact = await Contact.presentPicker();
      if (!contact) return;
      const [fullName, phones] = await Promise.all([contact.getFullName(), contact.getPhones()]);
      if (fullName) setValue('name', fullName, { shouldValidate: true });
      const number = phones.find((p) => p.number)?.number;
      if (number) setValue('phone', number, { shouldValidate: true });
      haptic.selection();
    } catch {
      showToast(t('error'));
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      if (editingId !== null) {
        await updateCustomer(db, editingId, values);
        haptic.success();
        router.back();
        return;
      }
      if (ENFORCE_FREE_LIMIT && (await countCustomers(db)) >= FREE_CUSTOMER_LIMIT) {
        setError(t('freeLimitReached', { limit: FREE_CUSTOMER_LIMIT }));
        return;
      }
      const newId = await createCustomer(db, values);
      // Moving from the paper notebook: what the customer already owes becomes an "old debt" entry.
      const opening = parseAmount(values.openingBalance ?? '', settings.currency) ?? 0;
      if (opening > 0) {
        await addEntry(db, {
          customerId: newId,
          kind: 'credit',
          amount: opening,
          method: 'cash',
          note: null,
          creditType: 'opening',
        });
      }
      haptic.success();
      router.replace({ pathname: '/customer/[id]', params: { id: String(newId) } });
    } catch {
      setError(t('error'));
    }
  });

  const phonePrefix = settings.countryCode ? `+${settings.countryCode}` : undefined;

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: editingId !== null ? t('edit') : t('addCustomer') }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {editingId === null ? (
            <DaftarButton
              label={t('importContact')}
              icon={ContactRound}
              variant="secondary"
              onPress={pickContact}
            />
          ) : null}

          <Card style={{ gap: 16 }}>
            <FormField control={control} name="name" label={t('customerName')} autoCapitalize="words" />
            <FormField
              control={control}
              name="phone"
              label={t('phoneOptional')}
              prefix={phonePrefix}
              keyboardType="phone-pad"
            />
            <FormField
              control={control}
              name="note"
              label={t('description')}
              placeholder={t('descriptionPlaceholder')}
            />
            {editingId === null ? (
              <View style={{ gap: 6 }}>
                <FormField
                  control={control}
                  name="openingBalance"
                  label={t('openingBalance')}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
                <DaftarText role="caption" tone="muted">
                  {t('openingBalanceHint')}
                </DaftarText>
              </View>
            ) : null}
          </Card>

          {error ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
              <Row gap={8}>
                <AlertCircle size={ICON_SCALE.sm.size} color={colors.danger} strokeWidth={ICON_SCALE.sm.strokeWidth} />
                <DaftarText role="caption" tone="danger" weight="600" style={{ flex: 1 }}>
                  {error}
                </DaftarText>
              </Row>
            </View>
          ) : null}

          <DaftarButton label={t('save')} onPress={onSubmit} loading={formState.isSubmitting} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  errorBanner: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
