import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

interface FontLoaderProps {
  onLoaded: () => void;
}

const languageOptions = [
  { code: 'ru' as const, name: 'Русский', flag: '🇷🇺' },
  { code: 'uz' as const, name: "O'zbekcha", flag: '🇺🇿' },
  { code: 'uk' as const, name: 'Українська', flag: '🇺🇦' },
  { code: 'en' as const, name: 'English', flag: '🇬🇧' }
];

export const FontLoader: React.FC<FontLoaderProps> = ({ onLoaded }) => {
  const { i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleContinue = async () => {
    setLoading(true);

    try {
      const fontName = 'Apple Color Emoji';
      
      // Проверяем, загружен ли уже шрифт
      if (document.fonts.check(`12px "${fontName}"`)) {
        onLoaded();
        return;
      }

      // Создаем FontFace
      const font = new FontFace(
        fontName,
        'url(/AppleColorEmoji.ttf)',
        { style: 'normal', weight: '400' }
      );

      // Симулируем прогресс
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Загружаем шрифт
      const loadedFont = await font.load();
      document.fonts.add(loadedFont);

      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        onLoaded();
      }, 500);
    } catch (error) {
      console.error('Failed to load resources:', error);
      // Продолжаем даже при ошибке
      setTimeout(() => {
        onLoaded();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl max-w-md w-full overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {!loading ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className="text-7xl mb-4"
                >
                  🎮
                </motion.div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
                  {i18n.t('welcome.title', 'Добро пожаловать!')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {i18n.t('welcome.subtitle', 'Настройте приложение перед началом')}
                </p>
              </div>

              {/* Language Selection */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  🌍 {i18n.t('welcome.selectLanguage', 'Выберите язык')}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {languageOptions.map((lang) => (
                    <motion.button
                      key={lang.code}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        i18n.changeLanguage(lang.code);
                        localStorage.setItem('i18nextLng', lang.code);
                      }}
                      className={`p-3 rounded-[16px] font-bold transition-all ${
                        i18n.language === lang.code
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      }`}
                    >
                      <div className="text-2xl mb-1">{lang.flag}</div>
                      <div className="text-xs">{lang.name}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Theme Toggle */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                  🎨 {i18n.t('welcome.theme', 'Тема оформления')}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleTheme}
                  className="w-full p-4 bg-gray-100 dark:bg-gray-800 rounded-[20px] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{theme === 'light' ? '🌙' : '☀️'}</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {theme === 'light' 
                        ? i18n.t('welcome.darkMode', 'Темная тема')
                        : i18n.t('welcome.lightMode', 'Светлая тема')
                      }
                    </span>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-colors ${
                    theme === 'dark' ? 'bg-indigo-500' : 'bg-gray-300'
                  }`}>
                    <motion.div
                      animate={{ x: theme === 'dark' ? 24 : 0 }}
                      className="w-6 h-6 bg-white rounded-full shadow-lg"
                    />
                  </div>
                </motion.button>
              </div>

              {/* Info */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-[20px] border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📦</span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                      <span className="font-bold">{i18n.t('welcome.dataLoading', 'Загрузка данных')}</span>
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {i18n.t('welcome.dataLoadingDesc', 'Будет загружено ~40 МБ необходимых ресурсов для корректной работы приложения')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleContinue}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-black text-lg rounded-[20px] shadow-lg"
              >
                {i18n.t('welcome.continue', 'Продолжить')} 🚀
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8"
            >
              <div className="text-center mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="text-6xl mb-4 inline-block"
                >
                  ⚡
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  {i18n.t('welcome.loading', 'Загрузка...')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {i18n.t('welcome.preparing', 'Подготовка приложения')}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                />
              </div>

              <div className="text-center text-sm font-bold text-gray-700 dark:text-gray-300">
                {progress}%
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
