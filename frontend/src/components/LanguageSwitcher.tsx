/**
 * Language switcher component
 * 
 * Allows users to switch between supported languages (ru, uz, uk, en)
 * Persists language selection to localStorage and backend
 */

import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

/**
 * Supported language codes
 */
type Language = 'ru' | 'uz' | 'uk' | 'en';

/**
 * Language option with display information
 */
interface LanguageOption {
  code: Language;
  flag: string;
  name: string;
}

/**
 * Available language options
 */
const languages: LanguageOption[] = [
  { code: 'ru', flag: '🇷🇺', name: 'Русский' },
  { code: 'uz', flag: '🇺🇿', name: "O'zbekcha" },
  { code: 'uk', flag: '🇺🇦', name: 'Українська' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
];

/**
 * LanguageSwitcher component props
 */
interface LanguageSwitcherProps {
  /**
   * Optional callback when language changes
   * Can be used to sync with backend
   */
  onLanguageChange?: (language: Language) => void;
  
  /**
   * Display mode: 'compact' shows only flags, 'full' shows flags and names
   */
  mode?: 'compact' | 'full';
}

/**
 * LanguageSwitcher component
 * 
 * Displays language options and handles language switching
 * Supports both compact (flags only) and full (flags + names) modes
 */
export function LanguageSwitcher({ 
  onLanguageChange, 
  mode = 'compact' 
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language as Language;

  /**
   * Handle language change
   * Updates i18next and calls optional callback
   */
  const handleLanguageChange = async (language: Language) => {
    await i18n.changeLanguage(language);
    onLanguageChange?.(language);
  };

  return (
    <div className="flex gap-2">
      {languages.map((lang) => (
        <motion.button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg
            transition-colors duration-200
            ${
              currentLanguage === lang.code
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }
          `}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          aria-label={`Switch to ${lang.name}`}
        >
          <span className="text-xl">{lang.flag}</span>
          {mode === 'full' && (
            <span className="text-sm font-medium">{lang.name}</span>
          )}
        </motion.button>
      ))}
    </div>
  );
}
