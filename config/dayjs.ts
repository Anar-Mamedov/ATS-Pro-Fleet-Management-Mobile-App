import baseDayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import i18n from './i18n';

// Load only the locales we support in the app to keep bundle size small
import 'dayjs/locale/az';
import 'dayjs/locale/en';
import 'dayjs/locale/ru';
import 'dayjs/locale/tr';

baseDayjs.extend(localizedFormat);

const supportedLocales = ['en', 'tr', 'ru', 'az'] as const;
type SupportedLocale = (typeof supportedLocales)[number];

/**
 * Sets Day.js locale based on the current i18n language or an explicit code.
 * Falls back to 'en' when unsupported.
 */
export const setDayjsLocaleFromI18n = (languageCode?: string): SupportedLocale => {
  const code = (languageCode || i18n.language || 'en').toLowerCase();
  const locale: SupportedLocale = (supportedLocales as readonly string[]).includes(code) ? (code as SupportedLocale) : 'en';
  baseDayjs.locale(locale);
  return locale;
};

// Initialize Day.js locale once on module load
setDayjsLocaleFromI18n();

export default baseDayjs;
