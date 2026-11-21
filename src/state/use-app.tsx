import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, type ReactNode } from 'react';

import { formatAmount } from '@/domain/currency';
import { fillTemplate } from '@/domain/reminder';
import { pluralText } from '@/i18n/plural';
import { DICTIONARIES, LANGUAGES, type TranslationKey } from '@/i18n/translations';
import { useSettingsStore, type AppSettings } from '@/state/settings-store';

export type { AppSettings };

export type Translate = (key: TranslationKey, values?: Record<string, string | number>) => string;

interface AppApi {
  ready: boolean;
  settings: AppSettings;
  isRTL: boolean;
  t: Translate;
  /** Formats an amount; an optional sign ("+" / "−") is placed inside the same LTR isolate. */
  money: (minor: number, sign?: string) => string;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
}

/** Loads settings from SQLite into the Zustand store once. Renders children immediately. */
export function AppProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const load = useSettingsStore((s) => s.load);
  useEffect(() => {
    load(db);
  }, [db, load]);
  return <>{children}</>;
}

/** App helpers on top of the settings store: translation, money formatting, RTL flag. */
export function useApp(): AppApi {
  const db = useSQLiteContext();
  const ready = useSettingsStore((s) => s.ready);
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => update(db, patch), [db, update]);

  return useMemo<AppApi>(() => {
    const dict = DICTIONARIES[settings.language];
    return {
      ready,
      settings,
      isRTL: LANGUAGES.find((l) => l.code === settings.language)?.rtl ?? false,
      t: (key, values) => {
        const text = pluralText(settings.language, key, values) ?? dict[key] ?? DICTIONARIES.en[key];
        return values
          ? fillTemplate(text, Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v)])))
          : text;
      },
      // Left-to-right isolate (U+2066 … U+2069) so "535 000 GNF" is not reversed inside Arabic text.
      // The sign goes inside the isolate too: a sign outside it made Android measure the text too short.
      money: (minor, sign = '') => `⁦${sign}${formatAmount(minor, settings.currency)}⁩`,
      updateSettings,
    };
  }, [ready, settings, updateSettings]);
}
