import { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface Character {
  id: string;
  name: {
    ru: string;
    uz: string;
    uk: string;
    en: string;
  };
  avatar: string;
  description: {
    ru: string;
    uz: string;
    uk: string;
    en: string;
  };
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
  const { t, i18n } = useTranslation();
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');

  const characterIndex = wrap(0, characters.length, page);
  const currentCharacter = characters[characterIndex];

  // Валидация имени пользователя
  const validateUsername = (name: string): string => {
    // Только русские, английские буквы, цифры, дефис и пробел
    const validCharsRegex = /^[a-zA-Zа-яА-ЯёЁ0-9\s-]+$/;
    
    if (name.length < 6) {
      return t('validation.usernameTooShort') || 'Минимум 6 символов';
    }
    
    if (name.length > 20) {
      return t('validation.usernameTooLong') || 'Максимум 20 символов';
    }
    
    if (!validCharsRegex.test(name)) {
      return t('validation.usernameInvalidChars') || 'Только русские/английские буквы, цифры, дефис и пробел';
    }
    
    // Не может состоять только из цифр
    if (/^\d+$/.test(name)) {
      return t('validation.usernameOnlyNumbers') || 'Имя не может состоять только из цифр';
    }
    
    // Не может состоять только из пробелов
    if (/^\s+$/.test(name)) {
      return t('validation.usernameOnlySpaces') || 'Имя не может состоять только из пробелов';
    }
    
    // Не может содержать два пробела подряд
    if (/\s{2,}/.test(name)) {
      return t('validation.usernameDoubleSpaces') || 'Имя не может содержать два пробела подряд';
    }
    
    return '';
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    
    if (value) {
      const error = validateUsername(value);
      setUsernameError(error);
    } else {
      setUsernameError('');
    }
  };

  const handleConfirm = () => {
    const error = validateUsername(username);
    if (error) {
      setUsernameError(error);
      return;
    }
    
    // Передаем и ID персонажа и имя пользователя
    onSelect(currentCharacter.id);
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 p-4 overflow-hidden transition-colors duration-300">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-black text-gray-900 dark:text-white mb-2 transition-colors"
      >
        {t('character.select')}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-gray-600 dark:text-gray-300 mb-2 font-medium transition-colors"
      >
        {t('app.swipeHint')}
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
              className="bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl rounded-[32px] shadow-2xl p-8 border border-gray-100 dark:border-gray-700 transition-colors"
            >
              <div className="w-full h-72 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:bg-gray-700 rounded-[24px] mb-6 flex items-center justify-center overflow-hidden shadow-inner transition-colors">
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
                className="text-3xl font-black text-gray-900 dark:text-white mb-3 text-center transition-colors"
              >
                {currentCharacter.name[i18n.language as keyof typeof currentCharacter.name] || currentCharacter.name.ru}
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 dark:text-gray-300 text-center leading-relaxed font-medium transition-colors"
              >
                {currentCharacter.description[i18n.language as keyof typeof currentCharacter.description] || currentCharacter.description.ru}
              </motion.p>
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
                : 'w-3 h-3 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
            }`}
            aria-label={`Select character ${index + 1}`}
          />
        ))}
      </div>

      {/* Username Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-sm mb-6"
      >
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
          {t('character.enterUsername') || 'Введите имя персонажа'}
        </label>
        <input
          type="text"
          value={username}
          onChange={handleUsernameChange}
          placeholder={t('character.usernamePlaceholder') || 'Ваше имя'}
          className={`w-full px-4 py-3 rounded-[20px] border-2 font-medium transition-all ${
            usernameError
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
          } text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500`}
        />
        {usernameError && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium"
          >
            ⚠️ {usernameError}
          </motion.p>
        )}
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {t('character.usernameHint') || '6-20 символов: русские/английские буквы, цифры, дефис'}
        </p>
      </motion.div>

      <motion.button
        onClick={handleConfirm}
        disabled={!username || !!usernameError}
        whileHover={{ scale: username && !usernameError ? 1.05 : 1 }}
        whileTap={{ scale: username && !usernameError ? 0.95 : 1 }}
        className={`min-h-touch w-full max-w-sm font-black py-4 px-8 rounded-[24px] shadow-2xl transition-all ${
          username && !usernameError
            ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white cursor-pointer'
            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
        }`}
      >
        {t('ui.confirm')}
      </motion.button>
    </div>
  );
};
