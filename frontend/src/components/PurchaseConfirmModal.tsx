import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface PurchaseConfirmModalProps {
  isOpen: boolean;
  itemName: string;
  itemIcon: string;
  itemRarity: string;
  priceSoms?: number;
  priceCrystals?: number;
  playerSoms: number;
  playerCrystals: number;
  bonus?: {
    type: string;
    value: number;
    description: string;
  };
  onConfirm: (currency: 'soms' | 'crystals') => void;
  onCancel: () => void;
  loading?: boolean;
}

const rarityColors = {
  common: 'from-gray-400 to-gray-500',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-500'
};

export const PurchaseConfirmModal = ({
  isOpen,
  itemName,
  itemIcon,
  itemRarity,
  priceSoms,
  priceCrystals,
  playerSoms,
  playerCrystals,
  bonus,
  onConfirm,
  onCancel,
  loading
}: PurchaseConfirmModalProps) => {
  const { t } = useTranslation();

  const canAffordSoms = priceSoms ? playerSoms >= priceSoms : false;
  const canAffordCrystals = priceCrystals ? playerCrystals >= priceCrystals : false;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6 pointer-events-auto border-2 border-white/50 dark:border-gray-700/50"
            >
              {/* Item Preview */}
              <div className="text-center mb-6">
                <div className={`w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br ${rarityColors[itemRarity as keyof typeof rarityColors]} flex items-center justify-center text-7xl mb-4 shadow-xl`}>
                  {itemIcon}
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                  {itemName}
                </h2>
                <span className={`inline-block text-xs font-black px-3 py-1 rounded-lg bg-gradient-to-r ${rarityColors[itemRarity as keyof typeof rarityColors]} text-white shadow-lg uppercase tracking-wide`}>
                  {t(`cosmetic.rarity.${itemRarity}`)}
                </span>
              </div>

              {/* Bonus Info */}
              {bonus && (
                <div className="mb-6 p-4 bg-gradient-to-r from-green-400/20 to-emerald-500/20 rounded-2xl border-2 border-green-400/30">
                  <div className="text-center">
                    <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {t('cosmetic.bonus', 'Бонус')}
                    </div>
                    <div className="text-lg font-black text-green-600 dark:text-green-400">
                      {bonus.description}
                    </div>
                  </div>
                </div>
              )}

              {/* Current Balance */}
              <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700/50 rounded-2xl">
                <div className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 text-center">
                  {t('cosmetic.yourBalance', 'Ваш баланс')}
                </div>
                <div className="flex justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    <span className="font-black text-gray-900 dark:text-white">
                      {playerSoms.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💎</span>
                    <span className="font-black text-gray-900 dark:text-white">
                      {playerCrystals}
                    </span>
                  </div>
                </div>
              </div>

              {/* Purchase Options */}
              <div className="space-y-3 mb-6">
                {priceSoms && (
                  <motion.button
                    whileHover={canAffordSoms ? { scale: 1.02 } : {}}
                    whileTap={canAffordSoms ? { scale: 0.98 } : {}}
                    onClick={() => onConfirm('soms')}
                    disabled={!canAffordSoms || loading}
                    className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-between px-6 ${
                      canAffordSoms
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-3xl">💰</span>
                      <span>{t('cosmetic.buyWithSoms', 'Купить за сомы')}</span>
                    </span>
                    <span className="text-2xl">{priceSoms.toLocaleString()}</span>
                  </motion.button>
                )}
                
                {priceCrystals && (
                  <motion.button
                    whileHover={canAffordCrystals ? { scale: 1.02 } : {}}
                    whileTap={canAffordCrystals ? { scale: 0.98 } : {}}
                    onClick={() => onConfirm('crystals')}
                    disabled={!canAffordCrystals || loading}
                    className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-between px-6 ${
                      canAffordCrystals
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-3xl">💎</span>
                      <span>{t('cosmetic.buyWithCrystals', 'Купить за кристаллы')}</span>
                    </span>
                    <span className="text-2xl">{priceCrystals}</span>
                  </motion.button>
                )}
              </div>

              {/* Cancel Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                disabled={loading}
                className="w-full py-3 rounded-2xl font-bold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                {t('common.cancel', 'Отмена')}
              </motion.button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
