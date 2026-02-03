import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Emoji from './Emoji';

type LeaderboardCategory = 
  | 'level' | 'soms' | 'crystals' 
  | 'cityPower' | 'totalExp' | 'referrals' 
  | 'activityStreak';

interface LeaderboardPlayer {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  level: number;
  soms: number;
  cityName: string;
  isCurrentPlayer?: boolean;
  value?: number;
}

interface CategoryConfig {
  id: LeaderboardCategory;
  emoji: string;
  labelKey: string;
  apiEndpoint: string;
}

const categories: CategoryConfig[] = [
  { id: 'level', emoji: '🏆', labelKey: 'leaderboard.categories.level', apiEndpoint: '/api/leaderboard/global' },
  { id: 'soms', emoji: '💰', labelKey: 'leaderboard.categories.soms', apiEndpoint: '/api/leaderboard/soms' },
  { id: 'crystals', emoji: '💎', labelKey: 'leaderboard.categories.crystals', apiEndpoint: '/api/leaderboard/crystals' },
  { id: 'cityPower', emoji: '🏙️', labelKey: 'leaderboard.categories.cityPower', apiEndpoint: '/api/leaderboard/city-power' },
  { id: 'totalExp', emoji: '⭐', labelKey: 'leaderboard.categories.totalExp', apiEndpoint: '/api/leaderboard/total-exp' },
  { id: 'referrals', emoji: '👥', labelKey: 'leaderboard.categories.referrals', apiEndpoint: '/api/leaderboard/referrals' },
  { id: 'activityStreak', emoji: '🔥', labelKey: 'leaderboard.categories.activityStreak', apiEndpoint: '/api/leaderboard/activity-streak' }
];

const medals = ['🥇', '🥈', '🥉'];

export const Leaderboard = () => {
  const { t } = useTranslation();
  const { player: currentPlayer } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>('level');
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [playerRank, setPlayerRank] = useState<number | null>(null);

  const currentCategory = categories.find(c => c.id === selectedCategory)!;

  useEffect(() => {
    loadLeaderboard();
  }, [selectedCategory]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const category = categories.find(c => c.id === selectedCategory);
      if (!category) return;

      const response = await fetch(`${category.apiEndpoint}?limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (selectedCategory === 'cityPower') {
          // Special handling for city power
          setPlayers(data.data.leaderboard.map((city: any) => ({
            rank: city.rank,
            userId: city.cityId,
            username: getCityName(city.cityId),
            avatar: '🏛️',
            level: city.totalLevel,
            soms: city.playerCount,
            cityName: `${city.playerCount} игроков`,
            value: city.avgLevel
          })));
          setPlayerRank(null);
        } else {
          // Map leaderboard entries
          const mappedPlayers = data.data.leaderboard.map((entry: any) => {
            const isCurrentPlayer = currentPlayer?.id === entry.player.id;
            
            return {
              rank: entry.rank,
              userId: entry.player.id,
              username: entry.player.displayName,
              avatar: entry.player.avatar || '👤',
              level: entry.player.level,
              soms: entry.player.soms,
              cityName: getCityName(entry.player.cityId),
              isCurrentPlayer
            };
          });
          
          setPlayers(mappedPlayers);
          setPlayerRank(data.data.playerRank || data.data.currentPlayerRank || null);
        }
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const getCityName = (cityId: string): string => {
    const cityNames: Record<string, string> = {
      'samarkand': 'Самарканд',
      'tashkent': 'Ташкент',
      'bukhara': 'Бухара',
      'khiva': 'Хива',
      'andijan': 'Андижан'
    };
    return cityNames[cityId] || cityId;
  };

  const getValueDisplay = (player: LeaderboardPlayer): string => {
    if (selectedCategory === 'soms') return player.soms.toLocaleString();
    if (selectedCategory === 'cityPower') return player.level.toLocaleString();
    if (selectedCategory === 'crystals') return player.value?.toLocaleString() || '0';
    return player.level.toString();
  };

  const getValueLabel = (): string => {
    if (selectedCategory === 'soms') return t('currency.soms', 'сомов');
    if (selectedCategory === 'cityPower') return 'сила';
    if (selectedCategory === 'crystals') return t('currency.crystals', 'кристаллов');
    if (selectedCategory === 'referrals') return 'рефералов';
    if (selectedCategory === 'activityStreak') return 'дней';
    return t('character.level', 'Уровень');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-black dark:from-black dark:via-black dark:to-black p-4 pb-32">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[24px] shadow-2xl p-4 mb-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Emoji emoji={currentCategory.emoji} size={36} />
            <h1 className="text-2xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
              {t('leaderboard.title', 'Рейтинги')}
            </h1>
          </div>

          {/* Category Grid - 7 categories in 2 rows */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            {categories.slice(0, 4).map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`relative py-3 px-2 rounded-[16px] font-bold text-xs transition-all overflow-hidden ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-xl'
                    : 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-xl">{category.emoji}</span>
                  <span className="text-[9px] leading-tight text-center">
                    {t(category.labelKey, category.id)}
                  </span>
                </div>
                {selectedCategory === category.id && (
                  <motion.div
                    layoutId="activeCategory"
                    className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[16px] -z-10"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {categories.slice(4).map((category) => (
              <motion.button
                key={category.id}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category.id)}
                className={`relative py-3 px-2 rounded-[16px] font-bold text-xs transition-all overflow-hidden ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-xl'
                    : 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-xl">{category.emoji}</span>
                  <span className="text-[9px] leading-tight text-center">
                    {t(category.labelKey, category.id)}
                  </span>
                </div>
                {selectedCategory === category.id && (
                  <motion.div
                    layoutId="activeCategory"
                    className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[16px] -z-10"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Players List */}
        <div className="space-y-2">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[24px] p-12 text-center border border-gray-200 dark:border-gray-700"
            >
              <div className="mb-4"><Emoji emoji="⏳" size={72} /></div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {t('common.loading', 'Загрузка...')}
              </p>
            </motion.div>
          ) : players.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[24px] p-12 text-center border border-gray-200 dark:border-gray-700"
            >
              <div className="mb-4"><Emoji emoji="🏜️" size={72} /></div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {t('leaderboard.noPlayers', 'Пока нет данных')}
              </p>
            </motion.div>
          ) : (
            players.map((player, index) => (
              <motion.div
                key={player.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01, x: 2 }}
                className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[16px] p-3 shadow-lg border-2 transition-all ${
                  player.isCurrentPlayer
                    ? 'border-amber-500 dark:border-amber-400 shadow-amber-500/30 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* Rank */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-black shadow-lg ${
                    player.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                    player.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                    player.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                    'bg-gradient-to-br from-indigo-500 to-purple-500 text-white'
                  }`}>
                    {player.rank <= 3 ? <Emoji emoji={medals[player.rank - 1]} size={20} /> : <span className="text-sm">{player.rank}</span>}
                  </div>

                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {player.avatar && player.avatar.startsWith('http') ? (
                      <img 
                        src={player.avatar} 
                        alt={player.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <Emoji emoji={player.avatar || '👤'} size={40} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="font-black text-sm text-gray-900 dark:text-white truncate">
                        {player.username}
                      </span>
                      {player.isCurrentPlayer && (
                        <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold rounded-full whitespace-nowrap">
                          {t('leaderboard.you', 'Вы')}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Emoji emoji="📍" size={12} />
                      <span className="truncate">{player.cityName}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-lg bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                      {getValueDisplay(player)}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                      {getValueLabel()}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          <p>{t('leaderboard.updateInfo', 'Рейтинги обновляются в реальном времени')}</p>
        </motion.div>
      </div>
    </div>
  );
};
