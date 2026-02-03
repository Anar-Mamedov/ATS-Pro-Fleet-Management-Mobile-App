import { config } from '@tamagui/config/v3';
import { createTamagui } from '@tamagui/core';

const appConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
    light: {
      ...config.themes.light,

      // ===== STANDARD TAMAGUI KEYS =====

      // Background colors
      background: '#F8F8F8',           // Ana sayfa arka planı
      backgroundHover: '#F0F0F0',
      backgroundPress: '#E8E8E8',
      backgroundFocus: '#F0F0F0',
      backgroundStrong: '#FFFFFF',     // Kartlar, yüzeyler
      backgroundElevated: '#F3F4F6',   // Icon backgrounds (tasarım: --bg-surface)
      backgroundTransparent: 'transparent',

      // Text colors (color = primary text)
      color: '#18181B',                // Ana metin rengi
      colorHover: '#27272A',
      colorPress: '#3F3F46',
      colorFocus: '#27272A',
      colorTransparent: 'transparent',

      // Border colors
      borderColor: '#E5E5E7',
      borderColorHover: '#D4D4D8',
      borderColorPress: '#A1A1AA',
      borderColorFocus: '#0066FF',

      // Other standard keys
      shadowColor: 'rgba(0,0,0,0.1)',
      placeholderColor: '#6B7280',     // Muted/secondary text (tasarım: --text-secondary)
      outlineColor: '#0066FF',

      // ===== SEMANTIC COLORS (Custom but needed) =====

      // Accent/Brand
      accentBackground: '#0066FF',     // Tasarım: --blue-primary
      accentColor: '#FFFFFF',

      // Status colors
      success: '#10B981',              // Tasarım: --green-success
      successBackground: '#10B98114',
      warning: '#F59E0B',
      warningBackground: '#F59E0B14',
      error: '#EF4444',
      errorBackground: '#EF444414',
      info: '#3B82F6',
      infoBackground: '#3B82F614',

      // Additional UI colors
      purple: '#6366F1',              // Tasarım: --accent-indigo
      purpleBackground: '#6366F114',
      orange: '#FFB547',              // Tasarım: --accent-amber
      orangeBackground: '#FFB54714',
    },

    dark: {
      ...config.themes.dark,

      // ===== STANDARD TAMAGUI KEYS =====

      // Background colors
      background: '#0B0B0E',           // Ana sayfa arka planı (tasarım: --bg-page)
      backgroundHover: '#16161A',
      backgroundPress: '#1A1A1E',
      backgroundFocus: '#16161A',
      backgroundStrong: '#16161A',     // Kartlar, yüzeyler (tasarım: --bg-card)
      backgroundElevated: '#1A1A1E',   // Icon backgrounds (tasarım: --bg-elevated)
      backgroundTransparent: 'transparent',

      // Text colors (color = primary text)
      color: '#FAFAF9',                // Ana metin rengi (tasarım: --text-primary)
      colorHover: '#E5E5E5',
      colorPress: '#CCCCCC',
      colorFocus: '#E5E5E5',
      colorTransparent: 'transparent',

      // Border colors
      borderColor: '#2A2A2E',          // Tasarım: --border-subtle
      borderColorHover: '#3A3A40',     // Tasarım: --border-strong
      borderColorPress: '#4A4A50',
      borderColorFocus: '#0066FF',

      // Other standard keys
      shadowColor: 'rgba(0,0,0,0.5)',
      placeholderColor: '#6B6B70',     // Muted/secondary text (tasarım: --text-secondary)
      outlineColor: '#0066FF',

      // ===== SEMANTIC COLORS (Custom but needed) =====

      // Accent/Brand
      accentBackground: '#0066FF',     // Tasarım: --blue-primary
      accentColor: '#FFFFFF',

      // Status colors
      success: '#10B981',              // Tasarım: --green-success
      successBackground: '#10B98120',
      warning: '#F59E0B',
      warningBackground: '#F59E0B20',
      error: '#EF4444',
      errorBackground: '#EF444420',
      info: '#3B82F6',
      infoBackground: '#3B82F620',

      // Additional UI colors
      purple: '#6366F1',              // Tasarım: --accent-indigo
      purpleBackground: '#6366F120',
      orange: '#FFB547',              // Tasarım: --accent-amber
      orangeBackground: '#FFB54720',
    },
  },
});

export default appConfig;

export type Conf = typeof appConfig;

declare module '@tamagui/core' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends Conf {}
}
