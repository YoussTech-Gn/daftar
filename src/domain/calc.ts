import { getCurrency, parseAmount } from '@/domain/currency';
import type { ProductUnit } from '@/domain/types';

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
  unit?: ProductUnit;
}

const FRACTIONS: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾' };

/** 0.5 → "½", 1.5 → "1½", 2 → "2", 0.3 → "0.3". */
export function formatQty(qty: number): string {
  const whole = Math.floor(qty);
  const frac = Math.round((qty - whole) * 100) / 100;
  if (frac === 0) return String(whole);
  const symbol = FRACTIONS[String(frac)];
  if (symbol) return whole === 0 ? symbol : `${whole}${symbol}`;
  return String(Math.round(qty * 1000) / 1000);
}

const UNIT_SUFFIX: Record<ProductUnit, string> = { piece: '', pack: '', kg: 'kg', liter: 'L' };

/** One readable line: "½ kg Riz", "1½ L Huile", "Pain ×3", "Lait". */
export function itemLabel(item: PickedItem): string {
  const unit = item.unit ?? 'piece';
  const suffix = UNIT_SUFFIX[unit];
  if (suffix) return `${formatQty(item.qty)} ${suffix} ${item.name}`;
  return item.qty === 1 ? item.name : `${item.name} ×${formatQty(item.qty)}`;
}

/** Builds the entry note from picked items, e.g. "½ kg Riz, Pain ×3". */
export function itemsToNote(items: PickedItem[]): string {
  return items.map(itemLabel).join(', ');
}

/** Line total in minor units (rounded for fractional quantities). */
export function lineTotal(item: PickedItem): number {
  return Math.round(item.price * item.qty);
}

export function itemsTotal(items: PickedItem[]): number {
  return items.reduce((sum, i) => sum + lineTotal(i), 0);
}
