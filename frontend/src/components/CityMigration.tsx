import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import Emoji from './Emoji';
import andijanSvg from '../assets/cities/andijan.svg';
import bukharaSvg from '../assets/cities/bukhara.svg';
import khivaSvg from '../assets/cities/khiva.svg';
import samarkandSvg from '../assets/cities/samarkand.svg';
import tashkentSvg from '../assets/cities/tashkent.svg';

const citySvgMap: Record<string, string> = {
  andijan: andijanSvg,
  bukhara: bukharaSvg,
  khiva: khivaSvg,
  samarkand: samarkandSvg,
  tashkent: tashkentSvg,
};

const getCityIllustration = (cityId: string, bgImage?: string): string => {
  const normalized = (cityId || '').toLowerCase();
  if (citySvgMap[normalized]) return citySvgMap[normalized];
  if (bgImage && bgImage.endsWith('.svg')) return bgImage;
  return `/assets/cities/${normalized}.svg`;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface CityData {
  cityId: string;
  name: { ru: string; uz: string; uk: string; en: string };
  playerCount: number;
  maxPlayers: number;
  isOpen: boolean;
  theme: {
    primaryColor: string;
    backgroundImage: string;
    description: { ru: string; uz: string; uk: string; en: string };
  };
  migrationCost?: {
    soms: number;
    crystals: number;
  };
}

interface MigrationInfo {
  currentCityId: string;
  availableCities: CityData[];
  playerBalance: {
    soms: number;
    crystals: number;
  };
}

const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

const CityMigration: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { token, refreshPlayer } = useAuth();
  const [migrationInfo, setMigrationInfo] = useState<MigrationInfo | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'soms' | 'crystals'>('crystals');
  const [loading, setLoading] = useState(true);
  const [[page, direction], setPage] = useState([0, 0]);

  useEffect(() => {
    fetchMigrationInfo();
  }, [token]);

  const fetchMigrationInfo = async () => {
    if (!token) {
      console.log('No token available for city migration');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/city-migration/info`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMigrationInfo(data.data);
      } else {
        toast.error(t('city.loadFailed', 'Не вдалося завантажити інформацію'));
      }
    } catch (error) {
      console.error('Failed to fetch migration info:', error);
      toast.error(t('city.loadFailed', 'Не вдалося завантажити інформацію'));
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = (city: CityData) => {
    setSelectedCity(city);
    setShowConfirmModal(true);
  };

  const confirmMigration = async () => {
    if (!selectedCity || !token) return;

    try {
      const response = await fetch(`${API_URL}/api/city-migration/migrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetCityId: selectedCity.cityId,
          paymentMethod
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(t('city.migrationSuccess', 'Переїзд розпочато! Прибуття через 60 хвилин'));
        setShowConfirmModal(false);
        setSelectedCity(null);
        await refreshPlayer();
        window.history.back();
      } else {
        // Handle specific error messages
        if (data.error === 'Cannot migrate while activity is in progress') {
          toast.error(t('city.activeActivityError', 'Неможливо переїхати під час виконання іншої активності'));
        } else if (data.error === 'Already in this city') {
          toast.error(t('city.alreadyInCity', 'Ви вже в цьому місті'));
        } else if (data.error === 'Target city is full') {
          toast.error(t('city.cityFull', 'Місто переповнене'));
        } else if (data.error === 'Insufficient soms' || data.error === 'Insufficient crystals') {
          toast.error(t('city.insufficientFunds', 'Недостатньо коштів'));
        } else {
          toast.error(data.error || t('city.migrationFailed', 'Не вдалося переїхати'));
        }
      }
    } catch (error) {
      console.error('Failed to migrate:', error);
      toast.error(t('city.migrationFailed', 'Не вдалося переїхати'));
    }
  };

  const getCityEmoji = (cityId: string) => {
    const emojis: Record<string, string> = {
      samarkand: '🕌',
      tashkent: '🏙️',
      bukhara: '🏛️',
      khiva: '🏰',
      andijan: '🌆'
    };
    return emojis[cityId] || '🏙️';
  };

  const getCityGradient = (cityId: string) => {
    const gradients: Record<string, string> = {
      samarkand: 'from-blue-100 via-cyan-100 to-sky-100',
      tashkent: 'from-green-100 via-emerald-100 to-teal-100',
      bukhara: 'from-yellow-100 via-amber-100 to-orange-100',
      khiva: 'from-orange-100 via-red-100 to-pink-100',
      andijan: 'from-purple-100 via-violet-100 to-fuchsia-100'
    };
    return gradients[cityId] || 'from-gray-100 via-slate-100 to-zinc-100';
  };

  const swipeConfidenceThreshold = 5000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  const handleDragEnd = (_e: any, { offset, velocity }: PanInfo) => {
    const swipe = swipePower(offset.x, velocity.x);

    if (swipe < -swipeConfidenceThreshold) {
      paginate(1);
    } else if (swipe > swipeConfidenceThreshold) {
      paginate(-1);
    } else if (Math.abs(offset.x) > 100) {
      if (offset.x < 0) {
        paginate(1);
      } else {
        paginate(-1);
      }
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.85,
      rotateY: direction > 0 ? 25 : -25
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.85,
      rotateY: direction < 0 ? 25 : -25
    })
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-black dark:via-black dark:to-black flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4"><Emoji emoji="🏙️" size={72} /></div>
          <div className="text-gray-900 dark:text-white text-2xl font-bold">
            {t('common.loading', 'Завантаження...')}
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-black dark:via-black dark:to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <div className="text-gray-900 dark:text-white text-2xl font-bold mb-4">
            {t('auth.loginRequired', 'Потрібна авторизація')}
          </div>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-full"
          >
            {t('auth.login', 'Увійти')}
          </button>
        </div>
      </div>
    );
  }

  if (!migrationInfo || migrationInfo.availableCities.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-black dark:via-black dark:to-black flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4"><Emoji emoji="❌" size={72} /></div>
          <div className="text-gray-900 dark:text-white text-2xl font-bold">
            {t('city.noData', 'Немає даних')}
          </div>
        </div>
      </div>
    );
  }

  const cityIndex = wrap(0, migrationInfo.availableCities.length, page);
  const currentCity = migrationInfo.availableCities[cityIndex];
  const canAffordSoms = currentCity.migrationCost ? migrationInfo.playerBalance.soms >= currentCity.migrationCost.soms : false;
  const canAffordCrystals = currentCity.migrationCost ? migrationInfo.playerBalance.crystals >= currentCity.migrationCost.crystals : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-black dark:via-black dark:to-black pb-32">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl p-4 backdrop-blur-2xl bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-gray-800/90 dark:via-gray-800/80 dark:to-gray-800/70 shadow-2xl border border-white/50 dark:border-gray-700/50"
        >
          <div className="relative flex items-center justify-center">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              <Emoji emoji="🗺️" size={24} className="inline" /> {t('city.migration', 'Переїзд до іншого міста')}
            </h1>
          </div>
        </motion.div>

        {/* Balance info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3"
        >
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border border-yellow-400/30 backdrop-blur-xl">
            <Emoji emoji="💰" size={20} />
            <span className="text-gray-900 dark:text-white font-bold text-sm">{migrationInfo.playerBalance.soms.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-400/20 to-blue-500/20 border border-cyan-400/30 backdrop-blur-xl">
            <Emoji emoji="💎" size={20} />
            <span className="text-gray-900 dark:text-white font-bold text-sm">{migrationInfo.playerBalance.crystals}</span>
          </div>
        </motion.div>

        {/* City carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center justify-center p-4 overflow-hidden transition-colors duration-300"
        >
          <div className="relative w-full max-w-sm h-[490px]" style={{ perspective: '1200px' }}>
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={page}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 500, damping: 40 },
                  opacity: { duration: 0.1 },
                  scale: { duration: 0.1 },
                  rotateY: { type: 'spring', stiffness: 500, damping: 40 }
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                className="absolute w-full cursor-grab active:cursor-grabbing"
                style={{ touchAction: 'pan-y' }}
              >
                <motion.div 
                  whileHover={{ scale: 1.02, y: -8 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[32px] shadow-2xl p-7 border-2 transition-colors border-blue-200 dark:border-blue-700"
                >
                  <div className={`w-full h-64 bg-gradient-to-br ${getCityGradient(currentCity.cityId)} rounded-[24px] mb-5 flex flex-col items-center justify-center overflow-hidden shadow-inner relative`}>
                    <motion.img
                      key={currentCity.cityId}
                      src={getCityIllustration(currentCity.cityId, currentCity.theme?.backgroundImage)}
                      alt={currentCity.name[i18n.language as keyof typeof currentCity.name] || currentCity.name.ru}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 w-full h-full object-cover z-10"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.opacity = '0';
                      }}
                    />
                    <div className="text-8xl select-none pointer-events-none opacity-40 z-0">
                      {getCityEmoji(currentCity.cityId)}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none z-20" />
                  </div>

                  <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-black text-gray-900 dark:text-white mb-4 text-center transition-colors"
                  >
                    {currentCity.name[i18n.language as keyof typeof currentCity.name] || currentCity.name.ru}
                  </motion.h2>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-2.5"
                  >
                    <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 px-4 py-2.5 rounded-[16px] border border-purple-200 dark:border-purple-700 transition-colors">
                      <span className="text-gray-700 dark:text-gray-300 font-medium text-sm transition-colors"><Emoji emoji="👥" size={16} className="inline" /> {t('cities.players')}</span>
                      <span className="font-black text-gray-900 dark:text-white transition-colors">{currentCity.playerCount}</span>
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden shadow-inner transition-colors">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentCity.playerCount / currentCity.maxPlayers) * 100}%` }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="h-full rounded-full bg-gradient-to-r from-blue-400 to-cyan-400"
                      />
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation arrows */}
            <motion.button
              onClick={() => paginate(-1)}
              whileHover={{ scale: 1.1, x: -4 }}
              whileTap={{ scale: 0.9 }}
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 w-12 h-12 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-full shadow-lg items-center justify-center text-2xl text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-700"
            >
              ←
            </motion.button>
            <motion.button
              onClick={() => paginate(1)}
              whileHover={{ scale: 1.1, x: 4 }}
              whileTap={{ scale: 0.9 }}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 w-12 h-12 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-full shadow-lg items-center justify-center text-2xl text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-700"
            >
              →
            </motion.button>
          </div>

          <div className="mt-8 w-full max-w-sm">
            <motion.button
              onClick={() => handleCitySelect(currentCity)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full text-white font-black py-4 px-8 rounded-[24px] shadow-none transition-all bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 cursor-pointer"
            >
              {t('city.migrate', 'Переїхати')}
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Confirmation Modal */}
      {createPortal(
        <AnimatePresence>
          {showConfirmModal && selectedCity && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowConfirmModal(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              />
              <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="w-full max-w-[450px] pointer-events-auto"
                >
                  <div className="bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-[32px] p-1 shadow-2xl">
                    <div className="bg-white dark:bg-gray-900 rounded-[28px] p-6">
                      <div className="text-center mb-6">
                        <div className="relative w-28 h-28 mx-auto mb-4 rounded-2xl overflow-hidden shadow-md flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                          <img
                            src={getCityIllustration(selectedCity.cityId, selectedCity.theme?.backgroundImage)}
                            alt={selectedCity.name[i18n.language as 'ru' | 'uz' | 'uk' | 'en'] || selectedCity.name.ru}
                            className="w-full h-full object-cover z-10"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.opacity = '0';
                            }}
                          />
                          <div className="text-5xl opacity-40 absolute z-0 pointer-events-none">
                            {getCityEmoji(selectedCity.cityId)}
                          </div>
                        </div>
                        <h2 className="text-3xl font-black bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 bg-clip-text text-transparent mb-2">
                          {t('city.confirmMigration', 'Підтвердіть переїзд')}
                        </h2>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {selectedCity.name[i18n.language as 'ru' | 'uz' | 'uk' | 'en']}
                        </div>
                      </div>

                      {/* Payment method selector */}
                      <div className="mb-6">
                        <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center">
                          {t('city.selectPayment', 'Оберіть спосіб оплати')}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setPaymentMethod('crystals')}
                            className={`py-4 rounded-2xl font-bold transition-all border-2 ${
                              paymentMethod === 'crystals'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <div className="mb-1"><Emoji emoji="💎" size={36} /></div>
                            <div className="text-lg font-black">{selectedCity.migrationCost?.crystals || 0}</div>
                            <div className="text-xs mt-1 opacity-70">
                              {t('common.have', 'Є')}: {migrationInfo.playerBalance.crystals}
                            </div>
                          </button>
                          
                          <button
                            onClick={() => setPaymentMethod('soms')}
                            className={`py-4 rounded-2xl font-bold transition-all border-2 ${
                              paymentMethod === 'soms'
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <div className="mb-1"><Emoji emoji="💰" size={36} /></div>
                            <div className="text-lg font-black">{selectedCity.migrationCost?.soms.toLocaleString() || 0}</div>
                            <div className="text-xs mt-1 opacity-70">
                              {t('common.have', 'Є')}: {migrationInfo.playerBalance.soms.toLocaleString()}
                            </div>
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowConfirmModal(false)}
                          className="flex-1 py-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 text-gray-900 dark:text-white font-bold rounded-full shadow-lg"
                        >
                          {t('common.cancel', 'Скасувати')}
                        </motion.button>
                        <motion.button
                          whileHover={
                            (paymentMethod === 'soms' && canAffordSoms) ||
                            (paymentMethod === 'crystals' && canAffordCrystals)
                              ? { scale: 1.02 }
                              : {}
                          }
                          whileTap={
                            (paymentMethod === 'soms' && canAffordSoms) ||
                            (paymentMethod === 'crystals' && canAffordCrystals)
                              ? { scale: 0.98 }
                              : {}
                          }
                          onClick={confirmMigration}
                          disabled={
                            (paymentMethod === 'soms' && !canAffordSoms) ||
                            (paymentMethod === 'crystals' && !canAffordCrystals)
                          }
                          className={`flex-1 py-3 font-bold rounded-full shadow-lg ${
                            (paymentMethod === 'soms' && canAffordSoms) ||
                            (paymentMethod === 'crystals' && canAffordCrystals)
                              ? 'bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white'
                              : 'bg-gray-400 text-gray-200 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          {t('common.confirm', 'Підтвердити')}
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
      )}
    </div>
  );
};

export default CityMigration;
