/**
 * Brute-force protection for the PIN and the recovery code (decision 0019). Pure logic, no storage.
 *
 * A 4-digit PIN has only 10 000 values: without a limit a script (or a patient person) tries them all.
 * After FREE_ATTEMPTS wrong tries, every further wrong try locks entry for a growing delay, capped at
 * one hour. 10 000 tries then take more than a year. The state is stored in SecureStore, so closing
 * and reopening the app does not reset it.
 */
export interface AttemptState {
  /** Consecutive wrong attempts since the last success. */
  failures: number;
  /** Wall-clock time of the last wrong attempt (ms). */
  lastFailAt: number;
}

export const FREE_ATTEMPTS = 5;
export const EMPTY_ATTEMPTS: AttemptState = { failures: 0, lastFailAt: 0 };

const SECOND = 1000;
const MINUTE = 60 * SECOND;
/** Delay after the 5th, 6th, 7th, 8th wrong try; every later one waits the last value (1 hour). */
const SCHEDULE = [30 * SECOND, 1 * MINUTE, 5 * MINUTE, 15 * MINUTE, 60 * MINUTE];

/** How long entry stays locked after `failures` consecutive wrong attempts. */
export function lockDurationMs(failures: number): number {
  if (failures < FREE_ATTEMPTS) return 0;
  return SCHEDULE[Math.min(failures - FREE_ATTEMPTS, SCHEDULE.length - 1)];
}

/** Remaining lock time at `now`. Moving the phone clock backwards restarts the full delay. */
export function remainingLockMs(state: AttemptState, now: number): number {
  const duration = lockDurationMs(state.failures);
  if (duration === 0) return 0;
  if (now < state.lastFailAt) return duration;
  return Math.max(0, state.lastFailAt + duration - now);
}

export function registerFailure(state: AttemptState, now: number): AttemptState {
  return { failures: state.failures + 1, lastFailAt: now };
}

/** Wrong tries left before the next lock (0 when the next wrong try will lock). */
export function attemptsBeforeLock(state: AttemptState): number {
  return Math.max(0, FREE_ATTEMPTS - state.failures - 1);
}

export function parseAttempts(raw: string | null): AttemptState {
  if (!raw) return EMPTY_ATTEMPTS;
  try {
    const v = JSON.parse(raw) as Partial<AttemptState>;
    const failures = Number(v.failures);
    const lastFailAt = Number(v.lastFailAt);
    if (!Number.isFinite(failures) || !Number.isFinite(lastFailAt) || failures < 0) return EMPTY_ATTEMPTS;
    return { failures: Math.floor(failures), lastFailAt };
  } catch {
    return EMPTY_ATTEMPTS;
  }
}

/** "0:28", "4:59", "59:10". */
export function formatWait(ms: number): string {
  const total = Math.ceil(ms / SECOND);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
