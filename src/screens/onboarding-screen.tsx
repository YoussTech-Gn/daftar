import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, ChipRow, Field, Txt } from '@/components/ui';
import { CURRENCIES } from '@/domain/currency';
import { LANGUAGES } from '@/i18n/translations';
import { useApp } from '@/state/app-context';
import { usePalette } from '@/theme';

export function OnboardingScreen() {
  const { t, settings, updateSettings } = useApp();
  const palette = usePalette();
  const [shopName, setShopName] = useState(settings.shopName);
  const [countryCode, setCountryCode] = useState(settings.countryCode);
  const [saving, setSaving] = useState(false);

  async function finish() {
    setSaving(true);
    await updateSettings({
      shopName: shopName.trim(),
      countryCode: countryCode.replace(/\D/g, ''),
      onboarded: true,
    });
  }

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

          <Field
            label={t('shopName')}
            placeholder={t('shopNamePlaceholder')}
            value={shopName}
            onChangeText={setShopName}
          />
          <View style={{ gap: 6 }}>
            <Field
              label={t('countryCode')}
              placeholder="224"
              keyboardType="number-pad"
              value={countryCode}
              onChangeText={setCountryCode}
              maxLength={4}
            />
            <Txt size={13} muted>
              {t('countryCodeHint')}
            </Txt>
          </View>

          <Button label={t('start')} onPress={finish} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
