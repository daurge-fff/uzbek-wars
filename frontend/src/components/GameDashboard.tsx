import { useTranslation } from 'react-i18next';
import { ProgressBar } from './ProgressBar';
import { StatBar } from './StatBar';

interface PlayerState {
  characterId: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  soms: number;
  donationCurrency: number;
  stats: {
    hunger: number;
    health: number;
    mood: number;
    energy: number;
  };
}

interface Activity {
  id: string;
  name: string;
  icon: string;
}

interface GameDashboardProps {
  playerState: PlayerState;
  activities: Activity[];
  onActivitySelect: (activityId: string) => void;
}

export const GameDashboard = ({ playerState, activities, onActivitySelect }: GameDashboardProps) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white shadow-md z-10 p-4">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl">
            {playerState.level}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-text-primary">
              {t('character.level')} {playerState.level}
            </h2>
            <ProgressBar
              current={playerState.experience}
              max={playerState.experienceToNextLevel}
              label={`${playerState.experience}/${playerState.experienceToNextLevel}`}
              color="bg-primary"
            />
          </div>
        </div>

        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-2xl">💰</span>
            <span className="font-semibold text-text-primary">{playerState.soms}</span>
            <span className="text-text-secondary">{t('currency.soms_short')}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl">💎</span>
            <span className="font-semibold text-text-primary">{playerState.donationCurrency}</span>
            <span className="text-text-secondary">{t('currency.crystals_short')}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-3 space-y-2">
          <StatBar
            label={t('stats.hunger')}
            value={playerState.stats.hunger}
            icon="🍖"
            color="bg-warning"
          />
          <StatBar
            label={t('stats.health')}
            value={playerState.stats.health}
            icon="❤️"
            color="bg-danger"
          />
          <StatBar
            label={t('stats.mood')}
            value={playerState.stats.mood}
            icon="😊"
            color="bg-primary"
          />
          <StatBar
            label={t('stats.energy')}
            value={playerState.stats.energy}
            icon="⚡"
            color="bg-success"
          />
        </div>
      </div>

      {/* Activities Grid */}
      <div className="p-4">
        <h3 className="text-xl font-bold text-text-primary mb-4">
          {t('activities.title') || 'Активности'}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {activities.map((activity) => (
            <button
              key={activity.id}
              onClick={() => onActivitySelect(activity.id)}
              className="min-h-touch bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl mb-2">{activity.icon}</div>
              <div className="text-sm font-semibold text-text-primary">
                {activity.name}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
