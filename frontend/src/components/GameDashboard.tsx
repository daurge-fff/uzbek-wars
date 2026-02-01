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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-xl shadow-2xl z-10 p-6 border-b border-gray-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[24px] flex items-center justify-center text-white font-black text-2xl shadow-xl">
            {playerState.level}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-gray-900 mb-1">
              {t('character.level')} {playerState.level}
            </h2>
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500 shadow-lg"
                style={{ width: `${(playerState.experience / playerState.experienceToNextLevel) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1 font-medium">
              {playerState.experience}/{playerState.experienceToNextLevel} XP
            </p>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <div className="flex-1 flex items-center gap-2 bg-gradient-to-br from-yellow-50 to-orange-50 px-4 py-3 rounded-[20px] border-2 border-yellow-200 shadow-lg">
            <span className="text-3xl">💰</span>
            <div>
              <span className="font-black text-gray-900 text-lg block">{playerState.soms}</span>
              <span className="text-gray-600 font-medium text-xs">{t('currency.soms_short')}</span>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-2 bg-gradient-to-br from-purple-50 to-pink-50 px-4 py-3 rounded-[20px] border-2 border-purple-200 shadow-lg">
            <span className="text-3xl">💎</span>
            <div>
              <span className="font-black text-gray-900 text-lg block">{playerState.donationCurrency}</span>
              <span className="text-gray-600 font-medium text-xs">{t('currency.crystals_short')}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍖</span>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-xs font-black text-gray-700">{t('stats.hunger')}</span>
                <span className="text-xs font-black text-gray-900">{playerState.stats.hunger}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${playerState.stats.hunger}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-2xl">❤️</span>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-xs font-black text-gray-700">{t('stats.health')}</span>
                <span className="text-xs font-black text-gray-900">{playerState.stats.health}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-red-400 to-pink-400 rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${playerState.stats.health}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-2xl">😊</span>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-xs font-black text-gray-700">{t('stats.mood')}</span>
                <span className="text-xs font-black text-gray-900">{playerState.stats.mood}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${playerState.stats.mood}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-xs font-black text-gray-700">{t('stats.energy')}</span>
                <span className="text-xs font-black text-gray-900">{playerState.stats.energy}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${playerState.stats.energy}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activities Grid */}
      <div className="p-6">
        <h3 className="text-3xl font-black text-gray-900 mb-6">
          {t('activities.title')}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {activities.map((activity) => (
            <button
              key={activity.id}
              onClick={() => onActivitySelect(activity.id)}
              className="min-h-touch bg-white/95 backdrop-blur-xl rounded-[24px] shadow-xl p-6 hover:shadow-2xl transition-all hover:scale-105 active:scale-95 border border-gray-100"
            >
              <div className="text-5xl mb-3">{activity.icon}</div>
              <div className="text-sm font-black text-gray-900">
                {activity.name}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
