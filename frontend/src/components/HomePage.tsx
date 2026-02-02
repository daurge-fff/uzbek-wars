import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { GoogleLoginButton } from './GoogleLoginButton';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Функция для форматирования больших чисел
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

// 3D карусель с перспективой (как в iOS)
function FeaturesCarousel({ features }: { features: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const onDragEnd = (_: any, info: any) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    if (Math.abs(velocity) > 500 || Math.abs(offset) > 100) {
      if ((velocity < 0 || offset < 0) && currentIndex < features.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if ((velocity > 0 || offset > 0) && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    }
  };

  return (
    <div className="relative py-8">
      <div className="overflow-hidden" style={{ perspective: '1000px' }}>
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={onDragEnd}
          animate={{ x: `calc(-${currentIndex * 100}%)` }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 30
          }}
          className="flex gap-6 cursor-grab active:cursor-grabbing px-4"
        >
          {features.map((feature, index) => {
            const offset = index - currentIndex;
            const isActive = index === currentIndex;
            
            return (
              <motion.div
                key={index}
                className="min-w-full"
                animate={{ 
                  scale: isActive ? 1 : 0.85,
                  opacity: isActive ? 1 : 0.4,
                  rotateY: offset * -15,
                  z: isActive ? 0 : -100
                }}
                transition={{ duration: 0.5 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
                  <motion.div
                    animate={{ scale: isActive ? 1 : 0.8 }}
                    className="text-7xl mb-6 text-center"
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 text-center">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
      
      {/* Элегантные dots */}
      <div className="flex justify-center gap-2 mt-8">
        {features.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => setCurrentIndex(index)}
            whileHover={{ scale: 1.3 }}
            whileTap={{ scale: 0.9 }}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex 
                ? 'w-8 bg-indigo-600 dark:bg-indigo-400' 
                : 'w-2 bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// Реалистичный iPhone с красивыми обоями
function PhoneMockup({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  
  // Обновляем время каждую секунду
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const isDark = theme === 'dark';

  const menuItems = [
    { id: 'leaderboard', icon: '🏆', path: '/leaderboard', label: t('menu.leaderboard'), desc: t('menu.leaderboardDesc') },
    { id: 'shop', icon: '🛍️', path: '/shop', label: t('menu.shop'), desc: t('menu.shopDesc') },
    { id: 'referral', icon: '👥', path: '/referral', label: t('menu.referral'), desc: t('menu.referralDesc') },
    { id: 'inventory', icon: '📦', path: '/inventory', label: t('menu.inventory'), desc: t('menu.inventoryDesc') },
    { id: 'settings', icon: '⚙️', path: '/settings', label: t('menu.settings'), desc: t('menu.settingsDesc') },
    { id: 'donate', icon: '💎', path: '/donate', label: t('menu.donate'), desc: t('menu.donateDesc') },
  ];

  const dockItems = [
    { 
      id: 'tutorial', 
      icon: '🎓', 
      label: t('menu.tutorial', 'Обучение'),
      action: () => setShowTutorialModal(true)
    },
    { 
      id: 'changelog', 
      icon: '📋', 
      label: t('menu.changelog', 'История версий'),
      action: () => setShowChangelogModal(true)
    },
    { 
      id: 'developer', 
      icon: '👨‍💻', 
      label: t('menu.developer', 'Разработчик'),
      action: () => setShowDeveloperModal(true)
    },
  ];

  const handleMouseEnter = (itemId: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
    setActiveTooltip(itemId);
  };

  return (
    <div className="relative max-w-md mx-auto">
      {/* iPhone корпус */}
      <div className="relative bg-gradient-to-b from-gray-800 via-gray-900 to-black rounded-[3.5rem] p-3.5 shadow-2xl">
        {/* Dynamic Island - опущен ниже и серый */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
          <div className="relative w-[126px] h-[37px] bg-gray-900 rounded-[2rem] shadow-2xl">
            {/* Внутренние элементы Dynamic Island */}
            <div className="absolute inset-0 flex items-center justify-between px-4">
              {/* Камера */}
              <div className="w-2.5 h-2.5 bg-gray-950 rounded-full ring-1 ring-gray-800" />
              {/* Датчики */}
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-gray-950 rounded-full" />
                <div className="w-1.5 h-1.5 bg-gray-950 rounded-full" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Экран */}
        <div className="relative bg-black rounded-[3rem] overflow-hidden aspect-[9/19.5] shadow-inner">
          {/* Обои - градиент (меняется мгновенно с темой) */}
          <div className={`absolute inset-0 transition-none ${
            isDark 
              ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900' 
              : 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600'
          }`}>
            {/* Абстрактные формы на обоях */}
            <div className={`absolute top-10 right-10 w-40 h-40 rounded-full blur-3xl transition-none ${
              isDark ? 'bg-blue-500/30' : 'bg-white/10'
            }`} />
            <div className={`absolute bottom-20 left-10 w-60 h-60 rounded-full blur-3xl transition-none ${
              isDark ? 'bg-indigo-500/30' : 'bg-blue-400/10'
            }`} />
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl transition-none ${
              isDark ? 'bg-purple-500/30' : 'bg-purple-400/10'
            }`} />
          </div>

          {/* Статус бар */}
          <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-8 text-xs font-semibold text-white z-30 pt-2">
            <span>{currentTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
            <div className="flex items-center gap-1.5">
              {/* Сигнал сети - столбики */}
              <svg className="w-4 h-3" viewBox="0 0 17 12" fill="white">
                <rect x="0" y="8" width="3" height="4" rx="0.5"/>
                <rect x="4.5" y="5" width="3" height="7" rx="0.5"/>
                <rect x="9" y="2" width="3" height="10" rx="0.5"/>
                <rect x="13.5" y="0" width="3" height="12" rx="0.5"/>
              </svg>
              {/* Батарейка */}
              <svg className="w-6 h-3" viewBox="0 0 27 13" fill="none">
                <rect x="0" y="0" width="22" height="13" rx="2.5" stroke="white" strokeWidth="1" fill="none"/>
                <rect x="2" y="2" width="18" height="9" rx="1" fill="white"/>
                <rect x="23" y="4" width="4" height="5" rx="1.5" fill="white"/>
              </svg>
            </div>
          </div>

          {/* Контент экрана */}
          <div className="relative h-full pt-16 pb-10 px-6 z-10">
            {/* Время и дата */}
            <div className="text-center mb-12">
              <div className="text-7xl font-light text-white mb-2">
                {currentTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-lg text-white/80">
                {currentTime.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\./g, '/')}
              </div>
            </div>

            {/* Сетка иконок приложений */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              {menuItems.map((item) => (
                <div key={item.id} className="flex flex-col items-center">
                  <button
                    onMouseEnter={(e) => handleMouseEnter(item.id, e)}
                    onMouseLeave={() => setActiveTooltip(null)}
                    onClick={() => onNavigate(item.path)}
                    className="relative w-20 h-20 bg-white/20 backdrop-blur-xl rounded-[1.3rem] shadow-2xl flex items-center justify-center border border-white/30 mb-2 active:bg-white/40 transition-colors duration-100"
                    style={{
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <span className="text-5xl">{item.icon}</span>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-[1.3rem] pointer-events-none" />
                  </button>
                  
                  <span className="text-xs text-white font-medium text-center drop-shadow-lg px-1 line-clamp-1 max-w-[80px]">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Dock - 3 иконки в ряд как у iPhone */}
            <div className="absolute bottom-8 left-6 right-6">
              <div className="bg-white/20 backdrop-blur-2xl rounded-[2rem] px-4 py-3 border border-white/30 shadow-2xl">
                <div className="flex justify-around items-center gap-2">
                  {dockItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={item.action}
                      className="relative flex items-center justify-center group"
                    >
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-[1.2rem] shadow-xl flex items-center justify-center border border-white/30 active:bg-white/40 transition-colors duration-100">
                        <span className="text-3xl">{item.icon}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Home indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-36 h-1.5 bg-white/40 rounded-full" />
          </div>
        </div>
      </div>

      {/* Физические кнопки */}
      <div className="absolute -right-1 top-28 w-1 h-16 bg-gray-700 rounded-l shadow-inner" />
      <div className="absolute -right-1 top-48 w-1 h-20 bg-gray-700 rounded-l shadow-inner" />
      <div className="absolute -left-1 top-32 w-1 h-12 bg-gray-700 rounded-r shadow-inner" />

      {/* Tooltip - простой, без motion */}
      {activeTooltip && (() => {
        const item = menuItems.find(i => i.id === activeTooltip);
        if (!item) return null;
        
        return (
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y - 10}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="bg-gray-900/95 backdrop-blur-xl text-white rounded-xl px-4 py-3 shadow-2xl border border-white/10 whitespace-nowrap">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <div className="font-bold text-sm">{item.label}</div>
                  <div className="text-xs text-gray-300">{item.desc}</div>
                </div>
              </div>
              {/* Arrow */}
              <div 
                className="absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900/95 rotate-45 border-r border-b border-white/10"
                style={{ bottom: '-6px' }}
              />
            </div>
          </div>
        );
      })()}

      {/* Модалка "О игре" */}
      {showAboutModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowAboutModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-6xl mb-3">🏛️</div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">UZBEK WARS</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {t('menu.aboutText', 'Стань легендой Великого Шёлкового пути! Исследуй древние города Узбекистана, развивай своего персонажа, торгуй, сражайся и соревнуйся с другими игроками.')}
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('menu.version', 'Версия')}</span>
                <span className="font-bold text-gray-900 dark:text-white">1.0.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('menu.releaseDate', 'Дата выпуска')}</span>
                <span className="font-bold text-gray-900 dark:text-white">2026</span>
              </div>
            </div>
            <button
              onClick={() => setShowAboutModal(false)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {t('ui.close', 'Закрыть')}
            </button>
          </div>
        </div>
      )}

      {/* Модалка "Разработчик" - из Settings */}
      {showDeveloperModal && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={() => setShowDeveloperModal(false)}
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
                  <div className="text-center mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, delay: 0.2 }}
                      className="text-8xl mb-4"
                    >
                      👨‍💻
                    </motion.div>
                    <h2 className="text-3xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
                      German Vitiaz
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                      Full-Stack Developer
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                      <span>🚀 React</span>
                      <span>•</span>
                      <span>⚡ Node.js</span>
                      <span>•</span>
                      <span>🎨 TypeScript</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <motion.a
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      href="https://t.me/daurge"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-[20px] font-bold shadow-lg hover:shadow-xl transition-all"
                    >
                      <span className="text-3xl">✈️</span>
                      <div className="flex-1 text-left">
                        <div className="text-sm opacity-90">Telegram</div>
                        <div className="text-lg">@daurge</div>
                      </div>
                      <span className="text-xl">→</span>
                    </motion.a>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-[16px] text-center">
                        <div className="text-2xl mb-1">⭐</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{t('about.codeQuality', 'Качество кода')}</div>
                      </div>
                      <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-[16px] text-center">
                        <div className="text-2xl mb-1">🎯</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{t('about.fastWork', 'Быстрая работа')}</div>
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-[20px] border border-yellow-200 dark:border-yellow-800">
                      <p className="text-xs text-gray-700 dark:text-gray-300 text-center">
                        💝 {t('app.thankYou', 'Спасибо за использование Узбек Варс!')}<br/>
                        {t('app.starOnGithub', 'Если нравится игра - поставь ⭐ на GitHub')}
                      </p>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDeveloperModal(false)}
                    className="w-full py-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 text-gray-900 dark:text-white font-bold rounded-full shadow-lg"
                  >
                    {t('ui.close', 'Закрыть')}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* Модалка "История версий" */}
      {showChangelogModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowChangelogModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-6xl mb-3">📋</div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{t('menu.changelog', 'История версий')}</h2>
            </div>
            <div className="space-y-4 mb-6">
              <div className="border-l-4 border-indigo-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-black text-lg text-gray-900 dark:text-white">v1.1.2</span>
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">Текущая</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">03.02.2026</p>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <li>✨ Добавлена система косметики</li>
                  <li>🎨 Улучшен дизайн главной страницы</li>
                  <li>🐛 Исправлены мелкие баги</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <div className="font-black text-lg text-gray-900 dark:text-white mb-2">v1.1.0</div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">01.02.2026</p>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <li>🎮 Добавлены новые активности</li>
                  <li>🏆 Система рейтингов</li>
                  <li>👥 Реферальная система</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-blue-500 pl-4">
                <div className="font-black text-lg text-gray-900 dark:text-white mb-2">v1.0.0</div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">25.01.2026</p>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <li>🚀 Первый релиз игры</li>
                  <li>🏛️ Система городов</li>
                  <li>⚔️ Базовые активности</li>
                  <li>🌍 Поддержка 4 языков</li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => setShowChangelogModal(false)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {t('ui.close', 'Закрыть')}
            </button>
          </div>
        </div>
      )}
    </div>
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
          platform: (navigator as any).userAgentData?.platform || 'unknown',
          deviceId: localStorage.getItem('deviceId') || Math.random().toString(36)
        }
      });
      
      const { token, user, player } = response.data;
      login(token, user, player);
      navigate('/dashboard');
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
      gradient: 'from-blue-400/20 to-cyan-400/20'
    },
    {
      icon: '🏛️',
      title: t('home.feature2', 'Легендарные города'),
      description: t('home.feature2Desc', 'Исследуй Самарканд, Бухару и другие'),
      gradient: 'from-purple-400/20 to-pink-400/20'
    },
    {
      icon: '⚔️',
      title: t('home.feature3', 'Захватывающие активности'),
      description: t('home.feature3Desc', 'Торгуй, сражайся, развивайся'),
      gradient: 'from-orange-400/20 to-red-400/20'
    },
    {
      icon: '🏆',
      title: t('home.feature4', 'Соревнуйся'),
      description: t('home.feature4Desc', 'Стань лучшим в рейтинге'),
      gradient: 'from-green-400/20 to-emerald-400/20'
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
          <motion.a
            href="/profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            {user.avatar && user.avatar.startsWith('http') ? (
              <img 
                src={user.avatar} 
                alt={user.displayName} 
                className="w-8 h-8 rounded-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<div class="w-8 h-8 flex items-center justify-center text-xl">👤</div>';
                }}
              />
            ) : (
              <span className="text-2xl">{user.avatar || '👤'}</span>
            )}
            <span className="font-semibold text-gray-900 dark:text-white hidden sm:inline text-sm">
              {user.displayName}
            </span>
          </motion.a>
        )}
        <ThemeToggle />
      </div>
      
      <main className="relative container mx-auto px-4 py-12 pt-24">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 max-w-5xl mx-auto"
        >
          {/* Logo with animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="text-8xl mb-4 inline-block"
          >
            🏛️
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-tight uppercase cursor-default mb-4"
            style={{ fontFamily: "'Bungee', sans-serif" }}
          >
            {t('app.name')}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-6 font-bold"
          >
            {t('app.tagline')}
          </motion.p>

          {/* Language Switcher */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-8 flex justify-center"
          >
            <LanguageSwitcher 
              currentLanguage={i18n.language as 'ru' | 'uz' | 'uk' | 'en'} 
              onLanguageChange={handleLanguageChange}
            />
          </motion.div>

          {/* Auth Section */}
          {!isAuthenticated ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-12"
            >
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[28px] p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md mx-auto relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/5 dark:via-purple-500/5 dark:to-pink-500/5" />
                
                <div className="relative">
                  <motion.div 
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className="text-6xl mb-3"
                  >
                    🚀
                  </motion.div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                    {t('app.startAdventure', 'Начать приключение')}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 text-base">
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
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-black text-xl rounded-full shadow-2xl hover:shadow-3xl transition-all mb-12 inline-flex items-center gap-3"
            >
              <span className="text-3xl">🎮</span>
              {t('home.continuePlaying', 'Продолжить игру')}
            </motion.button>
          )}
        </motion.div>

        {/* Features Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12 max-w-2xl mx-auto"
        >
          <h2 className="text-3xl font-black text-center text-gray-900 dark:text-white mb-8">
            {t('home.features', 'Возможности игры')}
          </h2>
          <FeaturesCarousel features={features} />
        </motion.div>

        {/* Phone Mockup вместо карточек */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-black text-center text-gray-900 dark:text-white mb-8">
            {t('menu.title', 'Разделы игры')}
          </h2>
          <PhoneMockup onNavigate={handleMenuClick} />
        </motion.div>

        {/* Stats Section - для залогиненных */}
        {isAuthenticated && player && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[28px] p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4 text-center">
                {t('home.yourProgress', 'Ваш прогресс')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl">
                  <div className="text-2xl mb-1">⭐</div>
                  <div className={`font-black text-gray-900 dark:text-white mb-1 ${
                    player.level >= 1000 ? 'text-xl' : 'text-2xl'
                  }`}>
                    {formatNumber(player.level)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">{t('dashboard.level', 'Уровень')}</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl">
                  <div className="text-2xl mb-1">💰</div>
                  <div className={`font-black text-gray-900 dark:text-white mb-1 ${
                    player.soms >= 1000 ? 'text-xl' : 'text-2xl'
                  }`}>
                    {formatNumber(player.soms)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">{t('dashboard.soms', 'Сомы')}</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl">
                  <div className="text-2xl mb-1">💎</div>
                  <div className={`font-black text-gray-900 dark:text-white mb-1 ${
                    player.donationCurrency >= 1000 ? 'text-xl' : 'text-2xl'
                  }`}>
                    {formatNumber(player.donationCurrency)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">{t('dashboard.crystals', 'Кристаллы')}</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl">
                  <div className="text-2xl mb-1">✨</div>
                  <div className={`font-black text-gray-900 dark:text-white mb-1 ${
                    player.experience >= 1000 ? 'text-xl' : 'text-2xl'
                  }`}>
                    {formatNumber(player.experience)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">{t('dashboard.xp', 'Опыт')}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="text-center mt-12 pb-8"
        >
          <div className="flex justify-center gap-4">
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="/privacy"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
            >
              🔒 Privacy Policy
            </motion.a>
            <span className="text-gray-400">•</span>
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="/terms"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
            >
              📜 Terms of Service
            </motion.a>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
