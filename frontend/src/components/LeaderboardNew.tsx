         <p>{t('leaderboard.updateInfo', 'Рейтинги обновляются в реальном времени')}</p>
        </motion.div>
      </div>

      <CategoryModal />
    </div>
  );
};
iv>
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {currentCategory.valueLabel}
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
 400">
                          📍 {cityNames[entry.player?.cityId || ''] || entry.player?.cityId}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="font-black text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                      {currentCategory.valueFormatter(entry)}
                    </d className="text-sm text-gray-600 dark:text-gray-400">
                          👥 {entry.playerCount} игроков • Ср: {entry.avgLevel}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-black text-lg text-gray-900 dark:text-white truncate">
                          {entry.player?.displayName || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray--purple-500 text-white'
                  }`}>
                    {entry.rank <= 3 ? medals[entry.rank - 1] : entry.rank}
                  </div>

                  <div className="flex-1 min-w-0">
                    {selectedCategory === 'cityPower' ? (
                      <>
                        <div className="font-black text-lg text-gray-900 dark:text-white truncate">
                          {cityNames[entry.cityId || ''] || entry.cityId}
                        </div>
                        <divflex items-center gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl font-black shadow-lg ${
                    entry.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                    entry.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                    entry.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                    'bg-gradient-to-br from-indigo-500 to              animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, x: 4 }}
                className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[24px] p-4 shadow-lg border-2 transition-all ${
                  entry.isCurrentPlayer
                    ? 'border-amber-500 shadow-amber-500/30'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="           <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[24px] p-12 text-center">
              <div className="text-6xl mb-4">🏜️</div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {t('leaderboard.noPlayers', 'Пока нет данных')}
              </p>
            </div>
          ) : (
            leaderboard.map((entry, index) => (
              <motion.div
                key={entry.rank}
                initial={{ opacity: 0, x: -20 }}
          </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[24px] p-12 text-center">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-gray-600 dark:text-gray-400">
                {t('common.loading', 'Загрузка...')}
              </p>
            </div>
          ) : leaderboard.length === 0 ? (
      {t('leaderboard.yourRank', 'Ваше место')}
                    </div>
                    <div className="font-black text-gray-900 dark:text-white">
                      {t('leaderboard.you', 'Вы')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    🎯
                  </div>
        e dark:bg-gray-900 rounded-[22px] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-black text-lg">
                    #{playerRank}
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div className="text-xl font-black text-gray-900 dark:text-white">
                {t(currentCategory.labelKey, currentCategory.id)}
              </div>
            </div>
          </div>
        </motion.div>

        {playerRank && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-[24px] p-1 mb-4 shadow-xl"
          >
            <div className="bg-whit6px] font-bold text-sm shadow-lg"
            >
              📊 {t('leaderboard.change', 'Сменить')}
            </motion.button>
          </div>

          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 rounded-[20px] p-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {t('leaderboard.currentCategory', 'Текущая категория')}
              </div>
       i}</span>
              <h1 className="text-3xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                {t('leaderboard.title', 'Рейтинги')}
              </h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCategoryModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-[1ack dark:to-black p-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[32px] shadow-2xl p-6 mb-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-4xl">{currentCategory.emojresence>,
      document.body
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-black dark:from-black dark:via-blHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowCategoryModal(false)}
                      className="w-full mt-6 py-3 bg-gray-200 dark:bg-gray-800 rounded-[20px] font-bold text-gray-900 dark:text-white"
                    >
                      {t('ui.close', 'Закрыть')}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePbg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          <span className="text-3xl">{category.emoji}</span>
                          <span className="text-xs font-bold text-center">
                            {t(category.labelKey, category.id)}
                          </span>
                        </motion.button>
                      ))}
                    </div>

                    <motion.button
                      whilebr from-indigo-500 to-purple-500 text-white shadow-lg'
                              : 'bg-gray-100 dark:                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedCategory(category.id);
                            setShowCategoryModal(false);
                          }}
                          className={`p-4 rounded-[20px] flex flex-col items-center gap-2 transition-all ${
                            selectedCategory === category.id
                              ? 'bg-gradient-to-k:bg-gray-900 rounded-[28px] p-6">
                    <h2 className="text-2xl font-black text-center mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {t('leaderboard.selectCategory', 'Выберите категорию')}
                    </h2>

                    <div className="grid grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
                      {categories.map((category) => (
                        <motion.button
                          key={category.id}
-1 shadow-2xl">
                  <div className="bg-white dar    <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[500px] pointer-events-auto"
              >
                <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[32px] pixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />

            <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-4">
          () * 3)],
        characterId: 'merchant'
      },
      value: Math.floor(Math.random() * 1000) + 100
    }));
  };

  const CategoryModal = () => {
    if (!showCategoryModal) return null;
    
    return createPortal(
      <AnimatePresence>
        {showCategoryModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCategoryModal(false)}
              className="fboard(generateMockData(selectedCategory));
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (_category: LeaderboardCategory): LeaderboardEntry[] => {
    return Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      player: {
        id: `player-${i}`,
        displayName: `Игрок ${i + 1}`,
        level: Math.floor(Math.random() * 50) + 10,
        soms: Math.floor(Math.random() * 10000) + 1000,
        cityId: ['samarkand', 'tashkent', 'bukhara'][Math.floor(Math.randomrror('Error loading leaderboard:', error);
      setLeader        })));
          setPlayerRank(null);
        } else {
          setLeaderboard(data.data.leaderboard.map((entry: any) => ({
            rank: entry.rank,
            player: entry.player,
            value: selectedCategory === 'soms' ? entry.player.soms : 
                   selectedCategory === 'crystals' ? entry.player.donationCurrency || 0 :
                   entry.player.level
          })));
          setPlayerRank(data.data.playerRank || null);
        }
      }
    } catch (error) {
      console.e
            playerCount: city.playerCount,
            avgLevel: city.avgLevel,
            value: city.totalLevel
  * 50) + 1);
        return;
      }

      const response = await fetch(`${category.apiEndpoint}?limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (selectedCategory === 'cityPower') {
          setLeaderboard(data.data.leaderboard.map((city: any) => ({
            rank: city.rank,
            cityId: city.cityId,
            totalLevel: city.totalLevel,| null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const currentCategory = categories.find(c => c.id === selectedCategory)!;

  useEffect(() => {
    loadLeaderboard();
  }, [selectedCategory]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const category = categories.find(c => c.id === selectedCategory);
      if (!category?.apiEndpoint) {
        setLeaderboard(generateMockData(selectedCategory));
        setPlayerRank(Math.floor(Math.random() ate<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [playerRank, setPlayerRank] = useState<number rd.categories.wealth',
    valueFormatter: (e) => e.value.toLocaleString(),
    valueLabel: 'богат.'
  }
];

const medals = ['🥇', '🥈', '🥉'];

const cityNames: Record<string, string> = {
  'samarkand': 'Самарканд',
  'tashkent': 'Ташкент',
  'bukhara': 'Бухара',
  'khiva': 'Хива',
  'andijan': 'Андижан'
};

export const LeaderboardNew = () => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>('level');
  const [leaderboard, setLeaderboard] = useSte.toFixed(1),
    valueLabel: 'ср.ур.'
  },
  {
    id: 'wealth',
    emoji: '🤑',
    labelKey: 'leaderboacaleString(),
    valueLabel: 'акт.'
  },
  {
    id: 'referrals',
    emoji: '👥',
    labelKey: 'leaderboard.categories.referrals',
    valueFormatter: (e) => e.value.toString(),
    valueLabel: 'реф.'
  },
  {
    id: 'playtime',
    emoji: '⏱️',
    labelKey: 'leaderboard.categories.playtime',
    valueFormatter: (e) => `${Math.floor(e.value / 60)}ч`,
    valueLabel: 'время'
  },
  {
    id: 'cityLevel',
    emoji: '🌆',
    labelKey: 'leaderboard.categories.cityLevel',
    valueFormatter: (e) => e.valutegories.activities',
    valueFormatter: (e) => e.value.toLo    emoji: '😊',
    labelKey: 'leaderboard.categories.mood',
    valueFormatter: (e) => `${e.value}%`,
    valueLabel: 'наст.'
  },
  {
    id: 'energy',
    emoji: '⚡',
    labelKey: 'leaderboard.categories.energy',
    valueFormatter: (e) => `${e.value}%`,
    valueLabel: 'энер.'
  },
  {
    id: 'hunger',
    emoji: '🍖',
    labelKey: 'leaderboard.categories.hunger',
    valueFormatter: (e) => `${e.value}%`,
    valueLabel: 'сыт.'
  },
  {
    id: 'activities',
    emoji: '🎯',
    labelKey: 'leaderboard.cavalueFormatter: (e) => `${e.value}%`,
    valueLabel: 'здор.'
  },
  {
    id: 'mood',
Label: 'кр.'
  },
  {
    id: 'cityPower',
    emoji: '🏙️',
    labelKey: 'leaderboard.categories.cityPower',
    apiEndpoint: '/api/leaderboard/city-power',
    valueFormatter: (e) => e.totalLevel?.toLocaleString() || '0',
    valueLabel: 'сила'
  },
  {
    id: 'experience',
    emoji: '⭐',
    labelKey: 'leaderboard.categories.experience',
    valueFormatter: (e) => e.value.toLocaleString(),
    valueLabel: 'опыт'
  },
  {
    id: 'health',
    emoji: '❤️',
    labelKey: 'leaderboard.categories.health',
    valuerd/global',
    valueFormatter: (e) => e.player?.level.toString() || '0',
    valueLabel: 'Ур.'
  },
  {
    id: 'soms',
    emoji: '💰',
    labelKey: 'leaderboard.categories.soms',
    apiEndpoint: '/api/leaderboard/soms',
    valueFormatter: (e) => e.player?.soms.toLocaleString() || '0',
    valueLabel: 'сом'
  },
  {
    id: 'crystals',
    emoji: '💎',
    labelKey: 'leaderboard.categories.crystals',
    apiEndpoint: '/api/leaderboard/crystals',
    valueFormatter: (e) => e.value.toLocaleString(),
    oard.categories.level',
    apiEndpoint: '/api/leaderboa;
    level: number;
    soms: number;
    cityId: string;
    characterId: string;
  };
  cityId?: string;
  totalLevel?: number;
  playerCount?: number;
  avgLevel?: number;
  value: number;
  isCurrentPlayer?: boolean;
}

interface CategoryConfig {
  id: LeaderboardCategory;
  emoji: string;
  labelKey: string;
  apiEndpoint?: string;
  valueFormatter: (entry: LeaderboardEntry) => string;
  valueLabel: string;
}

const categories: CategoryConfig[] = [
  {
    id: 'level',
    emoji: '🏆',
    labelKey: 'leaderbmport { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

type LeaderboardCategory = 
  | 'level' | 'soms' | 'crystals' | 'cityPower' 
  | 'experience' | 'health' | 'mood' | 'energy'
  | 'hunger' | 'activities' | 'referrals' | 'playtime'
  | 'cityLevel' | 'wealth';

interface LeaderboardEntry {
  rank: number;
  player?: {
    id: string;
    displayName: stringimport { motion, AnimatePresence } from 'framer-motion';
