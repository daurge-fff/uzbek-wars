import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

interface SettingsProps {
  currentLanguage: 'ru' | 'uz' | 'uk' | 'en';
  onLanguageChange: (lang: 'ru' | 'uz' | 'uk' | 'en') => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  musicEnabled: boolean;
  onMusicToggle: () => void;
  notificationsEnabled: boolean;
  onNotificationsToggle: () => void;
  appStats?: {
    uptime: number;
    lastRestart: string;
    onlinePlayersTotal: number;
    onlinePlayersCity: number;
    cityName: string;
    version: string;
  };
}

const languageOptions = [
  { code: 'ru' as const, name: 'Русский', flag: '🇷🇺' },
  { code: 'uz' as const, name: "O'zbekcha", flag: '🇺🇿' },
  { code: 'uk' as const, name: 'Українська', flag: '🇺🇦' },
  { code: 'en' as const, name: 'English', flag: '🇬🇧' }
];

export const Settings = ({
  currentLanguage,
  onLanguageChange,
  soundEnabled,
  onSoundToggle,
  musicEnabled,
  onMusicToggle,
  notificationsEnabled,
  onNotificationsToggle,
  appStats
}: SettingsProps) => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}ч ${minutes}м`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 backdrop-blur-xl rounded-[32px] shadow-2xl p-6"
        >
          <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mb-6">
            {t('settings.title', 'Настройки')}
          </h1>

          {/* Language Section */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              {t('settings.language', 'Язык')}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {languageOptions.map((lang) => (
                <motion.button
                  key={lang.code}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onLanguageChange(lang.code)}
                  className={`p-4 rounded-[20px] font-bold transition-all ${
                    currentLanguage === lang.code
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <div className="text-3xl mb-2">{lang.flag}</div>
                  <div className="text-sm">{lang.name}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Theme Section */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              {t('settings.appearance', 'Внешний вид')}
            </h2>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleTheme}
              className="w-full p-4 bg-gray-100 dark:bg-gray-700 rounded-[20px] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{theme === 'light' ? '🌙' : '☀️'}</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {theme === 'light' 
                    ? t('settings.darkMode', 'Темная тема')
                    : t('settings.lightMode', 'Светлая тема')
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

          {/* Sound Section */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              {t('settings.audio', 'Звук')}
            </h2>
            <div className="space-y-3">
              <ToggleButton
                icon="🔊"
                label={t('settings.soundEffects', 'Звуковые эффекты')}
                enabled={soundEnabled}
                onToggle={onSoundToggle}
              />
              <ToggleButton
                icon="🎵"
                label={t('settings.music', 'Музыка')}
                enabled={musicEnabled}
                onToggle={onMusicToggle}
              />
            </div>
          </div>

          {/* Notifications Section */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              {t('settings.notifications', 'Уведомления')}
            </h2>
            <ToggleButton
              icon="🔔"
              label={t('settings.pushNotifications', 'Push-уведомления')}
              enabled={notificationsEnabled}
              onToggle={onNotificationsToggle}
            />
          </div>
        </motion.div>

        {/* About Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 backdrop-blur-xl rounded-[32px] shadow-2xl p-6"
        >
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {t('settings.about', 'О приложении')}
          </h2>
          
          {appStats && (
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-[16px] border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-semibold">🌍 Онлайн всего</span>
                  <div className="group relative">
                    <span className="text-xs cursor-help opacity-60">ℹ️</span>
                    <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                      Игроки онлайн прямо сейчас во всех городах
                    </div>
                  </div>
                </div>
                <span className="font-black text-green-600 dark:text-green-400 text-lg">{appStats.onlinePlayersTotal}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-[16px] border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-semibold">🏙️ В {appStats.cityName}</span>
                  <div className="group relative">
                    <span className="text-xs cursor-help opacity-60">ℹ️</span>
                    <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                      Игроки онлайн в твоем городе
                    </div>
                  </div>
                </div>
                <span className="font-black text-blue-600 dark:text-blue-400 text-lg">{appStats.onlinePlayersCity}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-[16px]">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">⏱️ Время работы</span>
                  <div className="group relative">
                    <span className="text-xs cursor-help opacity-60">ℹ️</span>
                    <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                      Время с последнего перезапуска сервера
                    </div>
                  </div>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">{formatUptime(appStats.uptime)}</span>
              </div>
            </div>
          )}

          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <div className="flex justify-between">
              <span>Версия:</span>
              <span className="font-bold text-gray-900 dark:text-white">{appStats?.version || '1.0.0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Лицензия:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 dark:text-white">Proprietary</span>
                <div className="group relative">
                  <span className="text-xs cursor-help">ℹ️</span>
                  <div className="absolute bottom-full right-0 mb-2 w-56 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                    <div className="font-bold mb-1">🔒 Закрытый исходный код</div>
                    Копирование, изменение и распространение запрещены без письменного разрешения автора.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowDeveloperModal(true)}
            className="w-full p-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-[20px] shadow-lg"
          >
            👨‍💻 Разработчик
          </motion.button>
        </motion.div>

        {/* Developer Modal */}
        <AnimatePresence>
          {showDeveloperModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDeveloperModal(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              />
              
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
                      <div className="text-center mb-6">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, delay: 0.2 }}
                          className="text-8xl mb-4"
                        >
                          👨‍💻
                        </motion.div>
                        <h2 className="text-3xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
                          German Vitiaz
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                          Full-Stack Developer
                        </p>
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                          <span>🚀 React</span>
                          <span>•</span>
                          <span>⚡ Node.js</span>
                          <span>•</span>
                          <span>🎨 TypeScript</span>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <motion.a
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          href="https://t.me/daurge"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-[20px] font-bold shadow-lg hover:shadow-xl transition-all"
                        >
                          <span className="text-3xl">✈️</span>
                          <div className="flex-1 text-left">
                            <div className="text-sm opacity-90">Telegram</div>
                            <div className="text-lg">@daurge</div>
                          </div>
                          <span className="text-xl">→</span>
                        </motion.a>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-[16px] text-center">
                            <div className="text-2xl mb-1">⭐</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Качество кода</div>
                          </div>
                          <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-[16px] text-center">
                            <div className="text-2xl mb-1">🎯</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Быстрая работа</div>
                          </div>
                        </div>

                        <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-[20px] border border-yellow-200 dark:border-yellow-800">
                          <p className="text-xs text-gray-700 dark:text-gray-300 text-center">
                            💝 Спасибо за использование Узбек Варс!<br/>
                            Если нравится игра - поставь ⭐ на GitHub
                          </p>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowDeveloperModal(false)}
                        className="w-full py-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 text-gray-900 dark:text-white font-bold rounded-full shadow-lg"
                      >
                        Закрыть
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

interface ToggleButtonProps {
  icon: string;
  label: string;
  enabled: boolean;
  onToggle: () => void;
}

const ToggleButton = ({ icon, label, enabled, onToggle }: ToggleButtonProps) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onToggle}
    className="w-full p-4 bg-gray-100 dark:bg-gray-700 rounded-[20px] flex items-center justify-between"
  >
    <div className="flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <span className="font-bold text-gray-900 dark:text-white">{label}</span>
    </div>
    <div className={`w-12 h-6 rounded-full transition-colors ${
      enabled ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
    }`}>
      <motion.div
        animate={{ x: enabled ? 24 : 0 }}
        className="w-6 h-6 bg-white rounded-full shadow-lg"
      />
    </div>
  </motion.button>
);
