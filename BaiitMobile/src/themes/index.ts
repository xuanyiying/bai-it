import { lightTheme } from './light';
import { darkTheme } from './dark';
import { oceanTheme } from './ocean';

export { lightTheme } from './light';
export { darkTheme } from './dark';
export { oceanTheme } from './ocean';
export { colors, typography, spacing, borderRadius, shadows, animation, zIndex, breakpoints } from './tokens';

export type { Theme } from './light';
export type { Colors, Typography as TypographyType, Spacing, BorderRadius, Shadows, Animation, ZIndex, Breakpoints } from './tokens';

export type ThemeName = 'light' | 'dark' | 'ocean';

export const themes = {
  light: lightTheme,
  dark: darkTheme,
  ocean: oceanTheme,
};

export const themeList = [
  { name: 'light' as ThemeName, label: '明亮', labelEn: 'Light', labelJa: 'ライト' },
  { name: 'dark' as ThemeName, label: '深邃', labelEn: 'Dark', labelJa: 'ダーク' },
  { name: 'ocean' as ThemeName, label: '海洋', labelEn: 'Ocean', labelJa: 'オーシャン' },
];

export const getTheme = (name: ThemeName) => themes[name];
