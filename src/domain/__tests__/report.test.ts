import { describe, expect, it } from '@jest/globals';

import { ageBucket, bucketDebts, collectedRatio, dayGroup, monthRange } from '@/domain/report';

const DAY = 86_400_000;
const now = new Date(2026, 10, 21, 12, 0).getTime();

describe('debt age buckets', () => {
  it('maps days to buckets', () => {
    expect(ageBucket(0)).toBe('0_30');
    expect(ageBucket(30)).toBe('0_30');
    expect(ageBucket(31)).toBe('31_60');
    expect(ageBucket(75)).toBe('61_90');
    expect(ageBucket(120)).toBe('90');
  });

  it('sums amounts and counts per bucket', () => {
    const r = bucketDebts(
      [
        { balance: 1000, sinceAt: now - 2 * DAY },
        { balance: 500, sinceAt: now - 45 * DAY },
        { balance: 300, sinceAt: now - 200 * DAY },
        { balance: 200, sinceAt: now - 10 * DAY },
      ],
      now,
    );
    expect(r['0_30']).toEqual({ amount: 1200, count: 2 });
    expect(r['31_60']).toEqual({ amount: 500, count: 1 });
    expect(r['61_90']).toEqual({ amount: 0, count: 0 });
    expect(r['90']).toEqual({ amount: 300, count: 1 });
  });
});

describe('collected ratio', () => {
  it('is collected over collected + outstanding', () => {
    expect(collectedRatio(0, 0)).toBe(0);
    expect(collectedRatio(250, 750)).toBe(0.25);
    expect(collectedRatio(100, -50)).toBe(1);
  });
});

describe('dates', () => {
  it('month range covers the calendar month', () => {
    const [start, end] = monthRange(now);
    expect(new Date(start).getDate()).toBe(1);
    expect(new Date(start).getMonth()).toBe(10);
    expect(new Date(end).getMonth()).toBe(11);
  });

  it('groups recent activity by day', () => {
    expect(dayGroup(now - 60_000, now)).toBe('today');
    expect(dayGroup(now - DAY, now)).toBe('yesterday');
    expect(dayGroup(now - 3 * DAY, now)).toBe('earlier');
  });
});
