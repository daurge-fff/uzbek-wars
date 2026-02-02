/**
 * Root application component
 * 
 * Production-ready iOS-style modern design with smooth transitions
 * Full authentication flow with Google OAuth
 * Multi-language support (RU, UZ, UK, EN)
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeToggle } from './components/ThemeToggle';
import { ColorPalette } from './components/ColorPalette';
import { GoogleLoginButton } from './components/GoogleLoginButton';
import { CharacterSelection } from './components/CharacterSelection';
import { CitySelection } from './components/CitySelection';
import { GameDashboardContainer } from './components/GameDashboardContainer';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { DonationModal } from './components/DonationModal';
import { CosmeticShop } from './components/CosmeticShop';
import { Leaderboard } from './components/Leaderboard';
import { ReferralPanel } from './components/ReferralPanel';
import { PlayerProfile } from './components/PlayerProfile';
import { Settings } from './components/Settings';
import { HealthCheck } from './components/HealthCheck';
import { BackButton } from './components/BackButton';
import { ReferralLanding } from './components/ReferralLanding';
import { OnboardingFlow } from './components/OnboardingFlow';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

function MenuCard({ title, description, icon, to, onClick }: any) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(to);
    }
  };
  
  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.05, y: -8 }}
      whileTap={{ scale: 0.95 }}
      className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-6 rounded-[24px] shadow-xl hover:shadow-2xl transition-all text-left w-full border border-gray-100 dark:border-gray-700 group overflow-hidden relative"
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

function LogoutPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    logout();
    setTimeout(() => {
      navigate('/');
    }, 2000);
  }, []);

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="text-8xl mb-6"
      >
        👋
      </motion.div>
      <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
        {t('auth.loggingOut', 'Выход из системы...')}
      </h2>
      <p className="text-gray-600 dark:text-gray-300">
        {t('auth.redirectingHome', 'Перенаправление на главную...')}
      </p>
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (lang: 'ru' | 'uz' | 'uk' | 'en') => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 transition-colors duration-300">
      {/* Top Right Controls */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        {isAuthenticated && user && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700"
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
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 max-w-4xl mx-auto"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-8xl mb-6"
          >
            🏛️
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent"
          >
            {t('home.title')}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl md:text-3xl text-gray-700 dark:text-gray-300 mb-8 font-bold"
          >
            {t('home.subtitle')}
          </motion.p>

          {/* CTA Button - компактная */}
          {isAuthenticated ? (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-black text-lg rounded-full shadow-xl hover:shadow-2xl transition-all mb-8"
            >
              🎮 {t('home.continuePlaying')}
            </motion.button>
          ) : (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/start')}
              className="px-8 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-black text-lg rounded-full shadow-xl hover:shadow-2xl transition-all mb-8"
            >
              🚀 {t('home.startGame')}
            </motion.button>
          )}

          {/* Language Switcher - компактный */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-12"
          >
            <LanguageSwitcher 
              currentLanguage={i18n.language as 'ru' | 'uz' | 'uk' | 'en'} 
              onLanguageChange={handleLanguageChange}
            />
          </motion.div>
        </motion.div>

        {/* Navigation Menu - простая сетка */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <MenuCard 
              title={t('menu.game')} 
              description={t('menu.gameDesc')} 
              icon="🎮" 
              to="/dashboard" 
            />
            <MenuCard 
              title={t('menu.leaderboard')} 
              description={t('menu.leaderboardDesc')} 
              icon="🏆" 
              to="/leaderboard" 
            />
            <MenuCard 
              title={t('menu.referral')} 
              description={t('menu.referralDesc')} 
              icon="👥" 
              to="/referral" 
            />
            <MenuCard 
              title={t('menu.shop')} 
              description={t('menu.shopDesc')} 
              icon="🛍️" 
              to="/shop" 
            />
            <MenuCard 
              title={t('menu.profile')} 
              description={t('menu.profileDesc')} 
              icon="👤" 
              to="/profile" 
            />
            <MenuCard 
              title={t('menu.settings')} 
              description={t('menu.settingsDesc')} 
              icon="⚙️" 
              to="/settings" 
            />
            <MenuCard 
              title={t('menu.donate')} 
              description={t('menu.donateDesc')} 
              icon="💎" 
              to="/donate" 
            />
            <MenuCard 
              title={t('menu.health')} 
              description={t('menu.healthDesc')} 
              icon="🏥" 
              to="/health" 
            />
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  
  // Smooth page transitions
  const pageVariants = {
    initial: { opacity: 0, scale: 0.98, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.98, y: -10 }
  };
  
  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.3
  };
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/logout" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 flex items-center justify-center"
          >
            <LogoutPage />
          </motion.div>
        } />
        <Route path="/start" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <OnboardingFlow />
          </motion.div>
        } />
        <Route path="/ref/:code" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 flex items-center justify-center p-4"
          >
            <ReferralLanding />
          </motion.div>
        } />
        <Route path="/colors" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <ColorPalette />
          </motion.div>
        } />
        <Route path="/auth" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 flex items-center justify-center p-4"
          >
            <div className="max-w-md w-full">
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mb-8 text-center"
              >
                Вход в игру
              </motion.h1>
              <GoogleLoginButton />
            </div>
          </motion.div>
        } />
        <Route path="/characters" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="relative"
          >
            <CharacterSelectionWithData />
          </motion.div>
        } />
        <Route path="/cities" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="relative"
          >
            <CitySelectionWithData />
          </motion.div>
        } />
        <Route path="/dashboard" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="relative"
          >
            <GameDashboardContainer />
          </motion.div>
        } />
        <Route path="/shop" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="relative"
          >
            <CosmeticShopWithData />
          </motion.div>
        } />
        <Route path="/leaderboard" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="relative"
          >
            <LeaderboardWithData />
          </motion.div>
        } />
        <Route path="/referral" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="relative"
          >
            <ReferralPanelWithData />
          </motion.div>
        } />
        <Route path="/donate" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900"
          >
            <DonationModal
              isOpen={true}
              onClose={() => window.history.back()}
              onDonate={async (id) => console.log('Donate:', id)}
            />
          </motion.div>
        } />
        <Route path="/health" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="relative"
          >
            <HealthCheck />
          </motion.div>
        } />
        <Route path="/profile" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="relative"
          >
            <PlayerProfileWithData />
          </motion.div>
        } />
        <Route path="/settings" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="relative"
          >
            <SettingsWithI18n />
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
}

import { cosmeticItems } from './data/cosmeticItems';

// Wrapper components with real data
const CharacterSelectionWithData = () => {
  const navigate = useNavigate();
  // TODO: Fetch from API when endpoint is ready
  const characters = [
    { id: 'char1', name: 'Farmer', avatar: '👨‍🌾', description: 'Hardworking farmer' },
    { id: 'char2', name: 'Chef', avatar: '👩‍🍳', description: 'Master chef' },
    { id: 'char3', name: 'Businessman', avatar: '👨‍💼', description: 'Entrepreneur' },
    { id: 'char4', name: 'Student', avatar: '👨‍🎓', description: 'Ambitious student' }
  ];
  
  return <CharacterSelection characters={characters} onSelect={(id) => navigate('/cities')} />;
};

const CitySelectionWithData = () => {
  const navigate = useNavigate();
  // TODO: Fetch from API when endpoint is ready
  const cities = [
    { cityId: 'tashkent', name: { ru: 'Ташкент', uz: 'Toshkent', uk: 'Ташкент', en: 'Tashkent' }, playerCount: 0, maxPlayers: 1000, isOpen: true, theme: { primaryColor: '#50C878', backgroundImage: '' } },
    { cityId: 'samarkand', name: { ru: 'Самарканд', uz: 'Samarqand', uk: 'Самарканд', en: 'Samarkand' }, playerCount: 0, maxPlayers: 1000, isOpen: true, theme: { primaryColor: '#4A90E2', backgroundImage: '' } },
    { cityId: 'bukhara', name: { ru: 'Бухара', uz: 'Buxoro', uk: 'Бухара', en: 'Bukhara' }, playerCount: 0, maxPlayers: 1000, isOpen: true, theme: { primaryColor: '#DAA520', backgroundImage: '' } }
  ];
  
  return <CitySelection cities={cities} onSelect={(id) => navigate('/dashboard')} />;
};

const CosmeticShopWithData = () => {
  const { player, updatePlayer } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // TODO: Fetch from /api/cosmetics and merge with owned/equipped status
    // For now, use imported cosmeticItems
    setItems(cosmeticItems);
    setLoading(false);
  }, []);
  
  const handlePurchase = async (id: string, currency: 'soms' | 'crystals') => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    const price = currency === 'soms' ? item.priceSoms : item.priceCrystals;
    const currentBalance = currency === 'soms' ? (player?.soms || 0) : (player?.donationCurrency || 0);
    
    if (currentBalance < price) {
      throw new Error('Insufficient funds');
    }
    
    // TODO: POST /api/cosmetics/purchase
    // For now, update locally
    
    // Update balance
    if (currency === 'soms') {
      updatePlayer({ soms: (player?.soms || 0) - price });
    } else {
      updatePlayer({ donationCurrency: (player?.donationCurrency || 0) - price });
    }
    
    // Mark item as owned
    setItems(prev => prev.map(i => 
      i.id === id ? { ...i, owned: true } : i
    ));
  };
  
  const handleEquip = async (id: string) => {
    // TODO: POST /api/cosmetics/equip
    // For now, update locally
    
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    // Unequip all items of the same type, equip selected
    setItems(prev => prev.map(i => ({
      ...i,
      equipped: i.id === id ? true : (i.type === item.type ? false : i.equipped)
    })));
  };
  
  return (
    <CosmeticShop
      items={items}
      playerCrystals={player?.donationCurrency || 0}
      playerSoms={player?.soms || 0}
      onPurchase={handlePurchase}
      onEquip={handleEquip}
    />
  );
};

const LeaderboardWithData = () => {
  const [players, setPlayers] = useState<any[]>([]);
  const [type, setType] = useState<'global' | 'city'>('global');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        // TODO: GET /api/leaderboard?type=${type}
        setPlayers([]);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [type]);
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  return <Leaderboard players={players} type={type} onTypeChange={setType} />;
};

const ReferralPanelWithData = () => {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [bonus, setBonus] = useState({ crystals: 0, soms: 0 });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        setLoading(true);
        // TODO: GET /api/referrals
        setReferrals([]);
        setBonus({ crystals: 0, soms: 0 });
      } catch (error) {
        console.error('Failed to fetch referrals:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReferrals();
  }, []);
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  const referralCode = user?.referralCode || 'LOADING';
  const referralLink = `${window.location.origin}/ref/${referralCode}`;
  
  return (
    <ReferralPanel
      referralCode={referralCode}
      referralLink={referralLink}
      referredFriends={referrals}
      totalBonus={bonus}
    />
  );
};

const PlayerProfileWithData = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        // TODO: GET /api/player/profile
        setStats({
          level: user?.level || 1,
          experience: user?.experience || 0,
          experienceToNextLevel: user?.experienceToNextLevel || 100,
          soms: user?.soms || 0,
          crystals: user?.donationCurrency || 0,
          totalActivities: 0,
          daysPlayed: 0,
          achievements: 0
        });
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [user]);
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  const playerInfo = {
    username: user?.displayName || 'Player',
    avatar: user?.avatar || '👤',
    characterName: user?.characterId || 'Newbie',
    cityName: user?.cityId || 'No city',
    joinedDate: user?.createdAt || new Date().toISOString(),
    referralCode: user?.referralCode || ''
  };
  
  return (
    <PlayerProfile
      playerInfo={playerInfo}
      stats={stats}
      onEditProfile={() => console.log('Edit profile')}
      isVerified={false}
      telegramUsername=""
      onVerify={() => console.log('Verified!')}
    />
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
          
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                color: '#2C1810',
                borderRadius: '16px',
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
              }
            }}
          />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Wrapper component for Settings with i18n
const SettingsWithI18n = () => {
  const { i18n } = useTranslation();
  
  return (
    <Settings
      currentLanguage={i18n.language as 'ru' | 'uz' | 'uk' | 'en'}
      onLanguageChange={(lang) => i18n.changeLanguage(lang)}
      soundEnabled={true}
      onSoundToggle={() => console.log('Toggle sound')}
      musicEnabled={true}
      onMusicToggle={() => console.log('Toggle music')}
      notificationsEnabled={false}
      onNotificationsToggle={() => console.log('Toggle notifications')}
      appStats={{
        uptime: 3600 * 2 + 1800,
        lastRestart: new Date(Date.now() - 3600 * 2.5 * 1000).toISOString(),
        onlinePlayersTotal: 1247,
        onlinePlayersCity: 342,
        cityName: 'Самарканд',
        version: '1.0.0'
      }}
    />
  );
};

export default App;
