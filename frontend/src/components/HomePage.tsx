import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { GoogleLoginButton } from './GoogleLoginButton';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface MenuCardProps {
  title: string;
  description: string;
  icon: string;
  to?: string;
  onClick?: () => void;
}

function MenuCard({ title, description, icon, to, onClick }: MenuCardProps) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    }
  };
  
  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.05, y: -8 }}
      whileTap={{ scale: 0.95 }}
      className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-6 rounded-[24px] shadow-xl hover:shadow-2xl transition-all text-left w-full border border-gray-200 dark:border-gray-700 group overflow-hidden relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-purple-500/0 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-all duration-300" />
      <div className="relative">
        <motion.div 
          className="text-5xl mb-3"
          whileHover={{ scale: 1.2, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          {icon}
        </motion.div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{title}</h2>
        <p className="text-gray-600 dark:text-gray-300 text-sm transition-colors">{description}</p>
      </div>
    </motion.button>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, player, login } = useAuth();
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (lang: 'ru' | 'uz' | 'uk' | 'en') => {
    i18n.changeLanguage(lang);
  };

  const handleMenuClick = (path: string) => {
    if (!isAuthenticated) {
      toast.error(t('auth.loginRequired', 'Войдите в аккаунт, узбек! 👆'), {
        icon: '🔒',
        duration: 3000
      });
      // Прокручиваем наверх к кнопке входа
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    navigate(path);
  };

  const handleGoogleLogin = async (idToken: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/google`, {
        idToken,
        ipAddress: '127.0.0.1',
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          deviceId: localStorage.getItem('deviceId') || Math.random().toString(36)
        }
      });
      
      const { token, user, player } = response.data;
      login(token, user, player);
      
      // Проверяем нужен ли онбординг
      const needsCharacter = !player.characterId || player.characterId === 'default';
      const needsCity = !player.cityId || player.cityId === 'default';
      
      if (needsCharacter || needsCity) {
        // Перенаправляем на дашборд, там покажется онбординг
        navigate('/dashboard');
      } else {
        toast.success(t('auth.welcome', 'Добро пожаловать') + ', ' + user.displayName + '!');
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast.error(t('auth.loginError', 'Ошибка входа'));
    }
  };

  const features = [
    {
      icon: '👥',
      title: t('home.feature1', 'Уникальные персонажи'),
      description: t('home.feature1Desc', 'Выбери героя с особыми способностями'),
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '🏛️',
      title: t('home.feature2', 'Легендарные города'),
      description: t('home.feature2Desc', 'Исследуй Самарканд, Бухару и другие'),
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: '⚔️',
      title: t('home.feature3', 'Захватывающие активности'),
      description: t('home.feature3Desc', 'Торгуй, сражайся, развивайся'),
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: '🏆',
      title: t('home.feature4', 'Соревнуйся'),
      description: t('home.feature4Desc', 'Стань лучшим в рейтинге'),
      gradient: 'from-green-500 to-emerald-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 transition-colors duration-300 overflow-hidden">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 100, 0],
            y: [0, -100, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/30 to-pink-400/30 dark:from-purple-600/20 dark:to-pink-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
            x: [0, -100, 0],
            y: [0, 100, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 dark:from-blue-600/20 dark:to-cyan-600/20 rounded-full blur-3xl"
        />
      </div>

      {/* Top Right Controls */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        {isAuthenticated && user && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-lg"
          >
            {user.avatar && user.avatar.startsWith('http') ? (
              <img src={user.avatar} alt={user.displayName} className="w-8 h-8 rounded-full" />
            ) : (
              <span className="text-2xl">{user.avatar || '👤'}</span>
            )}
            <span className="font-semibold text-gray-900 dark:text-white hidden sm:inline">
              {user.displayName}
            </span>
          </motion.div>
        )}
        <ThemeToggle />
      </div>
      
      <main className="relative container mx-auto px-4 py-12 pt-24">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 max-w-5xl mx-auto"
        >
          {/* Logo with animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="text-9xl mb-6 inline-block"
          >
            🏛️
          </motion.div>

          {/* Title - Bungee White (адаптивный под тему) */}
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white leading-tight uppercase cursor-default"
            style={{ 
              fontFamily: "'Bungee', sans-serif"
            }}
          >
            {t('app.name')}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl md:text-3xl text-gray-700 dark:text-gray-300 mb-8 font-bold"
          >
            {t('app.tagline')}
          </motion.p>

          {/* Language Switcher - центр под заголовком */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-12 flex justify-center"
          >
            <LanguageSwitcher 
              currentLanguage={i18n.language as 'ru' | 'uz' | 'uk' | 'en'} 
              onLanguageChange={handleLanguageChange}
            />
          </motion.div>

          {/* Auth Section or CTA */}
          {!isAuthenticated ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-12"
            >
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[32px] p-8 shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md mx-auto relative overflow-hidden">
                {/* Decorative gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/5 dark:via-purple-500/5 dark:to-pink-500/5" />
                
                <div className="relative">
                  <motion.div 
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="text-7xl mb-4"
                  >
                    🚀
                  </motion.div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">
                    {t('app.startAdventure', 'Начать приключение')}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg">
                    {t('auth.loginToPlay', 'Войдите чтобы начать играть')}
                  </p>
                  <GoogleLoginButton onSuccess={handleGoogleLogin} />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard')}
              className="px-10 py-5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-black text-2xl rounded-full shadow-2xl hover:shadow-3xl transition-all mb-12 inline-flex items-center gap-3"
            >
              <span className="text-3xl">🎮</span>
              {t('home.continuePlaying', 'Продолжить игру')}
            </motion.button>
          )}
        </motion.div>

        {/* Features Section - только для незалогиненных */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-4xl font-black text-center text-gray-900 dark:text-white mb-12">
              {t('home.features', 'Возможности игры')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[24px] p-6 shadow-xl border border-gray-200 dark:border-gray-700 relative overflow-hidden group"
                >
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  
                  <div className="relative">
                    <motion.div 
                      className="text-6xl mb-4"
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Navigation Menu */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h2 className="text-4xl font-black text-center text-gray-900 dark:text-white mb-12">
            {t('menu.title', 'Разделы игры')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            <MenuCard 
              title={t('menu.leaderboard')} 
              description={t('menu.leaderboardDesc')} 
              icon="🏆" 
              onClick={() => handleMenuClick('/leaderboard')}
            />
            <MenuCard 
              title={t('menu.referral')} 
              description={t('menu.referralDesc')} 
              icon="👥" 
              onClick={() => handleMenuClick('/referral')}
            />
            <MenuCard 
              title={t('menu.shop')} 
              description={t('menu.shopDesc')} 
              icon="🛍️" 
              onClick={() => handleMenuClick('/shop')}
            />
            <MenuCard 
              title={t('menu.inventory')} 
              description={t('menu.inventoryDesc')} 
              icon="📦" 
              onClick={() => handleMenuClick('/inventory')}
            />
            <MenuCard 
              title={t('menu.settings')} 
              description={t('menu.settingsDesc')} 
              icon="⚙️" 
              onClick={() => handleMenuClick('/settings')}
            />
            <MenuCard 
              title={t('menu.donate')} 
              description={t('menu.donateDesc')} 
              icon="💎" 
              onClick={() => handleMenuClick('/donate')}
            />
          </div>
        </motion.div>

        {/* Stats Section - для залогиненных */}
        {isAuthenticated && player && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[32px] p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6 text-center">
                {t('home.yourProgress', 'Ваш прогресс')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl">
                  <div className="text-3xl mb-2">⭐</div>
                  <div className="text-3xl font-black text-gray-900 dark:text-white">{player.level}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{t('dashboard.level', 'Уровень')}</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl">
                  <div className="text-3xl mb-2">💰</div>
                  <div className="text-3xl font-black text-gray-900 dark:text-white">{player.soms}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{t('dashboard.soms', 'Сомы')}</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl">
                  <div className="text-3xl mb-2">💎</div>
                  <div className="text-3xl font-black text-gray-900 dark:text-white">{player.donationCurrency}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{t('dashboard.crystals', 'Кристаллы')}</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl">
                  <div className="text-3xl mb-2">✨</div>
                  <div className="text-3xl font-black text-gray-900 dark:text-white">{player.experience}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{t('dashboard.xp', 'Опыт')}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Logout button for authenticated users */}
        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-center mt-12"
          >
            <button
              onClick={() => navigate('/logout')}
              className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 font-semibold transition-colors text-lg"
            >
              {t('auth.logout', 'Выйти')} →
            </button>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="text-center mt-16 pb-8"
        >
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t('home.madeWith', 'Сделано с')} ❤️ {t('home.inUzbekistan', 'в Узбекистане')}
          </p>
        </motion.div>
      </main>
    </div>
  );
}
