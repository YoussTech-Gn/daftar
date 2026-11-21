import { getLocales } from 'expo-localization';
import type { SQLiteDatabase } from 'expo-sqlite';
import { create } from 'zustand';

import { getSetting, setSetting } from '@/db/repository';
import { DEFAULT_CURRENCY } from '@/domain/currency';
import type { Language } from '@/i18n/translations';

export interface AppSettings {
  language: Language;
  currency: string;
  shopName: string;
  countryCode: string;
  onboarded: boolean;
}

/** SQLite keys (kept from v1 so existing installs keep their settings). */
const SETTING_KEYS: Record<keyof AppSettings, string> = {
  language: 'language',
  currency: 'currency',
  shopName: 'shop_name',
  countryCode: 'country_code',
  onboarded: 'onboarded',
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
  },
  load: async (db) => {
    const [language, currency, shopName, countryCode, onboarded] = await Promise.all([
      getSetting(db, SETTING_KEYS.language),
      getSetting(db, SETTING_KEYS.currency),
      getSetting(db, SETTING_KEYS.shopName),
      getSetting(db, SETTING_KEYS.countryCode),
      getSetting(db, SETTING_KEYS.onboarded),
    ]);
    const prev = get().settings;
    set({
      ready: true,
      settings: {
        language: (language as Language | null) ?? prev.language,
        currency: currency ?? prev.currency,
        shopName: shopName ?? '',
        countryCode: countryCode ?? '',
        onboarded: onboarded === '1',
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
