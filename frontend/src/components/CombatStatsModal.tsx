import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

interface CombatStats {
  strength: number;
  defense: number;
  agility: number;
  stamina: number;
  intelligence: number;
  luck: number;
  statPoints: number;
  combatPower: number;
}

interface CombatStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatsUpdated?: () => void;
}

const statIcons = {
  strength: '💪',
  defense: '🛡️',
  agility: '⚡',
  stamina: '❤️',
  intelligence: '🧠',
  luck: '🍀'
};

const statColors = {
  strength: 'from-red-500 to-orange-500',
  defense: 'from-blue-500 to-cyan-500',
  agility: 'from-yellow-500 to-amber-500',
  stamina: 'from-green-500 to-emerald-500',
  intelligence: 'from-purple-500 to-pink-500',
  luck: 'from-teal-500 to-green-500'
};

export const CombatStatsModal = ({ isOpen, onClose, onStatsUpdated }: CombatStatsModalProps) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<CombatStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [allocating, setAllocating] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/combat-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load combat stats:', error);
    }
  };

  const allocatePoint = async (stat: string) => {
    if (!stats || stats.statPoints <= 0) return;

    setAllocating(stat);
    try {
      const response = await fetch('/api/combat-stats/allocate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ stat, points: 1 })
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
        toast.success(t('stats.allocated', `+1 ${t(`stats.${stat}`)}`));
        onStatsUpdated?.();
      } else {
        const error = await response.json();
        toast.error(error.error || t('stats.allocationFailed'));
      }
    } catch (error) {
      toast.error(t('stats.allocationFailed'));
    } finally {
      setAllocating(null);
    }
  };

  const resetStats = async () => {
    if (!confirm(t('stats.confirmReset', 'Сбросить все статы за 100 кристаллов?'))) return;

    setLoading(true);
    try {
      const response = await fetch('/api/combat-stats/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
        toast.success(t('stats.resetSuccess', 'Статы сброшены!'));
        onStatsUpdated?.();
      } else {
        const error = await response.json();
        toast.error(error.error || t('stats.resetFailed'));
      }
    } catch (error) {
      toast.error(t('stats.resetFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          
          <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-full max-w-[500px] pointer-events-auto max-h-[90vh] overflow-y-auto"
            >
              <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[32px] p-1 shadow-2xl">
                <div className="bg-white dark:bg-gray-900 rounded-[28px] p-6">
                  {/* Header */}
                  <div className="text-center mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, delay: 0.1 }}
                      className="text-6xl mb-3"
                    >
                      ⚔️
                    </motion.div>
                    <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
                      {t('stats.title', 'Боевые Статы')}
                    </h2>
                    
                    {stats && (
                      <div className="flex items-center justify-center gap-4 mt-4">
                        <div className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl text-white font-black shadow-lg">
                          <div className="text-xs opacity-90">{t('stats.availablePoints', 'Доступно')}</div>
                          <div className="text-2xl">{stats.statPoints}</div>
                        </div>
                        <div className="px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl text-white font-black shadow-lg">
                          <div className="text-xs opacity-90">{t('stats.combatPower', 'Мощь')}</div>
                          <div className="text-2xl">{stats.combatPower}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stats List */}
                  {stats && (
                    <div className="space-y-3 mb-6">
                      {(['strength', 'defense', 'agility', 'stamina', 'intelligence'] as const).map((stat) => (
                        <motion.div
                          key={stat}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-4 border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{statIcons[stat]}</span>
                              <div>
                                <div className="font-black text-gray-900 dark:text-white">
                                  {t(`stats.${stat}`, stat)}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {t(`stats.${stat}Desc`, '')}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-2xl font-black text-gray-900 dark:text-white">
                                {stats[stat]}
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => allocatePoint(stat)}
                                disabled={stats.statPoints <= 0 || stats[stat] >= 100 || allocating === stat}
                                className={`w-10 h-10 rounded-full font-black text-xl shadow-lg transition-all ${
                                  stats.statPoints > 0 && stats[stat] < 100
                                    ? `bg-gradient-to-r ${statColors[stat]} text-white hover:shadow-xl`
                                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                                }`}
                              >
                                {allocating === stat ? '...' : '+'}
                              </motion.button>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${stats[stat]}%` }}
                              transition={{ duration: 0.5, delay: 0.1 }}
                              className={`h-full bg-gradient-to-r ${statColors[stat]}`}
                            />
                          </div>
                        </motion.div>
                      ))}

                      {/* Luck - Special */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-gradient-to-r from-teal-50 to-green-50 dark:from-teal-900/20 dark:to-green-900/20 rounded-2xl p-4 border-2 border-teal-400 dark:border-teal-600"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{statIcons.luck}</span>
                            <div>
                              <div className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                                {t('stats.luck', 'Удача')}
                                <span className="text-xs px-2 py-0.5 bg-teal-500 text-white rounded-full">
                                  {t('stats.secret', 'Секрет')}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {t('stats.luckDesc', 'Влияет на все +10% к мощи')}
                              </div>
                            </div>
                          </div>
                          <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
                            {stats.luck.toFixed(2)}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onClose}
                      className="flex-1 py-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 text-gray-900 dark:text-white font-bold rounded-full shadow-lg"
                    >
                      {t('common.close', 'Закрыть')}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={resetStats}
                      disabled={loading}
                      className="flex-1 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold rounded-full shadow-lg flex items-center justify-center gap-2"
                    >
                      <span>💎</span>
                      <span>{t('stats.reset', 'Сброс (100)')}</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
