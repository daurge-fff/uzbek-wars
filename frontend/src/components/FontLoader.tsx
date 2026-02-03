import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { createPortal } from 'react-dom';

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

      // Создаем FontFace ТОЛЬКО после нажатия кнопки
      const font = new FontFace(
        fontName,
        'url(/AppleColorEmoji.ttf)',
        { style: 'normal', weight: '400', display: 'swap' }
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

  return createPortal(
    <AnimatePresence>
      {!loading ? (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-full max-w-[450px] pointer-events-auto"
            >
              <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[32px] p-1 shadow-2xl">
                <div className="bg-white dark:bg-gray-900 rounded-[28px] p-6">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                      className="text-6xl mb-3"
                    >
                      🎮
                    </motion.div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                      {i18n.t('welcome.title', 'Добро пожаловать!')}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {i18n.t('welcome.subtitle', 'Настройте приложение перед началом')}
                    </p>
                  </div>

                  {/* АКЦЕНТ: Загрузка данных */}
                  <div className="mb-6 p-5 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-[24px] border-2 border-orange-300 dark:border-orange-700">
                    <div className="flex items-start gap-3">
                      <motion.span 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-4xl"
                      >
                        📦
                      </motion.span>
                      <div className="flex-1">
                        <p className="text-base font-black text-gray-900 dark:text-white mb-1">
                          {i18n.t('welcome.dataLoading', 'Загрузка данных')}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {i18n.t('welcome.dataLoadingDesc', 'Будет загружено ~40 МБ необходимых ресурсов для корректной работы приложения')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Language Selection - компактно */}
                  <div className="mb-4">
                    <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                      🌍 {i18n.t('welcome.selectLanguage', 'Выберите язык')}
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                      {languageOptions.map((lang) => (
                        <motion.button
                          key={lang.code}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            i18n.changeLanguage(lang.code);
                            localStorage.setItem('i18nextLng', lang.code);
                          }}
                          className={`p-2 rounded-[12px] font-bold transition-all ${
                            i18n.language === lang.code
                              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                          }`}
                        >
                          <div className="text-xl mb-0.5">{lang.flag}</div>
                          <div className="text-[10px]">{lang.code.toUpperCase()}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Theme Toggle - компактно */}
                  <div className="mb-6">
                    <h3 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
                      🎨 {i18n.t('welcome.theme', 'Тема оформления')}
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={toggleTheme}
                      className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-[16px] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{theme === 'light' ? '🌙' : '☀️'}</span>
                        <span className="font-bold text-sm text-gray-900 dark:text-white">
                          {theme === 'light' 
                            ? i18n.t('welcome.darkMode', 'Темная тема')
                            : i18n.t('welcome.lightMode', 'Светлая тема')
                          }
                        </span>
                      </div>
                      <div className={`w-11 h-6 rounded-full transition-colors ${
                        theme === 'dark' ? 'bg-indigo-500' : 'bg-gray-300'
                      }`}>
                        <motion.div
                          animate={{ x: theme === 'dark' ? 20 : 0 }}
                          className="w-6 h-6 bg-white rounded-full shadow-lg"
                        />
                      </div>
                    </motion.button>
                  </div>

                  {/* Continue Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleContinue}
                    className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-black text-base rounded-full shadow-lg"
                  >
                    {i18n.t('welcome.continue', 'Продолжить')}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      ) : (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Loading Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-full max-w-[450px] pointer-events-auto"
            >
              <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[32px] p-1 shadow-2xl">
                <div className="bg-white dark:bg-gray-900 rounded-[28px] p-8">
                  <div className="text-center mb-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="text-6xl mb-4 inline-block"
                    >
                      📦
                    </motion.div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                      {i18n.t('welcome.loading', 'Загрузка...')}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {i18n.t('welcome.preparing', 'Подготовка приложения')}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                    />
                  </div>

                  <div className="text-center text-lg font-black text-gray-900 dark:text-white">
                    {progress}%
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
