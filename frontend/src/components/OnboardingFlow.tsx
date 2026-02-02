import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLoginButton } from './GoogleLoginButton';
import { CharacterSelection } from './CharacterSelection';
import { CitySelection } from './CitySelection';
import axios from 'axios';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

type OnboardingStep = 'intro' | 'auth' | 'character' | 'city' | 'complete';

interface Character {
  id: string;
  name: string;
  avatar: string;
  description: string;
}

interface City {
  cityId: string;
  name: { ru: string; uz: string; uk: string; en: string };
  playerCount: number;
  maxPlayers: number;
  isOpen: boolean;
  theme: { primaryColor: string; backgroundImage: string };
}

const loreSlides = [
  {
    title: { ru: 'Великий Шелковый путь', en: 'The Great Silk Road', uz: 'Buyuk Ipak yo\'li', uk: 'Великий Шовковий шлях' },
    text: { 
      ru: 'Древние города Узбекистана были центром торговли и культуры. Караваны везли шелк, специи и знания через пустыни и горы.',
      en: 'Ancient cities of Uzbekistan were centers of trade and culture. Caravans carried silk, spices and knowledge through deserts and mountains.',
      uz: 'O\'zbekistonning qadimiy shaharlari savdo va madaniyat markazlari edi. Karvonlar ipak, ziravorlar va bilimlarni cho\'llar va tog\'lar orqali olib o\'tishgan.',
      uk: 'Стародавні міста Узбекистану були центрами торгівлі та культури. Каравани везли шовк, спеції та знання через пустелі та гори.'
    },
    icon: '🐪'
  },
  {
    title: { ru: 'Легенда о героях', en: 'Legend of Heroes', uz: 'Qahramonlar afsonasi', uk: 'Легенда про героїв' },
    text: {
      ru: 'В каждом городе рождались свои герои - торговцы, ремесленники, воины. Их истории передавались из поколения в поколение.',
      en: 'Each city gave birth to its own heroes - merchants, craftsmen, warriors. Their stories were passed down through generations.',
      uz: 'Har bir shaharda o\'z qahramonlari tug\'ilgan - savdogarlar, hunarmandlar, jangchilar. Ularning hikoyalari avloddan-avlodga o\'tgan.',
      uk: 'У кожному місті народжувалися свої герої - торговці, ремісники, воїни. Їхні історії передавалися з покоління в покоління.'
    },
    icon: '⚔️'
  },
  {
    title: { ru: 'Твоя история начинается', en: 'Your Story Begins', uz: 'Sizning hikoyangiz boshlanadi', uk: 'Твоя історія починається' },
    text: {
      ru: 'Теперь твоя очередь стать легендой. Выбери свой путь, построй империю, стань величайшим в истории Узбекистана!',
      en: 'Now it\'s your turn to become a legend. Choose your path, build an empire, become the greatest in Uzbekistan\'s history!',
      uz: 'Endi afsonaga aylanish navbati sizda. Yo\'lingizni tanlang, imperiya quring, O\'zbekiston tarixidagi eng buyuk bo\'ling!',
      uk: 'Тепер твоя черга стати легендою. Обери свій шлях, побудуй імперію, стань найвеличнішим в історії Узбекистану!'
    },
    icon: '👑'
  }
];

export const OnboardingFlow = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { login, isAuthenticated } = useAuth();
  const [step, setStep] = useState<OnboardingStep>('intro');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const languages = [
    { code: 'ru', flag: '🇷🇺' },
    { code: 'uz', flag: '🇺🇿' },
    { code: 'uk', flag: '🇺🇦' },
    { code: 'en', flag: '🇬🇧' }
  ];

  // Auto-advance slides
  useEffect(() => {
    if (step === 'intro') {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % loreSlides.length);
      }, 5000);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [step]);

  const handleSkipIntro = () => {
    setStep('auth');
  };

  const handleGoogleLogin = async (idToken: string) => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      const response = await axios.post(`${API_URL}/api/auth/google`, {
        idToken,
        ipAddress: '127.0.0.1',
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          deviceId: localStorage.getItem('deviceId') || generateDeviceId()
        }
      });

      const { token, user, player } = response.data;
      
      // Save to auth context
      login(token, user, player);

      // Проверяем нужно ли выбрать персонажа и город
      const needsCharacter = !player.characterId || player.characterId === 'default';
      const needsCity = !player.cityId || player.cityId === 'default';

      if (needsCharacter || needsCity) {
        // Load characters for selection
        const charsResponse = await axios.get(`${API_URL}/api/characters`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCharacters(charsResponse.data);
        setStep('character');
      } else {
        // User already has character and city, go to dashboard
        toast.success(t('auth.welcome', 'Добро пожаловать') + ', ' + user.displayName + '!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error(error.response?.data?.message || t('auth.loginError', 'Ошибка входа. Попробуйте снова.'));
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterSelect = async (characterId: string) => {
    try {
      setLoading(true);
      setSelectedCharacter(characterId);

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const citiesResponse = await axios.get(`${API_URL}/api/cities`);
      setCities(citiesResponse.data);

      setStep('city');
    } catch (error: any) {
      console.error('Failed to load cities:', error);
      toast.error(error.response?.data?.message || t('cities.loadError', 'Ошибка загрузки городов'));
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = async (cityId: string) => {
    try {
      setLoading(true);

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const referralCode = localStorage.getItem('referralCode');

      const response = await axios.post(
        `${API_URL}/api/player/select-character`,
        {
          characterId: selectedCharacter,
          cityId,
          referralCode: referralCode || undefined
        }
      );

      // Update player in auth context
      const { player } = response.data;
      login(localStorage.getItem('auth_token')!, JSON.parse(localStorage.getItem('auth_user')!), player);

      localStorage.removeItem('referralCode');
      setStep('complete');

      toast.success(t('app.registrationComplete', 'Регистрация завершена!'));

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Failed to complete registration:', error);
      toast.error(error.response?.data?.message || t('character.selectError', 'Ошибка регистрации'));
    } finally {
      setLoading(false);
    }
  };

  const generateDeviceId = (): string => {
    const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('deviceId', id);
    return id;
  };

  const pageVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      {/* Theme and Language Switchers - Fixed Position */}
      {step !== 'character' && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="w-12 h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-2xl"
          >
            <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
          </motion.button>

          <div className="flex gap-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-full shadow-lg border border-gray-200 dark:border-gray-700 p-1">
            {languages.map((lang) => (
              <motion.button
                key={lang.code}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => i18n.changeLanguage(lang.code)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
                  i18n.language === lang.code
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-md'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span>{lang.flag}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center p-4"
          >
            <div className="max-w-4xl w-full">
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center mb-12"
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="text-6xl md:text-7xl">🏛️</span>
                  <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                    {t('app.name')}
                  </h1>
                </div>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  {t('app.tagline', 'Стань легендой Великого Шелкового пути')}
                </p>
              </motion.div>

              {/* Slideshow */}
              <div className="relative h-96 mb-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                  >
                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[32px] shadow-2xl p-8 h-full flex flex-col items-center justify-center text-center border border-gray-200 dark:border-gray-700">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="text-8xl mb-6"
                       
                      >
                        {loreSlides[currentSlide].icon}
                      </motion.div>
                      <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
                        {loreSlides[currentSlide].title[i18n.language as keyof typeof loreSlides[0]['title']] || loreSlides[currentSlide].title.ru}
                      </h2>
                      <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                        {loreSlides[currentSlide].text[i18n.language as keyof typeof loreSlides[0]['text']] || loreSlides[currentSlide].text.ru}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Slide indicators */}
              <div className="flex justify-center gap-2 mb-8">
                {loreSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentSlide
                        ? 'w-8 bg-gradient-to-r from-indigo-500 to-purple-500'
                        : 'w-2 bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSkipIntro}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-black rounded-full shadow-2xl text-lg"
                >
                  {t('app.startAdventure', 'Начать приключение')} →
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'auth' && (
          <motion.div
            key="auth"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="min-h-screen flex items-center justify-center p-4"
          >
            <div className="max-w-md w-full">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center mb-8"
              >
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-5xl">{t('app.logo')}</span>
                  <h1 className="text-5xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                    {t('app.name')}
                  </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  {t('app.welcome')}
                </p>
              </motion.div>
              <GoogleLoginButton onSuccess={handleGoogleLogin} />
            </div>
          </motion.div>
        )}

        {step === 'character' && (
          <motion.div
            key="character"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <CharacterSelection
              characters={characters}
              onSelect={handleCharacterSelect}
            />
          </motion.div>
        )}

        {step === 'city' && (
          <motion.div
            key="city"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <CitySelection
              cities={cities}
              onSelect={handleCitySelect}
            />
          </motion.div>
        )}

        {step === 'complete' && (
          <motion.div
            key="complete"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="min-h-screen flex items-center justify-center p-4"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-9xl mb-6"
               
              >
                🎉
              </motion.div>
              <h2 className="text-4xl font-black bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent mb-4">
                {t('app.registrationComplete')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                {t('app.redirecting')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="text-6xl"
          >
            ⏳
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
};
