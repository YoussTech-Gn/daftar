import { daysAgo } from '@/domain/time';

export type AgeBucket = '0_30' | '31_60' | '61_90' | '90';

export const AGE_BUCKETS: AgeBucket[] = ['0_30', '31_60', '61_90', '90'];

export function ageBucket(days: number): AgeBucket {
  if (days <= 30) return '0_30';
  if (days <= 60) return '31_60';
  if (days <= 90) return '61_90';
  return '90';
}

/** Groups debts by age: total amount and number of customers per bucket. */
export function bucketDebts(
  debts: { balance: number; sinceAt: number }[],
  now: number = Date.now(),
): Record<AgeBucket, { amount: number; count: number }> {
  const result: Record<AgeBucket, { amount: number; count: number }> = {
    '0_30': { amount: 0, count: 0 },
    '31_60': { amount: 0, count: 0 },
    '61_90': { amount: 0, count: 0 },
    '90': { amount: 0, count: 0 },
  };
  for (const d of debts) {
    const b = result[ageBucket(daysAgo(d.sinceAt, now))];
    b.amount += d.balance;
    b.count += 1;
  }
  return result;
}

/** Share collected of everything ever owed: collected / (collected + outstanding), 0–1. */
export function collectedRatio(totalCollected: number, outstanding: number): number {
  const total = totalCollected + Math.max(outstanding, 0);
  return total <= 0 ? 0 : totalCollected / total;
}

/** [start, end) of the calendar month containing `now`. */
export function monthRange(now: number = Date.now()): [number, number] {
  const d = new Date(now);
  const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
  return [start, end];
}

/** 'today' | 'yesterday' | 'earlier' — for grouping recent activity. */
export function dayGroup(timestamp: number, now: number = Date.now()): 'today' | 'yesterday' | 'earlier' {
  const days = daysAgo(timestamp, now);
  return days === 0 ? 'today' : days === 1 ? 'yesterday' : 'earlier';
}
