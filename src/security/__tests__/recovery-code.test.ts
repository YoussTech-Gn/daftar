import { describe, expect, it } from '@jest/globals';

import {
  codeFromBytes,
  formatRecoveryCode,
  normalizeRecoveryCode,
  RECOVERY_ALPHABET,
} from '@/security/recovery-code';

describe('recovery code', () => {
  it('maps bytes to 12 characters of the unambiguous alphabet', () => {
    const code = codeFromBytes(Uint8Array.from([0, 1, 31, 32, 255, 10, 18, 22, 27, 29, 30, 64]));
    expect(code).toHaveLength(12);
    expect([...code].every((c) => RECOVERY_ALPHABET.includes(c))).toBe(true);
    expect(code.startsWith('01Z0Z')).toBe(true);
  });

  it('never uses letters that look like digits', () => {
    expect(RECOVERY_ALPHABET).not.toMatch(/[ILOU]/);
    expect(RECOVERY_ALPHABET).toHaveLength(32);
  });

  it('formats in groups of four', () => {
    expect(formatRecoveryCode('ABCD1234WXYZ')).toBe('ABCD-1234-WXYZ');
  });

  it('accepts what a person types from paper', () => {
    expect(normalizeRecoveryCode('abcd-1234-wxyz')).toBe('ABCD1234WXYZ');
    expect(normalizeRecoveryCode(' AbCd 1234 WxYz ')).toBe('ABCD1234WXYZ');
    expect(normalizeRecoveryCode('ABCD-O234-WXYL')).toBe('ABCD0234WXY1');
  });

  it('rejects wrong length and impossible characters', () => {
    expect(normalizeRecoveryCode('ABCD-1234')).toBeNull();
    expect(normalizeRecoveryCode('ABCD-1234-WXYU')).toBeNull();
    expect(normalizeRecoveryCode('')).toBeNull();
  });
});
