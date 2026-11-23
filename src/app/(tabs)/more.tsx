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
  Switch,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormField } from '@/components/form-field';
import { DOCK_SPACE } from '@/components/v4/floating-dock';
import { Glass, Txt } from '@/components/v4/primitives';
import {
  Bell,
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
  KeyRound,
  ShoppingBasket,
  Store,
  Trash2,
  type LucideIcon,
} from '@/components/icons';
import { ConfirmationDialog, DaftarButton, DaftarText, Row } from '@/components/ui';
import { listProducts, listTrash, type BackupData } from '@/db/repository';
import { CURRENCIES } from '@/domain/currency';
import { formatReminderClock, REMINDER_HOUR_OPTIONS } from '@/domain/notifications';
import { shopSchema, type ShopFormValues } from '@/domain/schemas';
import { LANGUAGES } from '@/i18n/translations';
import { importAll, pickBackup, shareBackup, shareCsv } from '@/lib/export';
import { haptic } from '@/lib/haptics';
import { scheduleDailySummary, sendTestNotification } from '@/lib/notifications';
import { hasPin, hasRecoveryCode, removePin } from '@/security/pin';
import { useSessionStore } from '@/state/session-store';
import { useApp } from '@/state/use-app';
import { useTheme, v4 } from '@/theme';

type SheetKind = 'shop' | 'language' | 'currency' | 'pin' | 'backup' | 'reminders' | null;

function Hairline() {
  return <View className="h-px bg-line" />;
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

const TINTS = {
  accent: { bg: 'bg-accent-soft', token: 'accent' },
  payment: { bg: 'bg-payment-soft', token: 'payment' },
  danger: { bg: 'bg-danger-soft', token: 'danger' },
} as const;

/** V4 settings group: uppercase caption + one glass card. */
function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  const { isRTL } = useApp();
  return (
    <View className="gap-2">
      <Txt
        weight="700"
        className="px-1 text-[11px] uppercase tracking-widest text-ink-3"
        style={{ textAlign: isRTL ? 'right' : 'left' }}>
        {title}
      </Txt>
      <Glass>{children}</Glass>
    </View>
  );
}

/** V4 settings row: 34px tinted badge, title + helpful subtitle, optional pill / badge, chevron. */
function V4Row({
  icon: Icon,
  tint,
  title,
  subtitle,
  pill,
  badge,
  onPress,
  last,
}: {
  icon: LucideIcon;
  tint: keyof typeof TINTS;
  title: string;
  subtitle?: string;
  pill?: string;
  badge?: string;
  onPress: () => void;
  last?: boolean;
}) {
  const { isRTL } = useApp();
  const { scheme } = useTheme();
  const Chevron = isRTL ? ChevronLeft : ChevronRight;
  const align = isRTL ? 'right' : 'left';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        haptic.selection();
        onPress();
      }}
      className={`items-center gap-3 px-4 py-[15px] active:bg-surface-muted ${last ? '' : 'border-b border-line'} ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
      <View className={`h-[34px] w-[34px] items-center justify-center rounded-xl ${TINTS[tint].bg}`}>
        <Icon size={17} color={v4(scheme, TINTS[tint].token)} strokeWidth={1.9} />
      </View>
      <View className="flex-1 gap-0.5">
        <Txt weight="600" numberOfLines={1} style={{ textAlign: align }}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt numberOfLines={1} className="text-xs text-ink-2" style={{ textAlign: align }}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {pill ? (
        <View className="rounded-full bg-payment-soft px-2.5 py-1">
          <Txt weight="700" className="text-[11px] text-payment">
            {pill}
          </Txt>
        </View>
      ) : null}
      {badge ? (
        <View className="min-w-[24px] items-center rounded-full bg-danger-soft px-2 py-0.5">
          <Txt weight="700" numeric className="text-xs text-danger">
            {badge}
          </Txt>
        </View>
      ) : null}
      <Chevron size={16} color={v4(scheme, 'text-muted')} strokeWidth={1.9} />
    </Pressable>
  );
}

/** 04 · Plus (V4, decision 0018): identity card, BOUTIQUE and SECURITE & DONNEES groups, isolated trash. */
export default function MoreScreen() {
  const db = useSQLiteContext();
  const { t, settings, updateSettings, isRTL } = useApp();
  const { colors } = useTheme();
  const showToast = useSessionStore((s) => s.showToast);

  const [pinOn, setPinOn] = useState(false);
  const [recoveryOn, setRecoveryOn] = useState(true);
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
      hasRecoveryCode().then(setRecoveryOn);
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
  const reminderClock = formatReminderClock(settings.reminderHour, settings.reminderMinute);

  const languageLabel = LANGUAGES.find((l) => l.code === settings.language)?.label ?? settings.language;
  const dir = isRTL ? 'flex-row-reverse' : 'flex-row';
  const align = isRTL ? 'right' : 'left';

  async function applyReminderSettings(patch: {
    remindersEnabled?: boolean;
    reminderHour?: number;
    reminderMinute?: number;
  }) {
    const next = {
      remindersEnabled: patch.remindersEnabled ?? settings.remindersEnabled,
      reminderHour: patch.reminderHour ?? settings.reminderHour,
      reminderMinute: patch.reminderMinute ?? settings.reminderMinute,
    };
    await updateSettings(patch);
    const result = await scheduleDailySummary({
      db,
      enabled: next.remindersEnabled,
      hour: next.reminderHour,
      minute: next.reminderMinute,
      language: settings.language,
      currency: settings.currency,
      t,
    });
    if (result === 'denied') {
      await updateSettings({ remindersEnabled: false });
      showToast(t('notifPermissionDenied'));
      return;
    }
    if (result === 'unsupported') {
      await updateSettings({ remindersEnabled: false });
      showToast(t('notifUnsupported'));
      return;
    }
    haptic.success();
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: DOCK_SPACE, gap: 20 }}
        keyboardShouldPersistTaps="handled">
        <Txt weight="700" className="text-2xl" style={{ textAlign: align }}>
          {t('tabMore')}
        </Txt>

        {/* Store identity card */}
        <Glass className={`items-center gap-3 p-4 ${dir}`}>
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-accent">
            <Store size={22} color={colors.onPrimary} strokeWidth={2} />
          </View>
          <View className="flex-1 gap-0.5">
            <Txt weight="700" numberOfLines={1} className="text-base" style={{ textAlign: align }}>
              {settings.shopName || t('shopName')}
            </Txt>
            <Txt numberOfLines={1} className="text-xs text-ink-2" style={{ textAlign: align }}>
              {settings.countryCode ? `+${settings.countryCode} · ` : ''}
              {t('dataOnDevice')}
            </Txt>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              haptic.selection();
              reset({ shopName: settings.shopName, countryCode: settings.countryCode });
              setSheet('shop');
            }}
            className="min-h-[48px] justify-center rounded-full bg-accent-soft px-4">
            <Txt weight="700" className="text-xs text-accent">
              {t('edit')}
            </Txt>
          </Pressable>
        </Glass>

        <SettingsGroup title={t('groupShop')}>
          <V4Row
            icon={ShoppingBasket}
            tint="accent"
            title={t('products')}
            subtitle={t('productsSaved', { n: productCount })}
            onPress={() => router.push('/products')}
          />
          <V4Row
            icon={Languages}
            tint="accent"
            title={t('languageAndCurrency')}
            subtitle={`${languageLabel} · ${currencyDisplay}`}
            onPress={() => setSheet('language')}
            last
          />
        </SettingsGroup>

        <SettingsGroup title={t('groupReminders')}>
          <V4Row
            icon={Bell}
            tint="payment"
            title={t('dailyReminder')}
            subtitle={
              settings.remindersEnabled
                ? t('dailyReminderOn', { time: reminderClock })
                : t('dailyReminderOff')
            }
            pill={settings.remindersEnabled ? t('pinOnShort') : undefined}
            onPress={() => setSheet('reminders')}
            last
          />
        </SettingsGroup>

        <SettingsGroup title={t('groupSecurityData')}>
          <V4Row
            icon={Lock}
            tint="payment"
            title={t('securityAndRecovery')}
            subtitle={pinOn ? (recoveryOn ? t('pinActive') : t('recoveryMissingShort')) : t('pinOffLong')}
            pill={pinOn ? t('pinOnShort') : undefined}
            onPress={() => {
              if (pinOn) setSheet('pin');
              else router.push('/pin-setup');
            }}
          />
          <V4Row
            icon={HardDriveDownload}
            tint="accent"
            title={t('backupAndRestore')}
            subtitle={t('backupSubtitle')}
            onPress={() => setSheet('backup')}
          />
          <V4Row
            icon={FileSpreadsheet}
            tint="accent"
            title={t('exportCsv')}
            subtitle={t('csvSubtitle')}
            onPress={() => run(() => shareCsv(db, settings.currency))}
          />
          <V4Row
            icon={History}
            tint="accent"
            title={t('activity')}
            subtitle={t('activitySubtitle')}
            onPress={() => router.push('/activity')}
            last
          />
        </SettingsGroup>

        <Glass>
          <V4Row
            icon={Trash2}
            tint="danger"
            title={t('trash')}
            subtitle={t('trashSubtitle')}
            badge={trashCount > 0 ? String(trashCount) : undefined}
            onPress={() => router.push('/trash')}
            last
          />
        </Glass>

        <Txt className="text-center text-xs text-ink-3">{t('settingsFooter', { version: appVersion })}</Txt>
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
        <DaftarButton
          label={`${t('chooseCurrency')} · ${currencyDisplay}`}
          icon={Coins}
          variant="secondary"
          onPress={() => setSheet('currency')}
        />
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
          {!recoveryOn ? (
            <DaftarText role="caption" tone="secondary">
              {t('recoveryMissingHint')}
            </DaftarText>
          ) : null}
          <DaftarButton
            label={t('newRecoveryCode')}
            icon={KeyRound}
            variant={recoveryOn ? 'secondary' : 'primary'}
            onPress={() => {
              setSheet(null);
              router.push('/recovery-code');
            }}
          />
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

      {/* Daily local notification sheet */}
      <SettingsSheet visible={sheet === 'reminders'} title={t('dailyReminder')} onClose={() => setSheet(null)}>
        <View style={styles.sheetBody}>
          <DaftarText role="caption" tone="muted">
            {t('dailyReminderHint')}
          </DaftarText>
          <View style={[styles.toggleRow, dir === 'flex-row-reverse' ? styles.toggleRowRtl : null]}>
            <DaftarText role="body" weight="600" style={{ flex: 1 }}>
              {t('enableDailyReminder')}
            </DaftarText>
            <Switch
              value={settings.remindersEnabled}
              onValueChange={(value) => {
                haptic.selection();
                run(() => applyReminderSettings({ remindersEnabled: value }));
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surfaceRaised}
            />
          </View>
          <DaftarText role="caption" tone="secondary">
            {t('reminderTime')}
          </DaftarText>
          <View style={[styles.hourRow, isRTL ? styles.hourRowRtl : null]}>
            {REMINDER_HOUR_OPTIONS.map((hour) => {
              const active = settings.reminderHour === hour;
              return (
                <Pressable
                  key={hour}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    haptic.selection();
                    run(() => applyReminderSettings({ reminderHour: hour, reminderMinute: 0 }));
                  }}
                  style={[
                    styles.hourChip,
                    {
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.primarySoft : colors.surface,
                    },
                  ]}>
                  <DaftarText role="caption" weight={active ? '700' : '500'} tone={active ? 'primary' : 'default'}>
                    {formatReminderClock(hour)}
                  </DaftarText>
                </Pressable>
              );
            })}
          </View>
          <DaftarButton
            label={t('testNotification')}
            icon={Bell}
            variant="secondary"
            onPress={() =>
              run(async () => {
                const result = await sendTestNotification({
                  db,
                  language: settings.language,
                  currency: settings.currency,
                  t,
                });
                if (result === 'denied') {
                  showToast(t('notifPermissionDenied'));
                  return;
                }
                if (result === 'unsupported') {
                  showToast(t('notifUnsupported'));
                  return;
                }
                haptic.success();
                showToast(t('testNotificationSent'));
              })
            }
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
  toggleRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleRowRtl: {
    flexDirection: 'row-reverse',
  },
  hourRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hourRowRtl: {
    flexDirection: 'row-reverse',
  },
  hourChip: {
    minHeight: 40,
    minWidth: 64,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
