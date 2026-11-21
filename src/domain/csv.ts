import { formatAmount } from '@/domain/currency';
import type { Customer, Entry } from '@/domain/types';

function csvCell(value: string | number | null): string {
  const text = value === null ? '' : String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Builds a CSV of all entries (one row per entry). */
export function buildCsv(customers: Customer[], entries: Entry[], currency: string): string {
  const byId = new Map(customers.map((c) => [c.id, c]));
  const header = ['date', 'customer', 'phone', 'type', 'amount', 'method', 'note'];
  const rows = entries.map((e) => {
    const c = byId.get(e.customerId);
    return [
      new Date(e.createdAt).toISOString(),
      c?.name ?? '',
      c?.phone ?? '',
      e.kind,
      formatAmount(e.amount, currency, false),
      e.method,
      e.note,
    ]
      .map(csvCell)
      .join(',');
  });
  // BOM so Excel opens UTF-8 (Arabic / accents) correctly.
  return '﻿' + [header.join(','), ...rows].join('\n');
}
