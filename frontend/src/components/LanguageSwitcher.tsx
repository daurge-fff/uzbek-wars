import { motion } from 'framer-motion';

type Language = 'ru' | 'uz' | 'uk' | 'en';

interface LanguageSwitcherProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

const languageFlags: Record<Language, string> = {
  ru: '🇷🇺',
  uz: '🇺🇿',
  uk: '🇺🇦',
  en: '🇬🇧'
};

export const LanguageSwitcher = ({ 
  currentLanguage, 
  onLanguageChange
}: LanguageSwitcherProps) => {
  const languages: Language[] = ['ru', 'uz', 'uk', 'en'];

  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
      {languages.map((lang) => (
        <motion.button
          key={lang}
          onClick={() => onLanguageChange(lang)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`relative px-2 py-1 rounded-full transition-all ${
            currentLanguage === lang
              ? 'text-white'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {currentLanguage === lang && (
            <motion.div
              layoutId="activeLanguage"
              className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative text-base">{languageFlags[lang]}</span>
        </motion.button>
      ))}
    </div>
  );
};
