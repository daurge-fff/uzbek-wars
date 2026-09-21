import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getCachedRates, convertCurrency } from '../utils/currencyConverter';
import { createPortal } from 'react-dom';
import Emoji from './Emoji';


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

export const DonationModal = ({ isOpen, onClose }: DonationModalProps) => {
  const { t } = useTranslation();
  const [currency, setCurrency] = useState<Currency>('USD');
  const [rates, setRates] = useState({ USD: 1, RUB: 90, UZS: 12500, UAH: 41 });
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'payment'>('select');
  const [paymentMethod, setPaymentMethod] = useState<'robokassa' | 'paypal' | 'manual' | null>(null);
  const [orderId, setOrderId] = useState<string>('');
  const [userId] = useState<string>('USER_' + Math.random().toString(36).substring(2, 11).toUpperCase());
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<'robokassa' | 'paypal' | 'manual' | null>(null);

  useEffect(() => {
    if (isOpen) {
      getCachedRates().then(setRates);
      setStep('select');
      setSelectedOption(null);
      setPaymentMethod(null);
      setOrderId('ORD-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase());
    }
  }, [isOpen]);

  const handleContinueToPayment = () => {
    if (selectedOption) {
      setStep('payment');
    }
  };

  const handlePaymentMethodSelect = async (method: 'robokassa' | 'paypal' | 'manual') => {
    if (method === 'robokassa') {
      alert(t('donation.robokassaInDev', 'Robokassa в разработке. Скоро будет доступна!'));
      return;
    }

    if (method === 'manual') {
      setPaymentMethod(method);
      return;
    }

    // Для PayPal показываем подтверждение
    if (method === 'paypal') {
      setPendingPaymentMethod(method);
      setShowConfirmation(true);
    }
  };

  const handleConfirmPayment = async () => {
    if (!pendingPaymentMethod) return;

    const selectedPkg = donationOptions.find(opt => opt.id === selectedOption);
    if (!selectedPkg) return;

    setShowConfirmation(false);
    setPaymentMethod(pendingPaymentMethod);

    try {
      // Отправляем уведомление админу через API
      const response = await fetch('/api/donations/notify-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          orderId,
          userId,
          amount: formatPrice(selectedPkg.amountUSD),
          crystals: selectedPkg.crystals,
          paymentMethod: 'PayPal'
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(t('donation.paypalPending', 'Заявка отправлена! Ожидайте подтверждения от администратора.'));
      } else {
        alert(t('donation.errorSending', 'Ошибка отправки заявки. Попробуйте позже.'));
        setPaymentMethod(null);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert(t('donation.errorSending', 'Ошибка отправки заявки. Попробуйте позже.'));
      setPaymentMethod(null);
    }

    setPendingPaymentMethod(null);
  };

  const handleCancelPayment = () => {
    setShowConfirmation(false);
    setPendingPaymentMethod(null);
  };

  const getSelectedPackage = () => {
    return donationOptions.find(opt => opt.id === selectedOption);
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
              className="w-full max-w-[500px] max-h-[90vh] bg-white dark:bg-gray-800 backdrop-blur-xl rounded-[32px] shadow-sm pointer-events-auto overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {step === 'payment' && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setStep('select')}
                        className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
                      >
                        <span className="text-xl">←</span>
                      </motion.button>
                    )}
                    <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                      {step === 'select' ? t('donation.title', 'Поддержать игру') : t('donation.paymentMethod', 'Способ оплаты')}
                    </h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center"
                  >
                    <span className="text-xl">✕</span>
                  </motion.button>
                </div>

                {step === 'select' && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {t('donation.description', 'Получите кристаллы для покупки косметики')}
                  </p>
                )}

                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full text-white font-bold shadow-lg"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-xl"><Emoji emoji={currencyFlags[currency]} size={20} /></span>
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
                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-700 rounded-[20px] shadow-sm overflow-hidden z-10"
                      >
                        {(['USD', 'RUB', 'UZS', 'UAH'] as Currency[]).map((curr) => (
                          <motion.button
                            key={curr}
                            whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
                            onClick={() => {
                              setCurrency(curr);
                              setShowCurrencyMenu(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${currency === curr
                              ? 'bg-indigo-100 dark:bg-indigo-900/30'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-600'
                              }`}
                          >
                            <span className="text-2xl"><Emoji emoji={currencyFlags[curr]} size={24} /></span>
                            <span className="font-bold text-gray-900 dark:text-white">{curr}</span>
                            {currency === curr && <span className="ml-auto text-indigo-500">✓</span>}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {step === 'select' ? (
                  <>
                    <div className="grid gap-4 mb-6">
                      {donationOptions.map((option, index) => (
                        <motion.button
                          key={option.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedOption(option.id)}
                          className={`relative p-6 rounded-[24px] border-2 transition-all ${selectedOption === option.id
                            ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 shadow-lg'
                            : option.popular
                              ? 'bg-gradient-to-br from-indigo-500 to-purple-500 border-transparent text-white shadow-xl'
                              : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                            }`}
                        >
                          {option.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full text-xs font-black text-white shadow-lg">
                              <Emoji emoji="⭐" size={14} className="inline mr-1" /> {t('donation.popular', 'Популярное')}
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="text-left">
                              <div className={`text-3xl font-black mb-1 ${selectedOption === option.id
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : option.popular
                                  ? 'text-white'
                                  : 'text-gray-900 dark:text-white'
                                }`}>
                                {formatPrice(option.amountUSD)}
                              </div>
                              <div className={`text-lg font-bold ${selectedOption === option.id
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : option.popular
                                  ? 'text-white'
                                  : 'text-indigo-600 dark:text-indigo-400'
                                }`}>
                                <Emoji emoji="💎" size={20} className="inline mr-1" /> {option.crystals} {t('donation.crystals', 'кристаллов')}
                              </div>
                              {option.bonus && (
                                <div className={`text-sm font-bold mt-1 ${selectedOption === option.id
                                  ? 'text-green-600 dark:text-green-400'
                                  : option.popular
                                    ? 'text-yellow-200'
                                    : 'text-green-600 dark:text-green-400'
                                  }`}>
                                  +{option.bonus}% {t('donation.bonus', 'бонус')}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-5xl">
                                {option.id === 'small' && <Emoji emoji="💰" size={48} />}
                                {option.id === 'medium' && <Emoji emoji="💎" size={48} />}
                                {option.id === 'large' && <Emoji emoji="👑" size={48} />}
                                {option.id === 'mega' && <Emoji emoji="🏆" size={48} />}
                              </div>
                              {selectedOption === option.id && (
                                <div className="text-2xl text-indigo-500">✓</div>
                              )}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    <div className="mb-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-[20px] border border-indigo-200 dark:border-indigo-800">
                      <p className="text-sm text-gray-700 dark:text-gray-300 text-center font-medium leading-relaxed">
                        <Emoji emoji="ℹ️" size={14} className="inline mr-1" /> {t('donation.info', 'Кристаллы используются только для покупки косметических предметов')}
                      </p>
                    </div>
                  </>
                ) : (
                  <PaymentMethodSelection
                    selectedPackage={getSelectedPackage()!}
                    orderId={orderId}
                    userId={userId}
                    currency={currency}
                    formatPrice={formatPrice}
                    onSelectMethod={handlePaymentMethodSelect}
                    paymentMethod={paymentMethod}
                  />
                )}
              </div>

              <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                {step === 'select' ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleContinueToPayment}
                    disabled={!selectedOption}
                    className={`w-full py-4 rounded-full font-black text-lg transition-all ${selectedOption
                      ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-xl hover:shadow-sm'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    {t('donation.continue', 'Продолжить') + ' →'}
                  </motion.button>
                ) : null}
              </div>
            </motion.div>
          </div>

          <ConfirmationModal
            isOpen={showConfirmation}
            selectedPackage={getSelectedPackage()}
            formatPrice={formatPrice}
            onConfirm={handleConfirmPayment}
            onCancel={handleCancelPayment}
          />
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

// Confirmation Modal Component
interface ConfirmationModalProps {
  isOpen: boolean;
  selectedPackage: DonationOption | undefined;
  formatPrice: (amount: number) => string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal = ({
  isOpen,
  selectedPackage,
  formatPrice,
  onConfirm,
  onCancel
}: ConfirmationModalProps) => {
  const { t } = useTranslation();

  if (!isOpen || !selectedPackage) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[102] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-[24px] p-6 max-w-md w-full shadow-sm"
        >
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4">
            {t('donation.confirmPayment', 'Подтвердите отправку заявки')}
          </h3>

          <div className="space-y-3 mb-6">
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-[16px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('donation.crystals', 'Кристаллы')}:
                </span>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  <Emoji emoji="💎" size={18} className="inline mr-1" /> {selectedPackage.crystals}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('donation.amount', 'Сумма')}:
                </span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatPrice(selectedPackage.amountUSD)}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              {t('donation.paypalInfo', 'После оплаты администратор подтвердит платеж в течение 24 часов')}
            </p>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCancel}
              className="flex-1 py-3 rounded-full font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              {t('ui.cancel', 'Отмена')}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfirm}
              className="flex-1 py-3 rounded-full font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
            >
              {t('ui.confirm', 'Подтвердить')}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

// Payment Method Selection Component
interface PaymentMethodSelectionProps {
  selectedPackage: DonationOption;
  orderId: string;
  userId: string;
  currency: Currency;
  formatPrice: (amount: number) => string;
  onSelectMethod: (method: 'robokassa' | 'paypal' | 'manual') => void;
  paymentMethod: 'robokassa' | 'paypal' | 'manual' | null;
}

const PaymentMethodSelection = ({
  selectedPackage,
  orderId,
  userId,
  // currency,
  formatPrice,
  onSelectMethod,
  paymentMethod
}: PaymentMethodSelectionProps) => {
  const { t } = useTranslation();
  const [showManualDetails, setShowManualDetails] = useState(false);

  const paymentMethods = [
    {
      id: 'robokassa' as const,
      name: 'Robokassa',
      icon: '🏦',
      description: t('donation.robokassaDesc', 'Банковские карты, электронные кошельки'),
      status: t('donation.inDevelopment', 'В разработке'),
      disabled: true
    },
    {
      id: 'paypal' as const,
      name: 'PayPal',
      icon: '💳',
      description: t('donation.paypalDesc', 'Международные платежи'),
      status: t('donation.semiAuto', 'Полуавтомат'),
      disabled: false
    },
    {
      id: 'manual' as const,
      name: t('donation.manualPayment', 'Ручная оплата'),
      icon: '👤',
      description: t('donation.manualDesc', 'Связь с разработчиком'),
      status: '',
      disabled: false
    }
  ];

  const handleMethodClick = (method: typeof paymentMethods[0]) => {
    if (method.disabled) {
      alert(t('donation.robokassaInDev', 'Robokassa в разработке. Скоро будет доступна!'));
      return;
    }

    if (method.id === 'manual') {
      setShowManualDetails(true);
    }

    onSelectMethod(method.id);
  };

  return (
    <div className="space-y-4">
      {/* Selected Package Summary */}
      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-[20px] border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{t('donation.selected', 'Выбран пакет')}:</div>
            <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
              <Emoji emoji="💎" size={20} className="inline mr-1" /> {selectedPackage.crystals} {t('donation.crystals', 'кристаллов')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {formatPrice(selectedPackage.amountUSD)}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="space-y-3">
        {paymentMethods.map((method) => (
          <motion.button
            key={method.id}
            whileHover={{ scale: method.disabled ? 1 : 1.02 }}
            whileTap={{ scale: method.disabled ? 1 : 0.98 }}
            onClick={() => handleMethodClick(method)}
            disabled={method.disabled}
            className={`w-full p-4 rounded-[20px] border-2 transition-all text-left ${paymentMethod === method.id
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
              : method.disabled
                ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 opacity-60 cursor-not-allowed'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 hover:border-indigo-300'
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl"><Emoji emoji={method.icon} size={32} /></span>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {method.name}
                    {method.status && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${method.disabled
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                        {method.status}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{method.description}</div>
                </div>
              </div>
              {paymentMethod === method.id && !method.disabled && (
                <span className="text-xl text-indigo-500">✓</span>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Manual Payment Details */}
      {showManualDetails && paymentMethod === 'manual' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-[24px] border-2 border-gray-300 dark:border-gray-600"
        >
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">
            <Emoji emoji="📋" size={24} className="inline mr-2" /> {t('donation.paymentDetails', 'Детали платежа')}
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400">{t('donation.amount', 'Сумма')}:</span>
              <span className="font-bold text-gray-900 dark:text-white">{formatPrice(selectedPackage.amountUSD)}</span>
            </div>
            <div className="flex justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400">{t('donation.crystalsToReceive', 'К начислению')}:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400"><Emoji emoji="💎" size={14} className="inline mr-1" /> {selectedPackage.crystals}</span>
            </div>
            <div className="flex justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400">{t('donation.orderId', 'ID заявки')}:</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white text-xs">{orderId}</span>
            </div>
            <div className="flex justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400">{t('donation.profileId', 'ID профиля')}:</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white text-xs">{userId}</span>
            </div>
          </div>

          <a
            href={`https://t.me/daurge?text=${encodeURIComponent(
              `🎮 Uzbek Wars - ${t('donation.manualPayment', 'Ручная оплата')}\n\n` +
              `<Emoji emoji="💎" size={14} /> ${t('donation.crystals', 'Кристаллы')}: ${selectedPackage.crystals}\n` +
              `💵 ${t('donation.amount', 'Сумма')}: ${formatPrice(selectedPackage.amountUSD)}\n` +
              `🆔 ${t('donation.orderId', 'ID заявки')}: ${orderId}\n` +
              `👤 ${t('donation.profileId', 'ID профиля')}: ${userId}\n\n` +
              `${t('donation.readyToPay', 'Готов(а) оплатить!')}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-4"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-5 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-[20px] text-white shadow-xl cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl">
                  <Emoji emoji="✈️" size={40} />
                </div>
                <div className="flex-1">
                  <div className="text-lg font-black mb-1">
                    💬 {t('donation.contactDeveloper', 'Свяжитесь с разработчиком')}
                  </div>
                  <div className="text-sm opacity-90">
                    {t('donation.tapToOpen', 'Нажмите чтобы открыть чат')}
                  </div>
                </div>
                <div className="text-2xl opacity-80">
                  →
                </div>
              </div>
            </motion.div>
          </a>
        </motion.div>
      )}

      {/* PayPal Pending Message */}
      {paymentMethod === 'paypal' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-[20px] border border-blue-200 dark:border-blue-800"
        >
          <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
            ⏳ {t('donation.paypalInfo', 'После оплаты администратор подтвердит платеж в течение 24 часов')}
          </p>
        </motion.div>
      )}
    </div>
  );
};
