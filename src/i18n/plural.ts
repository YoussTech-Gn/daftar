import type { Language, TranslationKey } from './translations';

/** CLDR plural categories used by our three languages. */
export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

/**
 * CLDR cardinal rules for integers:
 * - en: 1 → one, else other.
 * - fr: 0 and 1 → one, else other.
 * - ar: 0 zero, 1 one, 2 two, 3–10 few, 11–99 many (by n % 100), else other.
 */
export function pluralCategory(language: Language, n: number): PluralCategory {
  const i = Math.abs(Math.trunc(n));
  if (language === 'fr') return i <= 1 ? 'one' : 'other';
  if (language === 'ar') {
    const mod = i % 100;
    if (i === 0) return 'zero';
    if (i === 1) return 'one';
    if (i === 2) return 'two';
    if (mod >= 3 && mod <= 10) return 'few';
    if (mod >= 11 && mod <= 99) return 'many';
    return 'other';
  }
  return i === 1 ? 'one' : 'other';
}

type PluralForms = Partial<Record<PluralCategory, string>>;

/**
 * Plural variants of counted strings. The base string in translations.ts stays the fallback
 * ("other"); a variant is used when the call passes a numeric `n` or `count`.
 */
export const PLURALS: Record<Language, Partial<Record<TranslationKey, PluralForms>>> = {
  en: {
    customersInDebt: { one: '1 customer owes you' },
    customersCount: { one: '1 customer' },
    daysLeft: { one: '1 day left' },
    lastDaysAgo: { one: 'Last: 1 day ago' },
    triesBeforeLock: { one: '1 try left before a pause.' },
  },
  fr: {
    customersInDebt: { one: '{count} client vous doit' },
    customersCount: { one: '{n} client' },
    daysLeft: { one: 'encore {n} jour' },
    lastDaysAgo: { one: 'Dernier : il y a {n} jour' },
    triesBeforeLock: { one: 'Encore 1 essai avant une pause.' },
  },
  ar: {
    customersInDebt: {
      one: 'زبون واحد عليه دين',
      two: 'زبونان عليهما دين',
      few: '{count} زبائن عليهم ديون',
      many: '{count} زبونًا عليهم ديون',
      other: '{count} زبون عليهم ديون',
    },
    customersCount: {
      zero: 'لا زبائن',
      one: 'زبون واحد',
      two: 'زبونان',
      few: '{n} زبائن',
      many: '{n} زبونًا',
      other: '{n} زبون',
    },
    daysLeft: {
      one: 'باقي يوم واحد',
      two: 'باقي يومان',
      few: 'باقي {n} أيام',
      many: 'باقي {n} يومًا',
      other: 'باقي {n} يوم',
    },
    triesBeforeLock: {
      one: 'باقي محاولة واحدة قبل الإيقاف المؤقت.',
      two: 'باقي محاولتان قبل الإيقاف المؤقت.',
    },
    lastDaysAgo: {
      one: 'آخر عملية: منذ يوم',
      two: 'آخر عملية: منذ يومين',
      few: 'آخر عملية: منذ {n} أيام',
      many: 'آخر عملية: منذ {n} يومًا',
      other: 'آخر عملية: منذ {n} يوم',
    },
  },
};

/** Picks the plural variant of `key` for the numeric `n` / `count` in `values`, if there is one. */
export function pluralText(
  language: Language,
  key: TranslationKey,
  values: Record<string, string | number> | undefined,
): string | undefined {
  const forms = PLURALS[language][key];
  if (!forms || !values) return undefined;
  const n = typeof values.count === 'number' ? values.count : typeof values.n === 'number' ? values.n : undefined;
  if (n === undefined) return undefined;
  const cat = pluralCategory(language, n);
  return forms[cat] ?? (cat === 'zero' ? forms.other : undefined);
}
