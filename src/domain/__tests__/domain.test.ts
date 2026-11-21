import { describe, expect, it } from '@jest/globals';

import { buildCsv } from '@/domain/csv';
import { formatAmount, parseAmount } from '@/domain/currency';
import { buildWhatsAppLink, fillTemplate, normalizePhone } from '@/domain/reminder';

describe('parseAmount', () => {
  it('parses whole amounts for zero-decimal currencies', () => {
    expect(parseAmount('12 500', 'XOF')).toBe(12500);
    expect(parseAmount('150000', 'GNF')).toBe(150000);
  });

  it('rejects decimals for zero-decimal currencies', () => {
    expect(parseAmount('12.5', 'XOF')).toBeNull();
  });

  it('parses decimals with comma or dot for 2-decimal currencies', () => {
    expect(parseAmount('12,5', 'MAD')).toBe(1250);
    expect(parseAmount('12.05', 'MAD')).toBe(1205);
    expect(parseAmount('12.055', 'MAD')).toBeNull();
  });

  it('rejects empty, zero, negative and garbage input', () => {
    expect(parseAmount('', 'XOF')).toBeNull();
    expect(parseAmount('0', 'XOF')).toBeNull();
    expect(parseAmount('-5', 'XOF')).toBeNull();
    expect(parseAmount('abc', 'XOF')).toBeNull();
  });
});

describe('formatAmount', () => {
  it('groups thousands and adds the symbol', () => {
    expect(formatAmount(1250000, 'XOF')).toBe('1 250 000 FCFA');
    expect(formatAmount(1250000, 'GNF')).toBe('1 250 000 GNF');
  });

  it('shows minor units only when non-zero', () => {
    expect(formatAmount(1250, 'MAD')).toBe('12,50 DH');
    expect(formatAmount(1200, 'MAD')).toBe('12 DH');
  });

  it('handles negatives and no-symbol mode', () => {
    expect(formatAmount(-5000, 'XOF', false)).toBe('-5 000');
  });
});

describe('reminders', () => {
  it('normalizes local numbers with a country code', () => {
    expect(normalizePhone('620 12 34 56', '224')).toBe('224620123456');
    expect(normalizePhone('0612345678', '212')).toBe('212612345678');
  });

  it('keeps international numbers as they are', () => {
    expect(normalizePhone('+221 77 123 45 67', '224')).toBe('221771234567');
    expect(normalizePhone('00221771234567', '224')).toBe('221771234567');
  });

  it('builds an encoded wa.me link', () => {
    expect(buildWhatsAppLink('+224620123456', 'Salam & merci')).toBe(
      'https://wa.me/224620123456?text=Salam%20%26%20merci',
    );
  });

  it('fills templates and leaves unknown keys', () => {
    expect(fillTemplate('Hi {name}, {x}', { name: 'Awa' })).toBe('Hi Awa, {x}');
  });
});

describe('buildCsv', () => {
  it('writes a header, one row per entry, and escapes cells', () => {
    const csv = buildCsv(
      [{ id: 1, name: 'Diallo, Mamadou', phone: null, createdAt: 0 }],
      [{ id: 1, customerId: 1, kind: 'credit', amount: 5000, method: 'cash', note: 'riz "25kg"', createdAt: 0 }],
      'GNF',
    );
    const lines = csv.replace('﻿', '').split('\n');
    expect(lines[0]).toBe('date,customer,phone,type,amount,method,note,status');
    expect(lines[1]).toBe('1970-01-01T00:00:00.000Z,"Diallo, Mamadou",,credit,5 000,cash,"riz ""25kg""",active');
  });
});
