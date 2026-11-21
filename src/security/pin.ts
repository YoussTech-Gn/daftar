import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import {
  attemptsBeforeLock,
  EMPTY_ATTEMPTS,
  parseAttempts,
  registerFailure,
  remainingLockMs,
  type AttemptState,
} from './attempts';
import { codeFromBytes, normalizeRecoveryCode, RECOVERY_LENGTH } from './recovery-code';

const PIN_KEY = 'daftar_pin_hash';
const SALT_KEY = 'daftar_pin_salt';
const RECOVERY_KEY = 'daftar_recovery_hash';
const RECOVERY_SALT_KEY = 'daftar_recovery_salt';
/** Wrong-attempt counters (decision 0019), one per secret, kept in SecureStore so a restart does not reset them. */
const ATTEMPT_KEYS = { pin: 'daftar_pin_attempts', recovery: 'daftar_recovery_attempts' } as const;

export type SecretKind = keyof typeof ATTEMPT_KEYS;

/** Result of a PIN or recovery-code check. When locked, the secret was not even compared. */
export type CheckResult =
  | { ok: true }
  | { ok: false; locked: boolean; lockedMs: number; triesBeforeLock: number };

async function hash(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

async function readAttempts(kind: SecretKind): Promise<AttemptState> {
  return parseAttempts(await SecureStore.getItemAsync(ATTEMPT_KEYS[kind]));
}

async function writeAttempts(kind: SecretKind, state: AttemptState): Promise<void> {
  await SecureStore.setItemAsync(ATTEMPT_KEYS[kind], JSON.stringify(state));
}

export async function resetAttempts(kind: SecretKind): Promise<void> {
  await SecureStore.deleteItemAsync(ATTEMPT_KEYS[kind]);
}

/** Milliseconds before another try is allowed (0 = allowed now). */
export async function lockRemainingMs(kind: SecretKind): Promise<number> {
  return remainingLockMs(await readAttempts(kind), Date.now());
}

/**
 * Checks are serialised: a script firing many checks at once still goes through the counter one by one,
 * so it cannot slip extra guesses in before the lock is written.
 */
let queue: Promise<unknown> = Promise.resolve();
function serial<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

function guarded(kind: SecretKind, matches: () => Promise<boolean>): Promise<CheckResult> {
  return serial(async () => {
    const state = await readAttempts(kind);
    const waiting = remainingLockMs(state, Date.now());
    if (waiting > 0) {
      return { ok: false, locked: true, lockedMs: waiting, triesBeforeLock: 0 } as const;
    }
    if (await matches()) {
      if (state.failures > 0) await writeAttempts(kind, EMPTY_ATTEMPTS);
      return { ok: true } as const;
    }
    const next = registerFailure(state, Date.now());
    await writeAttempts(kind, next);
    const lockedMs = remainingLockMs(next, Date.now());
    return { ok: false, locked: lockedMs > 0, lockedMs, triesBeforeLock: attemptsBeforeLock(next) } as const;
  });
}

export async function hasPin(): Promise<boolean> {
  return (await SecureStore.getItemAsync(PIN_KEY)) !== null;
}

/** A new PIN clears both counters (the owner just proved who they are). */
export async function savePin(pin: string): Promise<void> {
  const salt = Crypto.randomUUID();
  await SecureStore.setItemAsync(SALT_KEY, salt);
  await SecureStore.setItemAsync(PIN_KEY, await hash(pin, salt));
  await resetAttempts('pin');
  await resetAttempts('recovery');
}

async function pinMatches(pin: string): Promise<boolean> {
  const [stored, salt] = await Promise.all([SecureStore.getItemAsync(PIN_KEY), SecureStore.getItemAsync(SALT_KEY)]);
  if (!stored || !salt) return true;
  return (await hash(pin, salt)) === stored;
}

/** PIN check with brute-force protection (decision 0019). */
export function checkPin(pin: string): Promise<CheckResult> {
  return guarded('pin', () => pinMatches(pin));
}

/** Removes the PIN and its recovery code (a code without a PIN has nothing to unlock). */
export async function removePin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
  await SecureStore.deleteItemAsync(SALT_KEY);
  await SecureStore.deleteItemAsync(RECOVERY_KEY);
  await SecureStore.deleteItemAsync(RECOVERY_SALT_KEY);
  await resetAttempts('pin');
  await resetAttempts('recovery');
}

// ── Recovery code (decision 0017) ──────────────────────────────────────────

export async function hasRecoveryCode(): Promise<boolean> {
  return (await SecureStore.getItemAsync(RECOVERY_KEY)) !== null;
}

/**
 * Creates a new recovery code, replacing any previous one. Only its salted hash is stored:
 * the plain code is returned once, to be shown to the shopkeeper and written on paper.
 */
export async function createRecoveryCode(): Promise<string> {
  const code = codeFromBytes(await Crypto.getRandomBytesAsync(RECOVERY_LENGTH));
  const salt = Crypto.randomUUID();
  await SecureStore.setItemAsync(RECOVERY_SALT_KEY, salt);
  await SecureStore.setItemAsync(RECOVERY_KEY, await hash(code, salt));
  return code;
}

async function recoveryMatches(code: string): Promise<boolean> {
  const [stored, salt] = await Promise.all([
    SecureStore.getItemAsync(RECOVERY_KEY),
    SecureStore.getItemAsync(RECOVERY_SALT_KEY),
  ]);
  if (!stored || !salt) return false;
  return (await hash(code, salt)) === stored;
}

/**
 * Recovery-code check, same protection as the PIN with its own counter. Text that cannot be a code
 * (wrong length or letters) is refused without counting: it is a typo, not a guess.
 */
export async function checkRecoveryCode(input: string): Promise<CheckResult> {
  const code = normalizeRecoveryCode(input);
  if (code === null) {
    const waiting = await lockRemainingMs('recovery');
    return { ok: false, locked: waiting > 0, lockedMs: waiting, triesBeforeLock: 0 };
  }
  return guarded('recovery', () => recoveryMatches(code));
}
