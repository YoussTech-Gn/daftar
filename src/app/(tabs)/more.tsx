import { zodResolver } from '@hookform/resolvers/zod';
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormField } from '@/components/form-field';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Coins,
  FileSpreadsheet,
  HardDriveDownload,
  HardDriveUpload,
  History,
  Languages,
  Lock,
  LockKeyhole,
  LockKeyholeOpen,
  ShoppingBasket,
  Store,
  Trash2,
  type LucideIcon,
} from '@/components/icons';
import { ConfirmationDialog, DaftarButton, DaftarText, Row } from '@/components/ui';
import { listProducts, listTrash, type BackupData } from '@/db/repository';
import { CURRENCIES } from '@/domain/currency';
import { shopSchema, type ShopFormValues } from '@/domain/schemas';
import { LANGUAGES } from '@/i18n/translations';
import { importAll, pickBackup, shareBackup, shareCsv } from '@/lib/export';
import { haptic } from '@/lib/haptics';
import { hasPin, removePin } from '@/security/pin';
import { useSessionStore } from '@/state/session-store';
import { useApp } from '@/state/use-app';
import { useTheme } from '@/theme';

type SheetKind = 'shop' | 'language' | 'currency' | 'pin' | 'backup' | null;

function GroupedCard({ children }: { children: ReactNode }) {
  const { colors, shadows } = useTheme();
  return (
    <View
      style={[
        styles.groupCard,
        shadows.card,
        { backgroundColor: colors.surface },
      ]}>
      {children}
    </View>
  );
}

function Hairline() {
  const { colors } = useTheme();
  return <View style={[styles.hairline, { backgroundColor: colors.border }]} />;
}

function SettingsRow({
  icon: Icon,
  title,
  value,
  numericValue,
  onPress,
}: {
  icon: LucideIcon;
  title: string;
  value?: string;
  numericValue?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { isRTL } = useApp();
  const Chevron = isRTL ? ChevronLeft : ChevronRight;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        haptic.selection();
        onPress();
      }}
      style={({ pressed }) => [
        styles.rowPressable,
        pressed ? { backgroundColor: colors.surfaceSunken } : undefined,
      ]}>
      <Row gap={12} style={styles.rowInner}>
        <View style={[styles.iconBadge, { backgroundColor: colors.primarySoft }]}>
          <Icon size={16} color={colors.primary} strokeWidth={1.85} />
        </View>

        <DaftarText
          role="label"
          weight="600"
          numberOfLines={1}
          style={{ flex: 1, color: colors.text }}>
          {title}
        </DaftarText>

        <Row gap={6} style={{ flexShrink: 0 }}>
          {value !== undefined && value !== '' ? (
            <DaftarText
              role="caption"
              tone="muted"
              numeric={numericValue}
              numberOfLines={1}
              style={styles.trailingValue}>
              {value}
            </DaftarText>
          ) : null}
          <Chevron size={16} color={colors.textMuted} strokeWidth={1.85} />
        </Row>
      </Row>
    </Pressable>
  );
}

function SettingsSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.sheetRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          style={[styles.sheetBackdrop, { backgroundColor: colors.overlay }]}
          onPress={onClose}
        />
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surfaceRaised,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 20) + 8,
            },
          ]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.borderStrong }]} />
          <DaftarText role="heading" weight="700">
            {title}
          </DaftarText>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** 04 · More / Settings: 4 clean grouped surface cards + quiet centered footer. */
export default function MoreScreen() {
  const db = useSQLiteContext();
  const { t, settings, updateSettings } = useApp();
  const { colors } = useTheme();
  const showToast = useSessionStore((s) => s.showToast);

  const [pinOn, setPinOn] = useState(false);
  const [productCount, setProductCount] = useState(0);
  const [trashCount, setTrashCount] = useState(0);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [confirmRemovePin, setConfirmRemovePin] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<BackupData | null>(null);

  const { control, handleSubmit, reset, formState } = useForm<ShopFormValues>({
    resolver: zodResolver(shopSchema),
    defaultValues: { shopName: settings.shopName, countryCode: settings.countryCode },
  });

  useFocusEffect(
    useCallback(() => {
      hasPin().then(setPinOn);
      listProducts(db).then((p) => setProductCount(p.length));
      listTrash(db).then((tr) => setTrashCount(tr.length));
    }, [db]),
  );

  async function run(task: () => Promise<void>) {
    try {
      await task();
    } catch {
      showToast(t('error'));
    }
  }

  async function handlePickBackup() {
    let data: BackupData | null;
    try {
      data = await pickBackup();
    } catch {
      showToast(t('restoreFailed'));
      return;
    }
    if (!data) return;
    setPendingBackup(data);
  }

  const saveShop = handleSubmit(async (values) => {
    await updateSettings({
      shopName: values.shopName.trim(),
      countryCode: values.countryCode.trim(),
    });
    haptic.success();
    setSheet(null);
  });

  const currencyDisplay =
    settings.currency === 'XOF' || settings.currency === 'XAF' ? 'FCFA' : settings.currency;
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <DaftarText role="title" weight="700">
          {t('tabMore')}
        </DaftarText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Card 1: Products & prices */}
        <GroupedCard>
          <SettingsRow
            icon={ShoppingBasket}
            title={t('products')}
            value={String(productCount)}
            numericValue
            onPress={() => router.push('/products')}
          />
        </GroupedCard>

        {/* Card 2: Shop name, Language, Currency */}
        <GroupedCard>
          <SettingsRow
            icon={Store}
            title={settings.shopName || t('shopName')}
            value={settings.countryCode ? `+${settings.countryCode}` : undefined}
            numericValue
            onPress={() => {
              reset({ shopName: settings.shopName, countryCode: settings.countryCode });
              setSheet('shop');
            }}
          />
          <Hairline />
          <SettingsRow
            icon={Languages}
            title={t('chooseLanguage')}
            value={settings.language.toUpperCase()}
            onPress={() => setSheet('language')}
          />
          <Hairline />
          <SettingsRow
            icon={Coins}
            title={t('chooseCurrency')}
            value={currencyDisplay}
            onPress={() => setSheet('currency')}
          />
        </GroupedCard>

        {/* Card 3: PIN Security */}
        <GroupedCard>
          <SettingsRow
            icon={Lock}
            title={t('security')}
            value={pinOn ? t('pinOnShort') : t('pinOffShort')}
            onPress={() => {
              if (pinOn) setSheet('pin');
              else router.push('/pin-setup');
            }}
          />
        </GroupedCard>

        {/* Card 4: Export CSV, Backup & restore, Activity log, Trash */}
        <GroupedCard>
          <SettingsRow
            icon={FileSpreadsheet}
            title={t('exportCsv')}
            onPress={() => run(() => shareCsv(db, settings.currency))}
          />
          <Hairline />
          <SettingsRow
            icon={HardDriveDownload}
            title={t('backupAndRestore')}
            onPress={() => setSheet('backup')}
          />
          <Hairline />
          <SettingsRow
            icon={History}
            title={t('activity')}
            onPress={() => router.push('/activity')}
          />
          <Hairline />
          <SettingsRow
            icon={Trash2}
            title={t('trash')}
            value={String(trashCount)}
            numericValue
            onPress={() => router.push('/trash')}
          />
        </GroupedCard>

        {/* Quiet centered caption footer */}
        <DaftarText role="caption" tone="muted" align="center" style={styles.footerCaption}>
          {t('settingsFooter', { version: appVersion })}
        </DaftarText>
      </ScrollView>

      {/* Shop name & country code sheet */}
      <SettingsSheet visible={sheet === 'shop'} title={t('shopSettings')} onClose={() => setSheet(null)}>
        <View style={styles.sheetBody}>
          <FormField
            control={control}
            name="shopName"
            label={t('shopName')}
            placeholder={t('shopNamePlaceholder')}
          />
          <FormField
            control={control}
            name="countryCode"
            label={t('countryCode')}
            prefix="+"
            keyboardType="number-pad"
            maxLength={4}
          />
          <DaftarButton label={t('save')} onPress={saveShop} loading={formState.isSubmitting} />
        </View>
      </SettingsSheet>

      {/* Language selector sheet */}
      <SettingsSheet visible={sheet === 'language'} title={t('chooseLanguage')} onClose={() => setSheet(null)}>
        <View style={[styles.optionList, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          {LANGUAGES.map((l, idx) => {
            const active = settings.language === l.code;
            return (
              <View key={l.code}>
                {idx > 0 ? <Hairline /> : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={async () => {
                    haptic.selection();
                    await updateSettings({ language: l.code });
                    setSheet(null);
                  }}
                  style={styles.optionRow}>
                  <Row style={{ justifyContent: 'space-between', flex: 1 }}>
                    <DaftarText role="body" weight={active ? '700' : '500'}>
                      {l.label}
                    </DaftarText>
                    {active ? <Check size={18} color={colors.primary} strokeWidth={2.2} /> : null}
                  </Row>
                </Pressable>
              </View>
            );
          })}
        </View>
      </SettingsSheet>

      {/* Currency selector sheet */}
      <SettingsSheet visible={sheet === 'currency'} title={t('chooseCurrency')} onClose={() => setSheet(null)}>
        <ScrollView
          style={[styles.currencyScroll, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          {CURRENCIES.map((c, idx) => {
            const active = settings.currency === c.code;
            return (
              <View key={c.code}>
                {idx > 0 ? <Hairline /> : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={async () => {
                    haptic.selection();
                    await updateSettings({ currency: c.code });
                    setSheet(null);
                  }}
                  style={styles.optionRow}>
                  <Row style={{ justifyContent: 'space-between', flex: 1 }}>
                    <DaftarText role="body" weight={active ? '700' : '500'}>
                      {c.code === c.symbol ? c.code : `${c.code} · ${c.symbol}`}
                    </DaftarText>
                    {active ? <Check size={18} color={colors.primary} strokeWidth={2.2} /> : null}
                  </Row>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      </SettingsSheet>

      {/* PIN options sheet (when PIN is active) */}
      <SettingsSheet visible={sheet === 'pin'} title={t('security')} onClose={() => setSheet(null)}>
        <View style={styles.sheetBody}>
          <DaftarButton
            label={t('changePin')}
            icon={LockKeyhole}
            variant="secondary"
            onPress={() => {
              setSheet(null);
              router.push('/pin-setup');
            }}
          />
          <DaftarButton
            label={t('removePin')}
            icon={LockKeyholeOpen}
            variant="dangerSoft"
            onPress={() => {
              setSheet(null);
              setConfirmRemovePin(true);
            }}
          />
        </View>
      </SettingsSheet>

      {/* Backup & restore sheet */}
      <SettingsSheet visible={sheet === 'backup'} title={t('backupAndRestore')} onClose={() => setSheet(null)}>
        <View style={styles.sheetBody}>
          <DaftarText role="caption" tone="muted">
            {t('dataPromise')}
          </DaftarText>
          <DaftarButton
            label={t('backupJson')}
            icon={HardDriveDownload}
            variant="secondary"
            onPress={() => {
              setSheet(null);
              run(() => shareBackup(db));
            }}
          />
          <DaftarButton
            label={t('restoreJson')}
            icon={HardDriveUpload}
            variant="secondary"
            onPress={() => {
              setSheet(null);
              handlePickBackup();
            }}
          />
        </View>
      </SettingsSheet>

      <ConfirmationDialog
        visible={confirmRemovePin}
        title={t('removePinTitle')}
        body={t('removePinBody')}
        confirmLabel={t('removePin')}
        tone="danger"
        icon="alert"
        onCancel={() => setConfirmRemovePin(false)}
        onConfirm={() => {
          setConfirmRemovePin(false);
          run(async () => {
            await removePin();
            haptic.warning();
            setPinOn(false);
          });
        }}
      />

      <ConfirmationDialog
        visible={pendingBackup !== null}
        title={t('restoreTitle')}
        body={t('restoreBody')}
        confirmLabel={t('restoreJson')}
        tone="danger"
        icon="restore"
        onCancel={() => setPendingBackup(null)}
        onConfirm={() => {
          const data = pendingBackup;
          setPendingBackup(null);
          if (!data) return;
          run(async () => {
            await importAll(db, data);
            haptic.success();
            showToast(t('restoreDone'));
          });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 36,
    gap: 12,
  },
  groupCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  hairline: {
    height: 1,
  },
  rowPressable: {
    minHeight: 52,
    justifyContent: 'center',
  },
  rowInner: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  trailingValue: {
    fontSize: 13,
    lineHeight: 18,
  },
  footerCaption: {
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 14,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 9999,
    alignSelf: 'center',
    marginBottom: 2,
  },
  sheetBody: {
    gap: 12,
  },
  optionList: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  currencyScroll: {
    maxHeight: 340,
    borderRadius: 14,
    borderWidth: 1,
  },
  optionRow: {
    minHeight: 50,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
});
