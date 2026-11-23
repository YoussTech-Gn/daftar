import { describe, expect, it } from '@jest/globals';

import {
  buildDailySummaryContent,
  clampReminderHour,
  countStaleDebts,
  DEFAULT_REMINDER_HOUR,
  formatReminderClock,
} from '@/domain/notifications';

describe('reminder clock', () => {
  it('formats and clamps hours', () => {
    expect(formatReminderClock(20)).toBe('20:00');
    expect(formatReminderClock(9, 5)).toBe('09:05');
    expect(clampReminderHour(99)).toBe(23);
    expect(clampReminderHour(-3)).toBe(0);
    expect(clampReminderHour(Number.NaN)).toBe(DEFAULT_REMINDER_HOUR);
  });
});

describe('countStaleDebts', () => {
  const now = Date.parse('2026-11-23T12:00:00Z');

  it('counts debts older than 30 days', () => {
    expect(
      countStaleDebts(
        [
          { sinceAt: now - 10 * 86_400_000 },
          { sinceAt: now - 31 * 86_400_000 },
          { sinceAt: now - 90 * 86_400_000 },
        ],
        now,
      ),
    ).toBe(2);
  });
});

describe('buildDailySummaryContent', () => {
  const copy = {
    title: 'Daftar',
    clearBody: 'Nobody owes you anything.',
    bodyWithDebts: 'Today: {count} customers · {amount}.',
    bodyWithStale: '{stale} with no payment for 30+ days.',
  };

  it('uses the clear body when the ledger is empty', () => {
    expect(
      buildDailySummaryContent(
        { customersInDebt: 0, totalOwedFormatted: '0', staleCount: 0 },
        copy,
      ),
    ).toEqual({ title: 'Daftar', body: 'Nobody owes you anything.' });
  });

  it('includes stale debts when present', () => {
    expect(
      buildDailySummaryContent(
        { customersInDebt: 3, totalOwedFormatted: '50 000 FCFA', staleCount: 2 },
        copy,
      ),
    ).toEqual({
      title: 'Daftar',
      body: 'Today: 3 customers · 50 000 FCFA. 2 with no payment for 30+ days.',
    });
  });
});
