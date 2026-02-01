import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface ReferredFriend {
  username: string;
  avatar: string;
  level: number;
  registeredAt: string;
}

interface ReferralPanelProps {
  referralCode: string;
  referralLink: string;
  referredFriends: ReferredFriend[];
  totalBonus: {
    crystals: number;
    soms: number;
  };
}

export const ReferralPanel = ({ 
  referralCode, 
  referralLink, 
  referredFriends,
  totalBonus 
}: ReferralPanelProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success(t('referral.copied', 'Ссылка скопирована!'));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error(t('referral.copyError', 'Ошибка копирования'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[32px] shadow-2xl p-6">
          <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mb-4">
            {t('referral.title', 'Пригласи друзей')}
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('referral.description', 'Получай 50 кристаллов и 500 сомов за каждого друга!')}
          </p>

          <div className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-[24px] p-6 text-white mb-4">
            <div className="text-center mb-4">
              <div className="text-sm opacity-90 mb-2">{t('referral.yourCode', 'Твой код')}</div>
              <div className="text-4xl font-black tracking-wider">{referralCode}</div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={copyToClipboard}
              className="w-full py-3 bg-white/20 backdrop-blur-xl rounded-full font-bold flex items-center justify-center gap-2 hover:bg-white/30 transition-all"
            >
              {copied ? '✓' : '📋'} {copied ? t('referral.copied', 'Скопировано!') : t('referral.copy', 'Копировать ссылку')}
            </motion.button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-[20px] p-4 text-center">
              <div className="text-3xl mb-2">💎</div>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{totalBonus.crystals}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{t('referral.totalCrystals', 'Всего кристаллов')}</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-[20px] p-4 text-center">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-2xl font-black text-orange-600 dark:text-orange-400">{totalBonus.soms}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{t('referral.totalSoms', 'Всего сомов')}</div>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[32px] shadow-2xl p-6">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">
            {t('referral.friends', 'Твои друзья')} ({referredFriends.length})
          </h2>

          {referredFriends.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-6xl mb-4">👥</div>
              <p>{t('referral.noFriends', 'Пока никто не присоединился')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referredFriends.map((friend, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-[20px]"
                >
                  <div className="text-4xl">{friend.avatar}</div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-900 dark:text-white">{friend.username}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t('referral.level', 'Уровень')} {friend.level}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(friend.registeredAt).toLocaleDateString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
