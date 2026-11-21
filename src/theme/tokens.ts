import type { TextStyle, ViewStyle } from 'react-native';

import type { Language } from '@/i18n/translations';
import TOKENS from './daftar-indigo-atelier-tokens.json';

export { TOKENS };

export type ColorTokens = typeof TOKENS.color.light;
export type QuietShadows = typeof TOKENS.quietShadows.light;
export type TypographyRole = keyof typeof TOKENS.typography.scale;
export type FontWeightKey = '400' | '500' | '600' | '700' | '800';
export type IconScaleKey = keyof typeof TOKENS.icon.scale;

export const LIGHT_COLORS: ColorTokens = TOKENS.color.light;
export const DARK_COLORS: ColorTokens = TOKENS.color.dark;

export const SPACING = TOKENS.spacing;
export const RADIUS = TOKENS.radius;
export const TYPOGRAPHY = TOKENS.typography;
export const QUIET_SHADOWS = TOKENS.quietShadows;
export const MOTION = TOKENS.motion;
export const ICON_SCALE = TOKENS.icon.scale;

const ARABIC_FONTS: Record<FontWeightKey, string> = {
  '400': TOKENS.typography.arabic.regular,
  '500': TOKENS.typography.arabic.medium,
  '600': TOKENS.typography.arabic.semiBold,
  '700': TOKENS.typography.arabic.bold,
  '800': TOKENS.typography.arabic.bold,
};

const LATIN_FONTS: Record<FontWeightKey, string> = {
  '400': TOKENS.typography.latin.regular,
  '500': TOKENS.typography.latin.medium,
  '600': TOKENS.typography.latin.semiBold,
  '700': TOKENS.typography.latin.bold,
  '800': TOKENS.typography.latin.extraBold,
};

/** Returns the exact loaded font face name for the active language and weight. */
export function getFontFamily(lang: Language, weight: FontWeightKey = '400'): string {
  return lang === 'ar' ? ARABIC_FONTS[weight] : LATIN_FONTS[weight];
}

/**
 * Returns complete typography TextStyle for a role and language.
 * Omits `fontWeight` so Android matches the loaded weight-specific custom font face,
 * and zeros `letterSpacing` in Arabic so ligatures stay intact.
 */
export function getTextStyle(
  role: TypographyRole,
  lang: Language,
  opts?: { compact?: boolean; weight?: FontWeightKey },
): TextStyle {
  const scale = TOKENS.typography.scale[role];
  const isCompactDisplay = role === 'displayAmount' && opts?.compact;
  const fontSize = isCompactDisplay ? TOKENS.typography.scale.displayAmount.fontSizeCompact : scale.fontSize;
  const lineHeight = isCompactDisplay ? 34 : scale.lineHeight;
  const resolvedWeight = opts?.weight ?? (scale.fontWeight as FontWeightKey);

  return {
    fontFamily: getFontFamily(lang, resolvedWeight),
    fontSize,
    lineHeight,
    letterSpacing: lang === 'ar' ? 0 : scale.letterSpacing,
  };
}

/** Applied to every monetary amount, counter, and keypad readout. */
export const NUMERIC_TEXT_STYLE: TextStyle = {
  fontVariant: ['tabular-nums'],
  writingDirection: 'ltr',
};

export type ShadowSlot = keyof QuietShadows;

export function getQuietShadow(isDark: boolean, slot: ShadowSlot): ViewStyle {
  const paletteShadows = isDark ? DARK_COLORS : LIGHT_COLORS;
  const set = isDark ? QUIET_SHADOWS.dark : QUIET_SHADOWS.light;
  if (slot === 'tabBar') {
    return {
      ...set.tabBar,
      borderTopWidth: 1,
      borderTopColor: paletteShadows.border,
    };
  }
  return set[slot] as ViewStyle;
}
