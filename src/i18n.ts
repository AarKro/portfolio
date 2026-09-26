import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';

// All UI text lives in locale files. English only for now; German comes later.
void i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
