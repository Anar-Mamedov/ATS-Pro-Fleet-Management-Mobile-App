import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationAZ from '../locales/az/translation.json';
import translationEN from '../locales/en/translation.json';
import translationRU from '../locales/ru/translation.json';
import translationTR from '../locales/tr/translation.json';

const resources = {
  en: {
    translation: translationEN,
  },
  tr: {
    translation: translationTR,
  },
  ru: {
    translation: translationRU,
  },
  az: {
    translation: translationAZ,
  },
};

const supportedLanguages = ['tr', 'en', 'ru', 'az'];

// AsyncStorage'dan dil ayarını al veya cihaz dilini tespit et
const getStoredLanguage = async (): Promise<string> => {
  try {
    const storedLanguage = await AsyncStorage.getItem('i18nextLng');
    if (storedLanguage && supportedLanguages.includes(storedLanguage)) {
      return storedLanguage;
    }

    // Cihaz dilini tespit et
    const deviceLanguage = Localization.locale.split('-')[0];
    const selectedLanguage = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'en';

    // AsyncStorage'a kaydet
    await AsyncStorage.setItem('i18nextLng', selectedLanguage);
    return selectedLanguage;
  } catch (error) {
    console.error('Error getting stored language:', error);
    return 'en';
  }
};

// i18n'i başlat
const initI18n = async () => {
  const language = await getStoredLanguage();

  i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: 'tr',
    keySeparator: false,
    interpolation: {
      escapeValue: false,
    },
  });
};

// Dil değiştirme fonksiyonu
export const changeLanguage = async (language: string) => {
  if (supportedLanguages.includes(language)) {
    await AsyncStorage.setItem('i18nextLng', language);
    i18n.changeLanguage(language);
  }
};

// i18n'i başlat
initI18n();

export default i18n;
