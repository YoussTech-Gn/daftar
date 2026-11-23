/**
 * "21 Nov · 13:28". No seconds. Latin digits even in Arabic, so amounts and dates use one numeral system.
 */
export function shortStamp(timestamp: number, language: string): string {
  const locale = language === 'ar' ? 'ar-u-nu-latn' : language === 'fr' ? 'fr-FR' : 'en-GB';
  const date = new Date(timestamp);
  const day = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(date);
  const hm = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return `${day} · ${hm}`;
}

/** Whole calendar days between a timestamp and now (0 = today, 1 = yesterday). */
export function daysAgo(timestamp: number, now: number = Date.now()): number {
  const start = (ms: number) => {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  return Math.max(0, Math.round((start(now) - start(timestamp)) / 86_400_000));
}
