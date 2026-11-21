import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme, View, type ViewStyle } from 'react-native';

import {
  DARK_COLORS,
  ICON_SCALE,
  LIGHT_COLORS,
  MOTION,
  QUIET_SHADOWS,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
  type ColorTokens,
} from './tokens';
import { v4Vars } from './v4-tokens';

export interface ThemeShadows {
  card: ViewStyle;
  button: ViewStyle;
  fab: ViewStyle;
  tabBar: ViewStyle;
}

export interface DaftarTheme {
  scheme: 'light' | 'dark';
  isDark: boolean;
  colors: ColorTokens;
  shadows: ThemeShadows;
  spacing: typeof SPACING;
  radius: typeof RADIUS;
  typography: typeof TYPOGRAPHY;
  motion: typeof MOTION;
  iconScale: typeof ICON_SCALE;
}

function buildTheme(scheme: 'light' | 'dark'): DaftarTheme {
  const isDark = scheme === 'dark';
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const shadowSet = isDark ? QUIET_SHADOWS.dark : QUIET_SHADOWS.light;

  return {
    scheme,
    isDark,
    colors,
    shadows: {
      card: shadowSet.card as ViewStyle,
      button: shadowSet.button as ViewStyle,
      fab: shadowSet.fab as ViewStyle,
      tabBar: {
        ...(shadowSet.tabBar as ViewStyle),
        borderTopWidth: 1,
        borderTopColor: colors.border,
      },
    },
    spacing: SPACING,
    radius: RADIUS,
    typography: TYPOGRAPHY,
    motion: MOTION,
    iconScale: ICON_SCALE,
  };
}

const DEFAULT_THEME = buildTheme('light');
const ThemeContext = createContext<DaftarTheme>(DEFAULT_THEME);

/** Provides Indigo Atelier light/dark semantic tokens, quiet shadows, spacing, and typography. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const scheme: 'light' | 'dark' = systemScheme === 'dark' ? 'dark' : 'light';

  const theme = useMemo(() => buildTheme(scheme), [scheme]);

  // The V4 CSS variables wrap the whole app, so every Tailwind class resolves for the current scheme.
  return (
    <ThemeContext.Provider value={theme}>
      <View style={[{ flex: 1 }, v4Vars(scheme)]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useTheme(): DaftarTheme {
  return useContext(ThemeContext);
}

export function useColors(): ColorTokens {
  return useContext(ThemeContext).colors;
}

export * from './tokens';
export * from './motion';
export * from './v4-tokens';
