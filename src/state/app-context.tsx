import { getLocales } from 'expo-localization';
import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getSetting, setSetting } from '@/db/repository';
import { DEFAULT_CURRENCY, formatAmount } from '@/domain/currency';
import { fillTemplate } from '@/domain/reminder';
import { DICTIONARIES, LANGUAGES, type Language, type TranslationKey } from '@/i18n/translations';

export interface AppSettings {
  language: Language;
  currency: string;
  shopName: string;
  countryCode: string;
  onboarded: boolean;
}

interface AppContextValue {
  ready: boolean;
  settings: AppSettings;
  isRTL: boolean;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
  money: (minor: number) => string;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function detectLanguage(): Language {
  const code = getLocales()[0]?.languageCode ?? 'fr';
  return code === 'ar' || code === 'en' ? code : 'fr';
}

const SETTING_KEYS: Record<keyof AppSettings, string> = {
  language: 'language',
  currency: 'currency',
  shopName: 'shop_name',
  countryCode: 'country_code',
  onboarded: 'onboarded',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    language: detectLanguage(),
    currency: DEFAULT_CURRENCY,
    shopName: '',
    countryCode: '',
    onboarded: false,
  });

  useEffect(() => {
    (async () => {
      const [language, currency, shopName, countryCode, onboarded] = await Promise.all([
        getSetting(db, SETTING_KEYS.language),
        getSetting(db, SETTING_KEYS.currency),
        getSetting(db, SETTING_KEYS.shopName),
        getSetting(db, SETTING_KEYS.countryCode),
        getSetting(db, SETTING_KEYS.onboarded),
      ]);
      setSettings((prev) => ({
        language: (language as Language | null) ?? prev.language,
        currency: currency ?? prev.currency,
        shopName: shopName ?? '',
        countryCode: countryCode ?? '',
        onboarded: onboarded === '1',
      }));
      setReady(true);
    })();
  }, [db]);

  const updateSettings = useCallback(
    async (patch: Partial<AppSettings>) => {
      for (const [key, value] of Object.entries(patch) as [keyof AppSettings, AppSettings[keyof AppSettings]][]) {
        const stored = typeof value === 'boolean' ? (value ? '1' : '0') : String(value);
        await setSetting(db, SETTING_KEYS[key], stored);
      }
      setSettings((prev) => ({ ...prev, ...patch }));
    },
    [db],
  );

  const value = useMemo<AppContextValue>(() => {
    const dict = DICTIONARIES[settings.language];
    return {
      ready,
      settings,
      isRTL: LANGUAGES.find((l) => l.code === settings.language)?.rtl ?? false,
      t: (key, values) => {
        const text = dict[key] ?? DICTIONARIES.en[key];
        return values
          ? fillTemplate(text, Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v)])))
          : text;
      },
      // Left-to-right isolate (U+2066 … U+2069) so "535 000 GNF" is not reversed inside Arabic text.
      money: (minor) => `⁦${formatAmount(minor, settings.currency)}⁩`,
      updateSettings,
    };
  }, [ready, settings, updateSettings]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
