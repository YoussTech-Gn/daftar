import { zodResolver } from '@hookform/resolvers/zod';
import { Contact, requestPermissionsAsync } from 'expo-contacts';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect } from 'react';
import { Controller, useForm, type Control } from 'react-hook-form';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { ContactRound, ICON_SCALE } from '@/components/icons';
import { addEntry, countCustomers, createCustomer } from '@/db/repository';
import { parseAmount } from '@/domain/currency';
import { ENFORCE_FREE_LIMIT, FREE_CUSTOMER_LIMIT } from '@/domain/plan';
import { newCustomerSchema, type NewCustomerFormValues } from '@/domain/schemas';
import type { TranslationKey } from '@/i18n/translations';
import { haptic } from '@/lib/haptics';
import { useSessionStore } from '@/state/session-store';
import { useApp } from '@/state/use-app';
import { getFontFamily, useTheme, v4 } from '@/theme';
import { PrimaryButton, Sheet, Txt } from './primitives';

const EMPTY: NewCustomerFormValues = { name: '', phone: '', note: '', openingBalance: '' };

function Field({
  control,
  name,
  label,
  prefix,
  ...input
}: {
  control: Control<NewCustomerFormValues>;
  name: keyof NewCustomerFormValues;
  label: string;
  prefix?: string;
} & Omit<TextInputProps, 'value' | 'onChangeText'>) {
  const { t, settings, isRTL } = useApp();
  const { scheme } = useTheme();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <View className="gap-1.5">
          <Txt weight="600" className="text-sm text-ink-2">
            {label}
          </Txt>
          <View
            className={`min-h-[52px] items-center gap-2 rounded-2xl border bg-surface px-4 ${fieldState.error ? 'border-danger' : 'border-line'} ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
            {prefix ? (
              <Txt weight="600" numeric className="text-ink-2">
                {prefix}
              </Txt>
            ) : null}
            <TextInput
              {...input}
              value={field.value ?? ''}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholderTextColor={v4(scheme, 'text-muted')}
              className="flex-1 py-3 text-base text-ink"
              style={{ fontFamily: getFontFamily(settings.language, '500'), textAlign: isRTL ? 'right' : 'left' }}
            />
          </View>
          {fieldState.error?.message ? (
            <Txt className="text-xs text-danger">{t(fieldState.error.message as TranslationKey)}</Txt>
          ) : null}
        </View>
      )}
    />
  );
}

/** "Nouveau client" bottom sheet (decision 0018): name, phone, optional old debt; contacts import. */
export function NewCustomerSheet() {
  const db = useSQLiteContext();
  const { t, settings, isRTL } = useApp();
  const { scheme } = useTheme();
  const open = useSessionStore((s) => s.newCustomerOpen);
  const setOpen = useSessionStore((s) => s.setNewCustomerOpen);
  const bumpLedger = useSessionStore((s) => s.bumpLedger);
  const showToast = useSessionStore((s) => s.showToast);
  const openOperation = useSessionStore((s) => s.openOperation);

  const { control, handleSubmit, reset, setValue, formState } = useForm<NewCustomerFormValues>({
    resolver: zodResolver(newCustomerSchema(settings.currency)),
    defaultValues: EMPTY,
  });

  useEffect(() => {
    if (open) reset(EMPTY);
  }, [open, reset]);

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
    try {
      if (ENFORCE_FREE_LIMIT && (await countCustomers(db)) >= FREE_CUSTOMER_LIMIT) {
        showToast(t('freeLimitReached', { limit: FREE_CUSTOMER_LIMIT }));
        return;
      }
      const id = await createCustomer(db, values);
      const opening = parseAmount(values.openingBalance ?? '', settings.currency) ?? 0;
      if (opening > 0) {
        await addEntry(db, { customerId: id, kind: 'credit', amount: opening, method: 'cash', note: null, creditType: 'opening' });
      }
      haptic.success();
      bumpLedger();
      setOpen(false);
      showToast(t('customerAdded', { name: values.name.trim() }));
      // The usual next step: record what the new client just took.
      setTimeout(() => openOperation({ kind: 'credit', customerId: id }), 350);
    } catch {
      showToast(t('error'));
    }
  });

  return (
    <Sheet visible={open} onClose={() => setOpen(false)} title={t('addCustomer')}>
      <View className="gap-3">
        <Pressable
          accessibilityRole="button"
          onPress={pickContact}
          className={`min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-line bg-surface ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
          <ContactRound size={ICON_SCALE.sm.size} color={v4(scheme, 'accent')} />
          <Txt weight="600" className="text-accent">
            {t('importContact')}
          </Txt>
        </Pressable>
        <Field control={control} name="name" label={t('customerName')} autoCapitalize="words" autoFocus />
        <Field
          control={control}
          name="phone"
          label={t('phoneOptional')}
          prefix={settings.countryCode ? `+${settings.countryCode}` : undefined}
          keyboardType="phone-pad"
        />
        <Field
          control={control}
          name="openingBalance"
          label={t('openingBalance')}
          keyboardType="decimal-pad"
          placeholder="0"
        />
        <PrimaryButton label={t('save')} onPress={onSubmit} disabled={formState.isSubmitting} />
      </View>
    </Sheet>
  );
}
