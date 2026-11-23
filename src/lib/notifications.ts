import { Platform } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import * as Notifications from 'expo-notifications';
import {
  AndroidImportance,
  IosAuthorizationStatus,
  SchedulableTriggerInputTypes,
} from 'expo-notifications';

import { getSummary, listDebtAges } from '@/db/repository';
import { formatAmount } from '@/domain/currency';
import {
  buildDailySummaryContent,
  countStaleDebts,
  DAILY_SUMMARY_CHANNEL_ID,
  DAILY_SUMMARY_NOTIFICATION_ID,
  DEFAULT_REMINDER_HOUR,
  DEFAULT_REMINDER_MINUTE,
  clampReminderHour,
  type DailySummaryStats,
} from '@/domain/notifications';
import { DICTIONARIES, type Language, type TranslationKey } from '@/i18n/translations';

export type NotificationCopy = (key: TranslationKey, values?: Record<string, string | number>) => string;

/** Show banners while the app is open — the daily summary is meant to be seen. */
export function configureNotificationHandler(): void {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(DAILY_SUMMARY_CHANNEL_ID, {
    name: 'Daily follow-up',
    importance: AndroidImportance.DEFAULT,
    vibrationPattern: [0, 180],
  });
}

/** Asks the OS for local-notification permission. Returns whether it was granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  await ensureAndroidChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted || asked.ios?.status === IosAuthorizationStatus.PROVISIONAL;
}

export async function cancelDailySummary(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(DAILY_SUMMARY_NOTIFICATION_ID).catch(
    () => undefined,
  );
}

async function loadSummaryStats(db: SQLiteDatabase, currency: string): Promise<DailySummaryStats> {
  const [summary, ages] = await Promise.all([getSummary(db), listDebtAges(db)]);
  return {
    customersInDebt: summary.customersInDebt,
    totalOwedFormatted: formatAmount(summary.totalOwed, currency),
    staleCount: countStaleDebts(ages),
  };
}

function resolveCopy(
  language: Language,
  t?: NotificationCopy,
): NotificationCopy {
  if (t) return t;
  const dict = DICTIONARIES[language];
  return (key) => dict[key] ?? DICTIONARIES.en[key];
}

/** Cancels then schedules the daily local summary at the chosen local hour. */
export async function scheduleDailySummary(options: {
  db: SQLiteDatabase;
  enabled: boolean;
  hour: number;
  minute?: number;
  language: Language;
  currency: string;
  t?: NotificationCopy;
}): Promise<'scheduled' | 'disabled' | 'denied' | 'unsupported'> {
  if (Platform.OS === 'web') return 'unsupported';

  const hour = clampReminderHour(options.hour);
  const minute = options.minute ?? DEFAULT_REMINDER_MINUTE;

  if (!options.enabled) {
    await cancelDailySummary();
    return 'disabled';
  }

  const allowed = await requestNotificationPermission();
  if (!allowed) {
    await cancelDailySummary();
    return 'denied';
  }

  await ensureAndroidChannel();
  await cancelDailySummary();

  const stats = await loadSummaryStats(options.db, options.currency);
  const t = resolveCopy(options.language, options.t);
  const content = buildDailySummaryContent(stats, {
    title: t('notifDailyTitle'),
    clearBody: t('notifDailyClear'),
    bodyWithDebts: t('notifDailyBody'),
    bodyWithStale: t('notifDailyStale'),
  });

  // channelId belongs on the trigger (SDK 58 docs), not on content.
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_SUMMARY_NOTIFICATION_ID,
    content: {
      title: content.title,
      body: content.body,
      data: { url: '/(tabs)/customers', kind: 'daily-summary' },
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: DAILY_SUMMARY_CHANNEL_ID,
    },
  });

  return 'scheduled';
}

/** One-shot notification in a few seconds so the shopkeeper can verify the phone shows it. */
export async function sendTestNotification(options: {
  db: SQLiteDatabase;
  language: Language;
  currency: string;
  t?: NotificationCopy;
}): Promise<'sent' | 'denied' | 'unsupported'> {
  if (Platform.OS === 'web') return 'unsupported';

  const allowed = await requestNotificationPermission();
  if (!allowed) return 'denied';

  await ensureAndroidChannel();
  const stats = await loadSummaryStats(options.db, options.currency);
  const t = resolveCopy(options.language, options.t);
  const content = buildDailySummaryContent(stats, {
    title: t('notifDailyTitle'),
    clearBody: t('notifDailyClear'),
    bodyWithDebts: t('notifDailyBody'),
    bodyWithStale: t('notifDailyStale'),
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      data: { url: '/(tabs)/customers', kind: 'daily-summary' },
    },
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
      channelId: DAILY_SUMMARY_CHANNEL_ID,
    },
  });

  return 'sent';
}

export { DEFAULT_REMINDER_HOUR, DEFAULT_REMINDER_MINUTE };
