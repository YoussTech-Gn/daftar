import { getLocales } from 'expo-localization';
import type { SQLiteDatabase } from 'expo-sqlite';
import { create } from 'zustand';

import { getSetting, setSetting } from '@/db/repository';
import { DEFAULT_CURRENCY } from '@/domain/currency';
import {
  clampReminderHour,
  DEFAULT_REMINDER_HOUR,
  DEFAULT_REMINDER_MINUTE,
} from '@/domain/notifications';
import type { Language } from '@/i18n/translations';

export interface AppSettings {
  language: Language;
  currency: string;
  shopName: string;
  countryCode: string;
  onboarded: boolean;
  /** Local daily follow-up notification for the shopkeeper (decision 0020). */
  remindersEnabled: boolean;
  /** Local hour 0–23 for the daily summary (default 20 = closing time). */
  reminderHour: number;
  reminderMinute: number;
}

/** SQLite keys (kept from v1 so existing installs keep their settings). */
const SETTING_KEYS: Record<keyof AppSettings, string> = {
  language: 'language',
  currency: 'currency',
  shopName: 'shop_name',
  countryCode: 'country_code',
  onboarded: 'onboarded',
  remindersEnabled: 'reminders_enabled',
  reminderHour: 'reminder_hour',
  reminderMinute: 'reminder_minute',
};

function detectLanguage(): Language {
  const code = getLocales()[0]?.languageCode ?? 'fr';
  return code === 'ar' || code === 'en' ? code : 'fr';
}

interface SettingsState {
  ready: boolean;
  settings: AppSettings;
  /** Reads all settings from SQLite once at startup. */
  load: (db: SQLiteDatabase) => Promise<void>;
  /** Persists to SQLite, then updates the store. */
  update: (db: SQLiteDatabase, patch: Partial<AppSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  ready: false,
  settings: {
    language: detectLanguage(),
    currency: DEFAULT_CURRENCY,
    shopName: '',
    countryCode: '',
    onboarded: false,
    remindersEnabled: false,
    reminderHour: DEFAULT_REMINDER_HOUR,
    reminderMinute: DEFAULT_REMINDER_MINUTE,
  },
  load: async (db) => {
    const [language, currency, shopName, countryCode, onboarded, remindersEnabled, reminderHour, reminderMinute] =
      await Promise.all([
        getSetting(db, SETTING_KEYS.language),
        getSetting(db, SETTING_KEYS.currency),
        getSetting(db, SETTING_KEYS.shopName),
        getSetting(db, SETTING_KEYS.countryCode),
        getSetting(db, SETTING_KEYS.onboarded),
        getSetting(db, SETTING_KEYS.remindersEnabled),
        getSetting(db, SETTING_KEYS.reminderHour),
        getSetting(db, SETTING_KEYS.reminderMinute),
      ]);
    const prev = get().settings;
    const parsedHour = reminderHour != null ? Number(reminderHour) : prev.reminderHour;
    const parsedMinute = reminderMinute != null ? Number(reminderMinute) : prev.reminderMinute;
    set({
      ready: true,
      settings: {
        language: (language as Language | null) ?? prev.language,
        currency: currency ?? prev.currency,
        shopName: shopName ?? '',
        countryCode: countryCode ?? '',
        onboarded: onboarded === '1',
        remindersEnabled: remindersEnabled === '1',
        reminderHour: clampReminderHour(parsedHour),
        reminderMinute: Number.isFinite(parsedMinute)
          ? Math.min(59, Math.max(0, Math.trunc(parsedMinute)))
          : DEFAULT_REMINDER_MINUTE,
      },
    });
  },
  update: async (db, patch) => {
    for (const [key, value] of Object.entries(patch) as [keyof AppSettings, AppSettings[keyof AppSettings]][]) {
      const stored = typeof value === 'boolean' ? (value ? '1' : '0') : String(value);
      await setSetting(db, SETTING_KEYS[key], stored);
    }
    set((s) => ({ settings: { ...s.settings, ...patch } }));
  },
}));
