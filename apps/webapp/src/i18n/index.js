import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from '../locales/en/common.json';
import neCommon from '../locales/ne/common.json';

const SUPPORTED_LANGUAGES = ['en', 'ne'];

const getInitialLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = localStorage.getItem('i18nextLng');
    return SUPPORTED_LANGUAGES.includes(stored) ? stored : 'en';
  } catch {
    return 'en';
  }
};

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enCommon,
    },
    ne: {
      translation: neCommon,
    },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
