import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import Emoji from './Emoji';


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

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-full max-w-[450px] pointer-events-auto"
            >
              <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[32px] p-1 shadow-2xl">
                <div className="bg-white dark:bg-gray-900 rounded-[28px] p-6">
                  {/* Item Preview */}
                  <div className="text-center mb-6">
                    <div className={`w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br ${rarityColors[itemRarity as keyof typeof rarityColors]} flex items-center justify-center mb-4 shadow-xl`}>
                      <Emoji emoji={itemIcon} size={84} />
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

                  {/* Purchase Options */}
                  <div className="space-y-3 mb-6">
                    {priceSoms && (
                      <motion.button
                        whileHover={canAffordSoms ? { scale: 1.02 } : {}}
                        whileTap={canAffordSoms ? { scale: 0.98 } : {}}
                        onClick={() => onConfirm('soms')}
                        disabled={!canAffordSoms || loading}
                        className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-between px-6 ${canAffordSoms
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg hover:shadow-xl'
                            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                          }`}
                      >
                        <span className="flex items-center gap-2">
                          <Emoji emoji="💰" size={32} />
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
                        className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-between px-6 ${canAffordCrystals
                            ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg hover:shadow-xl'
                            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                          }`}
                      >
                        <span className="flex items-center gap-2">
                          <Emoji emoji="💎" size={32} />
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
                    className="w-full py-3 rounded-full font-bold text-gray-700 dark:text-gray-300 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 shadow-lg transition-all"
                  >
                    {t('common.cancel', 'Отмена')}
                  </motion.button>
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
