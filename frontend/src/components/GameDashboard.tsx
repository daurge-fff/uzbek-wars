import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

interface PlayerState {
  characterId: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  soms: number;
  donationCurrency: number;
  stats: {
    hunger: number;
    health: number;
    mood: number;
    energy: number;
  };
}

interface Activity {
  id: string;
  name: string | { ru: string; uz: string; uk: string; en: string };
  icon: string;
  cooldown?: number;
  requiredLevel?: number;
  image?: string;
}

interface GameDashboardProps {
  playerState: PlayerState;
  activities: Activity[];
  onActivitySelect: (activityId: string) => void;
  userAvatar?: string;
  currentActivity?: {
    activityId: string;
    activityName: string;
    startTime: number;
    endTime: number;
  } | null;
}

const statConfig = {
  hunger: { icon: '🍖', color: 'from-orange-500 to-red-500', label: 'Голод' },
  health: { icon: '❤️', color: 'from-red-500 to-pink-500', label: 'Здоровье' },
  mood: { icon: '😊', color: 'from-yellow-500 to-orange-500', label: 'Настроение' },
  energy: { icon: '⚡', color: 'from-blue-500 to-cyan-500', label: 'Энергия' }
};

// Картинки для активностей (эмодзи как фон)
const activityImages: Record<string, string> = {
  'work': '💼',
  'rob': '🔫',
  'police': '👮',
  'cook': '🍲',
  'samsa': '🥟',
  'trade': '🏪',
  'rest': '😴',
  'study': '📚',
  'gym': '💪',
  'crime': '🦹'
};

export const GameDashboard = ({ playerState, activities, onActivitySelect, userAvatar, currentActivity }: GameDashboardProps) => {
  const { t, i18n } = useTranslation();
  const expPercent = (playerState.experience / playerState.experienceToNextLevel) * 100;
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showLevelWarning, setShowLevelWarning] = useState(false);
  const [warningActivity, setWarningActivity] = useState<Activity | null>(null);

  // Обновление таймера
  useEffect(() => {
    if (!currentActivity) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const total = currentActivity.endTime - currentActivity.startTime;
      const elapsed = now - currentActivity.startTime;
      const remaining = currentActivity.endTime - now;

      if (remaining <= 0) {
        setTimeLeft(0);
        setProgress(100);
        clearInterval(interval);
      } else {
        setTimeLeft(Math.ceil(remaining / 1000));
        setProgress((elapsed / total) * 100);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentActivity]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleActivityClick = (activity: Activity) => {
    // Проверка уровня
    if (activity.requiredLevel && playerState.level < activity.requiredLevel) {
      setWarningActivity(activity);
      setShowLevelWarning(true);
      return;
    }

    setSelectedActivity(activity);
  };

  const confirmActivity = () => {
    if (selectedActivity) {
      onActivitySelect(selectedActivity.id);
      setSelectedActivity(null);
    }
  };

  const getActivityName = (activity: Activity): string => {
    if (typeof activity.name === 'object') {
      return activity.name[i18n.language as keyof typeof activity.name] || activity.name.ru;
    }
    return activity.name;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 pb-20">
      {/* Header with Player Info */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40"
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {userAvatar ? (
                <div className="relative">
                  <img 
                    src={userAvatar} 
                    alt="Avatar" 
                    className="w-16 h-16 rounded-full shadow-lg border-4 border-white dark:border-gray-700"
                  />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-black text-white shadow-lg border-2 border-white dark:border-gray-800">
                    {playerState.level}
                  </div>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-3xl font-black text-white shadow-lg">
                  {playerState.level}
                </div>
              )}
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">{t('dashboard.level')} {playerState.level}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {playerState.experience}/{playerState.experienceToNextLevel} XP
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg">
                <span className="text-white font-black text-sm">💰 {playerState.soms}</span>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg">
                <span className="text-white font-black text-sm">💎 {playerState.donationCurrency}</span>
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${expPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
            />
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Current Activity Status */}
        {currentActivity && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[24px] p-6 shadow-2xl text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm opacity-90">Сейчас ты:</div>
                <div className="text-2xl font-black">{currentActivity.activityName}</div>
              </div>
              <div className="text-6xl">{activityImages[currentActivity.activityId] || '⏳'}</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Осталось времени:</span>
                <span className="font-black text-xl">{formatTime(timeLeft)}</span>
              </div>
              <div className="h-4 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-white rounded-full"
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {Object.entries(playerState.stats).map(([key, value], index) => {
            const config = statConfig[key as keyof typeof statConfig];
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[20px] p-4 shadow-lg border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{config.icon}</span>
                  <span className="text-2xl font-black text-gray-900 dark:text-white">{value}%</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">{config.label}</div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className={`h-full bg-gradient-to-r ${config.color}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Activities Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 px-2">
            {t('activities.title', 'Активности')}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activities.map((activity, index) => {
              const activityName = getActivityName(activity);
              const isLocked = activity.requiredLevel && playerState.level < activity.requiredLevel;
              const activityImage = activityImages[activity.id] || activity.icon;

              return (
                <motion.button
                  key={activity.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  whileHover={{ scale: isLocked ? 1 : 1.05, y: isLocked ? 0 : -5 }}
                  whileTap={{ scale: isLocked ? 1 : 0.95 }}
                  onClick={() => handleActivityClick(activity)}
                  disabled={isLocked || !!currentActivity}
                  className={`relative bg-gradient-to-br ${
                    isLocked 
                      ? 'from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800' 
                      : 'from-white to-indigo-50 dark:from-gray-800 dark:to-purple-900/50'
                  } rounded-[24px] p-6 shadow-lg hover:shadow-2xl transition-all border ${
                    isLocked 
                      ? 'border-gray-300 dark:border-gray-600' 
                      : 'border-gray-100 dark:border-purple-500/30'
                  } ${currentActivity ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLocked && (
                    <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                      🔒 Ур. {activity.requiredLevel}
                    </div>
                  )}
                  
                  <div className="text-7xl mb-3">{activityImage}</div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                    {activityName}
                  </div>
                  
                  {activity.cooldown && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      ⏱️ {activity.cooldown} мин
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Activity Confirmation Modal */}
      <AnimatePresence>
        {selectedActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedActivity(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-[32px] p-8 max-w-md w-full shadow-2xl"
            >
              <div className="text-center">
                <div className="text-8xl mb-4">{activityImages[selectedActivity.id] || selectedActivity.icon}</div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                  {getActivityName(selectedActivity)}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Начать это действие? Это займет {selectedActivity.cooldown || 5} минут.
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedActivity(null)}
                    className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={confirmActivity}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-full hover:shadow-lg transition-all"
                  >
                    Начать!
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Warning Modal */}
      <AnimatePresence>
        {showLevelWarning && warningActivity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowLevelWarning(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-[32px] p-8 max-w-md w-full shadow-2xl"
            >
              <div className="text-center">
                <div className="text-8xl mb-4">🔒</div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                  Недостаточно опыта
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Для "{getActivityName(warningActivity)}" нужен {warningActivity.requiredLevel} уровень.
                  <br />
                  Твой уровень: {playerState.level}
                </p>
                
                <button
                  onClick={() => setShowLevelWarning(false)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-full hover:shadow-lg transition-all"
                >
                  Понятно
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
