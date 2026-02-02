import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GameDashboard } from './GameDashboard';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export const GameDashboardContainer = () => {
  const { player, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/start');
      return;
    }

    loadActivities();
  }, [isAuthenticated]);

  const loadActivities = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.get(`${API_URL}/api/activities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActivities(response.data);
    } catch (error) {
      console.error('Failed to load activities:', error);
      toast.error('Не удалось загрузить активности');
    } finally {
      setLoading(false);
    }
  };

  const handleActivitySelect = async (activityId: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await axios.post(
        `${API_URL}/api/activities/${activityId}/perform`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Активность выполнена!');
      // TODO: Update player state
      console.log('Activity result:', response.data);
    } catch (error: any) {
      console.error('Activity failed:', error);
      toast.error(error.response?.data?.message || 'Ошибка выполнения активности');
    }
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
    stats: {
      hunger: 75, // TODO: Get from player
      health: 90,
      mood: 60,
      energy: 80
    }
  };

  return (
    <GameDashboard
      playerState={playerState}
      activities={activities}
      onActivitySelect={handleActivitySelect}
    />
  );
};

function calculateExpToNextLevel(level: number): number {
  // Formula: 100 * level^1.5
  return Math.floor(100 * Math.pow(level, 1.5));
}
