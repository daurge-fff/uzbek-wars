import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 pb-20">
      {/* Player Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/95 backdrop-blur-xl rounded-[32px] shadow-2xl p-6 mb-6 border border-gray-100"
      >
        {/* Level Badge */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[24px] flex items-center justify-center shadow-xl">
            <div className="text-center">
              <div className="text-xs text-white/80 font-medium">LVL</div>
              <div className="text-2xl font-black text-white">{playerState.level}</div>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-black text-gray-700">Опыт</span>
              <span className="text-xs font-black text-gray-900">{playerState.experience}/{playerState.experienceToNextLevel}</span>
            </div>
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(playerState.experience / playerState.experienceToNextLevel) * 100}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Currency */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-[20px] p-4 border-2 border-yellow-200 shadow-md">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl">💰</span>
              <span className="text-xs text-gray-600 font-medium">Сомы</span>
            </div>
            <div className="text-2xl font-black text-gray-900">{playerState.soms}</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[20px] p-4 border-2 border-purple-200 shadow-md">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl">💎</span>
              <span className="text-xs text-gray-600 font-medium">Кристаллы</span>
            </div>
            <div className="text-2xl font-black text-gray-900">{playerState.donationCurrency}</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-[16px] p-3 border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🍖</span>
              <span className="text-xs font-black text-gray-700">Голод</span>
            </div>
            <div className="bg-white/50 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full"
                style={{ width: `${playerState.stats.hunger}%` }}
              />
            </div>
            <div className="text-right text-xs font-black text-gray-900 mt-1">{playerState.stats.hunger}%</div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-[16px] p-3 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">❤️</span>
              <span className="text-xs font-black text-gray-700">Здоровье</span>
            </div>
            <div className="bg-white/50 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-400 to-pink-400 rounded-full"
                style={{ width: `${playerState.stats.health}%` }}
              />
            </div>
            <div className="text-right text-xs font-black text-gray-900 mt-1">{playerState.stats.health}%</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-[16px] p-3 border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">😊</span>
              <span className="text-xs font-black text-gray-700">Настроение</span>
            </div>
            <div className="bg-white/50 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
                style={{ width: `${playerState.stats.mood}%` }}
              />
            </div>
            <div className="text-right text-xs font-black text-gray-900 mt-1">{playerState.stats.mood}%</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-[16px] p-3 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">⚡</span>
              <span className="text-xs font-black text-gray-700">Энергия</span>
            </div>
            <div className="bg-white/50 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
                style={{ width: `${playerState.stats.energy}%` }}
              />
            </div>
            <div className="text-right text-xs font-black text-gray-900 mt-1">{playerState.stats.energy}%</div>
          </div>
        </div>
      </motion.div>

      {/* Activities Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="text-3xl font-black text-gray-900 mb-4 px-2">
          {t('activities.title')}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {activities.map((activity, index) => (
            <motion.button
              key={activity.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              onClick={() => onActivitySelect(activity.id)}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95 }}
              className="min-h-touch bg-white/95 backdrop-blur-xl rounded-[24px] shadow-xl p-6 hover:shadow-2xl transition-all border border-gray-100"
            >
              <div className="text-5xl mb-3">{activity.icon}</div>
              <div className="text-sm font-black text-gray-900">
                {activity.name}
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
