/**
 * Tailwind (NativeWind v4) — decision 0018, "V4 Équilibre Visuel".
 * Every colour is a CSS variable set by ThemeProvider from src/theme/v4-tokens.ts,
 * so light / dark come from one source of truth and class names never change.
 * @type {import('tailwindcss').Config}
 */
const v = (name) => `var(--${name})`;

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        'surface-solid': v('surface-solid'),
        'surface-muted': v('surface-muted'),
        line: v('border'),
        specular: v('specular'),
        ink: v('text-primary'),
        'ink-2': v('text-secondary'),
        'ink-3': v('text-muted'),
        'fab-bg': v('fab-bg'),
        'fab-fg': v('fab-fg'),
        dock: v('dock-bg'),
        accent: v('accent'),
        'accent-soft': v('accent-soft'),
        credit: v('credit'),
        'credit-soft': v('credit-soft'),
        payment: v('payment'),
        'payment-soft': v('payment-soft'),
        plum: v('plum'),
        'plum-soft': v('plum-soft'),
        danger: v('danger'),
        'danger-soft': v('danger-soft'),
      },
      fontFamily: {
        sans: ['Manrope_500Medium'],
        'sans-regular': ['Manrope_400Regular'],
        'sans-semibold': ['Manrope_600SemiBold'],
        'sans-bold': ['Manrope_700Bold'],
        'sans-extrabold': ['Manrope_800ExtraBold'],
        ar: ['ReadexPro_500Medium'],
        'ar-regular': ['ReadexPro_400Regular'],
        'ar-semibold': ['ReadexPro_600SemiBold'],
        'ar-bold': ['ReadexPro_700Bold'],
        mono: ['JetBrainsMono_700Bold'],
      },
      borderRadius: {
        card: '22px',
        row: '16px',
      },
    },
  },
  plugins: [],
};
