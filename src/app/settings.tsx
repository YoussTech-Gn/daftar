import { zodResolver } from '@hookform/resolvers/zod';
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, ScrollView } from 'react-native';

import { FormField } from '@/components/form-field';
import {
  FileSpreadsheet,
  HardDriveDownload,
  HardDriveUpload,
  LockKeyhole,
  LockKeyholeOpen,
} from '@/components/icons';
import { Button, Card, Chip, ChipRow, Txt } from '@/components/ui';
import { CURRENCIES } from '@/domain/currency';
import { shopSchema, type ShopFormValues } from '@/domain/schemas';
import { LANGUAGES } from '@/i18n/translations';
import { importAll, pickBackup, shareBackup, shareCsv } from '@/lib/export';
import { hasPin, removePin } from '@/security/pin';
import { useApp } from '@/state/use-app';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { t, settings, updateSettings } = useApp();
  const [pinOn, setPinOn] = useState(false);
  const { control, handleSubmit } = useForm<ShopFormValues>({
    resolver: zodResolver(shopSchema),
    defaultValues: { shopName: settings.shopName, countryCode: settings.countryCode },
  });
  // Saved when the user leaves a field; invalid values show an error and are not saved.
  const saveShop = handleSubmit((values) =>
    updateSettings({ shopName: values.shopName.trim(), countryCode: values.countryCode.trim() }),
  );

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
        <FormField control={control} name="shopName" label={t('shopName')} onEndEditing={() => saveShop()} />
        <FormField
          control={control}
          name="countryCode"
          label={t('countryCode')}
          keyboardType="number-pad"
          maxLength={4}
          onEndEditing={() => saveShop()}
        />
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
        <Txt weight="600">{t('chooseCurrency')}</Txt>
        <ChipRow>
          {CURRENCIES.map((c) => (
            <Chip
              key={c.code}
              label={c.code}
              selected={settings.currency === c.code}
              onPress={() => updateSettings({ currency: c.code })}
            />
          ))}
        </ChipRow>
      </Card>

      <Card style={{ gap: 12 }}>
        <Txt weight="700" size={18}>
          {t('security')}
        </Txt>
        <Txt muted>{pinOn ? t('pinEnabled') : t('pinDisabled')}</Txt>
        <Button
          label={pinOn ? t('changePin') : t('setPin')}
          icon={LockKeyhole}
          variant="secondary"
          onPress={() => router.push('/pin-setup')}
        />
        {pinOn ? (
          <Button
            label={t('removePin')}
            icon={LockKeyholeOpen}
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
        <Button
          label={t('exportCsv')}
          icon={FileSpreadsheet}
          variant="secondary"
          onPress={() => run(() => shareCsv(db, settings.currency))}
        />
        <Button
          label={t('backupJson')}
          icon={HardDriveDownload}
          variant="secondary"
          onPress={() => run(() => shareBackup(db))}
        />
        <Button label={t('restoreJson')} icon={HardDriveUpload} variant="secondary" onPress={restore} />
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
