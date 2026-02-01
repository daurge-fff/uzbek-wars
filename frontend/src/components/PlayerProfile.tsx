import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PlayerStats {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  soms: number;
  crystals: number;
  totalActivities: number;
  daysPlayed: number;
  achievements: number;
}

interface PlayerInfo {
  username: string;
  avatar: string;
  characterName: string;
  cityName: string;
  joinedDate: string;
  referralCode: string;
}

interface PlayerProfileProps {
  playerInfo: PlayerInfo;
  stats: PlayerStats;
  onEditProfile: () => void;
  isVerified?: boolean;
  telegramUsername?: string;
  onVerify?: () => void;
}

export const PlayerProfile = ({ playerInfo, stats, onEditProfile, isVerified = false, onVerify }: PlayerProfileProps) => {
  const { t } = useTranslation();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(playerInfo.avatar);

  const statCards = [
    { label: t('profile.totalActivities', 'Всего активностей'), value: stats.totalActivities, icon: '🎯', gradient: 'from-blue-500 to-cyan-500' },
    { label: t('profile.daysPlayed', 'Дней в игре'), value: stats.daysPlayed, icon: '📅', gradient: 'from-green-500 to-emerald-500' },
    { label: t('profile.achievements', 'Достижений'), value: stats.achievements, icon: '🏆', gradient: 'from-yellow-500 to-orange-500' },
    { label: t('profile.level', 'Уровень'), value: stats.level, icon: '⭐', gradient: 'from-purple-500 to-pink-500' }
  ];

  const handleVerify = async () => {
    setVerifying(true);
    
    try {
      // Request verification code from backend
      const response = await fetch('/api/auth/verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add auth token from context/localStorage
          // 'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate verification code');
      }
      
      const { code } = await response.json();
      
      const botUsername = 'uzbekwars_bot';
      const telegramUrl = `https://t.me/${botUsername}?start=${code}`;
      
      // Open Telegram
      window.open(telegramUrl, '_blank');
      
      // Poll for verification status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch('/api/auth/verification-status', {
            headers: {
              // TODO: Add auth token from context/localStorage
              // 'Authorization': `Bearer ${token}`
            }
          });
          
          if (statusResponse.ok) {
            const { isVerified } = await statusResponse.json();
            if (isVerified) {
              clearInterval(pollInterval);
              setVerifying(false);
              setShowVerifyModal(false);
              if (onVerify) onVerify();
            }
          }
        } catch (pollError) {
          console.error('Polling error:', pollError);
        }
      }, 2000);
      
      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (verifying) {
          setVerifying(false);
          // Show timeout message
          alert('Время верификации истекло. Попробуйте снова.');
        }
      }, 5 * 60 * 1000);
      
    } catch (error) {
      console.error('Verification error:', error);
      setVerifying(false);
      alert('Ошибка верификации. Попробуйте позже.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-purple-900/50 backdrop-blur-xl rounded-[32px] shadow-2xl p-6 border border-gray-100 dark:border-purple-500/30"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="relative">
              <div className="text-7xl">{playerInfo.avatar}</div>
              {isVerified && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-4 border-white dark:border-gray-800 flex items-center justify-center shadow-lg"
                >
                  <span className="text-sm">✓</span>
                </motion.div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-1">
                {playerInfo.username}
              </h1>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-2 font-semibold">
                {playerInfo.characterName}
              </p>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full font-bold">
                  🏙️ {playerInfo.cityName}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {t('profile.joined', 'В игре с')} {new Date(playerInfo.joinedDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-bold text-gray-700 dark:text-gray-300">
                Уровень {stats.level}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {stats.experience}/{stats.experienceToNextLevel} XP
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(stats.experience / stats.experienceToNextLevel) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"
              />
            </div>
          </div>

          {/* Currency Display */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[20px] p-4 shadow-lg">
              <div className="text-2xl mb-1">💰</div>
              <div className="text-2xl font-black text-white">
                {stats.soms.toLocaleString()}
              </div>
              <div className="text-xs text-white/80 font-semibold">
                {t('currency.soms', 'сомов')}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-[20px] p-4 shadow-lg">
              <div className="text-2xl mb-1">💎</div>
              <div className="text-2xl font-black text-white">
                {stats.crystals}
              </div>
              <div className="text-xs text-white/80 font-semibold">
                {t('currency.crystals', 'кристаллов')}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowEditModal(true)}
              className="py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-full shadow-lg"
            >
              ✏️ {t('profile.edit', 'Редактировать')}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowVerifyModal(true)}
              className={`py-3 font-bold rounded-full shadow-lg ${
                isVerified
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              {isVerified ? '✓ Верифицирован' : '🔒 Верифицировать'}
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 backdrop-blur-xl rounded-[32px] shadow-2xl p-6 border border-gray-100 dark:border-gray-700"
        >
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">
            {t('profile.statistics', 'Статистика')}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                className={`bg-gradient-to-br ${stat.gradient} rounded-[20px] p-4 text-center shadow-lg`}
              >
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-black text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-white/90 font-semibold">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Referral Code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[32px] shadow-2xl p-6 text-white"
        >
          <h3 className="text-lg font-bold mb-2">
            {t('profile.referralCode', 'Твой реферальный код')}
          </h3>
          <div className="text-3xl font-black tracking-wider text-center py-4 bg-white/10 rounded-[20px] backdrop-blur-sm">
            {playerInfo.referralCode}
          </div>
          <p className="text-sm text-white/80 text-center mt-3">
            {t('profile.referralHint', 'Пригласи друзей и получи бонусы!')}
          </p>
        </motion.div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            
            <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="w-full max-w-[450px] bg-white dark:bg-gray-800 backdrop-blur-xl rounded-[32px] shadow-2xl p-6 pointer-events-auto"
              >
                <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mb-6">
                  Редактировать профиль
                </h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Имя пользователя
                    </label>
                    <input
                      type="text"
                      defaultValue={playerInfo.username}
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-[16px] text-gray-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      Выбрать аватар
                    </label>
                    <div className="grid grid-cols-6 gap-2 max-h-[300px] overflow-y-auto p-1">
                      {['👨‍🌾', '👩‍🍳', '👨‍💼', '👨‍🔧', '👩‍🎨', '👨‍💻', '👩‍🎓', '👨‍🚀', '👩‍⚕️', '👨‍🎤', '👨‍🏫', '👩‍🔬', '🧑‍🎤', '🧑‍🚒', '👮‍♂️', '👮‍♀️', '🕵️‍♂️', '🕵️‍♀️', '💂‍♂️', '💂‍♀️', '👷‍♂️', '👷‍♀️', '🤴', '👸', '👳‍♂️', '👳‍♀️', '👲', '🧕', '🤵', '👰'].map((emoji) => (
                        <motion.button
                          key={emoji}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedAvatar(emoji)}
                          className={`text-3xl p-2 rounded-[12px] transition-all ${
                            selectedAvatar === emoji
                              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg ring-2 ring-indigo-300 dark:ring-indigo-700'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {emoji}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowEditModal(false);
                      onEditProfile();
                    }}
                    className="py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-full shadow-lg"
                  >
                    Сохранить
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowEditModal(false)}
                    className="py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-full"
                  >
                    Отмена
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Verify Modal */}
      <AnimatePresence>
        {showVerifyModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !verifying && setShowVerifyModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            
            <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="w-full max-w-[450px] pointer-events-auto"
              >
                <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[32px] p-1 shadow-2xl">
                  <div className="bg-white dark:bg-gray-900 rounded-[28px] p-6">
                    {verifying ? (
                      <div className="text-center py-8">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="text-6xl mb-4"
                        >
                          ⏳
                        </motion.div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                          Ожидание верификации...
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Подтвердите в Telegram боте
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="text-center mb-6">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500 }}
                            className="text-7xl mb-4"
                          >
                            🔒
                          </motion.div>
                          <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mb-2">
                            Верификация аккаунта
                          </h2>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Привяжите Telegram для получения галочки
                          </p>
                        </div>

                        <div className="space-y-4 mb-6">
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-[20px] border border-blue-200 dark:border-blue-800">
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">✅</span>
                              <div>
                                <div className="font-bold text-gray-900 dark:text-white text-sm mb-1">
                                  Защита аккаунта
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  Дополнительная безопасность через Telegram
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-[20px] border border-purple-200 dark:border-purple-800">
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">⭐</span>
                              <div>
                                <div className="font-bold text-gray-900 dark:text-white text-sm mb-1">
                                  Эксклюзивные бонусы
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  Специальные награды для верифицированных
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleVerify}
                            className="py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-full shadow-lg"
                          >
                            ✈️ Открыть бота
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowVerifyModal(false)}
                            className="py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-full"
                          >
                            Отмена
                          </motion.button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
