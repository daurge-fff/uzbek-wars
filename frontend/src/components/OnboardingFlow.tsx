import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLoginButton } from './GoogleLoginButton';
import { CharacterSelection } from './CharacterSelection';
import { CitySelection } from './CitySelection';
import axios from 'axios';

type OnboardingStep = 'auth' | 'character' | 'city' | 'complete';

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

export const OnboardingFlow = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<OnboardingStep>('auth');
  const [token, setToken] = useState<string>('');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async (idToken: string) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/google', {
        idToken,
        ipAddress: '127.0.0.1', // В продакшене получать реальный IP
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          deviceId: localStorage.getItem('deviceId') || generateDeviceId()
        }
      });

      const { token: jwtToken } = response.data;
      setToken(jwtToken);
      localStorage.setItem('token', jwtToken);

      // Загрузить персонажей
      const charsResponse = await axios.get('/api/characters');
      setCharacters(charsResponse.data);

      setStep('character');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Ошибка входа. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterSelect = async (characterId: string) => {
    try {
      setLoading(true);
      setSelectedCharacter(characterId);

      // Загрузить города
      const citiesResponse = await axios.get('/api/cities');
      setCities(citiesResponse.data);

      setStep('city');
    } catch (error) {
      console.error('Failed to load cities:', error);
      alert('Ошибка загрузки городов');
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = async (cityId: string) => {
    try {
      setLoading(true);

      const referralCode = localStorage.getItem('referralCode');

      await axios.post(
        '/api/player/select-character',
        {
          characterId: selectedCharacter,
          cityId,
          referralCode: referralCode || undefined
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      localStorage.removeItem('referralCode');
      setStep('complete');

      // Перенаправить на dashboard через 2 секунды
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Failed to complete registration:', error);
      alert('Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  const generateDeviceId = () => {
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
      <AnimatePresence mode="wait">
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
                <h1 className="text-5xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mb-4">
                  Узбек Варс
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  Добро пожаловать в игру!
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
                Регистрация завершена!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Перенаправление в игру...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="text-6xl"
          >
            ⏳
          </motion.div>
        </div>
      )}
    </div>
  );
};
