import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getCachedRates, convertCurrency } from '../utils/currencyConverter';
import { createPortal } from 'react-dom';

type Currency = 'USD' | 'RUB' | 'UZS' | 'UAH';

interface DonationOption {
  id: string;
  amountUSD: number;
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
  { id: 'small', amountUSD: 1, crystals: 50 },
  { id: 'medium', amountUSD: 5, crystals: 300, bonus: 50 },
  { id: 'large', amountUSD: 10, crystals: 700, bonus: 200, popular: true },
  { id: 'mega', amountUSD: 50, crystals: 4000, bonus: 1500 }
];

const currencySymbols: Record<Currency, string> = {
  USD: '$',
  RUB: '₽',
  UZS: 'сўм',
  UAH: '₴'
};

const currencyFlags: Record<Currency, string> = {
  USD: '🇺🇸',
  RUB: '🇷🇺',
  UZS: '🇺🇿',
  UAH: '🇺🇦'
};

export const DonationModal = ({ isOpen, onClose, onDonate }: DonationModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [rates, setRates] = useState({ USD: 1, RUB: 90, UZS: 12500, UAH: 41 });
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getCachedRates().then(setRates);
    }
  }, [isOpen]);

  const handleDonate = async (optionId: string) => {
    setLoading(true);
    try {
      await onDonate(optionId);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amountUSD: number) => {
    const converted = convertCurrency(amountUSD, currency, rates);
    return `${currencySymbols[currency]}${converted.toLocaleString()}`;
  };

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
              className="w-full max-w-[500px] max-h-[80vh] bg-white dark:bg-gray-800 backdrop-blur-xl rounded-[32px] shadow-2xl pointer-events-auto overflow-hidden"
            >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
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
              
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {t('donation.description', 'Получите кристаллы для покупки косметики')}
              </p>

              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full text-white font-bold shadow-lg"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-xl">{currencyFlags[currency]}</span>
                    <span>{currency}</span>
                  </span>
                  <span className="text-xl">{showCurrencyMenu ? '▲' : '▼'}</span>
                </motion.button>

                <AnimatePresence>
                  {showCurrencyMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-700 rounded-[20px] shadow-2xl overflow-hidden z-10"
                    >
                      {(['USD', 'RUB', 'UZS', 'UAH'] as Currency[]).map((curr) => (
                        <motion.button
                          key={curr}
                          whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
                          onClick={() => {
                            setCurrency(curr);
                            setShowCurrencyMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                            currency === curr
                              ? 'bg-indigo-100 dark:bg-indigo-900/30'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          <span className="text-2xl">{currencyFlags[curr]}</span>
                          <span className="font-bold text-gray-900 dark:text-white">{curr}</span>
                          {currency === curr && <span className="ml-auto text-indigo-500">✓</span>}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(100vh-300px)]">
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
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400'
                    }`}
                  >
                    {option.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full text-xs font-black text-white shadow-lg">
                        ⭐ {t('donation.popular', 'Популярное')}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <div className={`text-3xl font-black mb-1 ${option.popular ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                          {formatPrice(option.amountUSD)}
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

              <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-[20px] border border-indigo-200 dark:border-indigo-800">
                <p className="text-xs text-gray-600 dark:text-gray-300 text-center">
                  {t('donation.info', 'Кристаллы используются только для покупки косметических предметов')}
                </p>
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
