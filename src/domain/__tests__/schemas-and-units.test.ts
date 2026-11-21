import { describe, expect, it } from '@jest/globals';

import { formatQty, itemLabel, itemsToNote, itemsTotal } from '@/domain/calc';
import { customerSchema, productSchema, shopSchema } from '@/domain/schemas';

describe('quantities and units', () => {
  it('formats fractions', () => {
    expect(formatQty(0.5)).toBe('½');
    expect(formatQty(0.25)).toBe('¼');
    expect(formatQty(1.5)).toBe('1½');
    expect(formatQty(2)).toBe('2');
    expect(formatQty(0.3)).toBe('0.3');
  });

  it('labels items by unit', () => {
    expect(itemLabel({ name: 'Riz', price: 25000, qty: 0.5, unit: 'kg' })).toBe('½ kg Riz');
    expect(itemLabel({ name: 'Huile', price: 30000, qty: 1.5, unit: 'liter' })).toBe('1½ L Huile');
    expect(itemLabel({ name: 'Pain', price: 2000, qty: 3, unit: 'piece' })).toBe('Pain ×3');
    expect(itemLabel({ name: 'Lait', price: 5000, qty: 1, unit: 'pack' })).toBe('Lait');
  });

  it('totals fractional quantities with rounding', () => {
    const items = [
      { name: 'Riz', price: 25000, qty: 0.5, unit: 'kg' as const },
      { name: 'Sucre', price: 15000, qty: 0.25, unit: 'kg' as const },
      { name: 'Pain', price: 2000, qty: 3, unit: 'piece' as const },
    ];
    expect(itemsTotal(items)).toBe(12500 + 3750 + 6000);
    expect(itemsToNote(items)).toBe('½ kg Riz, ¼ kg Sucre, Pain ×3');
  });
});

describe('form schemas', () => {
  it('customer: name required, phone optional but checked', () => {
    expect(customerSchema.safeParse({ name: '  ', phone: '', note: '' }).success).toBe(false);
    expect(customerSchema.safeParse({ name: 'Awa', phone: '', note: '' }).success).toBe(true);
    expect(customerSchema.safeParse({ name: 'Awa', phone: '+224 620 12 34 56', note: '' }).success).toBe(true);
    const bad = customerSchema.safeParse({ name: 'Awa', phone: 'abc', note: '' });
    expect(bad.success).toBe(false);
    expect(bad.error?.issues[0]?.message).toBe('phoneInvalid');
  });

  it('product: price parsed in the shop currency, unit from the list', () => {
    const gnf = productSchema('GNF');
    expect(gnf.safeParse({ name: 'Riz', price: '25000', unit: 'kg' }).success).toBe(true);
    expect(gnf.safeParse({ name: 'Riz', price: '12.5', unit: 'kg' }).success).toBe(false);
    expect(productSchema('MAD').safeParse({ name: 'Lait', price: '12,5', unit: 'pack' }).success).toBe(true);
    expect(gnf.safeParse({ name: 'Riz', price: '100', unit: 'ton' }).success).toBe(false);
  });

  it('shop: country code is 1–4 digits or empty', () => {
    expect(shopSchema.safeParse({ shopName: 'Boutique', countryCode: '224' }).success).toBe(true);
    expect(shopSchema.safeParse({ shopName: 'Boutique', countryCode: '' }).success).toBe(true);
    expect(shopSchema.safeParse({ shopName: 'Boutique', countryCode: '22a' }).success).toBe(false);
  });
});
