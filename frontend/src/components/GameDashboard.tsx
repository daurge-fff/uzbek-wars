import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

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
  name: string;
  icon: string;
  cooldown?: number;
  requiredLevel?: number;
}

interface GameDashboardProps {
  playerState: PlayerState;
  activities: Activity[];
  onActivitySelect: (activityId: string) => void;
}

const statConfig = {
  hunger: { icon: '🍖', color: 'from-orange-500 to-red-500', label: 'Голод' },
  health: { icon: '❤️', color: 'from-red-500 to-pink-500', label: 'Здоровье' },
  mood: { icon: '😊', color: 'from-yellow-500 to-orange-500', label: 'Настроение' },
  energy: { icon: '⚡', color: 'from-blue-500 to-cyan-500', label: 'Энергия' }
};

export const GameDashboard = ({ playerState, activities, onActivitySelect }: GameDashboardProps) => {
  const { t } = useTranslation();
  const expPercent = (playerState.experience / playerState.experienceToNextLevel) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      {/* Header with Player Info */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40"
      >
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-3xl font-black text-white shadow-lg">
                {playerState.level}
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.level')} {playerState.level}</div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
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
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-[24px] p-4 shadow-lg border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{config.icon}</span>
                  <span className="text-2xl font-black text-gray-900 dark:text-white">{value}%</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">{config.label}</div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${config.color} transition-all duration-500`}
                    style={{ width: `${value}%` }}
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
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4 px-2">
            {t('activities.title', 'Активности')}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {activities.map((activity, index) => (
              <motion.button
                key={activity.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onActivitySelect(activity.id)}
                className="relative bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-purple-900/50 rounded-[24px] p-6 shadow-lg hover:shadow-2xl transition-all border border-gray-100 dark:border-purple-500/30"
              >
                <div className="text-6xl mb-3">{activity.icon}</div>
                <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                  {activity.name}
                </div>
                {activity.requiredLevel && (
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Уровень {activity.requiredLevel}+
                  </div>
                )}
                {activity.cooldown && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full">
                    ⏱️ {activity.cooldown}м
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-[20px] shadow-lg"
          >
            🏆 Рейтинг
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-[20px] shadow-lg"
          >
            🛍️ Магазин
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold rounded-[20px] shadow-lg"
          >
            👥 Друзья
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};
