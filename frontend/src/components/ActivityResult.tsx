import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';

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

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-xl rounded-[32px] shadow-2xl z-50 p-6 max-w-sm mx-auto border border-gray-100"
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
                <h2 className="text-3xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                  {t('notifications.level_up', { level: result.newLevel })}
                </h2>
              </div>
            )}

            <div className="space-y-3 mb-6">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 rounded-[20px] p-3 border border-green-200"
              >
                <span className="text-gray-700 font-medium">{t('activity.experience')}</span>
                <span className="text-xl font-black text-green-600">+{result.experienceGained} XP</span>
              </motion.div>

              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-between bg-gradient-to-r from-yellow-50 to-orange-50 rounded-[20px] p-3 border border-yellow-200"
              >
                <span className="text-gray-700 font-medium">{t('activity.soms')}</span>
                <span className="text-xl font-black text-yellow-600">
                  {result.somsGained > 0 ? '+' : ''}{result.somsGained} <span>💰</span>
                </span>
              </motion.div>

              {result.statChanges && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-[20px] p-3 border border-purple-200"
                >
                  <div className="text-sm text-gray-700 mb-2 font-medium">{t('activity.statChanges')}</div>
                  <div className="flex gap-3 justify-center flex-wrap">
                    {result.statChanges.hunger && (
                      <span className={`px-3 py-1 rounded-full font-black ${result.statChanges.hunger > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        🍖 {result.statChanges.hunger > 0 ? '+' : ''}{result.statChanges.hunger}
                      </span>
                    )}
                    {result.statChanges.health && (
                      <span className={`px-3 py-1 rounded-full font-black ${result.statChanges.health > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        ❤️ {result.statChanges.health > 0 ? '+' : ''}{result.statChanges.health}
                      </span>
                    )}
                    {result.statChanges.mood && (
                      <span className={`px-3 py-1 rounded-full font-black ${result.statChanges.mood > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        😊 {result.statChanges.mood > 0 ? '+' : ''}{result.statChanges.mood}
                      </span>
                    )}
                    {result.statChanges.energy && (
                      <span className={`px-3 py-1 rounded-full font-black ${result.statChanges.energy > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        ⚡ {result.statChanges.energy > 0 ? '+' : ''}{result.statChanges.energy}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full min-h-touch bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black py-3 rounded-[20px] hover:shadow-lg transition-all"
            >
              {t('ui.close')}
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
