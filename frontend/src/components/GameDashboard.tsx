import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

interface PlayerState {
  characterId: string;
  cityId: string;
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
  duration?: number;
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
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showLevelWarning, setShowLevelWarning] = useState(false);
  const [warningActivity, setWarningActivity] = useState<Activity | null>(null);
  const [hoveredStat, setHoveredStat] = useState<string | null>(null);
  const [characterModifiers, setCharacterModifiers] = useState<any>(null);
  const [shakingStat, setShakingStat] = useState<string | null>(null);

  // Загружаем модификаторы класса при монтировании
  useEffect(() => {
    const fetchModifiers = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/player/character-modifiers', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCharacterModifiers(data.modifiers);
        }
      } catch (error) {
        console.error('Failed to fetch character modifiers:', error);
      }
    };

    fetchModifiers();
  }, [playerState.characterId]);

  // Применяем модификаторы класса к значениям активности
  const applyClassModifiers = (activity: Activity) => {
    if (!activity.rewards) return activity;
    
    // Если модификаторы не загружены, возвращаем базовые значения
    if (!characterModifiers) return activity;

    const modifiedActivity = { ...activity };
    
    // Применяем бонусы к наградам
    if (modifiedActivity.rewards) {
      const expBonus = characterModifiers.experienceBonus || 0;
      const incomeBonus = characterModifiers.incomeBonus || 0;
      
      modifiedActivity.rewards = {
        experience: Math.round(activity.rewards.experience * (1 + expBonus / 100)),
        soms: Math.round(activity.rewards.soms * (1 + incomeBonus / 100)),
      };
    }

    // Применяем модификаторы к изменениям статов
    if (modifiedActivity.statModifiers) {
      const newModifiers: any = {};
      Object.entries(modifiedActivity.statModifiers).forEach(([key, value]) => {
        const statValue = value as number;
        
        // Применяем модификаторы класса к статам
        if (key === 'mood' && statValue > 0) {
          // Положительное настроение от работы
          const moodBonus = characterModifiers.moodFromWork || 0;
          newModifiers[key] = Math.round(statValue * (1 + moodBonus / 100));
        } else if (key === 'hunger' && statValue > 0) {
          // Восстановление голода от еды
          const foodBonus = characterModifiers.foodRecovery || 0;
          newModifiers[key] = Math.round(statValue * (1 + foodBonus / 100));
        } else if (key === 'health' && statValue > 0) {
          // Восстановление здоровья от еды
          const healthBonus = characterModifiers.healthFromFood || 0;
          newModifiers[key] = Math.round(statValue * (1 + healthBonus / 100));
        } else if (key === 'energy' && statValue > 0) {
          // Восстановление энергии
          const energyBonus = characterModifiers.energyRecovery || 0;
          newModifiers[key] = Math.round(statValue * (1 + energyBonus / 100));
        } else {
          // Остальные статы без изменений
          newModifiers[key] = Math.round(statValue);
        }
      });
      modifiedActivity.statModifiers = newModifiers;
    }

    // Применяем модификатор времени
    if (modifiedActivity.duration) {
      const timeMod = characterModifiers.activityDuration || 0;
      modifiedActivity.duration = Math.round((activity.duration || 0) * (1 + timeMod / 100));
    }

    return modifiedActivity;
  };

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

  // Проверяем хватает ли статов для активности
  const checkStatsForActivity = (activity: Activity): { canPerform: boolean; missingStats: string[] } => {
    if (!activity.statModifiers) return { canPerform: true, missingStats: [] };

    const missingStats: string[] = [];

    Object.entries(activity.statModifiers).forEach(([stat, change]) => {
      if (change < 0) { // Только негативные изменения (расход статов)
        const currentValue = playerState.stats[stat as keyof typeof playerState.stats];
        const requiredValue = Math.abs(change);
        
        if (currentValue < requiredValue) {
          missingStats.push(stat);
        }
      }
    });

    return {
      canPerform: missingStats.length === 0,
      missingStats
    };
  };

  const handleActivityClick = (activity: Activity) => {
    // Проверка уровня
    if (activity.requiredLevel && playerState.level < activity.requiredLevel) {
      setWarningActivity(activity);
      setShowLevelWarning(true);
      return;
    }

    // Проверка статов
    const { canPerform, missingStats } = checkStatsForActivity(activity);
    if (!canPerform) {
      // Трясем все недостающие статы по очереди
      missingStats.forEach((stat, index) => {
        setTimeout(() => {
          setShakingStat(stat);
          setTimeout(() => setShakingStat(null), 600);
        }, index * 200);
      });
      
      // Скроллим наверх к статам
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const getCharacterName = (characterId: string): string => {
    const characters: Record<string, Record<string, string>> = {
      'char_merchant': { ru: 'Торговец', en: 'Merchant', uz: 'Savdogar', uk: 'Торговець' },
      'char_warrior': { ru: 'Воин', en: 'Warrior', uz: 'Jangchi', uk: 'Воїн' },
      'char_scholar': { ru: 'Философ', en: 'Philosopher', uz: 'Faylasuf', uk: 'Філософ' },
      'char_artisan': { ru: 'Ремесленник', en: 'Artisan', uz: 'Hunarmand', uk: 'Ремісник' },
      'char_chef': { ru: 'Повар', en: 'Chef', uz: 'Oshpaz', uk: 'Кухар' },
      'char_trader': { ru: 'Торговец', en: 'Trader', uz: 'Savdogar', uk: 'Торговець' },
      'char_worker': { ru: 'Работник', en: 'Worker', uz: 'Ishchi', uk: 'Робітник' },
      'char_student': { ru: 'Студент', en: 'Student', uz: 'Talaba', uk: 'Студент' },
      'char_cook': { ru: 'Повар', en: 'Cook', uz: 'Oshpaz', uk: 'Кухар' },
      'char_craftsman': { ru: 'Ремесленник', en: 'Craftsman', uz: 'Hunarmand', uk: 'Ремісник' },
      'char_master_chef': { ru: 'Шеф-повар', en: 'Master Chef', uz: 'Bosh oshpaz', uk: 'Шеф-кухар' },
      'char_master_artisan': { ru: 'Мастер-ремесленник', en: 'Master Artisan', uz: 'Usta hunarmand', uk: 'Майстер-ремісник' },
      'char_tycoon': { ru: 'Магнат', en: 'Tycoon', uz: 'Magnate', uk: 'Магнат' },
      'char_legend': { ru: 'Легенда', en: 'Legend', uz: 'Afsona', uk: 'Легенда' },
      'char_sage': { ru: 'Мудрец', en: 'Sage', uz: 'Donishmand', uk: 'Мудрець' },
      'default': { ru: 'Новичок', en: 'Newbie', uz: 'Yangi', uk: 'Новачок' }
    };
    const lang = i18n.language as 'ru' | 'en' | 'uz' | 'uk';
    return characters[characterId]?.[lang] || characters['default'][lang];
  };

  const getCharacterTier = (characterId: string): number => {
    // Tier 1 classes
    const tier1 = ['char_trader', 'char_worker', 'char_student', 'char_cook', 'char_craftsman'];
    // Tier 2 classes
    const tier2 = ['char_merchant', 'char_warrior', 'char_scholar', 'char_master_chef', 'char_master_artisan'];
    // Tier 3 classes
    const tier3 = ['char_tycoon', 'char_legend', 'char_sage'];
    
    if (tier1.includes(characterId)) return 1;
    if (tier2.includes(characterId)) return 2;
    if (tier3.includes(characterId)) return 3;
    return 1; // default
  };

  const getCharacterEmoji = (characterId: string): string => {
    const emojis: Record<string, string> = {
      'char_merchant': '🤑',
      'char_warrior': '⚔️',
      'char_scholar': '📚',
      'char_artisan': '🎨',
      'char_chef': '👨‍🍳',
      'default': '👤'
    };
    return emojis[characterId] || emojis['default'];
  };

  const getCityName = (cityId: string): string => {
    const cities: Record<string, Record<string, string>> = {
      'tashkent': { ru: 'Ташкент', en: 'Tashkent', uz: 'Toshkent', uk: 'Ташкент' },
      'samarkand': { ru: 'Самарканд', en: 'Samarkand', uz: 'Samarqand', uk: 'Самарканд' },
      'bukhara': { ru: 'Бухара', en: 'Bukhara', uz: 'Buxoro', uk: 'Бухара' },
      'khiva': { ru: 'Хива', en: 'Khiva', uz: 'Xiva', uk: 'Хіва' },
      'andijan': { ru: 'Андижан', en: 'Andijan', uz: 'Andijon', uk: 'Андіжан' },
      'default': { ru: 'Без города', en: 'No city', uz: 'Shahar yo\'q', uk: 'Без міста' }
    };
    const lang = i18n.language as 'ru' | 'en' | 'uz' | 'uk';
    return cities[cityId]?.[lang] || cities['default'][lang];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-black dark:from-black dark:via-black dark:to-black pb-20">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Объединенная карточка профиля и статов */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl p-6 backdrop-blur-2xl bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-gray-800/90 dark:via-gray-800/80 dark:to-gray-800/70 shadow-2xl border border-white/50 dark:border-gray-700/50 overflow-hidden"
        >
          {/* Animated background blobs */}
          <div className="absolute inset-0 opacity-30 dark:opacity-20">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-2xl animate-blob" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-2xl animate-blob animation-delay-2000" />
            <div className="absolute -bottom-10 left-1/2 w-40 h-40 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-2xl animate-blob animation-delay-4000" />
          </div>

          <div className="relative z-10">
            {/* Верхняя часть - профиль */}
            <div className="flex items-center gap-4 mb-6">
              {/* Аватар с XP кольцом */}
              <div className="relative flex-shrink-0">
                <svg className="absolute -inset-2 w-20 h-20 -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-gray-300/50 dark:text-gray-600/50"
                  />
                  <motion.circle
                    cx="40"
                    cy="40"
                    r="36"
                    stroke="url(#xpGradient)"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 36}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 36 }}
                    animate={{ 
                      strokeDashoffset: 2 * Math.PI * 36 * (1 - playerState.experience / playerState.experienceToNextLevel)
                    }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    strokeLinecap="round"
                    className="drop-shadow-lg"
                  />
                  <defs>
                    <linearGradient id="xpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                
                <div className="w-16 h-16 rounded-full overflow-hidden shadow-xl ring-2 ring-white dark:ring-gray-800 bg-gray-200 dark:bg-gray-700">
                  {userAvatar && userAvatar.startsWith('http') ? (
                    <img 
                      src={userAvatar} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-3xl">👤</div>';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      {userAvatar || '👤'}
                    </div>
                  )}
                </div>
              </div>

              {/* Инфо и валюта */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                    {t('dashboard.level')} {playerState.level}
                  </h2>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-1 rounded-lg">
                    {Math.round((playerState.experience / playerState.experienceToNextLevel) * 100)}%
                  </span>
                </div>
                
                <div className="relative h-2 bg-gray-300/60 dark:bg-gray-600/60 rounded-full overflow-hidden mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(playerState.experience / playerState.experienceToNextLevel) * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                  />
                </div>

                <div className="flex items-stretch gap-1.5">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.location.href = '/classes'}
                    className="relative flex items-center gap-1.5 px-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 dark:from-purple-500/30 dark:to-pink-500/30 border border-purple-400/50 dark:border-purple-500/50 hover:border-purple-500 dark:hover:border-purple-400 transition-all shadow-sm hover:shadow-md"
                  >
                    <span className="text-base">{getCharacterEmoji(playerState.characterId)}</span>
                    <span className="text-gray-900 dark:text-white font-bold text-[11px] whitespace-nowrap">
                      {getCharacterName(playerState.characterId)}
                    </span>
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-400 dark:bg-yellow-500 flex items-center justify-center shadow-sm">
                      <span className="text-[9px] font-black text-gray-900">
                        {getCharacterTier(playerState.characterId)}
                      </span>
                    </div>
                  </motion.button>
                  
                  <div className="flex items-center gap-1 px-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 dark:from-blue-500/30 dark:to-cyan-500/30 border border-blue-400/50 dark:border-blue-500/50 shadow-sm">
                    <span className="text-base">🏙️</span>
                    <span className="text-gray-900 dark:text-white font-bold text-[11px] whitespace-nowrap">
                      {getCityName(playerState.cityId)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 px-2 rounded-lg bg-gradient-to-r from-yellow-400/30 to-orange-500/30 border border-yellow-400/50 shadow-sm ml-auto">
                    <span className="text-base">💰</span>
                    <span className="text-gray-900 dark:text-white font-black text-[11px] whitespace-nowrap">
                      {playerState.soms.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 px-2 rounded-lg bg-gradient-to-r from-cyan-400/30 to-blue-500/30 border border-cyan-400/50 shadow-sm">
                    <span className="text-base">💎</span>
                    <span className="text-gray-900 dark:text-white font-black text-[11px]">
                      {playerState.donationCurrency}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Нижняя часть - статы в одну строку */}
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(playerState.stats).map(([key, value], index) => {
                const config = statConfig[key as keyof typeof statConfig];
                const isLow = value < 30;
                const isCritical = value < 15;
                const isShaking = shakingStat === key;
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={
                      isShaking 
                        ? { 
                            opacity: 1, 
                            scale: 1,
                            x: [0, -10, 10, -10, 10, -5, 5, 0],
                            rotate: [0, -5, 5, -5, 5, 0]
                          }
                        : { opacity: 1, scale: 1 }
                    }
                    transition={
                      isShaking 
                        ? { duration: 0.6, ease: 'easeInOut' }
                        : { delay: 0.1 + index * 0.05 }
                    }
                    onHoverStart={() => setHoveredStat(key)}
                    onHoverEnd={() => setHoveredStat(null)}
                    className={`relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-3 shadow-md border-2 ${
                      isCritical ? 'border-red-500 dark:border-red-400' :
                      isLow ? 'border-orange-500 dark:border-orange-400' :
                      'border-gray-200 dark:border-gray-700'
                    } cursor-pointer hover:shadow-lg transition-all hover:scale-105`}
                  >
                    {isCritical && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-lg"
                      >
                        !
                      </motion.div>
                    )}
                    
                    <div className="flex flex-col items-center">
                      <div className="relative mb-1">
                        <CircularProgress 
                          value={value} 
                          max={100} 
                          size={50} 
                          strokeWidth={5}
                          color={
                            value >= 70 ? '#10b981' : 
                            value >= 40 ? '#f59e0b' : '#ef4444'
                          }
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.span 
                            animate={isLow ? { rotate: [0, -10, 10, -10, 0] } : {}}
                            transition={{ duration: 0.5, repeat: isLow ? Infinity : 0, repeatDelay: 2 }}
                            className="text-xl"
                          >
                            {config.icon}
                          </motion.span>
                        </div>
                      </div>
                      
                      <div className="text-center w-full">
                        <div className={`text-lg font-black mb-0.5 ${
                          value >= 70 ? 'text-green-600 dark:text-green-400' :
                          value >= 40 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {value}%
                        </div>
                        <div className="text-[10px] text-gray-600 dark:text-gray-400 font-bold">
                          {t(config.labelKey)}
                        </div>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {hoveredStat === key && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className={`absolute bottom-full mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-xl shadow-2xl z-[200] max-w-[180px] text-center whitespace-normal pointer-events-none ${
                            index >= 2 ? 'right-0' : 'left-1/2 transform -translate-x-1/2'
                          }`}
                        >
                          <div className="font-bold mb-1">{t(config.descKey)}</div>
                          {isLow && <div className="text-red-400 font-bold">{t(config.lowWarningKey)}</div>}
                          <div className={`absolute top-full border-[6px] border-transparent border-t-gray-900 dark:border-t-gray-700 ${
                            index >= 2 ? 'right-4' : 'left-1/2 transform -translate-x-1/2'
                          }`} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Current Activity Status - Красивая и компактная */}
        <AnimatePresence>
          {currentActivity && timeLeft > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
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
                    <div className="text-xs opacity-80 font-semibold mb-1">🎯 {t('dashboard.currentActivity')}</div>
                    <div className="text-base font-bold truncate">
                      {t(`activities.${currentActivity.activityId}`, currentActivity.activityName)}
                    </div>
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
                    <span>{timeLeft <= 5 ? '⚡ ' + t('dashboard.almostDone') : '💪 ' + t('dashboard.keepItUp')}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
              const { canPerform: hasEnoughStats, missingStats } = checkStatsForActivity(activity);
              const isAvailable = !isLocked && canAfford && hasEnoughStats;

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
                  {/* Duration badge - top left */}
                  {activity.duration && (
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm ${
                      !isAvailable 
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500'
                        : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                    }`}>
                      <span>⏱️</span>
                      <span>{activity.duration < 60 ? `${activity.duration}с` : `${Math.floor(activity.duration / 60)}м`}</span>
                    </div>
                  )}

                  {isLocked && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-lg shadow-md z-10 flex items-center gap-1">
                      <span>🔒</span>
                      <span>LVL {activity.requiredLevel}</span>
                    </div>
                  )}

                  {!hasEnoughStats && !isLocked && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-lg shadow-md z-10 flex items-center gap-1">
                      {missingStats.map(stat => statConfig[stat as keyof typeof statConfig]?.icon).join('')}
                    </div>
                  )}

                  {!canAfford && !isLocked && hasEnoughStats && (
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
                    {activity.rewards && (
                      <div className="mb-2">
                        <div className="text-[9px] text-gray-500 dark:text-gray-400 mb-1 text-center font-semibold uppercase tracking-wide">{t('dashboard.rewards')}</div>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          <div className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 ${
                            !isAvailable 
                              ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500'
                              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          }`}>
                            <span>⭐</span>
                            <span>{activity.rewards.experience}</span>
                          </div>
                          <div className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 ${
                            !isAvailable 
                              ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500'
                              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          }`}>
                            <span>💰</span>
                            <span>{activity.rewards.soms}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Effects (stat changes + cost) */}
                    {((activity.statModifiers && Object.keys(activity.statModifiers).length > 0) || activity.cost) && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-[9px] text-gray-500 dark:text-gray-400 mb-1.5 text-center font-semibold uppercase tracking-wide">{t('dashboard.effects')}</div>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                          {/* Cost as negative effect */}
                          {activity.cost && (
                            <div className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                              !canAfford 
                                ? 'bg-red-500 dark:bg-red-600 text-white ring-2 ring-red-300 dark:ring-red-400'
                                : !isAvailable
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500'
                                : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 ring-1 ring-red-300 dark:ring-red-500'
                            }`}>
                              <span>💸</span>
                              <span>-{activity.cost}</span>
                            </div>
                          )}
                          
                          {/* Stat modifiers */}
                          {activity.statModifiers && Object.entries(activity.statModifiers).map(([stat, value]) => {
                            const statConf = statConfig[stat as keyof typeof statConfig];
                            if (!statConf) return null;
                            return (
                              <div 
                                key={stat}
                                className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                                  !isAvailable 
                                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-500'
                                    : value > 0 
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                                    : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 ring-1 ring-red-300 dark:ring-red-500'
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

        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6"
        >
          <div className="grid grid-cols-4 gap-3">
            <motion.button
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all text-center"
            >
              <div className="text-3xl mb-1">🏠</div>
              <div className="text-xs font-bold text-gray-900 dark:text-white truncate">{t('menu.home', 'Главная')}</div>
            </motion.button>
            
            <motion.button
              onClick={() => navigate('/shop')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all text-center"
            >
              <div className="text-3xl mb-1">🛍️</div>
              <div className="text-xs font-bold text-gray-900 dark:text-white truncate">{t('menu.shop', 'Магазин')}</div>
            </motion.button>
            
            <motion.button
              onClick={() => navigate('/classes')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-purple-500/30 dark:to-pink-500/30 border-2 border-purple-400 dark:border-purple-500 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-400/10 animate-pulse" />
              <div className="relative">
                <div className="text-3xl mb-1">🏛️</div>
                <div className="text-xs font-bold text-purple-900 dark:text-purple-200 truncate">{t('menu.classes', 'Классы')}</div>
              </div>
            </motion.button>
            
            <motion.button
              onClick={() => navigate('/settings')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all text-center"
            >
              <div className="text-3xl mb-1">⚙️</div>
              <div className="text-xs font-bold text-gray-900 dark:text-white truncate">{t('menu.settings', 'Настройки')}</div>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Activity Confirmation Modal - ПОРТАЛ В ЦЕНТР ЭКРАНА */}
      {createPortal(
        <AnimatePresence>
          {selectedActivity && (() => {
            const modifiedActivity = applyClassModifiers(selectedActivity);
            const duration = modifiedActivity.duration || 0;
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            const timeText = minutes > 0 
              ? `${minutes} ${t('common.minutes', 'хв')}${seconds > 0 ? ` ${seconds} ${t('common.seconds', 'с')}` : ''}`
              : `${seconds} ${t('common.seconds', 'с')}`;

            return (
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
                  {modifiedActivity.rewards && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-bold flex items-center gap-2">
                          <span className="text-xl">⭐</span>
                          <span>{t('activity.experience')}:</span>
                        </span>
                        <span className="text-xl font-black text-green-600 dark:text-green-400">
                          +{modifiedActivity.rewards.experience} XP
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-bold flex items-center gap-2">
                          <span className="text-xl">💰</span>
                          <span>{t('activity.soms')}:</span>
                        </span>
                        <span className="text-xl font-black text-yellow-600 dark:text-yellow-400">
                          +{modifiedActivity.rewards.soms}
                        </span>
                      </div>
                    </>
                  )}
                  
                  {modifiedActivity.cost && (
                    <div className="flex justify-between items-center pt-3 border-t border-indigo-200 dark:border-indigo-700">
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-bold flex items-center gap-2">
                        <span className="text-xl">💸</span>
                        <span>{t('dashboard.cost')}:</span>
                      </span>
                      <span className="text-xl font-black text-red-600 dark:text-red-400">
                        -{modifiedActivity.cost}
                      </span>
                    </div>
                  )}

                  {modifiedActivity.statModifiers && Object.keys(modifiedActivity.statModifiers).length > 0 && (
                    <div className="pt-3 border-t border-indigo-200 dark:border-indigo-700">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-bold">{t('dashboard.statChanges')}</div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {Object.entries(modifiedActivity.statModifiers).map(([stat, value]) => {
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
                  ⏰ {t('dashboard.takesTime')}: {timeText}
                </p>
                
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedActivity(null)}
                    className="flex-1 px-6 py-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-2xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                  >
                    {t('dashboard.cancel')}
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
                      <span>{t('dashboard.start')}</span>
                      <span>🚀</span>
                    </span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      );
    })()}
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
                  {t('dashboard.levelTooLow')}!
                </h3>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-5 mb-6 border border-red-200 dark:border-red-800">
                  <p className="text-gray-700 dark:text-gray-300 mb-3 text-lg">
                    <span className="font-bold">{getActivityName(warningActivity)}</span>
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('ui.level_required')}</div>
                      <div className="text-2xl font-black text-red-600 dark:text-red-400">
                        {warningActivity.requiredLevel}
                      </div>
                    </div>
                    <div className="text-3xl text-gray-400">→</div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('character.level')}</div>
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
                  {t('dashboard.understood')}
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
