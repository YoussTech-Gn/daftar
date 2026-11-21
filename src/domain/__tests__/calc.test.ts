import { describe, expect, it } from '@jest/globals';

import { applyKey, itemsToNote, itemsTotal, sumExpression, type CalcKey } from '@/domain/calc';
import { daysAgo } from '@/domain/time';

function type(keys: CalcKey[], currency = 'GNF'): string {
  return keys.reduce((expr, k) => applyKey(expr, k, currency), '');
}

describe('calculator keypad', () => {
  it('builds and sums an expression', () => {
    const expr = type(['1', '5', '0', '0', '+', '8', '0', '0', '+', '3', '5', '0']);
    expect(expr).toBe('1500+800+350');
    expect(sumExpression(expr, 'GNF')).toBe(2650);
  });

  it('ignores leading zeros, double plus and a plus at the start', () => {
    expect(type(['+', '0', '000', '5', '+', '+', '000', '2'])).toBe('5+2');
  });

  it('supports 000 for large amounts', () => {
    expect(sumExpression(type(['2', '5', '000']), 'GNF')).toBe(25000);
  });

  it('handles decimals only when the currency has them', () => {
    expect(type(['1', ',', '5'], 'GNF')).toBe('15');
    const mad = type([',', '5', '+', '1', '2', ',', '2', '5'], 'MAD');
    expect(mad).toBe('0,5+12,25');
    expect(sumExpression(mad, 'MAD')).toBe(1275);
  });

  it('back and clear', () => {
    expect(applyKey('12+3', 'back', 'GNF')).toBe('12+');
    expect(applyKey('12+3', 'clear', 'GNF')).toBe('');
  });

  it('treats an empty or trailing-plus expression safely', () => {
    expect(sumExpression('', 'GNF')).toBe(0);
    expect(sumExpression('100+', 'GNF')).toBe(100);
  });
});

describe('picked items', () => {
  const items = [
    { name: 'Riz', price: 250000, qty: 2 },
    { name: 'Huile', price: 30000, qty: 1 },
  ];
  it('writes a readable note', () => {
    expect(itemsToNote(items)).toBe('Riz ×2, Huile');
  });
  it('sums price × quantity', () => {
    expect(itemsTotal(items)).toBe(530000);
  });
});

describe('daysAgo', () => {
  const now = new Date(2026, 10, 21, 10, 0).getTime();
  it('counts calendar days', () => {
    expect(daysAgo(new Date(2026, 10, 21, 1, 0).getTime(), now)).toBe(0);
    expect(daysAgo(new Date(2026, 10, 20, 23, 0).getTime(), now)).toBe(1);
    expect(daysAgo(new Date(2026, 10, 14, 12, 0).getTime(), now)).toBe(7);
  });
});
