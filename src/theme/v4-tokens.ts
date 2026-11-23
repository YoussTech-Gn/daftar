import { vars } from 'nativewind';

import { DARK_COLORS, LIGHT_COLORS } from './tokens';

/**
 * "V4 — Équilibre Visuel" (decision 0018): the Tailwind side of the tokens.
 * Solid values come from the token JSON (single source shared with StyleSheet code);
 * glass, dock and specular values are V4-only and live here.
 * Each key becomes a CSS variable that tailwind.config.js maps to a class (`bg-surface`, `text-ink`…).
 */
const V4 = {
  light: {
    bg: LIGHT_COLORS.bg,
    surface: 'rgba(250, 251, 252, 0.86)',
    'surface-solid': LIGHT_COLORS.surface,
    'surface-muted': LIGHT_COLORS.surfaceSunken,
    border: 'rgba(15, 23, 42, 0.14)',
    specular: 'rgba(255, 255, 255, 0.90)',
    'text-primary': LIGHT_COLORS.text,
    'text-secondary': LIGHT_COLORS.textSecondary,
    'text-muted': LIGHT_COLORS.textMuted,
    'fab-bg': '#111827',
    'fab-fg': '#F4F5F7',
    'dock-bg': 'rgba(250, 251, 252, 0.84)',
    accent: LIGHT_COLORS.primary,
    'accent-soft': LIGHT_COLORS.primarySoft,
    credit: LIGHT_COLORS.credit,
    'credit-soft': LIGHT_COLORS.creditSoft,
    payment: LIGHT_COLORS.payment,
    'payment-soft': LIGHT_COLORS.paymentSoft,
    plum: LIGHT_COLORS.forgiven,
    'plum-soft': LIGHT_COLORS.forgivenSoft,
    danger: LIGHT_COLORS.danger,
    'danger-soft': LIGHT_COLORS.dangerSoft,
  },
  dark: {
    bg: DARK_COLORS.bg,
    surface: 'rgba(21, 25, 34, 0.78)',
    'surface-solid': DARK_COLORS.surface,
    'surface-muted': DARK_COLORS.surfaceSunken,
    border: 'rgba(255, 255, 255, 0.14)',
    specular: 'rgba(255, 255, 255, 0.12)',
    'text-primary': DARK_COLORS.text,
    'text-secondary': DARK_COLORS.textSecondary,
    'text-muted': DARK_COLORS.textMuted,
    'fab-bg': '#ECEFF4',
    'fab-fg': '#0B0D12',
    'dock-bg': 'rgba(21, 25, 34, 0.82)',
    accent: DARK_COLORS.primary,
    'accent-soft': DARK_COLORS.primarySoft,
    credit: DARK_COLORS.credit,
    'credit-soft': DARK_COLORS.creditSoft,
    payment: DARK_COLORS.payment,
    'payment-soft': DARK_COLORS.paymentSoft,
    plum: DARK_COLORS.forgiven,
    'plum-soft': DARK_COLORS.forgivenSoft,
    danger: DARK_COLORS.danger,
    'danger-soft': DARK_COLORS.dangerSoft,
  },
} as const;

export type V4Scheme = keyof typeof V4;
export type V4Token = keyof typeof V4.light;

export const V4_TOKENS = V4;

/** Raw value, for the few props that cannot take a class (icon colours, BlurView tint, placeholder). */
export function v4(scheme: V4Scheme, token: V4Token): string {
  return V4[scheme][token];
}

const VARS = {
  light: vars(Object.fromEntries(Object.entries(V4.light).map(([k, val]) => [`--${k}`, val]))),
  dark: vars(Object.fromEntries(Object.entries(V4.dark).map(([k, val]) => [`--${k}`, val]))),
};

/** Style object that defines every V4 CSS variable for a subtree. */
export function v4Vars(scheme: V4Scheme) {
  return VARS[scheme];
}
