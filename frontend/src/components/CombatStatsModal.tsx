import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
  const [tempStats, setTempStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/combat-stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
        setTempStats({});
        setHasChanges(false);
      } else {
        console.error('Failed to load stats:', response.status);
      }
    } catch (error) {
      console.error('Failed to load combat stats:', error);
    }
  };

  const getTempValue = (stat: string): number => {
    if (!stats) return 0;
    return (stats[stat as keyof CombatStats] as number) + (tempStats[stat] || 0);
  };

  const getAvailablePoints = (): number => {
    if (!stats) return 0;
    const usedPoints = Object.values(tempStats).reduce((sum, val) => sum + val, 0);
    return stats.statPoints - usedPoints;
  };

  const canIncrease = (stat: string): boolean => {
    const available = getAvailablePoints();
    const currentValue = getTempValue(stat);
    return available > 0 && currentValue < 100;
  };

  const canDecrease = (stat: string): boolean => {
    return (tempStats[stat] || 0) > 0;
  };

  const increaseStat = (stat: string) => {
    if (!canIncrease(stat)) return;
    setTempStats(prev => ({
      ...prev,
      [stat]: (prev[stat] || 0) + 1
    }));
    setHasChanges(true);
  };

  const decreaseStat = (stat: string) => {
    if (!canDecrease(stat)) return;
    setTempStats(prev => ({
      ...prev,
      [stat]: (prev[stat] || 0) - 1
    }));
    setHasChanges(true);
  };

  const confirmAllocation = async () => {
    if (!hasChanges || !stats) return;

    setLoading(true);
    try {
      // Отправляем все изменения одним запросом
      const allocations = Object.entries(tempStats).filter(([_, points]) => points > 0);
      
      for (const [stat, points] of allocations) {
        const response = await fetch(`${API_URL}/api/combat-stats/allocate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ stat, points })
        });

        if (!response.ok) {
          const error = await response.json();
          toast.error(error.error || t('stats.allocationFailed'));
          await loadStats();
          return;
        }
      }

      toast.success(t('stats.allocated', 'Статы распределены!'));
      await loadStats();
      onStatsUpdated?.();
    } catch (error) {
      toast.error(t('stats.allocationFailed'));
      await loadStats();
    } finally {
      setLoading(false);
    }
  };

  const calculateTempPower = (): number => {
    if (!stats) return 0;
    const str = getTempValue('strength');
    const def = getTempValue('defense');
    const agi = getTempValue('agility');
    const sta = getTempValue('stamina');
    const int = getTempValue('intelligence');
    const luck = getTempValue('luck');
    
    const basePower = str * 2 + def * 1.5 + agi * 1.8 + sta * 1.2 + int * 1.5;
    return Math.round(basePower * (1 + luck * 0.1));
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
                          <div className="text-2xl">{getAvailablePoints()}</div>
                        </div>
                        <div className="px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl text-white font-black shadow-lg">
                          <div className="text-xs opacity-90">{t('stats.combatPower', 'Мощь')}</div>
                          <div className="text-2xl">{calculateTempPower()}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stats List */}
                  {stats && (
                    <div className="space-y-3 mb-6">
                      {(['strength', 'defense', 'agility', 'stamina', 'intelligence'] as const).map((stat) => {
                        const currentValue = getTempValue(stat);
                        const hasTemp = (tempStats[stat] || 0) !== 0;
                        
                        return (
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
                                <div className={`text-2xl font-black ${hasTemp ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                  {currentValue}
                                  {hasTemp && (
                                    <span className="text-sm ml-1">
                                      (+{tempStats[stat]})
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => decreaseStat(stat)}
                                    disabled={!canDecrease(stat)}
                                    className={`w-8 h-8 rounded-full font-black text-lg shadow-lg transition-all ${
                                      canDecrease(stat)
                                        ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:shadow-xl'
                                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                                    }`}
                                  >
                                    −
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => increaseStat(stat)}
                                    disabled={!canIncrease(stat)}
                                    className={`w-8 h-8 rounded-full font-black text-lg shadow-lg transition-all ${
                                      canIncrease(stat)
                                        ? `bg-gradient-to-r ${statColors[stat]} text-white hover:shadow-xl`
                                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                                    }`}
                                  >
                                    +
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${currentValue}%` }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className={`h-full bg-gradient-to-r ${statColors[stat]}`}
                              />
                            </div>
                          </motion.div>
                        );
                      })}

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
                    
                    {hasChanges && (
                      <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={confirmAllocation}
                        disabled={loading}
                        className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-full shadow-lg flex items-center justify-center gap-2"
                      >
                        <span>✓</span>
                        <span>{t('stats.confirm', 'Подтвердить')}</span>
                      </motion.button>
                    )}
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
