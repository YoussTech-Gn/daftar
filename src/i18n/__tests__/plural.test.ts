import { describe, expect, it } from '@jest/globals';

import { pluralCategory, pluralText } from '@/i18n/plural';

describe('plural rules', () => {
  it('follows CLDR for Arabic', () => {
    expect([0, 1, 2, 3, 10, 11, 99, 100, 103].map((n) => pluralCategory('ar', n))).toEqual([
      'zero', 'one', 'two', 'few', 'few', 'many', 'many', 'other', 'few',
    ]);
  });

  it('treats 0 and 1 as singular in French, only 1 in English', () => {
    expect(pluralCategory('fr', 0)).toBe('one');
    expect(pluralCategory('fr', 2)).toBe('other');
    expect(pluralCategory('en', 0)).toBe('other');
    expect(pluralCategory('en', 1)).toBe('one');
  });

  it('never says "1 زبائن" or "1 clients"', () => {
    expect(pluralText('ar', 'customersInDebt', { count: 1 })).toBe('زبون واحد عليه دين');
    expect(pluralText('ar', 'customersCount', { n: 2 })).toBe('زبونان');
    expect(pluralText('fr', 'customersInDebt', { count: 1 })).toBe('{count} client vous doit');
    expect(pluralText('fr', 'customersInDebt', { count: 5 })).toBeUndefined();
  });
});
