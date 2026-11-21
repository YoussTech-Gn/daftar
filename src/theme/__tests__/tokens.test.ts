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

  it('uses psychological muted terracotta red for money out (credit) and calm relief green for money in (payment)', () => {
    expect(LIGHT_COLORS.bg).toBe('#F2F0EB');
    expect(LIGHT_COLORS.surface).toBe('#FAF9F6');
    expect(LIGHT_COLORS.credit).toBe('#B83B3B');
    expect(LIGHT_COLORS.creditDeep).toBe('#962D2D');
    expect(LIGHT_COLORS.creditSoft).toBe('#FAECEC');
    expect(LIGHT_COLORS.onCredit).toBe('#FAF9F6');
    expect(LIGHT_COLORS.payment).toBe('#157A4F');
    expect(LIGHT_COLORS.paymentDeep).toBe('#10613E');
    expect(LIGHT_COLORS.paymentSoft).toBe('#E5F4EC');
    expect(LIGHT_COLORS.onPayment).toBe('#FAF9F6');

    expect(DARK_COLORS.credit).toBe('#EC7878');
    expect(DARK_COLORS.creditDeep).toBe('#F39696');
    expect(DARK_COLORS.creditSoft).toBe('#331B1E');
    expect(DARK_COLORS.onCredit).toBe('#240A0A');
    expect(DARK_COLORS.payment).toBe('#4ADE80');
    expect(DARK_COLORS.paymentDeep).toBe('#6EE7A0');
    expect(DARK_COLORS.paymentSoft).toBe('#132C21');
    expect(DARK_COLORS.onPayment).toBe('#062011');
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
    expect(compactFr.fontSize).toBe(28);
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
