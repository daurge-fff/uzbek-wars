import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

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
      className={`min-h-touch w-full bg-white rounded-xl shadow-md p-4 transition-all ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
      }`}
    >
      <div className="text-4xl mb-2">{activity.icon}</div>
      <h3 className="text-sm font-bold text-text-primary mb-1">{activity.name}</h3>
      <p className="text-xs text-text-secondary mb-2">{activity.description}</p>

      <div className="flex justify-between text-xs mb-2">
        <span className="text-success">+{activity.rewards.experience} XP</span>
        <span className="text-warning">+{activity.rewards.soms} 💰</span>
      </div>

      {activity.statModifiers && (
        <div className="flex gap-1 text-xs mb-2">
          {activity.statModifiers.hunger && (
            <span className={activity.statModifiers.hunger > 0 ? 'text-success' : 'text-danger'}>
              🍖{activity.statModifiers.hunger > 0 ? '+' : ''}{activity.statModifiers.hunger}
            </span>
          )}
          {activity.statModifiers.health && (
            <span className={activity.statModifiers.health > 0 ? 'text-success' : 'text-danger'}>
              ❤️{activity.statModifiers.health > 0 ? '+' : ''}{activity.statModifiers.health}
            </span>
          )}
          {activity.statModifiers.mood && (
            <span className={activity.statModifiers.mood > 0 ? 'text-success' : 'text-danger'}>
              😊{activity.statModifiers.mood > 0 ? '+' : ''}{activity.statModifiers.mood}
            </span>
          )}
          {activity.statModifiers.energy && (
            <span className={activity.statModifiers.energy > 0 ? 'text-success' : 'text-danger'}>
              ⚡{activity.statModifiers.energy > 0 ? '+' : ''}{activity.statModifiers.energy}
            </span>
          )}
        </div>
      )}

      {isLevelLocked && (
        <div className="text-xs text-danger font-semibold">
          {t('ui.level_required') || 'Требуется'} {activity.requiredLevel} {t('character.level')}
        </div>
      )}

      {isOnCooldown && (
        <div className="text-xs text-warning font-semibold">
          {formatCooldown(cooldownRemaining)}
        </div>
      )}
    </motion.button>
  );
};
