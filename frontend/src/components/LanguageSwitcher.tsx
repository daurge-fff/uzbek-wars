import { useTranslation } from 'react-i18next';

type Language = 'ru' | 'uz' | 'uk' | 'en';

interface LanguageSwitcherProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  mode?: 'compact' | 'full';
}

const languageFlags: Record<Language, string> = {
  ru: '🇷🇺',
  uz: '🇺🇿',
  uk: '🇺🇦',
  en: '🇬🇧'
};

const languageNames: Record<Language, string> = {
  ru: 'Русский',
  uz: "O'zbekcha",
  uk: 'Українська',
  en: 'English'
};

export const LanguageSwitcher = ({ 
  currentLanguage, 
  onLanguageChange,
  mode = 'compact'
}: LanguageSwitcherProps) => {
  const { t } = useTranslation();
  const languages: Language[] = ['ru', 'uz', 'uk', 'en'];

  return (
    <div className="flex gap-2">
      {languages.map((lang) => (
        <button
          key={lang}
          onClick={() => onLanguageChange(lang)}
          aria-label={`Switch to ${languageNames[lang]}`}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
            currentLanguage === lang
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <span className="text-xl">{languageFlags[lang]}</span>
          {mode === 'full' && (
            <span className="text-sm font-medium">{languageNames[lang]}</span>
          )}
        </button>
      ))}
    </div>
  );
};
