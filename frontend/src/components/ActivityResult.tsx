import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface ActivityResultProps {
  isOpen: boolean;
  onClose: () => void;
  result: {
    experienceGained: number;
    somsGained: number;
    levelUp: boolean;
    newLevel?: number;
    statChanges?: {
      hunger?: number;
      health?: number;
      mood?: number;
      energy?: number;
    };
  };
}

export const ActivityResult = ({ isOpen, onClose, result }: ActivityResultProps) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl z-50 p-6 max-w-sm mx-auto"
          >
            {result.levelUp && (
              <div className="text-center mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                  className="text-6xl mb-2"
                >
                  🎉
                </motion.div>
                <h2 className="text-2xl font-bold text-primary">
                  {t('notifications.level_up', { level: result.newLevel })}
                </h2>
              </div>
            )}

            <div className="space-y-3 mb-6">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between bg-background-secondary rounded-lg p-3"
              >
                <span className="text-text-secondary">Опыт</span>
                <span className="text-xl font-bold text-success">+{result.experienceGained} XP</span>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-between bg-background-secondary rounded-lg p-3"
              >
                <span className="text-text-secondary">Сомы</span>
                <span className="text-xl font-bold text-warning">
                  {result.somsGained > 0 ? '+' : ''}{result.somsGained} 💰
                </span>
              </motion.div>

              {result.statChanges && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-background-secondary rounded-lg p-3"
                >
                  <div className="text-sm text-text-secondary mb-2">Изменения характеристик:</div>
                  <div className="flex gap-3 justify-center">
                    {result.statChanges.hunger && (
                      <span className={result.statChanges.hunger > 0 ? 'text-success' : 'text-danger'}>
                        🍖 {result.statChanges.hunger > 0 ? '+' : ''}{result.statChanges.hunger}
                      </span>
                    )}
                    {result.statChanges.health && (
                      <span className={result.statChanges.health > 0 ? 'text-success' : 'text-danger'}>
                        ❤️ {result.statChanges.health > 0 ? '+' : ''}{result.statChanges.health}
                      </span>
                    )}
                    {result.statChanges.mood && (
                      <span className={result.statChanges.mood > 0 ? 'text-success' : 'text-danger'}>
                        😊 {result.statChanges.mood > 0 ? '+' : ''}{result.statChanges.mood}
                      </span>
                    )}
                    {result.statChanges.energy && (
                      <span className={result.statChanges.energy > 0 ? 'text-success' : 'text-danger'}>
                        ⚡ {result.statChanges.energy > 0 ? '+' : ''}{result.statChanges.energy}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full min-h-touch bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary-dark transition-colors"
            >
              {t('ui.close')}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
