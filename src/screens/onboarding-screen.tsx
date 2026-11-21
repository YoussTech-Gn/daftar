import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormField } from '@/components/form-field';
import { Card, ChipRow, DaftarButton, DaftarChip, DaftarEmblem, DaftarText, Row } from '@/components/ui';
import { CURRENCIES } from '@/domain/currency';
import { shopSchema, type ShopFormValues } from '@/domain/schemas';
import { LANGUAGES } from '@/i18n/translations';
import { haptic } from '@/lib/haptics';
import { useApp } from '@/state/use-app';
import { useTheme } from '@/theme';

const COUNTRY_PRESETS = ['221', '224', '223', '225', '212'];

/** 14 · Onboarding (Single Screen): emblem, headline, language & currency chips, shop name, country code, Start. */
export function OnboardingScreen() {
  const { t, settings, updateSettings } = useApp();
  const { colors } = useTheme();
  const { control, handleSubmit, setValue, formState } = useForm<ShopFormValues>({
    resolver: zodResolver(shopSchema),
    defaultValues: { shopName: settings.shopName, countryCode: settings.countryCode },
  });

  const currentCode = useWatch({ control, name: 'countryCode' });

  const finish = handleSubmit(async (values) => {
    haptic.success();
    await updateSettings({
      shopName: values.shopName.trim(),
      countryCode: values.countryCode.trim(),
      onboarded: true,
    });
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.heroHeader}>
            <Row gap={12}>
              <DaftarEmblem size={52} />
              <View style={{ flex: 1, gap: 2 }}>
                <DaftarText role="title" tone="primary" weight="700" style={{ fontSize: 28, lineHeight: 34 }}>
                  {t('appName')}
                </DaftarText>
                <DaftarText role="heading" weight="700">
                  {t('welcome')}
                </DaftarText>
              </View>
            </Row>
            <DaftarText role="body" tone="secondary">
              {t('tagline')}
            </DaftarText>
          </View>

          <Card style={{ gap: 16 }}>
            <View style={{ gap: 8 }}>
              <DaftarText role="label" tone="secondary" weight="600">
                {t('chooseLanguage')}
              </DaftarText>
              <ChipRow>
                {LANGUAGES.map((l) => (
                  <DaftarChip
                    key={l.code}
                    variant="filter"
                    label={l.label}
                    selected={settings.language === l.code}
                    onPress={() => updateSettings({ language: l.code })}
                  />
                ))}
              </ChipRow>
            </View>

            <View style={{ gap: 8 }}>
              <DaftarText role="label" tone="secondary" weight="600">
                {t('chooseCurrency')}
              </DaftarText>
              <ChipRow>
                {CURRENCIES.map((c) => (
                  <DaftarChip
                    key={c.code}
                    variant="filter"
                    label={c.code === c.symbol ? c.code : `${c.code} · ${c.symbol}`}
                    selected={settings.currency === c.code}
                    onPress={() => updateSettings({ currency: c.code })}
                  />
                ))}
              </ChipRow>
            </View>
          </Card>

          <Card style={{ gap: 16 }}>
            <FormField control={control} name="shopName" label={t('shopName')} placeholder={t('shopNamePlaceholder')} />

            <View style={{ gap: 8 }}>
              <FormField
                control={control}
                name="countryCode"
                label={t('countryCode')}
                prefix="+"
                placeholder="224"
                keyboardType="number-pad"
                maxLength={4}
              />
              <ChipRow>
                {COUNTRY_PRESETS.map((code) => (
                  <DaftarChip
                    key={code}
                    variant="filter"
                    label={`+${code}`}
                    selected={currentCode === code}
                    onPress={() => setValue('countryCode', code, { shouldValidate: true })}
                  />
                ))}
              </ChipRow>
              <DaftarText role="caption" tone="muted">
                {t('countryCodeHint')}
              </DaftarText>
            </View>
          </Card>

          <DaftarButton label={t('start')} onPress={finish} loading={formState.isSubmitting} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    gap: 18,
    paddingBottom: 36,
  },
  heroHeader: {
    gap: 10,
    marginTop: 12,
  },
});
