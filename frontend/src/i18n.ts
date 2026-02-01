/**
 * i18next configuration for multilanguage support
 * 
 * Supports 4 languages: Russian (ru), Uzbek (uz), Ukrainian (uk), English (en)
 * Uses browser language detection and localStorage persistence
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ruTranslations from './locales/ru.json';
import uzTranslations from './locales/uz.json';
import ukTranslations from './locales/uk.json';
import enTranslations from './locales/en.json';

/**
 * Initialize i18next with configuration
 * 
 * Features:
 * - Browser language detection
 * - localStorage persistence
 * - Fallback to Russian
 * - Interpolation support for dynamic values
 */
i18n
  .use(LanguageDetector) // Detect user language from browser
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources: {
      ru: { translation: ruTranslations },
      uz: { translation: uzTranslations },
      uk: { translation: ukTranslations },
      en: { translation: enTranslations },
    },
    fallbackLng: 'ru', // Default language if detection fails
    supportedLngs: ['ru', 'uz', 'uk', 'en'], // Supported languages
    
    // Language detection configuration
    detection: {
      order: ['localStorage', 'navigator'], // Check localStorage first, then browser
      caches: ['localStorage'], // Cache language selection in localStorage
      lookupLocalStorage: 'i18nextLng', // localStorage key
    },
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Development options
    debug: process.env.NODE_ENV === 'development',
  });

export default i18n;
