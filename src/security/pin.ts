import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { codeFromBytes, normalizeRecoveryCode, RECOVERY_LENGTH } from './recovery-code';

const PIN_KEY = 'daftar_pin_hash';
const SALT_KEY = 'daftar_pin_salt';
const RECOVERY_KEY = 'daftar_recovery_hash';
const RECOVERY_SALT_KEY = 'daftar_recovery_salt';

async function hash(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

export async function hasPin(): Promise<boolean> {
  return (await SecureStore.getItemAsync(PIN_KEY)) !== null;
}

export async function savePin(pin: string): Promise<void> {
  const salt = Crypto.randomUUID();
  await SecureStore.setItemAsync(SALT_KEY, salt);
  await SecureStore.setItemAsync(PIN_KEY, await hash(pin, salt));
}

export async function verifyPin(pin: string): Promise<boolean> {
  const [stored, salt] = await Promise.all([
    SecureStore.getItemAsync(PIN_KEY),
    SecureStore.getItemAsync(SALT_KEY),
  ]);
  if (!stored || !salt) return true;
  return (await hash(pin, salt)) === stored;
}

/** Removes the PIN and its recovery code (a code without a PIN has nothing to unlock). */
export async function removePin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
  await SecureStore.deleteItemAsync(SALT_KEY);
  await SecureStore.deleteItemAsync(RECOVERY_KEY);
  await SecureStore.deleteItemAsync(RECOVERY_SALT_KEY);
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

export async function verifyRecoveryCode(input: string): Promise<boolean> {
  const code = normalizeRecoveryCode(input);
  if (code === null) return false;
  const [stored, salt] = await Promise.all([
    SecureStore.getItemAsync(RECOVERY_KEY),
    SecureStore.getItemAsync(RECOVERY_SALT_KEY),
  ]);
  if (!stored || !salt) return false;
  return (await hash(code, salt)) === stored;
}
