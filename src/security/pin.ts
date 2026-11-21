import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'daftar_pin_hash';
const SALT_KEY = 'daftar_pin_salt';

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

export async function removePin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
  await SecureStore.deleteItemAsync(SALT_KEY);
}
