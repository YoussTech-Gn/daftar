import { describe, expect, it } from '@jest/globals';

import { amountToExpr, sumExpression } from '@/domain/calc';
import { buildCsv } from '@/domain/csv';
import { balanceSign, type Entry } from '@/domain/types';

describe('settle all pre-fill', () => {
  it('turns a balance back into a keypad expression that sums to the same amount', () => {
    expect(amountToExpr(1411388, 'GNF')).toBe('1411388');
    expect(amountToExpr(1250, 'MAD')).toBe('12,5');
    expect(amountToExpr(1205, 'MAD')).toBe('12,05');
    expect(amountToExpr(1200, 'MAD')).toBe('12');
    for (const [minor, cur] of [
      [1411388, 'GNF'],
      [1250, 'MAD'],
      [1205, 'MAD'],
      [7, 'TND'],
    ] as const) {
      expect(sumExpression(amountToExpr(minor, cur), cur)).toBe(minor);
    }
  });
});

describe('balance sign', () => {
  it('credit raises, payment and forgiven lower', () => {
    expect(balanceSign('credit')).toBe(1);
    expect(balanceSign('payment')).toBe(-1);
    expect(balanceSign('forgiven')).toBe(-1);
  });
});

describe('CSV status column', () => {
  it('marks cancelled and forgiven entries', () => {
    const base: Entry = { id: 1, customerId: 1, kind: 'credit', amount: 100, method: 'cash', note: null, createdAt: 0 };
    const csv = buildCsv(
      [{ id: 1, name: 'Awa', phone: null, createdAt: 0 }],
      [
        { ...base, cancelledAt: 5 },
        { ...base, id: 2, kind: 'forgiven', method: 'other' },
      ],
      'GNF',
    );
    const lines = csv.replace('﻿', '').split('\n');
    expect(lines[1].endsWith(',cancelled')).toBe(true);
    expect(lines[2]).toContain(',forgiven,');
    expect(lines[2].endsWith(',active')).toBe(true);
  });
});
