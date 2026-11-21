import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Button, Card, Chip, Field, Txt } from '@/components/ui';
import { CURRENCIES } from '@/domain/currency';
import { LANGUAGES } from '@/i18n/translations';
import { importAll, pickBackup, shareBackup, shareCsv } from '@/lib/export';
import { hasPin, removePin } from '@/security/pin';
import { useApp } from '@/state/app-context';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { t, settings, updateSettings } = useApp();
  const [pinOn, setPinOn] = useState(false);
  const [shopName, setShopName] = useState(settings.shopName);
  const [countryCode, setCountryCode] = useState(settings.countryCode);

  useFocusEffect(
    useCallback(() => {
      hasPin().then(setPinOn);
    }, []),
  );

  async function run(task: () => Promise<void>) {
    try {
      await task();
    } catch {
      Alert.alert(t('error'));
    }
  }

  async function restore() {
    let data;
    try {
      data = await pickBackup();
    } catch {
      Alert.alert(t('restoreFailed'));
      return;
    }
    if (!data) return;
    const backup = data;
    Alert.alert(t('restoreTitle'), t('restoreBody'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('restoreJson'),
        style: 'destructive',
        onPress: () =>
          run(async () => {
            await importAll(db, backup);
            Alert.alert(t('restoreDone'));
          }),
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
      <Card style={{ gap: 14 }}>
        <Field
          label={t('shopName')}
          value={shopName}
          onChangeText={setShopName}
          onEndEditing={() => updateSettings({ shopName: shopName.trim() })}
        />
        <Field
          label={t('countryCode')}
          value={countryCode}
          keyboardType="number-pad"
          maxLength={4}
          onChangeText={setCountryCode}
          onEndEditing={() => updateSettings({ countryCode: countryCode.replace(/\D/g, '') })}
        />
        <Txt weight="600">{t('chooseLanguage')}</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {LANGUAGES.map((l) => (
            <Chip
              key={l.code}
              label={l.label}
              selected={settings.language === l.code}
              onPress={() => updateSettings({ language: l.code })}
            />
          ))}
        </View>
        <Txt weight="600">{t('chooseCurrency')}</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CURRENCIES.map((c) => (
            <Chip
              key={c.code}
              label={c.code}
              selected={settings.currency === c.code}
              onPress={() => updateSettings({ currency: c.code })}
            />
          ))}
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <Txt weight="700" size={18}>
          {t('security')}
        </Txt>
        <Txt muted>{pinOn ? t('pinEnabled') : t('pinDisabled')}</Txt>
        <Button
          label={pinOn ? t('changePin') : t('setPin')}
          variant="secondary"
          onPress={() => router.push('/pin-setup')}
        />
        {pinOn ? (
          <Button
            label={t('removePin')}
            variant="danger"
            onPress={() =>
              run(async () => {
                await removePin();
                setPinOn(false);
              })
            }
          />
        ) : null}
      </Card>

      <Card style={{ gap: 12 }}>
        <Txt weight="700" size={18}>
          {t('data')}
        </Txt>
        <Txt muted>{t('dataPromise')}</Txt>
        <Button label={t('exportCsv')} variant="secondary" onPress={() => run(() => shareCsv(db, settings.currency))} />
        <Button label={t('backupJson')} variant="secondary" onPress={() => run(() => shareBackup(db))} />
        <Button label={t('restoreJson')} variant="secondary" onPress={restore} />
      </Card>

      <Card style={{ gap: 4 }}>
        <Txt weight="700" size={18}>
          {t('about')}
        </Txt>
        <Txt muted>{t('tagline')}</Txt>
        <Txt muted size={13}>
          {t('version')} {Constants.expoConfig?.version ?? '1.0.0'}
        </Txt>
      </Card>
    </ScrollView>
  );
}
