import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Emoji from './Emoji';

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
  const { token, user } = useAuth();

  const handleLanguageChange = async (lang: Language) => {
    // Change language in UI immediately
    onLanguageChange(lang);

    // Try to save to database if user is authenticated
    if (token && user) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || '';
        await axios.patch(
          `${API_URL}/api/player/language`,
          { language: lang },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Update user in localStorage
        const updatedUser = { ...user, language: lang };
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      } catch (error) {
        // Silently fail - language is already changed in UI
        // User might not be registered yet or API might be unavailable
        console.debug('Could not save language to server:', error);
      }
    }
    // If not authenticated, language is still saved in i18n localStorage automatically
  };

  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
      {languages.map((lang) => (
        <motion.button
          key={lang}
          onClick={() => handleLanguageChange(lang)}
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
          <span className="relative"><Emoji emoji={languageFlags[lang]} size={20} /></span>
        </motion.button>
      ))}
    </div>
  );
};
