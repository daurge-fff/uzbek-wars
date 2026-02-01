import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface PlayerStats {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  soms: number;
  crystals: number;
  totalActivities: number;
  daysPlayed: number;
  achievements: number;
}

interface PlayerInfo {
  username: string;
  avatar: string;
  characterName: string;
  cityName: string;
  joinedDate: string;
  referralCode: string;
}

interface PlayerProfileProps {
  playerInfo: PlayerInfo;
  stats: PlayerStats;
  onEditProfile: () => void;
  onLogout: () => void;
}

export const PlayerProfile = ({ playerInfo, stats, onEditProfile, onLogout }: PlayerProfileProps) => {
  const { t } = useTranslation();

  const statCards = [
    { label: t('profile.totalActivities', 'Всего активностей'), value: stats.totalActivities, icon: '🎯' },
    { label: t('profile.daysPlayed', 'Дней в игре'), value: stats.daysPlayed, icon: '📅' },
    { label: t('profile.achievements', 'Достижений'), value: stats.achievements, icon: '🏆' },
    { label: t('profile.level', 'Уровень'), value: stats.level, icon: '⭐' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 backdrop-blur-xl rounded-[32px] shadow-2xl p-6"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="text-7xl">{playerInfo.avatar}</div>
            <div className="flex-1">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">
                {playerInfo.username}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                {playerInfo.characterName} • {playerInfo.cityName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {t('profile.joined', 'В игре с')} {new Date(playerInfo.joinedDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Currency Display */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-[20px] p-4">
              <div className="text-2xl mb-1">💰</div>
              <div className="text-2xl font-black text-orange-600 dark:text-orange-400">
                {stats.soms.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {t('currency.soms', 'сомов')}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-[20px] p-4">
              <div className="text-2xl mb-1">💎</div>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                {stats.crystals}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {t('currency.crystals', 'кристаллов')}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onEditProfile}
              className="py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-full shadow-lg"
            >
              ✏️ {t('profile.edit', 'Редактировать')}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onLogout}
              className="py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-full"
            >
              🚪 {t('profile.logout', 'Выйти')}
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 backdrop-blur-xl rounded-[32px] shadow-2xl p-6"
        >
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">
            {t('profile.statistics', 'Статистика')}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-[20px] p-4 text-center"
              >
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Referral Code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[32px] shadow-2xl p-6 text-white"
        >
          <h3 className="text-lg font-bold mb-2">
            {t('profile.referralCode', 'Твой реферальный код')}
          </h3>
          <div className="text-3xl font-black tracking-wider text-center py-4">
            {playerInfo.referralCode}
          </div>
          <p className="text-sm text-white/80 text-center">
            {t('profile.referralHint', 'Пригласи друзей и получи бонусы!')}
          </p>
        </motion.div>
      </div>
    </div>
  );
};
