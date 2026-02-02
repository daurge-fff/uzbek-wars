import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

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
  description?: string | { ru: string; uz: string; uk: string; en: string };
  icon: string;
  cooldown?: number;
  requiredLevel?: number;
  image?: string;
  rewards?: {
    experience: number;
    soms: number;
  };
  statModifiers?: {
    hunger?: number;
    health?: number;
    mood?: number;
    energy?: number;
  };
  cost?: number;
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
  onActivityComplete?: () => void;
}

// Circular progress component
const CircularProgress = ({ value, max, size = 120, strokeWidth = 8, color = '#6366f1' }: { value: number; max: number; size?: number; strokeWidth?: number; color?: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = ((value / max) * 100);
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        className="text-gray-200 dark:text-gray-700"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </svg>
  );
};

const statConfig = {
  hunger: { 
    icon: '🍖', 
    color: 'from-orange-500 to-red-500', 
    labelKey: 'stats.hunger',
    descKey: 'stats.hungerDesc',
    lowWarningKey: 'stats.hungerLow'
  },
  health: { 
    icon: '❤️', 
    color: 'from-red-500 to-pink-500', 
    labelKey: 'stats.health',
    descKey: 'stats.healthDesc',
    lowWarningKey: 'stats.healthLow'
  },
  mood: { 
    icon: '😊', 
    color: 'from-yellow-500 to-orange-500', 
    labelKey: 'stats.mood',
    descKey: 'stats.moodDesc',
    lowWarningKey: 'stats.moodLow'
  },
  energy: { 
    icon: '⚡', 
    color: 'from-blue-500 to-cyan-500', 
    labelKey: 'stats.energy',
    descKey: 'stats.energyDesc',
    lowWarningKey: 'stats.energyLow'
  }
};

// Эмодзи для активностей
const activityImages: Record<string, string> = {
  'work_svyaznoy': '📱',
  'rob': '💰',
  'cook_plov': '🍛',
  'trade_bazaar': '🏪',
  'rest': '😴',
  'eat': '🍽️'
};

export const GameDashboard = ({ playerState, activities, onActivitySelect, userAvatar, currentActivity, onActivityComplete }: GameDashboardProps) => {
  const { t, i18n } = useTranslation();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showLevelWarning, setShowLevelWarning] = useState(false);
  const [warningActivity, setWarningActivity] = useState<Activity | null>(null);
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);

  // Блокировка скролла когда открыта модалка
  useEffect(() => {
    if (selectedActivity || showLevelWarning) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedActivity, showLevelWarning]);

  // Обновление таймера
  useEffect(() => {
    if (!currentActivity) {
      setTimeLeft(0);
      setProgress(0);
      return;
    }
    
    // Проверяем что данные валидные - если нет, просто не запускаем таймер
    if (!currentActivity.startTime || !currentActivity.endTime || 
        isNaN(currentActivity.startTime) || isNaN(currentActivity.endTime)) {
      setTimeLeft(0);
      setProgress(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const total = currentActivity.endTime - currentActivity.startTime;
      const elapsed = now - currentActivity.startTime;
      const remaining = currentActivity.endTime - now;

      if (remaining <= 0) {
        setTimeLeft(0);
        setProgress(100);
        // Небольшая задержка перед вызовом callback для плавного исчезновения
        setTimeout(() => {
          if (onActivityComplete) {
            onActivityComplete();
          }
        }, 300);
        return false; // Останавливаем таймер
      } else {
        setTimeLeft(Math.ceil(remaining / 1000));
        setProgress((elapsed / total) * 100);
        return true; // Продолжаем таймер
      }
    };

    // Первое обновление сразу
    if (!updateTimer()) {
      return;
    }

    const interval = setInterval(() => {
      if (!updateTimer()) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentActivity, onActivityComplete]);

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

  const getActivityDescription = (activity: Activity): string => {
    if (!activity.description) return '';
    if (typeof activity.description === 'object') {
      return activity.description[i18n.language as keyof typeof activity.description] || activity.description.ru;
    }
    return activity.description;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Карточка профиля - компактная */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-2xl p-4 shadow-xl text-white relative overflow-hidden"
        >
          {/* Animated background circles */}
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              scale: [1.2, 1, 1.2],
              rotate: [360, 180, 0]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/10 rounded-full blur-3xl"
          />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-3">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <img 
                  src={userAvatar} 
                  alt="Avatar" 
                  className="w-16 h-16 rounded-xl shadow-lg border-2 border-white/40"
                />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-sm shadow-lg border-2 border-white"
                >
                  ⭐
                </motion.div>
              </div>

              {/* Level & XP */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl font-black">LVL {playerState.level}</div>
                  <div className="text-xs opacity-90 font-semibold">
                    {playerState.experience}/{playerState.experienceToNextLevel} XP
                  </div>
                </div>
                
                {/* XP Progress Bar */}
                <div className="h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(playerState.experience / playerState.experienceToNextLevel) * 100}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-100 rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Currency Display */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-xl px-3 py-2 border border-white/30">
                <span className="text-xl">💰</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] opacity-75 font-semibold">Сомы</div>
                  <div className="text-base font-black truncate">{playerState.soms.toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-xl px-3 py-2 border border-white/30">
                <span className="text-xl">💎</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] opacity-75 font-semibold">Кристаллы</div>
                  <div className="text-base font-black truncate">{playerState.donationCurrency}</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Current Activity Status - Красивая и компактная */}
        <AnimatePresence>
          {currentActivity && timeLeft > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: timeLeft <= 5 ? [1, 1.015, 1] : 1
              }}
              exit={{ opacity: 0, y: -20 }}
              transition={
                timeLeft <= 5 
                  ? { scale: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' } }
                  : { duration: 0.3, ease: 'easeOut' }
              }
              className={`bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-2xl p-4 shadow-xl text-white relative overflow-hidden ${
                timeLeft <= 5 ? 'ring-2 ring-yellow-300 ring-opacity-60' : ''
              }`}
            >
              {/* Animated background */}
              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.15, 0.05, 0.15]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 bg-white rounded-full blur-3xl"
              />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  {/* Icon */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                    className="text-4xl flex-shrink-0"
                  >
                    {activityImages[currentActivity.activityId] || '⏳'}
                  </motion.div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs opacity-80 font-semibold mb-1">🎯 Текущая активность</div>
                    <div className="text-base font-bold truncate">{currentActivity.activityName}</div>
                  </div>
                  
                  {/* Timer */}
                  <motion.div 
                    className={`text-3xl font-black ${timeLeft <= 5 ? 'text-yellow-300' : ''}`}
                    animate={timeLeft <= 5 ? { scale: [1, 1.15, 1] } : {}}
                    transition={timeLeft <= 5 ? { duration: 0.6, repeat: Infinity, ease: 'easeInOut' } : {}}
                  >
                    {formatTime(timeLeft)}
                  </motion.div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                    <motion.div
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-white rounded-full relative overflow-hidden"
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      <motion.div
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      />
                    </motion.div>
                  </div>
                  <div className="flex justify-between text-xs opacity-75 font-semibold">
                    <span>{Math.round(progress)}%</span>
                    <span>{timeLeft <= 5 ? '⚡ Почти готово!' : '💪 Продолжай!'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid - 4 карточки в ряд */}
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(playerState.stats).map(([key, value], index) => {
            const config = statConfig[key as keyof typeof statConfig];
            const isLow = value < 30;
            const isCritical = value < 15;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onHoverStart={() => setHoveredStat(key)}
                onHoverEnd={() => setHoveredStat(null)}
                className={`relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-4 shadow-lg border-2 ${
                  isCritical ? 'border-red-500 dark:border-red-400' :
                  isLow ? 'border-orange-500 dark:border-orange-400' :
                  'border-gray-200 dark:border-gray-700'
                } cursor-pointer z-10 hover:z-[100] hover:shadow-xl transition-all hover:scale-105`}
              >
                {isCritical && (
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg z-10"
                  >
                    !
                  </motion.div>
                )}
                
                <div className="flex flex-col items-center">
                  {/* Circular progress */}
                  <div className="relative mb-2">
                    <CircularProgress 
                      value={value} 
                      max={100} 
                      size={80} 
                      strokeWidth={7}
                      color={
                        value >= 70 ? '#10b981' : 
                        value >= 40 ? '#f59e0b' : '#ef4444'
                      }
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.span 
                        animate={isLow ? { rotate: [0, -10, 10, -10, 0] } : {}}
                        transition={{ duration: 0.5, repeat: isLow ? Infinity : 0, repeatDelay: 2 }}
                        className="text-4xl"
                      >
                        {config.icon}
                      </motion.span>
                    </div>
                  </div>
                  
                  <div className="text-center w-full">
                    <div className={`text-2xl font-black mb-1 ${
                      value >= 70 ? 'text-green-600 dark:text-green-400' :
                      value >= 40 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {value}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-bold">
                      {t(config.labelKey)}
                    </div>
                  </div>
                </div>
                
                {/* Tooltip - фиксированный, не убегает */}
                <AnimatePresence>
                  {hoveredStat === key && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-xl shadow-2xl z-[200] max-w-[200px] text-center whitespace-normal pointer-events-none"
                    >
                      <div className="font-bold mb-1">{t(config.descKey)}</div>
                      {isLow && <div className="text-red-400 font-bold">{t(config.lowWarningKey)}</div>}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-[6px] border-transparent border-t-gray-900 dark:border-t-gray-700" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Activities Section - карточки по 2 в ряд */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <span>🎮</span>
              <span>{t('dashboard.activities')}</span>
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-bold">
              {activities.filter(a => (!a.requiredLevel || playerState.level >= a.requiredLevel) && (!a.cost || playerState.soms >= a.cost)).length} / {activities.length}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {activities.map((activity, index) => {
              const activityName = getActivityName(activity);
              const activityDesc = getActivityDescription(activity);
              const isLocked = activity.requiredLevel && playerState.level < activity.requiredLevel;
              const activityImage = activityImages[activity.id] || activity.icon;
              const canAfford = !activity.cost || playerState.soms >= activity.cost;
              const isAvailable = !isLocked && canAfford;

              return (
                <motion.button
                  key={activity.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.03 }}
                  whileHover={isAvailable && !currentActivity ? { y: -4 } : {}}
                  whileTap={isAvailable && !currentActivity ? { scale: 0.98 } : {}}
                  onClick={() => handleActivityClick(activity)}
                  disabled={!isAvailable || !!currentActivity}
                  className={`relative rounded-2xl p-5 shadow-md transition-all border-2 ${
                    !isAvailable
                      ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 opacity-50 cursor-not-allowed'
                      : currentActivity
                      ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-800 border-green-200 dark:border-green-700 hover:shadow-lg hover:border-green-300 dark:hover:border-green-600'
                  } overflow-hidden`}
                >
                  {isLocked && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-lg shadow-md z-10 flex items-center gap-1">
                      <span>🔒</span>
                      <span>{activity.requiredLevel}</span>
                    </div>
                  )}

                  {!canAfford && !isLocked && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-lg shadow-md z-10">
                      💰
                    </div>
                  )}
                  
                  <div className="relative z-10">
                    <div className={`text-5xl mb-3 text-center ${!isAvailable ? 'grayscale' : ''}`}>
                      {activityImage}
                    </div>
                    
                    <div className={`text-base font-bold mb-2 text-center line-clamp-2 min-h-[2.5rem] ${
                      !isAvailable ? 'text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-white'
                    }`}>
                      {activityName}
                    </div>

                    {activityDesc && (
                      <div className={`text-xs mb-3 text-center line-clamp-2 min-h-[2rem] ${
                        !isAvailable ? 'text-gray-400 dark:text-gray-600' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {activityDesc}
                      </div>
                    )}
                    
                    {/* Rewards */}
                    <div className="flex flex-wrap gap-1.5 justify-center mb-3">
                      {activity.rewards && (
                        <>
                          <div className={`px-2 py-1 rounded-lg font-bold text-xs flex items-center gap-1 ${
                            !isAvailable 
                              ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          }`}>
                            <span>⭐</span>
                            <span>+{activity.rewards.experience}</span>
                          </div>
                          <div className={`px-2 py-1 rounded-lg font-bold text-xs flex items-center gap-1 ${
                            !isAvailable 
                              ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          }`}>
                            <span>💰</span>
                            <span>+{activity.rewards.soms}</span>
                          </div>
                        </>
                      )}

                      {activity.cost && (
                        <div className={`px-2 py-1 rounded-lg font-bold text-xs flex items-center gap-1 ${
                          !canAfford 
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : !isAvailable
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500'
                            : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                        }`}>
                          <span>💸</span>
                          <span>-{activity.cost}</span>
                        </div>
                      )}
                    </div>

                    {/* Stat Changes */}
                    {activity.statModifiers && Object.keys(activity.statModifiers).length > 0 && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {Object.entries(activity.statModifiers).map(([stat, value]) => {
                            const statConf = statConfig[stat as keyof typeof statConfig];
                            if (!statConf) return null;
                            return (
                              <div 
                                key={stat}
                                className={`text-xs font-bold flex items-center gap-0.5 ${
                                  !isAvailable 
                                    ? 'text-gray-400 dark:text-gray-600'
                                    : value > 0 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-red-600 dark:text-red-400'
                                }`}
                                title={t(statConf.labelKey)}
                              >
                                <span>{statConf.icon}</span>
                                <span>{value > 0 ? '+' : ''}{value}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Activity Confirmation Modal - ПОРТАЛ В ЦЕНТР ЭКРАНА */}
      {createPortal(
        <AnimatePresence>
          {selectedActivity && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedActivity(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
              />
              
              <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-gray-800 rounded-[32px] p-8 max-w-md w-full shadow-2xl relative overflow-hidden pointer-events-auto"
                >
              {/* Animated Background */}
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl"
              />
              <motion.div
                animate={{ rotate: -360, scale: [1.2, 1, 1.2] }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-br from-pink-500/20 to-orange-500/20 rounded-full blur-3xl"
              />
              
              <div className="relative z-10 text-center">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-8xl mb-4"
                >
                  {activityImages[selectedActivity.id] || selectedActivity.icon}
                </motion.div>
                
                <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3">
                  {getActivityName(selectedActivity)}
                </h3>
                
                {getActivityDescription(selectedActivity) && (
                  <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm leading-relaxed">
                    {getActivityDescription(selectedActivity)}
                  </p>
                )}

                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-5 mb-6 space-y-3 border border-indigo-200 dark:border-indigo-800">
                  {selectedActivity.rewards && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-bold flex items-center gap-2">
                          <span className="text-xl">⭐</span>
                          <span>Опыт:</span>
                        </span>
                        <span className="text-xl font-black text-green-600 dark:text-green-400">
                          +{selectedActivity.rewards.experience} XP
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-bold flex items-center gap-2">
                          <span className="text-xl">💰</span>
                          <span>Сомы:</span>
                        </span>
                        <span className="text-xl font-black text-yellow-600 dark:text-yellow-400">
                          +{selectedActivity.rewards.soms}
                        </span>
                      </div>
                    </>
                  )}
                  
                  {selectedActivity.cost && (
                    <div className="flex justify-between items-center pt-3 border-t border-indigo-200 dark:border-indigo-700">
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-bold flex items-center gap-2">
                        <span className="text-xl">💸</span>
                        <span>Стоимость:</span>
                      </span>
                      <span className="text-xl font-black text-red-600 dark:text-red-400">
                        -{selectedActivity.cost}
                      </span>
                    </div>
                  )}

                  {selectedActivity.statModifiers && Object.keys(selectedActivity.statModifiers).length > 0 && (
                    <div className="pt-3 border-t border-indigo-200 dark:border-indigo-700">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-bold">Изменения статов:</div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {Object.entries(selectedActivity.statModifiers).map(([stat, value]) => {
                          const statConf = statConfig[stat as keyof typeof statConfig];
                          if (!statConf) return null;
                          return (
                            <div 
                              key={stat}
                              className={`px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1 ${
                                value > 0 
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              }`}
                            >
                              <span>{statConf.icon}</span>
                              <span>{t(statConf.labelKey)}: {value > 0 ? '+' : ''}{value}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm font-bold">
                  ⏰ Займет некоторое время
                </p>
                
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedActivity(null)}
                    className="flex-1 px-6 py-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-2xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                  >
                    Отмена
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={confirmActivity}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-2xl hover:shadow-xl transition-all relative overflow-hidden group"
                  >
                    <motion.div
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    />
                    <span className="relative flex items-center justify-center gap-2">
                      <span>Начать</span>
                      <span>🚀</span>
                    </span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )}

      {/* Level Warning Modal - ПОРТАЛ В ЦЕНТР ЭКРАНА */}
      {createPortal(
        <AnimatePresence>
          {showLevelWarning && warningActivity && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLevelWarning(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
              />
              
              <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-4">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.8 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-gray-800 rounded-[32px] p-8 max-w-md w-full shadow-2xl relative overflow-hidden pointer-events-auto"
                >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full blur-3xl"
              />
              
              <div className="relative z-10 text-center">
                <motion.div
                  animate={{ 
                    rotate: [0, -10, 10, -10, 10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 0.5, repeat: 3 }}
                  className="text-8xl mb-4"
                >
                  🔒
                </motion.div>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3">
                  Недостаточно уровня!
                </h3>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-5 mb-6 border border-red-200 dark:border-red-800">
                  <p className="text-gray-700 dark:text-gray-300 mb-3 text-lg">
                    <span className="font-bold">{getActivityName(warningActivity)}</span>
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Требуется</div>
                      <div className="text-2xl font-black text-red-600 dark:text-red-400">
                        {warningActivity.requiredLevel}
                      </div>
                    </div>
                    <div className="text-3xl text-gray-400">→</div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ваш уровень</div>
                      <div className="text-2xl font-black text-gray-600 dark:text-gray-400">
                        {playerState.level}
                      </div>
                    </div>
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowLevelWarning(false)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-2xl hover:shadow-xl transition-all"
                >
                  Понятно
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )}
    </div>
  );
};
