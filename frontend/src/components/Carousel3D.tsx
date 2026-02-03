import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface Carousel3DProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  onSelect?: (item: T, index: number) => void;
  showArrows?: boolean;
  itemWidth?: string;
  itemHeight?: string;
  selectButtonText?: string;
  canSelect?: (item: T, index: number) => boolean;
  initialIndex?: number;
}

export function Carousel3D<T>({
  items,
  renderItem,
  onSelect,
  showArrows = true,
  itemWidth = 'w-full',
  itemHeight = 'h-[460px]',
  selectButtonText,
  canSelect,
  initialIndex = 0
}: Carousel3DProps<T>) {
  const { t } = useTranslation();
  const [[page, direction], setPage] = useState([initialIndex, 0]);
  
  // Update page when initialIndex changes
  useEffect(() => {
    setPage([initialIndex, 0]);
  }, [initialIndex]);
  
  const wrap = (min: number, max: number, v: number) => {
    const rangeSize = max - min;
    return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
  };
  
  const itemIndex = wrap(0, items.length, page);
  const currentItem = items[itemIndex];
  const isSelectable = canSelect ? canSelect(currentItem, itemIndex) : true;
  
  const swipeConfidenceThreshold = 5000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };
  
  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };
  
  const handleDragEnd = (_e: any, { offset, velocity }: { offset: { x: number }, velocity: { x: number } }) => {
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

  return (
    <div className={`${itemWidth} max-w-sm mx-auto`}>
      <div className={`relative ${itemHeight} mb-6`} style={{ perspective: '1200px' }}>
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
            {renderItem(currentItem, itemIndex)}
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation arrows for desktop */}
        {showArrows && items.length > 1 && (
          <>
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
          </>
        )}
      </div>
      
      {onSelect && (
        <div className="mt-40">
          <motion.button
            onClick={() => isSelectable && onSelect(currentItem, itemIndex)}
            whileHover={isSelectable ? { scale: 1.05, boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)' } : {}}
            whileTap={isSelectable ? { scale: 0.95 } : {}}
            disabled={!isSelectable}
            className={`w-full py-4 font-black text-lg rounded-[24px] shadow-lg transition-all ${
              isSelectable
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-xl cursor-pointer'
                : 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed opacity-50'
            }`}
          >
            {selectButtonText || t('ui.continue', 'Продолжить')}
          </motion.button>
        </div>
      )}
    </div>
  );
}
