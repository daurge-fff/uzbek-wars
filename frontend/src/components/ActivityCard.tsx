import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import Emoji from './Emoji';

interface Activity {
  id: string;
  name: string;
  icon: string;
  description: string;
  rewards: {
    experience: number;
    soms: number;
  };
  statModifiers?: {
    hunger?: number;
    health?: number;
    mood?: number;
    energy?: number;
  };
  cooldown: number;
  requiredLevel: number;
  lastExecuted?: number;
}

interface ActivityCardProps {
  activity: Activity;
  playerLevel: number;
  isAvailable: boolean;
  onExecute: () => void;
}

export const ActivityCard = ({ activity, playerLevel, isAvailable, onExecute }: ActivityCardProps) => {
  const { t } = useTranslation();
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    if (activity.lastExecuted) {
      const elapsed = Date.now() - activity.lastExecuted;
      const remaining = Math.max(0, activity.cooldown * 1000 - elapsed);
      setCooldownRemaining(remaining);

      if (remaining > 0) {
        const timer = setInterval(() => {
          const newRemaining = Math.max(0, activity.cooldown * 1000 - (Date.now() - activity.lastExecuted!));
          setCooldownRemaining(newRemaining);
          if (newRemaining === 0) clearInterval(timer);
        }, 1000);
        return () => clearInterval(timer);
      }
    }
    return undefined;
  }, [activity.lastExecuted, activity.cooldown]);

  const isLevelLocked = playerLevel < activity.requiredLevel;
  const isOnCooldown = cooldownRemaining > 0;
  const isDisabled = !isAvailable || isLevelLocked || isOnCooldown;

  const formatCooldown = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <motion.button
      onClick={onExecute}
      disabled={isDisabled}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
      whileHover={!isDisabled ? { scale: 1.02, y: -4 } : {}}
      className={`min-h-touch w-full bg-white/90 backdrop-blur-xl rounded-[24px] shadow-lg p-4 transition-all border border-gray-100 ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-2xl'
      }`}
    >
      <div className="mb-2"><Emoji emoji={activity.icon} size={48} /></div>
      <h3 className="text-sm font-black text-gray-900 mb-1">{t(`activities.${activity.id}`)}</h3>
      <p className="text-xs text-gray-600 mb-2 font-medium">{activity.description}</p>

      <div className="flex justify-between text-xs mb-2">
        <span className="text-green-600 font-black">+{activity.rewards.experience} XP</span>
        <span className="text-yellow-600 font-black">+{activity.rewards.soms} <Emoji emoji="💰" size={16} /></span>
      </div>

      {activity.statModifiers && (
        <div className="flex gap-1 text-xs mb-2 flex-wrap justify-center">
          {activity.statModifiers.hunger && (
            <span className={`px-2 py-1 rounded-full font-black flex items-center gap-1 ${activity.statModifiers.hunger > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <Emoji emoji="🍖" size={14} />{activity.statModifiers.hunger > 0 ? '+' : ''}{activity.statModifiers.hunger}
            </span>
          )}
          {activity.statModifiers.health && (
            <span className={`px-2 py-1 rounded-full font-black flex items-center gap-1 ${activity.statModifiers.health > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <Emoji emoji="❤️" size={14} />{activity.statModifiers.health > 0 ? '+' : ''}{activity.statModifiers.health}
            </span>
          )}
          {activity.statModifiers.mood && (
            <span className={`px-2 py-1 rounded-full font-black flex items-center gap-1 ${activity.statModifiers.mood > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <Emoji emoji="😊" size={14} />{activity.statModifiers.mood > 0 ? '+' : ''}{activity.statModifiers.mood}
            </span>
          )}
          {activity.statModifiers.energy && (
            <span className={`px-2 py-1 rounded-full font-black flex items-center gap-1 ${activity.statModifiers.energy > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <Emoji emoji="⚡" size={14} />{activity.statModifiers.energy > 0 ? '+' : ''}{activity.statModifiers.energy}
            </span>
          )}
        </div>
      )}

      {isLevelLocked && (
        <div className="text-xs text-red-600 font-black bg-red-50 px-2 py-1 rounded-full">
          {t('ui.level_required') || 'Требуется'} {activity.requiredLevel} {t('character.level')}
        </div>
      )}

      {isOnCooldown && (
        <div className="text-xs text-orange-600 font-black bg-orange-50 px-2 py-1 rounded-full">
          {formatCooldown(cooldownRemaining)}
        </div>
      )}
    </motion.button>
  );
};
