import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from '../locales/en/common.json';
import neCommon from '../locales/ne/common.json';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enCommon,
    },
    ne: {
      translation: neCommon,
    },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
