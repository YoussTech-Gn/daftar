import { getCurrency, parseAmount } from '@/domain/currency';

/** Keys of the in-app calculator keypad. */
export type CalcKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '000' | ',' | '+' | 'back' | 'clear';

/** Applies a keypad key to an expression such as "1500+800". */
export function applyKey(expr: string, key: CalcKey, currencyCode: string): string {
  if (key === 'clear') return '';
  if (key === 'back') return expr.slice(0, -1);
  const last = expr.split('+').pop() ?? '';
  if (key === '+') return expr === '' || expr.endsWith('+') ? expr : `${expr}+`;
  if (key === ',') {
    if (getCurrency(currencyCode).decimals === 0 || last.includes(',')) return expr;
    return `${expr}${last === '' ? '0' : ''},`;
  }
  if (last.length >= 12) return expr;
  if ((key === '0' || key === '000') && last === '') return expr;
  return expr + key;
}

/** Sum of an expression in minor units. Empty → 0. Returns null when a term is invalid. */
export function sumExpression(expr: string, currencyCode: string): number | null {
  let total = 0;
  for (const term of expr.split('+')) {
    if (term === '') continue;
    const value = parseAmount(term.endsWith(',') ? term.slice(0, -1) : term, currencyCode);
    if (value === null) return null;
    total += value;
  }
  return total;
}

export interface PickedItem {
  name: string;
  price: number;
  qty: number;
}

/** Builds the entry note from picked items, e.g. "Riz ×2, Huile". */
export function itemsToNote(items: PickedItem[]): string {
  return items.map((i) => (i.qty > 1 ? `${i.name} ×${i.qty}` : i.name)).join(', ');
}

export function itemsTotal(items: PickedItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0);
}
