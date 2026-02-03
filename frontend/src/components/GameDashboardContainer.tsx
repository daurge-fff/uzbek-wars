import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GameDashboard } from './GameDashboard';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

export const GameDashboardContainer = () => {
  const { t } = useTranslation();
  const { player, token, isAuthenticated, user, updatePlayer } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentActivity, setCurrentActivity] = useState<any>(null);
  const [cooldownInfo, setCooldownInfo] = useState<{activityName: string; seconds: number} | null>(null);

  // Логируем изменения статов для отладки
  useEffect(() => {
    if (player?.stats) {
      // Stats updated
    }
  }, [player?.stats]);

  // Очищаем битые данные при монтировании
  useEffect(() => {
    setCurrentActivity(null);
    
    // Очищаем из localStorage если там что-то есть
    try {
      localStorage.removeItem('currentActivity');
      sessionStorage.removeItem('currentActivity');
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    // Загружаем данные
    loadActivities();
    loadCurrentActivity();
    
    // Проверяем активность каждые 5 секунд
    const interval = setInterval(checkActivityCompletion, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const loadActivities = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.get(`${API_URL}/api/activities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Backend returns { activities: [...], count: number }
      const activitiesData = response.data.activities || [];
      setActivities(activitiesData);
    } catch (error) {
      console.error('Failed to load activities:', error);
      toast.error(t('notifications.activityLoadError'));
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentActivity = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.get(`${API_URL}/api/player/current-activity`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.activity) {
        const activity = response.data.activity;
        
        // Проверяем что все данные валидные
        const startTime = activity.startTime;
        const endTime = activity.endTime;
        
        if (!endTime || isNaN(endTime) || !startTime || isNaN(startTime) || endTime <= Date.now()) {
          // Битые данные или активность уже завершена - очищаем на сервере
          await axios.post(`${API_URL}/api/player/cancel-activity`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setCurrentActivity(null);
          return;
        }
        
        // Преобразуем данные с сервера в нужный формат
        setCurrentActivity({
          activityId: activity.activityId || activity.id,
          activityName: activity.activityName || activity.name || 'Активность',
          startTime: startTime,
          endTime: endTime
        });
      } else {
        setCurrentActivity(null);
      }
    } catch (error) {
      // Нет текущей активности - это нормально
      setCurrentActivity(null);
    }
  };

  const checkActivityCompletion = async () => {
    if (!currentActivity) return;
    
    // Проверяем валидность данных
    if (!currentActivity.endTime || isNaN(currentActivity.endTime)) {
      setCurrentActivity(null);
      return;
    }

    const now = Date.now();
    if (now >= currentActivity.endTime) {
      // Активность завершена, получаем награды
      await completeActivity();
    }
  };

  const completeActivity = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.post(
        `${API_URL}/api/player/complete-activity`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Обновляем данные игрока напрямую из ответа (без перезагрузки!)
      if (response.data.player) {
        updatePlayer({
          level: response.data.player.level,
          experience: response.data.player.experience,
          soms: response.data.player.soms,
          stats: response.data.player.stats
        });
      }
      
      // Очищаем текущую активность
      setCurrentActivity(null);
      
      // Показываем тост с результатами
      if (response.data.leveledUp) {
        toast.success(
          t('notifications.levelUpNotification', {
            level: response.data.newLevel,
            exp: response.data.experienceGained,
            soms: `${response.data.somsGained >= 0 ? '+' : ''}${response.data.somsGained}`
          }),
          { duration: 4000 }
        );
      } else {
        toast.success(
          t('notifications.activityCompleted', {
            exp: response.data.experienceGained,
            soms: `${response.data.somsGained >= 0 ? '+' : ''}${response.data.somsGained}`
          }),
          { duration: 3000 }
        );
      }
      
      // Если был штраф, показываем предупреждение
      if (response.data.penaltyApplied) {
        toast.error(t('notifications.penaltyApplied'), { duration: 2000 });
      }
    } catch (error: any) {
      console.error('Failed to complete activity:', error);
      // Если активность не найдена, просто очищаем
      if (error.response?.status === 404 || error.response?.status === 400) {
        setCurrentActivity(null);
      }
    }
  };

  const handleActivitySelect = async (activityId: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.post(
        `${API_URL}/api/player/perform-activity`,
        { activityId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const activityName = response.data.activityName || 'Активность';
      const endTime = response.data.endTime;
      const durationSeconds = response.data.durationSeconds || 60;
      
      // Вычисляем startTime на основе endTime и duration
      const startTime = endTime - (durationSeconds * 1000);
      
      // Переводим название активности на текущий язык
      const translatedActivityName = t(`activities.${activityId}`, activityName);
      toast.success(t('notifications.activityStarted', { activity: translatedActivityName }));
      
      // Обновляем текущую активность
      setCurrentActivity({
        activityId,
        activityName: translatedActivityName,
        startTime,
        endTime
      });
      
      // Прокручиваем страницу наверх чтобы было видно карточку активности
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Перезагружаем активности
      loadActivities();
    } catch (error: any) {
      console.error('Activity failed:', error);
      const message = error.response?.data?.message || error.response?.data?.error || 'Ошибка выполнения активности';
      
      // Проверяем если это кулдаун
      if (message.includes('cooldown') || message.includes('Wait')) {
        const match = message.match(/Wait (\d+) seconds/);
        if (match) {
          const seconds = parseInt(match[1]);
          const activity = activities.find(a => a.id === activityId);
          setCooldownInfo({
            activityName: activity?.name?.ru || 'Активность',
            seconds
          });
          return;
        }
      }
      
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-black dark:from-black dark:via-black dark:to-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="text-6xl"
        >
          ⏳
        </motion.div>
      </div>
    );
  }

  if (!player) {
    return null;
  }

  // Если статов нет, используем дефолтные значения
  const playerState = {
    characterId: player.characterId,
    cityId: player.cityId,
    level: player.level,
    experience: player.experience,
    experienceToNextLevel: calculateExpToNextLevel(player.level),
    soms: player.soms,
    donationCurrency: player.donationCurrency,
    stats: player.stats || {
      hunger: 100,
      health: 100,
      mood: 100,
      energy: 100
    }
  };

  return (
    <>
      <GameDashboard
        playerState={playerState}
        activities={activities}
        onActivitySelect={handleActivitySelect}
        userAvatar={user?.avatar}
        currentActivity={currentActivity}
        onActivityComplete={completeActivity}
      />

      {/* Cooldown Modal - красивое окно с обратным отсчетом */}
      {createPortal(
        <AnimatePresence>
          {cooldownInfo && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setCooldownInfo(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
              />
              
              <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-4">
                <CooldownModalContent 
                  activityName={cooldownInfo.activityName}
                  initialSeconds={cooldownInfo.seconds}
                  onClose={() => setCooldownInfo(null)}
                />
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

// Компонент с обратным отсчетом
const CooldownModalContent = ({ activityName, initialSeconds, onClose }: { activityName: string; initialSeconds: number; onClose: () => void }) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) {
      onClose();
      return;
    }

    const timer = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(onClose, 300); // Небольшая задержка перед закрытием
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white dark:bg-gray-800 rounded-[32px] p-8 max-w-md w-full shadow-2xl relative overflow-hidden pointer-events-auto"
    >
      {/* Animated Background */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full blur-3xl"
      />
      
      <div className="relative z-10 text-center">
        <motion.div
          animate={{ 
            rotate: [0, -10, 10, -10, 10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          className="text-8xl mb-4"
        >
          ⏰
        </motion.div>
        
        <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-3">
          Подожди немного!
        </h3>
        
        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 mb-6 border border-orange-200 dark:border-orange-800">
          <p className="text-gray-700 dark:text-gray-300 mb-4 text-lg">
            <span className="font-bold">{activityName}</span> еще на кулдауне
          </p>
          <div className="text-center">
            <motion.div 
              key={seconds}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-6xl font-black text-orange-600 dark:text-orange-400 mb-2"
            >
              {seconds}
            </motion.div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {seconds === 1 ? 'секунда' : seconds < 5 ? 'секунды' : 'секунд'} до следующего использования
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 h-2 bg-white/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: `${(seconds / initialSeconds) * 100}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
            />
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-2xl hover:shadow-xl transition-all"
        >
          Понятно
        </motion.button>
      </div>
    </motion.div>
  );
};

function calculateExpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}
