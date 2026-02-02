import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GameDashboard } from './GameDashboard';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityResult {
  success: boolean;
  experienceGained: number;
  somsGained: number;
  leveledUp: boolean;
  newLevel?: number;
  levelsGained?: number;
  penaltyApplied: boolean;
  statChanges: any;
  player: any;
}

export const GameDashboardContainer = () => {
  const { player, token, isAuthenticated, user, refreshPlayer } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentActivity, setCurrentActivity] = useState<any>(null);
  const [activityResult, setActivityResult] = useState<ActivityResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/start');
      return;
    }

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
      toast.error('Не удалось загрузить активности');
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
        setCurrentActivity(response.data.activity);
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
      
      setActivityResult(response.data);
      setShowResultModal(true);
      setCurrentActivity(null);
      
      // Обновляем данные игрока
      await refreshPlayer();
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
      
      toast.success(`Начал: ${activityName}!`);
      
      // Обновляем текущую активность
      setCurrentActivity({
        activityId,
        activityName,
        startTime: Date.now(),
        endTime: response.data.endTime
      });
      
      // Перезагружаем активности
      loadActivities();
    } catch (error: any) {
      console.error('Activity failed:', error);
      const message = error.response?.data?.message || 'Ошибка выполнения активности';
      toast.error(message);
    }
  };

  const closeResultModal = () => {
    setShowResultModal(false);
    setActivityResult(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 flex items-center justify-center">
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

  const playerState = {
    characterId: player.characterId,
    level: player.level,
    experience: player.experience,
    experienceToNextLevel: calculateExpToNextLevel(player.level),
    soms: player.soms,
    donationCurrency: player.donationCurrency,
    stats: player.stats || {
      hunger: 75,
      health: 90,
      mood: 60,
      energy: 80
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
      />

      {/* Activity Result Modal */}
      <AnimatePresence>
        {showResultModal && activityResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeResultModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-[32px] p-8 max-w-md w-full shadow-2xl"
            >
              <div className="text-center">
                <div className="text-8xl mb-4">
                  {activityResult.leveledUp ? '🎉' : activityResult.penaltyApplied ? '😰' : '✅'}
                </div>
                
                <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
                  {activityResult.leveledUp ? 'Новый уровень!' : 'Активность завершена!'}
                </h3>

                {activityResult.leveledUp && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl">
                    <div className="text-white text-2xl font-black">
                      Уровень {activityResult.newLevel}!
                    </div>
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <span className="text-gray-700 dark:text-gray-300">Опыт</span>
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                      +{activityResult.experienceGained} XP
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                    <span className="text-gray-700 dark:text-gray-300">Сомы</span>
                    <span className={`text-xl font-black ${
                      activityResult.somsGained >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {activityResult.somsGained >= 0 ? '+' : ''}{activityResult.somsGained} 💰
                    </span>
                  </div>

                  {activityResult.penaltyApplied && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                      <span className="text-red-600 dark:text-red-400 font-bold">
                        ⚠️ Попался! Штраф применен
                      </span>
                    </div>
                  )}

                  {/* Stat Changes */}
                  {activityResult.statChanges && Object.keys(activityResult.statChanges).length > 0 && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                      <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">Изменения статов:</div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {Object.entries(activityResult.statChanges).map(([stat, value]: [string, any]) => (
                          <span key={stat} className={`text-sm font-bold ${
                            value > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stat}: {value > 0 ? '+' : ''}{value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={closeResultModal}
                  className="w-full px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-lg rounded-full hover:shadow-lg transition-all"
                >
                  Отлично!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

function calculateExpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}
