import { useColorScheme } from 'react-native';
import { theme as baseTheme } from './theme';

type Scheme = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  text: string;
  muted: string;
  background: string;
  border: string;
  card: string;
}

export interface UseThemeValue {
  isDark: boolean;
  colors: ThemeColors;
  raw: typeof baseTheme;
}

/**
 * Simple theming hook that maps the design tokens in theme.ts
 * to current color scheme (light/dark). No global state required.
 */
export function useTheme(): UseThemeValue {
  const scheme = (useColorScheme?.() ?? 'light') as Scheme;
  const isDark = scheme === 'dark';

  const colors: ThemeColors = {
    primary: baseTheme.colors.primary,
    text: isDark ? baseTheme.colors.textDark : baseTheme.colors.textLight,
    muted: isDark ? baseTheme.colors.mutedDark : baseTheme.colors.mutedLight,
    background: isDark ? baseTheme.colors.backgroundDark : baseTheme.colors.backgroundLight,
    border: isDark ? baseTheme.colors.borderDark : baseTheme.colors.borderLight,
    card: isDark ? baseTheme.colors.cardDark : baseTheme.colors.cardLight,
  };

  return {
    isDark,
    colors,
    raw: baseTheme,
  };
}