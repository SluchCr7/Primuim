'use client'
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '@/public/locales/en/translation.json';
import ar from '@/public/locales/ar/translation.json';
import de from '@/public/locales/de/translation.json';
// import it from '@/public/locales/it/translation.json';
import fr from '@/public/locales/fr/translation.json';
import es from '@/public/locales/es/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
      de: { translation: de },  
    //   it: { translation: it },
      fr: { translation: fr },
      es: { translation: es },
    },
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'htmlTag', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
