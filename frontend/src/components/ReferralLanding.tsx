import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export const ReferralLanding = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [referrerInfo, setReferrerInfo] = useState<any>(null);

  useEffect(() => {
    // Store referral code in localStorage
    if (code) {
      localStorage.setItem('referralCode', code);
      
      // TODO: Fetch referrer info from API
      // For now, use mock data
      setReferrerInfo({
        username: code.replace(/[0-9]/g, ''),
        avatar: '👨‍🌾'
      });
    }
  }, [code]);

  const handleLogin = () => {
    // Navigate to auth page with referral code stored
    navigate('/auth');
  };

  return (
    <div className="max-w-md w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[32px] shadow-2xl p-8 border border-gray-100 dark:border-gray-700"
      >
        {/* Referrer Info */}
        {referrerInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-6"
          >
            <div className="text-7xl mb-4">{referrerInfo.avatar}</div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
              {referrerInfo.username} пригласил вас!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Присоединяйтесь к Узбек Варс
            </p>
          </motion.div>
        )}

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 mb-6"
        >
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-[20px] border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎁</span>
              <div>
                <div className="font-bold text-gray-900 dark:text-white text-sm">
                  Бонус при регистрации
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Получите стартовые ресурсы
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-[20px] border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3">
              <span className="text-3xl">👥</span>
              <div>
                <div className="font-bold text-gray-900 dark:text-white text-sm">
                  Играйте вместе
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Присоединитесь к городу друга
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-[20px] border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⭐</span>
              <div>
                <div className="font-bold text-gray-900 dark:text-white text-sm">
                  Эксклюзивные награды
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Специальные бонусы для рефералов
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Login Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogin}
          className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black rounded-full shadow-lg text-lg"
        >
          🚀 Начать играть
        </motion.button>

        {/* Referral Code Display */}
        {code && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-center"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Реферальный код: <span className="font-bold">{code}</span>
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
