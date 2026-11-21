export interface CurrencyInfo {
  code: string;
  /** Number of decimal digits used for the minor unit. */
  decimals: number;
  symbol: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: 'GNF', decimals: 0, symbol: 'GNF' },
  { code: 'XOF', decimals: 0, symbol: 'FCFA' },
  { code: 'XAF', decimals: 0, symbol: 'FCFA' },
  { code: 'MAD', decimals: 2, symbol: 'DH' },
  { code: 'DZD', decimals: 2, symbol: 'DA' },
  { code: 'TND', decimals: 3, symbol: 'DT' },
  { code: 'EGP', decimals: 2, symbol: 'E£' },
  { code: 'MRU', decimals: 2, symbol: 'UM' },
  { code: 'NGN', decimals: 2, symbol: '₦' },
  { code: 'EUR', decimals: 2, symbol: '€' },
  { code: 'USD', decimals: 2, symbol: '$' },
];

export const DEFAULT_CURRENCY = 'XOF';

export function getCurrency(code: string): CurrencyInfo {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[1];
}

/** Parses user input like "12 500" or "12,5" into minor units. Returns null when invalid or <= 0. */
export function parseAmount(input: string, currencyCode: string): number | null {
  const { decimals } = getCurrency(currencyCode);
  const cleaned = input.replace(/[\s  ]/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const [whole, fraction = ''] = cleaned.split('.');
  if (fraction.length > decimals) return null;
  const minor = Number(whole) * 10 ** decimals + Number(fraction.padEnd(decimals, '0') || '0');
  if (!Number.isSafeInteger(minor) || minor <= 0) return null;
  return minor;
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** Formats minor units for display, e.g. 1250000 XOF -> "1 250 000 FCFA". */
export function formatAmount(minor: number, currencyCode: string, withSymbol = true): string {
  const { decimals, symbol } = getCurrency(currencyCode);
  const negative = minor < 0;
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / 10 ** decimals).toString();
  const fraction = decimals > 0 ? (abs % 10 ** decimals).toString().padStart(decimals, '0') : '';
  let text = groupThousands(whole);
  if (fraction && Number(fraction) !== 0) text += `,${fraction}`;
  if (negative) text = `-${text}`;
  return withSymbol ? `${text} ${symbol}` : text;
}
