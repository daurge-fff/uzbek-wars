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

// Simplified character carousel for onboarding
const CharacterCarousel = ({ characters, onSelect }: { characters: any[], onSelect: (id: string) => void }) => {
  const { t, i18n } = useTranslation();
  const [[page, direction], setPage] = useState([0, 0]);
  
  const wrap = (min: number, max: number, v: number) => {
    const rangeSize = max - min;
    return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
  };
  
  const characterIndex = wrap(0, characters.length, page);
  const currentCharacter = characters[characterIndex];
  
  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };
  
  const handleDragEnd = (_e: any, info: { offset: { x: number }, velocity: { x: number } }) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    // Более чувствительная физика
    if (Math.abs(velocity) > 300 || Math.abs(offset) > 50) {
      if (velocity < 0 || offset < 0) {
        paginate(1);
      } else {
        paginate(-1);
      }
    }
  };
  
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
    })
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative h-[450px] mb-6">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={page}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.3}
            onDragEnd={handleDragEnd}
            className="absolute w-full cursor-grab active:cursor-grabbing"
          >
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[32px] p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
              <div className="w-full h-64 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-[24px] mb-6 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="text-9xl"
                >
                  {currentCharacter.avatar}
                </motion.div>
              </div>
              <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3 text-center">
                {currentCharacter.name[i18n.language as keyof typeof currentCharacter.name] || currentCharacter.name.ru}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
                {currentCharacter.description[i18n.language as keyof typeof currentCharacter.description] || currentCharacter.description.ru}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation arrows */}
        <button
          onClick={() => paginate(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-16 w-12 h-12 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform"
        >
          ←
        </button>
        <button
          onClick={() => paginate(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-16 w-12 h-12 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform"
        >
          →
        </button>
      </div>
      
      {/* Dots */}
      <div className="flex justify-center gap-2 mb-6">
        {characters.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              const newDirection = index > characterIndex ? 1 : -1;
              setPage([index, newDirection]);
            }}
            className={`transition-all rounded-full ${
              index === characterIndex 
                ? 'w-10 h-3 bg-gradient-to-r from-indigo-500 to-purple-500' 
                : 'w-3 h-3 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
      
      {/* Confirm button */}
      <button
        onClick={() => onSelect(currentCharacter.id)}
        className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-lg rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
      >
        {t('ui.confirm', 'Подтвердить')}
      </button>
    </div>
  );
};

export const OnboardingFlow = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, user, updatePlayer } = useAuth();
  const [step, setStep] = useState<OnboardingStep>('name');
  const [displayName, setDisplayName] = useState('');
  const [selectedCharacterId, setSelectedCharacterId] = useState('');
  const [characters, setCharacters] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    // Load characters and cities
    loadCharacters();
    loadCities();
    
    // Pre-fill with Google name if available
    if (user?.displayName) {
      setDisplayName(user.displayName);
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
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/check-username`, {
        username
      });
      setUsernameAvailable(response.data.available);
    } catch (error) {
      console.error('Failed to check username:', error);
      setUsernameAvailable(null);
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

    // Move to character selection
    setStep('character');
  };

  const handleCharacterSelect = (characterId: string) => {
    setSelectedCharacterId(characterId);
    setStep('city');
  };

  const handleCitySelect = async (cityId: string) => {
    setLoading(true);
    try {
      // Submit all onboarding data at once
      const response = await axios.post(
        `${API_URL}/api/player/select-character`,
        { 
          characterId: selectedCharacterId,
          cityId,
          displayName
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updatePlayer(response.data.player);
      
      toast.success(t('onboarding.complete', 'Добро пожаловать в игру!'));
      
      // Onboarding complete, navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {step === 'name' && (
          <motion.div
            key="name"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-md"
          >
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[32px] p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
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
                    ) : usernameAvailable === false ? (
                      <span className="text-red-600 dark:text-red-400">
                        ✗ {t('onboarding.nameTaken', 'Имя занято')}
                      </span>
                    ) : null}
                  </div>
                )}
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
              <motion.div
                animate={{ x: [-10, 10, -10] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-4xl"
              >
                👈 👉
              </motion.div>
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
              <p className="text-gray-600 dark:text-gray-300">
                {t('onboarding.cityDesc', 'Твой родной город на Великом Шёлковом пути')}
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
