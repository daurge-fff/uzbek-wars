import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { CitySelection } from './CitySelection';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type OnboardingStep = 'name' | 'character' | 'city';

// Character carousel - ТОЧНО КАК CitySelection
const CharacterCarousel = ({ characters, onSelect }: { characters: any[], onSelect: (id: string) => void }) => {
  const { t, i18n } = useTranslation();
  const [[page, direction], setPage] = useState([0, 0]);
  
  const wrap = (min: number, max: number, v: number) => {
    const rangeSize = max - min;
    return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
  };
  
  const characterIndex = wrap(0, characters.length, page);
  const currentCharacter = characters[characterIndex];
  
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
  
  const getCharacterGradient = (characterId: string) => {
    const gradients: Record<string, string> = {
      char_merchant: 'from-yellow-100 via-amber-100 to-orange-100',
      char_warrior: 'from-red-100 via-rose-100 to-pink-100',
      char_scholar: 'from-blue-100 via-cyan-100 to-sky-100',
      char_artisan: 'from-purple-100 via-violet-100 to-fuchsia-100',
      char_chef: 'from-green-100 via-emerald-100 to-teal-100'
    };
    return gradients[characterId] || 'from-gray-100 via-slate-100 to-zinc-100';
  };

  const getCharacterEmoji = (characterId: string) => {
    const emojis: Record<string, string> = {
      char_merchant: '🤑',
      char_warrior: '⚔️',
      char_scholar: '📚',
      char_artisan: '🎨',
      char_chef: '👨‍🍳'
    };
    return emojis[characterId] || currentCharacter.avatar || '👤';
  };
  
  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="relative h-[460px] mb-6" style={{ perspective: '1200px' }}>
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
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[32px] shadow-sm p-6 border-2 border-green-200 dark:border-green-700 transition-colors"
            >
              <div className={`w-full h-60 bg-gradient-to-br ${getCharacterGradient(currentCharacter.id)} dark:bg-gray-700 rounded-[24px] mb-4 flex flex-col items-center justify-center overflow-hidden shadow-inner relative transition-colors`}>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="text-8xl"
                >
                  {getCharacterEmoji(currentCharacter.id)}
                </motion.div>
              </div>

              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-black text-gray-900 dark:text-white mb-2 text-center transition-colors"
              >
                {currentCharacter.name[i18n.language as keyof typeof currentCharacter.name] || currentCharacter.name.ru}
              </motion.h2>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                {currentCharacter.strengths && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 px-3 py-2 rounded-[16px] border border-green-200 dark:border-green-700 transition-colors">
                    <div className="text-[10px] text-green-700 dark:text-green-300 font-bold mb-0.5">
                      {t('character.strengths', 'Сильные стороны')}
                    </div>
                    <div className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                      {currentCharacter.strengths[i18n.language as keyof typeof currentCharacter.strengths] || currentCharacter.strengths.ru}
                    </div>
                  </div>
                )}

                {currentCharacter.weaknesses && (
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 px-3 py-2 rounded-[16px] border border-red-200 dark:border-red-700 transition-colors">
                    <div className="text-[10px] text-red-700 dark:text-red-300 font-bold mb-0.5">
                      {t('character.weaknesses', 'Слабые стороны')}
                    </div>
                    <div className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                      {currentCharacter.weaknesses[i18n.language as keyof typeof currentCharacter.weaknesses] || currentCharacter.weaknesses.ru}
                    </div>
                  </div>
                )}

                <p className="text-center text-[10px] text-gray-500 dark:text-gray-400 font-medium transition-colors pt-0.5">
                  {currentCharacter.description[i18n.language as keyof typeof currentCharacter.description] || currentCharacter.description.ru}
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
      
      <div className="mt-16">
        <motion.button
          onClick={() => onSelect(currentCharacter.id)}
          whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)' }}
          whileTap={{ scale: 0.95 }}
          className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-lg rounded-[24px] shadow-lg hover:shadow-xl transition-all"
        >
          {t('ui.continue', 'Продолжить')}
        </motion.button>
      </div>
    </div>
  );
};

export const OnboardingFlow = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user, player, updatePlayer } = useAuth();
  const [step, setStep] = useState<OnboardingStep>('name');
  const [displayName, setDisplayName] = useState('');
  const [selectedCharacterId, setSelectedCharacterId] = useState('');
  const [characters, setCharacters] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<'taken' | 'invalid' | ''>('');

  // Проверяем, прошел ли пользователь уже онбординг
  useEffect(() => {
    if (user && player) {
      // Проверяем, что у игрока есть и класс, и город (не дефолтные значения)
      const hasCharacter = player.characterId && player.characterId !== 'default';
      const hasCity = player.cityId && player.cityId !== 'default';
      
      if (hasCharacter && hasCity) {
        // Пользователь уже прошел онбординг, перенаправляем на dashboard
        navigate('/dashboard');
      }
    }
  }, [user, player, navigate]);

  useEffect(() => {
    // Load characters and cities
    loadCharacters();
    loadCities();
    
    // Pre-fill with Google name if available, but clean it up
    if (user?.displayName && !displayName) {
      // Очищаем имя: убираем лишние пробелы, оставляем только допустимые символы
      let cleanedName = user.displayName
        .trim()
        .replace(/\s{2,}/g, ' ') // Заменяем множественные пробелы на один
        .replace(/[^a-zA-Zа-яА-ЯёЁіІїЇєЄґҐ0-9\s-]/g, ''); // Убираем недопустимые символы
      
      // Если после очистки имя слишком короткое или состоит только из цифр, не заполняем
      if (cleanedName.length >= 3 && !/^\d+$/.test(cleanedName)) {
        setDisplayName(cleanedName);
      }
    }
  }, [user]);

  const loadCharacters = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/characters`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCharacters(response.data.characters || []);
    } catch (error) {
      console.error('Failed to load characters:', error);
      toast.error(t('onboarding.loadCharactersError', 'Не удалось загрузить персонажей'));
    }
  };

  const loadCities = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/cities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCities(response.data.cities || []);
    } catch (error) {
      console.error('Failed to load cities:', error);
      toast.error(t('onboarding.loadCitiesError', 'Не удалось загрузить города'));
    }
  };

  const checkUsername = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      setUsernameError('');
      return;
    }

    const trimmedName = username.trim();
    
    // Валидация перед проверкой на сервере
    // Только цифры
    if (/^\d+$/.test(trimmedName)) {
      setUsernameAvailable(false);
      setUsernameError('invalid'); // Помечаем как невалидное
      return;
    }
    
    // Только пробелы
    if (/^\s+$/.test(trimmedName)) {
      setUsernameAvailable(false);
      setUsernameError('invalid');
      return;
    }
    
    // Два пробела подряд
    if (/\s{2,}/.test(trimmedName)) {
      setUsernameAvailable(false);
      setUsernameError('invalid');
      return;
    }
    
    // Только буквы, цифры, пробелы и дефис (включая украинские и русские буквы)
    if (!/^[a-zA-Zа-яА-ЯёЁіІїЇєЄґҐ0-9\s-]+$/.test(trimmedName)) {
      setUsernameAvailable(false);
      setUsernameError('invalid');
      return;
    }

    setCheckingUsername(true);
    setUsernameError('');
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/check-username`,
        { username: trimmedName },
        {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }
      );
      setUsernameAvailable(response.data.available);
      if (!response.data.available) {
        setUsernameError('taken'); // Помечаем как занятое
      }
    } catch (error: any) {
      console.error('Failed to check username:', error);
      // Если ошибка сети или сервера - считаем имя доступным
      // чтобы не блокировать регистрацию
      if (error.response?.status === 500 || !error.response) {
        setUsernameAvailable(true);
        setUsernameError('');
      } else {
        setUsernameAvailable(null);
        setUsernameError('');
      }
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleNameSubmit = () => {
    if (!displayName || displayName.length < 3) {
      toast.error(t('onboarding.nameMinLength', 'Имя должно быть минимум 3 символа'));
      return;
    }

    if (displayName.length > 20) {
      toast.error(t('onboarding.nameMaxLength', 'Имя должно быть максимум 20 символов'));
      return;
    }

    if (usernameAvailable === false) {
      toast.error(t('onboarding.nameTaken', 'Это имя уже занято'));
      return;
    }

    // Дополнительная валидация
    const trimmedName = displayName.trim();
    
    // Только цифры
    if (/^\d+$/.test(trimmedName)) {
      toast.error(t('validation.usernameOnlyNumbers', 'Имя не может состоять только из цифр'));
      return;
    }
    
    // Только пробелы
    if (/^\s+$/.test(trimmedName)) {
      toast.error(t('validation.usernameOnlySpaces', 'Имя не может состоять только из пробелов'));
      return;
    }
    
    // Два пробела подряд
    if (/\s{2,}/.test(trimmedName)) {
      toast.error(t('validation.usernameDoubleSpaces', 'Имя не может содержать два пробела подряд'));
      return;
    }
    
    // Только буквы, цифры, пробелы и дефис
    if (!/^[a-zA-Zа-яА-ЯёЁіІїЇєЄґҐ0-9\s-]+$/.test(trimmedName)) {
      toast.error(t('validation.usernameInvalidChars', 'Только буквы, цифры, пробелы и дефис'));
      return;
    }

    // Move to character selection
    setStep('character');
  };

  const handleCharacterSelect = (characterId: string) => {
    setSelectedCharacterId(characterId);
    setStep('city');
  };

  const handleCitySelect = async (cityId: string) => {
    if (!selectedCharacterId) {
      toast.error(t('notifications.selectCharacterFirst'));
      return;
    }

    setLoading(true);
    try {
      // Try to create new player first
      try {
        const response = await axios.post(
          `${API_URL}/api/player/select-character`,
          { 
            characterId: selectedCharacterId,
            cityId,
            displayName
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Update player data in context
        if (response.data.player) {
          const playerData = response.data.player;
          updatePlayer({
            id: playerData._id || playerData.id || playerData.userId,
            level: playerData.level,
            experience: playerData.experience,
            soms: playerData.soms,
            characterId: playerData.characterId,
            cityId: playerData.cityId,
            donationCurrency: playerData.donationCurrency,
            stats: playerData.stats
          });
        }
        
        toast.success(t('onboarding.complete', 'Добро пожаловать в игру!'));
        navigate('/dashboard');
      } catch (createError: any) {
        // If character already selected, try to update
        if (createError.response?.data?.code === 'CHARACTER_ALREADY_SELECTED') {
          const response = await axios.put(
            `${API_URL}/api/player/update-profile`,
            { 
              characterId: selectedCharacterId,
              cityId,
              displayName
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          // Update player data in context
          if (response.data.player) {
            const playerData = response.data.player;
            updatePlayer({
              id: playerData._id || playerData.id || playerData.userId,
              level: playerData.level,
              experience: playerData.experience,
              soms: playerData.soms,
              characterId: playerData.characterId,
              cityId: playerData.cityId,
              donationCurrency: playerData.donationCurrency,
              stats: playerData.stats
            });
          }
          
          toast.success(t('onboarding.complete', 'Добро пожаловать в игру!'));
          navigate('/dashboard');
        } else {
          throw createError;
        }
      }
    } catch (error: any) {
      console.error('Failed to complete onboarding:', error);
      toast.error(error.response?.data?.error || t('onboarding.error', 'Ошибка завершения регистрации'));
    } finally {
      setLoading(false);
    }
  };

  // Debounce username check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (displayName && displayName.length >= 3) {
        checkUsername(displayName);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [displayName]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-black dark:from-black dark:via-black dark:to-black flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {step === 'name' && (
          <motion.div
            key="name"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-md"
          >
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[32px] p-8 shadow-sm border border-gray-200 dark:border-gray-700">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="text-8xl mb-6 text-center"
              >
                👋
              </motion.div>
              
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3 text-center">
                {t('onboarding.welcome', 'Добро пожаловать!')}
              </h2>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
                {t('onboarding.enterName', 'Как тебя зовут?')}
              </p>
              
              <div className="mb-6">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t('onboarding.namePlaceholder', 'Введи своё имя')}
                  className="w-full px-4 py-4 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:outline-none text-lg font-semibold"
                  maxLength={20}
                  disabled={loading}
                />
                
                {displayName.length >= 3 && (
                  <div className="mt-2 text-sm">
                    {checkingUsername ? (
                      <span className="text-gray-500">
                        {t('onboarding.checking', 'Проверка...')}
                      </span>
                    ) : usernameAvailable === true ? (
                      <span className="text-green-600 dark:text-green-400">
                        ✓ {t('onboarding.nameAvailable', 'Имя доступно')}
                      </span>
                    ) : usernameAvailable === false && usernameError === 'taken' ? (
                      <span className="text-red-600 dark:text-red-400">
                        ✗ {t('onboarding.nameTaken', 'Это имя уже занято')}
                      </span>
                    ) : usernameAvailable === false && usernameError === 'invalid' ? (
                      <span className="text-red-600 dark:text-red-400">
                        ✗ {t('onboarding.nameInvalid', 'Имя содержит недопустимые символы')}
                      </span>
                    ) : null}
                  </div>
                )}
                
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {t('name.hint', '3-20 символов, буквы, цифры, пробелы и дефисы')}
                </p>
              </div>
              
              <button
                onClick={handleNameSubmit}
                disabled={loading || !displayName || displayName.length < 3 || usernameAvailable === false}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('ui.continue', 'Продолжить')}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'character' && (
          <motion.div
            key="character"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-4xl"
          >
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                {t('onboarding.chooseCharacter', 'Выбери персонажа')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {t('onboarding.characterDesc', 'Каждый персонаж имеет уникальные способности')}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {t('app.swipeHint', 'Свайпните влево или вправо')}
              </p>
            </div>
            
            {characters.length > 0 ? (
              <CharacterCarousel
                characters={characters}
                onSelect={handleCharacterSelect}
              />
            ) : (
              <div className="text-center text-gray-500">
                {t('onboarding.loadingCharacters', 'Загрузка персонажей...')}
              </div>
            )}
          </motion.div>
        )}

        {step === 'city' && (
          <motion.div
            key="city"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-4xl"
          >
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                {t('onboarding.chooseCity', 'Выбери город')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {t('onboarding.cityDesc', 'Твой родной город на Великом Шёлковом пути')}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {t('app.swipeHint', 'Свайпните влево или вправо')}
              </p>
            </div>
            
            {cities.length > 0 ? (
              <CitySelection
                cities={cities}
                onSelect={handleCitySelect}
              />
            ) : (
              <div className="text-center text-gray-500">
                {t('onboarding.loadingCities', 'Загрузка городов...')}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
