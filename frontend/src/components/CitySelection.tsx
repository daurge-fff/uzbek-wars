import { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface City {
  cityId: string;
  name: {
    ru: string;
    uz: string;
    uk: string;
    en: string;
  };
  playerCount: number;
  maxPlayers: number;
  isOpen: boolean;
  theme: {
    primaryColor: string;
    backgroundImage: string;
  };
}

interface CitySelectionProps {
  cities: City[];
  onSelect: (cityId: string) => void;
}

const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

export const CitySelection = ({ cities, onSelect }: CitySelectionProps) => {
  const [[page, direction], setPage] = useState([0, 0]);
  const { t, i18n } = useTranslation();

  // Calculate average player count
  const averagePlayerCount = cities.reduce((sum, city) => sum + city.playerCount, 0) / cities.length;

  const cityIndex = wrap(0, cities.length, page);
  const currentCity = cities[cityIndex];
  const isAvailable = currentCity.playerCount <= averagePlayerCount;

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

  return (
    <div className="flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-black dark:from-black dark:via-black dark:to-black p-4 pb-32 overflow-hidden transition-colors duration-300">
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
              className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[32px] shadow-2xl p-7 border-2 transition-colors ${
                isAvailable ? 'border-green-200 dark:border-green-700' : 'border-red-200 dark:border-red-700'
              }`}
            >
              <div className={`w-full h-64 bg-gradient-to-br ${getCityGradient(currentCity.cityId)} rounded-[24px] mb-5 flex flex-col items-center justify-center overflow-hidden shadow-inner relative`}>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="text-8xl"
                >
                  {getCityEmoji(currentCity.cityId)}
                </motion.div>
                
                {!isAvailable && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full font-black text-sm shadow-lg"
                  >
                    {t('cities.full')}
                  </motion.div>
                )}
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
                  <span className="text-gray-700 dark:text-gray-300 font-medium text-sm transition-colors">👥 {t('cities.players')}</span>
                  <span className="font-black text-gray-900 dark:text-white transition-colors">{currentCity.playerCount}</span>
                </div>

                <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden shadow-inner transition-colors">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentCity.playerCount / currentCity.maxPlayers) * 100}%` }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className={`h-full rounded-full ${
                      isAvailable 
                        ? 'bg-gradient-to-r from-green-400 to-emerald-400' 
                        : 'bg-gradient-to-r from-red-400 to-orange-400'
                    }`}
                  />
                </div>

                <p className="text-center text-xs text-gray-600 dark:text-gray-300 font-medium transition-colors">
                  {isAvailable 
                    ? `✅ ${t('cities.available')}` 
                    : `❌ ${t('cities.overpopulated')}`}
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows for desktop */}
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
          onClick={() => isAvailable && onSelect(currentCity.cityId)}
          disabled={!isAvailable}
          whileHover={isAvailable ? { scale: 1.05, boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)' } : {}}
          whileTap={isAvailable ? { scale: 0.95 } : {}}
          className={`w-full text-white font-black py-4 px-8 rounded-[24px] shadow-2xl transition-all ${
            isAvailable
              ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 cursor-pointer'
              : 'bg-gray-400 cursor-not-allowed opacity-50'
          }`}
        >
          {isAvailable ? t('ui.confirm') : t('cities.full')}
        </motion.button>
      </div>
    </div>
  );
};
