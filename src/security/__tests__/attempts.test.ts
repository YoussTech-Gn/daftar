import { describe, expect, it } from '@jest/globals';

import {
  attemptsBeforeLock,
  EMPTY_ATTEMPTS,
  formatWait,
  lockDurationMs,
  parseAttempts,
  registerFailure,
  remainingLockMs,
  type AttemptState,
} from '@/security/attempts';

const MIN = 60_000;

function fail(times: number, start = 1_000_000): AttemptState {
  let s = EMPTY_ATTEMPTS;
  for (let i = 0; i < times; i += 1) s = registerFailure(s, start);
  return s;
}

describe('PIN attempt limit', () => {
  it('allows 4 free wrong tries, then locks for growing delays capped at 1 hour', () => {
    expect([1, 2, 3, 4].map(lockDurationMs)).toEqual([0, 0, 0, 0]);
    expect([5, 6, 7, 8, 9, 20].map(lockDurationMs)).toEqual([30_000, MIN, 5 * MIN, 15 * MIN, 60 * MIN, 60 * MIN]);
  });

  it('counts down and then opens again', () => {
    const s = fail(5, 1_000_000);
    expect(remainingLockMs(s, 1_000_000)).toBe(30_000);
    expect(remainingLockMs(s, 1_020_000)).toBe(10_000);
    expect(remainingLockMs(s, 1_030_000)).toBe(0);
  });

  it('restarts the full delay when the phone clock is moved backwards', () => {
    const s = fail(7, 5_000_000);
    expect(remainingLockMs(s, 4_000_000)).toBe(5 * MIN);
  });

  it('makes a full 10 000-PIN sweep take more than a year', () => {
    let total = 0;
    for (let f = 1; f <= 10_000; f += 1) total += lockDurationMs(f);
    expect(total).toBeGreaterThan(365 * 24 * 60 * MIN);
  });

  it('warns before the lock and survives bad stored data', () => {
    expect(attemptsBeforeLock(fail(2))).toBe(2);
    expect(attemptsBeforeLock(fail(4))).toBe(0);
    expect(parseAttempts('not json')).toEqual(EMPTY_ATTEMPTS);
    expect(parseAttempts('{"failures":-3,"lastFailAt":1}')).toEqual(EMPTY_ATTEMPTS);
    expect(parseAttempts('{"failures":6,"lastFailAt":42}')).toEqual({ failures: 6, lastFailAt: 42 });
    expect(formatWait(28_100)).toBe('0:29');
    expect(formatWait(59 * MIN + 10_000)).toBe('59:10');
  });
});
