import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface DonationOption {
  id: string;
  amount: number;
  crystals: number;
  bonus?: number;
  popular?: boolean;
}

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDonate: (optionId: string) => Promise<void>;
}

const donationOptions: DonationOption[] = [
  { id: 'small', amount: 100, crystals: 50 },
  { id: 'medium', amount: 500, crystals: 300, bonus: 50 },
  { id: 'large', amount: 1000, crystals: 700, bonus: 200, popular: true },
  { id: 'mega', amount: 5000, crystals: 4000, bonus: 1500 }
];

export const DonationModal = ({ isOpen, onClose, onDonate }: DonationModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleDonate = async (optionId: string) => {
    setLoading(true);
    try {
      await onDonate(optionId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[500px] md:max-h-[80vh] bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-[32px] shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                  {t('donation.title', 'Поддержать игру')}
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
                >
                  <span className="text-xl">✕</span>
                </motion.button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {t('donation.description', 'Получите кристаллы для покупки косметики')}
              </p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
              <div className="grid gap-4">
                {donationOptions.map((option, index) => (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDonate(option.id)}
                    disabled={loading}
                    className={`relative p-6 rounded-[24px] border-2 transition-all ${
                      option.popular
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-500 border-transparent text-white shadow-xl'
                        : 'bg-white/80 dark:bg-gray-700/80 border-gray-200 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400'
                    }`}
                  >
                    {option.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full text-xs font-black text-white shadow-lg">
                        ⭐ {t('donation.popular', 'Популярное')}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <div className="text-3xl font-black mb-1">
                          {option.amount} ₽
                        </div>
                        <div className={`text-lg font-bold ${option.popular ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>
                          💎 {option.crystals} {t('donation.crystals', 'кристаллов')}
                        </div>
                        {option.bonus && (
                          <div className={`text-sm font-bold mt-1 ${option.popular ? 'text-yellow-200' : 'text-green-600 dark:text-green-400'}`}>
                            +{option.bonus} {t('donation.bonus', 'бонус')}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-5xl">
                        {option.id === 'small' && '💰'}
                        {option.id === 'medium' && '💎'}
                        {option.id === 'large' && '👑'}
                        {option.id === 'mega' && '🏆'}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-[20px] border border-indigo-200 dark:border-indigo-800">
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                  {t('donation.info', 'Кристаллы используются только для покупки косметических предметов')}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
