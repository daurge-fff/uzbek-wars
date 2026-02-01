import { motion } from 'framer-motion';
import { useState } from 'react';
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
  currentPlayerId: string;
  type: LeaderboardType;
  onTypeChange: (type: LeaderboardType) => void;
}

const medals = ['🥇', '🥈', '🥉'];

export const Leaderboard = ({ players, currentPlayerId, type, onTypeChange }: LeaderboardProps) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[32px] shadow-2xl p-6 mb-6">
          <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mb-4">
            {t('leaderboard.title', 'Рейтинг')}
          </h1>

          <div className="flex gap-2">
            {(['global', 'city', 'soms'] as const).map((t) => (
              <motion.button
                key={t}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onTypeChange(t)}
                className={`flex-1 py-2 rounded-full font-bold text-sm transition-all ${
                  type === t
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {t === 'global' && '🌍'}
                {t === 'city' && '🏙️'}
                {t === 'soms' && '💰'}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {players.map((player, index) => (
            <motion.div
              key={player.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[24px] p-4 shadow-lg border-2 transition-all ${
                player.isCurrentPlayer
                  ? 'border-indigo-500 dark:border-indigo-400 shadow-indigo-500/50'
                  : 'border-transparent'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-2xl font-black text-white shadow-lg">
                  {player.rank <= 3 ? medals[player.rank - 1] : player.rank}
                </div>

                <div className="text-4xl">{player.avatar}</div>

                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 dark:text-white truncate">
                    {player.username}
                    {player.isCurrentPlayer && (
                      <span className="ml-2 text-xs px-2 py-0.5 bg-indigo-500 text-white rounded-full">
                        {t('leaderboard.you', 'Вы')}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {player.cityName}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-black text-lg text-indigo-600 dark:text-indigo-400">
                    {type === 'soms' ? `${player.soms}с.` : `Ур.${player.level}`}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
