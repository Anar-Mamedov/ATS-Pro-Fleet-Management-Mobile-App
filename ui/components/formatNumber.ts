const localeMap: Record<string, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  az: 'az-AZ',
  ru: 'ru-RU',
};

/**
 * Formats a number according to the app's current language locale.
 * - TR: 12.345
 * - EN: 12,345
 * - RU: 12 345
 */
export function formatNumber(value: number | null | undefined, lang: string, fallback: string = '-'): string {
  if (value === null || value === undefined) return fallback;
  const locale = localeMap[lang] || 'tr-TR';
  return Number(value).toLocaleString(locale);
}
