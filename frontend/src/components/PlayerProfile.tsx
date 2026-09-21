import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Emoji from './Emoji';
import { createPortal } from 'react-dom';


interface PlayerStats {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  soms: number;
  crystals: number;
  totalActivities: number;
  daysPlayed: number;
  achievements: number;
  // Combat stats
  strength?: number;
  defense?: number;
  agility?: number;
  stamina?: number;
  intelligence?: number;
  luck?: number;
  statPoints?: number;
  combatPower?: number;
  loginStreak?: number;
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
  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(playerInfo.avatar);
  const [telegramUrl, setTelegramUrl] = useState('');

  const statCards = [
    { label: t('profile.totalActivities', 'Всего активностей'), value: stats.totalActivities, icon: <Emoji emoji="🎯" size={32} />, gradient: 'from-blue-500 to-cyan-500' },
    { label: t('profile.daysPlayed', 'Дней в игре'), value: stats.daysPlayed, icon: <Emoji emoji="📅" size={32} />, gradient: 'from-green-500 to-emerald-500' },
    { label: t('profile.achievements', 'Достижений'), value: stats.achievements, icon: <Emoji emoji="🏆" size={32} />, gradient: 'from-yellow-500 to-orange-500' },
    { label: t('tasks.streak', 'Стрик'), value: stats.loginStreak || 0, icon: <Emoji emoji="🔥" size={32} />, gradient: 'from-orange-600 to-red-600' },
    { label: t('profile.level', 'Уровень'), value: stats.level, icon: <Emoji emoji="⭐" size={32} />, gradient: 'from-purple-500 to-pink-500' }
  ];

  const handleVerify = async () => {
    // Generate verification code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const botUsername = 'uzbekwars_bot';
    const url = `https://t.me/${botUsername}?start=${code}`;

    setTelegramUrl(url);
    setShowVerifyModal(false);
    setShowTelegramModal(true);
  };

  const handleOpenTelegram = () => {
    window.open(telegramUrl, '_blank');
    setShowTelegramModal(false);
    setVerifying(true);

    // Simulate verification
    setTimeout(() => {
      setVerifying(false);
      if (onVerify) onVerify();
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-black dark:from-black dark:via-black dark:to-black p-4 pb-32">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-purple-900/50 backdrop-blur-xl rounded-[32px] shadow-sm p-6 border border-gray-100 dark:border-purple-500/30"
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
                  <Emoji emoji="🏙️" size={14} className="inline mr-1" /> {playerInfo.cityName}
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
              <div className="text-2xl mb-1"><Emoji emoji="💰" size={24} /></div>
              <div className="text-2xl font-black text-white">
                {stats.soms.toLocaleString()}
              </div>
              <div className="text-xs text-white/80 font-semibold">
                {t('currency.soms', 'сомов')}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-[20px] p-4 shadow-lg">
              <div className="text-2xl mb-1"><Emoji emoji="💎" size={24} /></div>
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
              className={`py-3 font-bold rounded-full shadow-lg ${isVerified
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
          className="bg-white dark:bg-gray-800 backdrop-blur-xl rounded-[32px] shadow-sm p-6 border border-gray-100 dark:border-gray-700"
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

        {/* Combat Stats - NEW */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 backdrop-blur-xl rounded-[32px] shadow-sm p-6 border-2 border-red-200 dark:border-red-800"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <span><Emoji emoji="⚔️" size={24} /></span>
              <span>{t('stats.title', 'Боевые Статы')}</span>
            </h2>
            <div className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white font-black text-sm">
              {t('stats.combatPower', 'Мощь')}: {stats.combatPower || 0}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'strength', icon: <Emoji emoji="💪" size={24} />, color: 'from-red-500 to-orange-500' },
              { key: 'defense', icon: <Emoji emoji="🛡️" size={24} />, color: 'from-blue-500 to-cyan-500' },
              { key: 'agility', icon: <Emoji emoji="⚡" size={24} />, color: 'from-yellow-500 to-amber-500' },
              { key: 'stamina', icon: <Emoji emoji="❤️" size={24} />, color: 'from-green-500 to-emerald-500' },
              { key: 'intelligence', icon: <Emoji emoji="🧠" size={24} />, color: 'from-purple-500 to-pink-500' },
              { key: 'luck', icon: <Emoji emoji="🍀" size={24} />, color: 'from-teal-500 to-green-500' }
            ].map((stat, index) => (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + index * 0.05 }}
                className={`bg-gradient-to-br ${stat.color} rounded-xl p-3 text-center shadow-lg`}
              >
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-xl font-black text-white mb-0.5">
                  {stats[stat.key as keyof PlayerStats] || (stat.key === 'luck' ? '0.00' : 0)}
                </div>
                <div className="text-[10px] text-white/90 font-semibold">
                  {t(`stats.${stat.key}`, stat.key)}
                </div>
              </motion.div>
            ))}
          </div>
          {stats.statPoints !== undefined && stats.statPoints > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl border border-amber-300 dark:border-amber-700 text-center"
            >
              <span className="text-amber-800 dark:text-amber-200 font-bold text-sm">
                <Emoji emoji="⭐" size={14} className="inline mr-1" /> {t('stats.availablePoints', 'Доступно')}: {stats.statPoints} {t('stats.pointsToDistribute', 'очков для распределения')}
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Referral Code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[32px] shadow-sm p-6 text-white"
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
      {createPortal(
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
                  className="w-full max-w-[450px] bg-white dark:bg-gray-800 backdrop-blur-xl rounded-[32px] shadow-sm p-6 pointer-events-auto"
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
                            className={`text-3xl p-2 rounded-[12px] transition-all ${selectedAvatar === emoji
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
        </AnimatePresence>,
        document.body
      )}

      {/* Verify Modal */}
      {createPortal(
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
                  <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[32px] p-1 shadow-sm">
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
                              <Emoji emoji="🔒" size={64} />
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
                                <Emoji emoji="✅" size={24} />
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
                                <Emoji emoji="⭐" size={24} />
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
        </AnimatePresence>,
        document.body
      )}

      {/* Telegram Opening Modal */}
      {createPortal(
        <AnimatePresence>
          {showTelegramModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowTelegramModal(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              />

              <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="w-full max-w-[500px] pointer-events-auto"
                >
                  <div className="bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 rounded-[32px] p-1 shadow-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-[28px] p-8">
                      <div className="text-center mb-6">
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                          className="text-8xl mb-4"
                        >
                          ✈️
                        </motion.div>
                        <h2 className="text-3xl font-black bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent mb-2">
                          Открыть Telegram
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Следуйте инструкциям для верификации
                        </p>
                      </div>

                      <div className="space-y-4 mb-8">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                          className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-[20px] border border-blue-200 dark:border-blue-800"
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg">
                            1
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white mb-1">
                              Откройте бота
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Нажмите кнопку ниже, чтобы открыть @uzbekwars_bot
                            </div>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                          className="flex items-start gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-[20px] border border-purple-200 dark:border-purple-800"
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg">
                            2
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white mb-1">
                              Нажмите START
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              В боте нажмите кнопку "START" или отправьте /start
                            </div>
                          </div>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 }}
                          className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-[20px] border border-green-200 dark:border-green-800"
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-black text-lg shadow-lg">
                            3
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white mb-1">
                              Подтвердите аккаунт
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Бот автоматически привяжет ваш аккаунт
                            </div>
                          </div>
                        </motion.div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleOpenTelegram}
                          className="py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-full shadow-lg text-lg"
                        >
                          ✈️ Открыть
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowTelegramModal(false)}
                          className="py-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-full"
                        >
                          Отмена
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
