import { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface Character {
  id: string;
  name: string;
  avatar: string;
  description: string;
}

interface CharacterSelectionProps {
  characters: Character[];
  onSelect: (characterId: string) => void;
}

const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

export const CharacterSelection = ({ characters, onSelect }: CharacterSelectionProps) => {
  const [[page, direction], setPage] = useState([0, 0]);
  const { t } = useTranslation();

  const characterIndex = wrap(0, characters.length, page);
  const currentCharacter = characters[characterIndex];

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
      // Если просто потянули больше 100px без учета скорости
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 overflow-hidden">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-black text-gray-900 mb-2"
      >
        {t('character.select')}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-gray-600 mb-2 font-medium"
      >
        Свайпните влево или вправо
      </motion.p>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, repeat: 3, repeatType: "reverse", duration: 0.8 }}
        className="text-4xl mb-6"
      >
        👈 👉
      </motion.div>

      <div className="relative w-full max-w-sm h-[520px] mb-8" style={{ perspective: '1200px' }}>
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={page}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 400, damping: 35 },
              opacity: { duration: 0.15 },
              scale: { duration: 0.15 },
              rotateY: { type: 'spring', stiffness: 400, damping: 35 }
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
              className="bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl p-8 border border-gray-100"
            >
              <div className="w-full h-72 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-[24px] mb-6 flex items-center justify-center overflow-hidden shadow-inner">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="text-9xl"
                >
                  {currentCharacter.avatar}
                </motion.div>
              </div>
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-black text-gray-900 mb-3 text-center"
              >
                {currentCharacter.name}
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 text-center leading-relaxed font-medium"
              >
                {currentCharacter.description}
              </motion.p>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows for desktop */}
        <motion.button
          onClick={() => paginate(-1)}
          whileHover={{ scale: 1.1, x: -4 }}
          whileTap={{ scale: 0.9 }}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 w-12 h-12 bg-white/90 backdrop-blur-xl rounded-full shadow-lg items-center justify-center text-2xl text-gray-700 hover:bg-white transition-colors border border-gray-100"
        >
          ←
        </motion.button>
        <motion.button
          onClick={() => paginate(1)}
          whileHover={{ scale: 1.1, x: 4 }}
          whileTap={{ scale: 0.9 }}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 w-12 h-12 bg-white/90 backdrop-blur-xl rounded-full shadow-lg items-center justify-center text-2xl text-gray-700 hover:bg-white transition-colors border border-gray-100"
        >
          →
        </motion.button>
      </div>

      <div className="flex gap-2 mb-8">
        {characters.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => {
              const newDirection = index > characterIndex ? 1 : -1;
              setPage([index, newDirection]);
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className={`transition-all duration-300 rounded-full ${
              index === characterIndex 
                ? 'w-10 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md' 
                : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Select character ${index + 1}`}
          />
        ))}
      </div>

      <motion.button
        onClick={() => onSelect(currentCharacter.id)}
        whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)' }}
        whileTap={{ scale: 0.95 }}
        className="min-h-touch w-full max-w-sm bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-black py-4 px-8 rounded-[24px] shadow-2xl"
      >
        {t('ui.confirm')}
      </motion.button>
    </div>
  );
};
