import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/form-field';
import { Button, Chip, ChipRow, Txt } from '@/components/ui';
import { CURRENCIES } from '@/domain/currency';
import { shopSchema, type ShopFormValues } from '@/domain/schemas';
import { LANGUAGES } from '@/i18n/translations';
import { useApp } from '@/state/use-app';
import { usePalette } from '@/theme';

export function OnboardingScreen() {
  const { t, settings, updateSettings } = useApp();
  const palette = usePalette();
  const { control, handleSubmit, formState } = useForm<ShopFormValues>({
    resolver: zodResolver(shopSchema),
    defaultValues: { shopName: settings.shopName, countryCode: settings.countryCode },
  });

  const finish = handleSubmit(async (values) => {
    await updateSettings({ shopName: values.shopName.trim(), countryCode: values.countryCode.trim(), onboarded: true });
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 22 }} keyboardShouldPersistTaps="handled">
          <View style={{ gap: 6, marginTop: 24 }}>
            <Txt size={34} weight="800" style={{ color: palette.primary }}>
              {t('appName')}
            </Txt>
            <Txt size={22} weight="700">
              {t('welcome')}
            </Txt>
            <Txt muted>{t('tagline')}</Txt>
          </View>

          <View style={{ gap: 10 }}>
            <Txt weight="600">{t('chooseLanguage')}</Txt>
            <ChipRow>
              {LANGUAGES.map((l) => (
                <Chip
                  key={l.code}
                  label={l.label}
                  selected={settings.language === l.code}
                  onPress={() => updateSettings({ language: l.code })}
                />
              ))}
            </ChipRow>
          </View>

          <View style={{ gap: 10 }}>
            <Txt weight="600">{t('chooseCurrency')}</Txt>
            <ChipRow>
              {CURRENCIES.map((c) => (
                <Chip
                  key={c.code}
                  label={c.code === c.symbol ? c.code : `${c.code} · ${c.symbol}`}
                  selected={settings.currency === c.code}
                  onPress={() => updateSettings({ currency: c.code })}
                />
              ))}
            </ChipRow>
          </View>

          <FormField control={control} name="shopName" label={t('shopName')} placeholder={t('shopNamePlaceholder')} />
          <View style={{ gap: 6 }}>
            <FormField
              control={control}
              name="countryCode"
              label={t('countryCode')}
              placeholder="224"
              keyboardType="number-pad"
              maxLength={4}
            />
            <Txt size={13} muted>
              {t('countryCodeHint')}
            </Txt>
          </View>

          <Button label={t('start')} onPress={finish} loading={formState.isSubmitting} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
