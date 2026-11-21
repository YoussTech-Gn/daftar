import { describe, expect, it } from '@jest/globals';

import { DICTIONARIES } from '@/i18n/translations';
import { buildReceiptPayload } from '@/lib/receipt';
import {
  DARK_COLORS,
  LIGHT_COLORS,
  NUMERIC_TEXT_STYLE,
  getFontFamily,
  getTextStyle,
} from '@/theme/tokens';

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function hueOf(hex: string): number {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return 0;
  const hue = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (hue * 60 + 360) % 360;
}

describe('Indigo Atelier design tokens', () => {
  it('forbids pure white #FFFFFF anywhere in light or dark color tokens', () => {
    const allHexes = [...Object.values(LIGHT_COLORS), ...Object.values(DARK_COLORS)].map((v) =>
      v.toLowerCase(),
    );
    expect(allHexes).not.toContain('#ffffff');
    expect(allHexes).not.toContain('#fff');
  });

  it('keeps identical semantic token keys across light and dark modes', () => {
    expect(Object.keys(LIGHT_COLORS).sort()).toEqual(Object.keys(DARK_COLORS).sort());
  });

  it('keeps text readable: muted and secondary text reach WCAG AA (4.5:1) on bg and surface', () => {
    for (const c of [LIGHT_COLORS, DARK_COLORS]) {
      for (const fg of [c.text, c.textSecondary, c.textMuted, c.creditDeep, c.paymentDeep, c.forgiven, c.primary]) {
        expect(contrast(fg, c.bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(fg, c.surface)).toBeGreaterThanOrEqual(4.5);
      }
      // Cancelled entries are struck through but must stay legible (large-text AA).
      expect(contrast(c.cancelled, c.surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('does not paint debts like an alarm: credit is a warm amber, clearly apart from danger red', () => {
    for (const c of [LIGHT_COLORS, DARK_COLORS]) {
      expect(hueOf(c.credit)).toBeGreaterThan(20);
      expect(hueOf(c.credit)).toBeLessThan(45);
      expect(hueOf(c.danger) < 10 || hueOf(c.danger) > 350).toBe(true);
    }
  });

  it('resolves Readex Pro for Arabic and Manrope for Latin without fontWeight collisions', () => {
    expect(getFontFamily('ar', '400')).toBe('ReadexPro_400Regular');
    expect(getFontFamily('ar', '700')).toBe('ReadexPro_700Bold');
    expect(getFontFamily('fr', '400')).toBe('Manrope_400Regular');
    expect(getFontFamily('fr', '800')).toBe('Manrope_800ExtraBold');

    const arDisplay = getTextStyle('displayAmount', 'ar');
    expect(arDisplay.letterSpacing).toBe(0);
    expect(arDisplay.fontWeight).toBeUndefined();

    const compactFr = getTextStyle('displayAmount', 'fr', { compact: true });
    expect(compactFr.fontSize).toBe(30);
    expect(compactFr.fontFamily).toBe('Manrope_700Bold');
  });

  it('enforces tabular-nums and LTR writingDirection on numeric style', () => {
    expect(NUMERIC_TEXT_STYLE).toEqual({
      fontVariant: ['tabular-nums'],
      writingDirection: 'ltr',
    });
  });
});

describe('buildReceiptPayload', () => {
  const t = (key: keyof typeof DICTIONARIES.fr, values?: Record<string, string | number>) => {
    let text = DICTIONARIES.fr[key];
    if (values) {
      for (const [k, v] of Object.entries(values)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }
    return text;
  };

  it('returns null when customer has no phone', () => {
    expect(
      buildReceiptPayload({
        t,
        money: (n) => `\u2066${n} FCFA\u2069`,
        shopName: 'Boutique Diallo',
        countryCode: '221',
        customer: { name: 'Awa', phone: null },
        kind: 'credit',
        amount: 5000,
        items: '',
        newBalance: 5000,
      }),
    ).toBeNull();
  });

  it('strips direction marks and builds WhatsApp and SMS links', () => {
    const payload = buildReceiptPayload({
      t,
      money: (n) => `\u2066${n} FCFA\u2069`,
      shopName: 'Boutique Diallo',
      countryCode: '221',
      customer: { name: 'Moussa', phone: '77 123 45 67' },
      kind: 'payment',
      amount: 10000,
      items: '',
      newBalance: 0,
    });
    expect(payload).not.toBeNull();
    expect(payload?.text).not.toMatch(/[\u200E\u200F\u2066-\u2069]/);
    expect(payload?.whatsappUrl).toContain('https://wa.me/221771234567?text=');
    expect(payload?.smsUrl).toContain('sms:+221771234567?body=');
  });
});
