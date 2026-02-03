import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: number;
  statPoints?: number;
}

export const LevelUpModal = ({ isOpen, onClose, level, statPoints = 5 }: LevelUpModalProps) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 50 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-full max-w-[450px] pointer-events-auto"
            >
              <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 rounded-[32px] p-1 shadow-2xl">
                <div className="bg-white dark:bg-gray-900 rounded-[28px] p-8 relative overflow-hidden">
                  {/* Animated background particles */}
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ 
                          x: Math.random() * 400 - 200,
                          y: Math.random() * 400 - 200,
                          scale: 0,
                          opacity: 0
                        }}
                        animate={{ 
                          x: Math.random() * 400 - 200,
                          y: Math.random() * 400 - 200,
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0]
                        }}
                        transition={{
                          duration: 2,
                          delay: i * 0.1,
                          repeat: Infinity,
                          repeatDelay: 1
                        }}
                        className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                        style={{
                          left: '50%',
                          top: '50%'
                        }}
                      />
                    ))}
                  </div>

                  {/* Content */}
                  <div className="relative z-10 text-center">
                    {/* Animated trophy */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        type: 'spring', 
                        stiffness: 200, 
                        damping: 15,
                        delay: 0.2
                      }}
                      className="text-9xl mb-4"
                    >
                      🎉
                    </motion.div>

                    {/* Title */}
                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-4xl font-black bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 bg-clip-text text-transparent mb-2"
                    >
                      {t('dashboard.levelUp', 'Поздравляем!')}
                    </motion.h2>

                    {/* Level badge */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        type: 'spring',
                        stiffness: 300,
                        delay: 0.6
                      }}
                      className="inline-block mb-6"
                    >
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl px-8 py-4 shadow-xl">
                        <div className="text-sm text-white/90 font-bold mb-1">
                          {t('dashboard.newLevel', 'Новый уровень')}
                        </div>
                        <div className="text-6xl font-black text-white">
                          {level}
                        </div>
                      </div>
                    </motion.div>

                    {/* Stat points reward */}
                    {statPoints > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl p-6 mb-6 border-2 border-red-200 dark:border-red-800"
                      >
                        <div className="flex items-center justify-center gap-3 mb-2">
                          <span className="text-4xl">⚔️</span>
                          <div className="text-left">
                            <div className="text-sm text-gray-600 dark:text-gray-400 font-bold">
                              {t('stats.availablePoints', 'Доступно очков')}
                            </div>
                            <div className="text-3xl font-black text-red-600 dark:text-red-400">
                              +{statPoints}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {t('levelUp.statPointsHint', 'Распределите очки в боевых статах!')}
                        </div>
                      </motion.div>
                    )}

                    {/* Motivational text */}
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      className="text-gray-600 dark:text-gray-400 mb-6 text-lg"
                    >
                      {t('levelUp.keepGoing', 'Продолжай в том же духе! Ты становишься сильнее!')}
                    </motion.p>

                    {/* Close button */}
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onClose}
                      className="w-full py-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white font-black text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group"
                    >
                      <motion.div
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      />
                      <span className="relative flex items-center justify-center gap-2">
                        <span>{t('common.continue', 'Продолжить')}</span>
                        <span>🚀</span>
                      </span>
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
