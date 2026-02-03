import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

type LeaderboardType = 'global' | 'city' | 'soms';

interface LeaderboardPlayer {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  level: number;
  soms: number;
  cityName: string;
  isCurrentPlayer?: boolean;
}

interface LeaderboardProps {
  players: LeaderboardPlayer[];
  type: LeaderboardType;
  onTypeChange: (type: LeaderboardType) => void;
}

const medals = ['🥇', '🥈', '🥉'];

export const Leaderboard = ({ players, type, onTypeChange }: LeaderboardProps) => {
  const { t } = useTranslation();

  const tabs = [
    { id: 'global' as const, label: t('leaderboard.global', 'Глобальный'), icon: '🌍' },
    { id: 'city' as const, label: t('leaderboard.city', 'Городской'), icon: '🏙️' },
    { id: 'soms' as const, label: t('leaderboard.soms', 'По сомам'), icon: '💰' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-black dark:from-black dark:via-black dark:to-black p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[32px] shadow-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-4xl">🏆</span>
            <h1 className="text-4xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
              {t('leaderboard.title', 'Рейтинг')}
            </h1>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-3 gap-3">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onTypeChange(tab.id)}
                className={`relative py-4 px-4 rounded-[20px] font-bold text-sm transition-all overflow-hidden ${
                  type === tab.id
                    ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-xl'
                    : 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl">{tab.icon}</span>
                  <span className="text-xs">{tab.label}</span>
                </div>
                {type === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[20px] -z-10"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Players List */}
        <div className="space-y-3">
          {players.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[24px] p-12 text-center border border-gray-200 dark:border-gray-700"
            >
              <div className="text-6xl mb-4">🏜️</div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {t('leaderboard.noPlayers', 'Пока нет игроков в рейтинге')}
              </p>
            </motion.div>
          ) : (
            players.map((player, index) => (
              <motion.div
                key={player.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, x: 4 }}
                className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[24px] p-5 shadow-lg border-2 transition-all ${
                  player.isCurrentPlayer
                    ? 'border-amber-500 dark:border-amber-400 shadow-amber-500/30 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black shadow-lg ${
                    player.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                    player.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                    player.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                    'bg-gradient-to-br from-indigo-500 to-purple-500 text-white'
                  }`}>
                    {player.rank <= 3 ? <span>{medals[player.rank - 1]}</span> : player.rank}
                  </div>

                  {/* Avatar */}
                  <div className="text-5xl">{player.avatar}</div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-lg text-gray-900 dark:text-white truncate">
                        {player.username}
                      </span>
                      {player.isCurrentPlayer && (
                        <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full whitespace-nowrap">
                          {t('leaderboard.you', 'Вы')}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <span>📍</span>
                      {player.cityName}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <div className="font-black text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                      {type === 'soms' ? `${player.soms.toLocaleString()}` : player.level}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {type === 'soms' ? t('currency.soms', 'сомов') : t('character.level', 'Уровень')}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
