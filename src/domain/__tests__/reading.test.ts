import { describe, expect, it } from '@jest/globals';

import { avatarSeed, avatarTintIndex, compareByDebt, latestPayment } from '@/domain/reading';
import { shortStamp } from '@/domain/time';

describe('latestPayment', () => {
  const credit = { id: 1, kind: 'credit', cancelledAt: null, createdAt: 30 };
  const forgiven = { id: 2, kind: 'forgiven', cancelledAt: null, createdAt: 20 };
  const cancelledPayment = { id: 3, kind: 'payment', cancelledAt: 15, createdAt: 15 };
  const payment = { id: 4, kind: 'payment', cancelledAt: null, createdAt: 10 };

  it('ignores forgiveness and cancelled payments', () => {
    // Newest first, the order listEntries returns.
    expect(latestPayment([forgiven, cancelledPayment, payment, credit])?.id).toBe(4);
  });

  it('returns nothing when the customer was only forgiven', () => {
    expect(latestPayment([forgiven, credit])).toBeUndefined();
  });
});

describe('compareByDebt', () => {
  it('puts the largest debt first, then the one that has been quiet longest', () => {
    const rows = [
      { name: 'Awa', balance: 500, lastActivityAt: 100 },
      { name: 'Moussa', balance: 2000, lastActivityAt: 50 },
      { name: 'Binta', balance: 2000, lastActivityAt: 10 },
      { name: 'Sidi', balance: 0, lastActivityAt: 80 },
      { name: 'Lamine', balance: -300, lastActivityAt: 90 },
    ];
    expect(rows.slice().sort(compareByDebt).map((r) => r.name)).toEqual([
      'Binta',
      'Moussa',
      'Awa',
      'Sidi',
      'Lamine',
    ]);
  });
});

describe('avatar seed', () => {
  it('hashes the id, so a rename does not move the colour', () => {
    const size = 4;
    expect(avatarTintIndex(avatarSeed(7, 'Awa Diallo'), size)).toBe(avatarTintIndex(avatarSeed(7, 'Awa'), size));
    const colours = new Set(
      Array.from({ length: 12 }, (_, id) => avatarTintIndex(avatarSeed(id, 'Awa'), size)),
    );
    expect(colours.size).toBeGreaterThan(1);
  });

  it('stays inside the palette', () => {
    for (let id = 0; id < 40; id += 1) {
      const index = avatarTintIndex(avatarSeed(id, 'x'), 4);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(4);
    }
  });
});

describe('shortStamp', () => {
  it('drops seconds and keeps Latin digits', () => {
    const ts = new Date(2026, 10, 21, 13, 28, 56).getTime();
    for (const language of ['en', 'fr', 'ar']) {
      const text = shortStamp(ts, language);
      expect(text).toContain('13:28');
      expect(text).not.toContain('13:28:56');
      expect(text).not.toMatch(/[٠-٩]/);
    }
  });
});
