/**
 * Recovery code for a forgotten PIN (decision 0017). Pure helpers, no storage here.
 *
 * Crockford Base32 alphabet: no I, L, O, U, so a code copied by hand into a paper notebook
 * cannot be misread (O → 0, I / L → 1 are mapped back when typed).
 * 12 characters × 5 bits = 60 bits of randomness, shown as XXXX-XXXX-XXXX.
 */
export const RECOVERY_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const RECOVERY_LENGTH = 12;

/** Turns 12 random bytes into a 12-character code (each byte keeps its low 5 bits: uniform over 32). */
export function codeFromBytes(bytes: Uint8Array): string {
  if (bytes.length < RECOVERY_LENGTH) throw new Error('Not enough random bytes');
  let code = '';
  for (let i = 0; i < RECOVERY_LENGTH; i += 1) code += RECOVERY_ALPHABET[bytes[i] & 31];
  return code;
}

/** "ABCD1234WXYZ" → "ABCD-1234-WXYZ" for display. */
export function formatRecoveryCode(code: string): string {
  return code.match(/.{1,4}/g)?.join('-') ?? code;
}

/**
 * What the shopkeeper typed → canonical code, or null if it cannot be a code.
 * Ignores spaces, dashes and case; reads O as 0 and I / L as 1.
 */
export function normalizeRecoveryCode(input: string): string | null {
  const cleaned = input
    .toUpperCase()
    .replace(/[\s\-_.]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
  if (cleaned.length !== RECOVERY_LENGTH) return null;
  for (const ch of cleaned) if (!RECOVERY_ALPHABET.includes(ch)) return null;
  return cleaned;
}
