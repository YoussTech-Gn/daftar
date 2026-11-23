/** Default closing-time reminder: 20:00 local. */
export const DEFAULT_REMINDER_HOUR = 20;
export const DEFAULT_REMINDER_MINUTE = 0;

/** Evening hours a shopkeeper can pick for the daily summary. */
export const REMINDER_HOUR_OPTIONS = [18, 19, 20, 21, 22] as const;

/** Debts with no payment / forgiveness for this many days appear in the summary. */
export const STALE_AFTER_DAYS = 30;

export const DAILY_SUMMARY_NOTIFICATION_ID = 'daftar-daily-summary';
export const DAILY_SUMMARY_CHANNEL_ID = 'daftar-daily-summary';

export function clampReminderHour(hour: number): number {
  if (!Number.isFinite(hour)) return DEFAULT_REMINDER_HOUR;
  return Math.min(23, Math.max(0, Math.trunc(hour)));
}

export function formatReminderClock(hour: number, minute = 0): string {
  const h = clampReminderHour(hour);
  const m = Math.min(59, Math.max(0, Math.trunc(minute)));
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export interface DailySummaryStats {
  customersInDebt: number;
  totalOwedFormatted: string;
  staleCount: number;
}

/** Pure copy for the shopkeeper's daily local notification (never sent to customers). */
export function buildDailySummaryContent(
  stats: DailySummaryStats,
  copy: {
    title: string;
    clearBody: string;
    bodyWithDebts: string;
    bodyWithStale: string;
  },
): { title: string; body: string } {
  if (stats.customersInDebt <= 0) {
    return { title: copy.title, body: copy.clearBody };
  }

  const base = copy.bodyWithDebts
    .replace('{count}', String(stats.customersInDebt))
    .replace('{amount}', stats.totalOwedFormatted);

  if (stats.staleCount <= 0) {
    return { title: copy.title, body: base };
  }

  return {
    title: copy.title,
    body: `${base} ${copy.bodyWithStale.replace('{stale}', String(stats.staleCount))}`.trim(),
  };
}

/** How many debtors have had no payment/forgiveness for at least `staleAfterDays`. */
export function countStaleDebts(
  debts: { sinceAt: number }[],
  now = Date.now(),
  staleAfterDays = STALE_AFTER_DAYS,
): number {
  const cutoff = now - staleAfterDays * 86_400_000;
  return debts.filter((d) => d.sinceAt <= cutoff).length;
}
