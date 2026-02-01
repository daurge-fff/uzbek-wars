/**
 * Root application component
 * 
 * iOS-style modern design with smooth transitions
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './contexts/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import { ColorPalette } from './components/ColorPalette';
import { GoogleLoginButton } from './components/GoogleLoginButton';
import { CharacterSelection } from './components/CharacterSelection';
import { CitySelection } from './components/CitySelection';
import { GameDashboard } from './components/GameDashboard';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { DonationModal } from './components/DonationModal';
import { CosmeticShop } from './components/CosmeticShop';
import { Leaderboard } from './components/Leaderboard';
import { ReferralPanel } from './components/ReferralPanel';
import { PlayerProfile } from './components/PlayerProfile';
import { Settings } from './components/Settings';
import { HealthCheck } from './components/HealthCheck';
import { BackButton } from './components/BackButton';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

const mockCharacters = [
  {
    id: 'char1',
    name: 'Рустам',
    avatar: '👨‍🌾',
    description: 'Трудолюбивый фермер из Самарканда'
  },
  {
    id: 'char2',
    name: 'Азиза',
    avatar: '👩‍🍳',
    description: 'Мастер плова из Ташкента'
  },
  {
    id: 'char3',
    name: 'Тимур',
    avatar: '👨‍💼',
    description: 'Предприниматель из Бухары'
  },
  {
    id: 'char4',
    name: 'Жасур',
    avatar: '👨‍🔧',
    description: 'Мастер на все руки из Андижана'
  },
  {
    id: 'char5',
    name: 'Малика',
    avatar: '👩‍🎨',
    description: 'Художница из Намангана'
  }
];

const mockCities = [
  {
    cityId: 'samarkand',
    name: { ru: 'Самарканд', uz: 'Samarqand', uk: 'Самарканд', en: 'Samarkand' },
    playerCount: 450,
    maxPlayers: 1000,
    isOpen: true,
    theme: { primaryColor: '#4A90E2', backgroundImage: '' }
  },
  {
    cityId: 'tashkent',
    name: { ru: 'Ташкент', uz: 'Toshkent', uk: 'Ташкент', en: 'Tashkent' },
    playerCount: 850,
    maxPlayers: 1000,
    isOpen: true,
    theme: { primaryColor: '#50C878', backgroundImage: '' }
  },
  {
    cityId: 'bukhara',
    name: { ru: 'Бухара', uz: 'Buxoro', uk: 'Бухара', en: 'Bukhara' },
    playerCount: 1000,
    maxPlayers: 1000,
    isOpen: false,
    theme: { primaryColor: '#DAA520', backgroundImage: '' }
  },
  {
    cityId: 'andijan',
    name: { ru: 'Андижан', uz: 'Andijon', uk: 'Андіжан', en: 'Andijan' },
    playerCount: 300,
    maxPlayers: 1000,
    isOpen: true,
    theme: { primaryColor: '#E24A4A', backgroundImage: '' }
  },
  {
    cityId: 'namangan',
    name: { ru: 'Наманган', uz: 'Namangan', uk: 'Наманган', en: 'Namangan' },
    playerCount: 550,
    maxPlayers: 1000,
    isOpen: true,
    theme: { primaryColor: '#9B59B6', backgroundImage: '' }
  }
];

const mockPlayerState = {
  characterId: 'char1',
  level: 5,
  experience: 450,
  experienceToNextLevel: 506,
  soms: 1250,
  donationCurrency: 50,
  stats: {
    hunger: 75,
    health: 90,
    mood: 60,
    energy: 80
  }
};

const mockActivities = [
  { id: 'work', name: 'Работать в Связном', icon: '💼' },
  { id: 'rob', name: 'Грабить', icon: '🔫' },
  { id: 'police', name: 'Ловить преступников', icon: '👮' },
  { id: 'cook', name: 'Готовить плов', icon: '🍲' },
  { id: 'samsa', name: 'Печь самсу', icon: '🥟' },
  { id: 'trade', name: 'Торговать', icon: '🏪' }
];

const mockCosmetics = [
  { id: 'hat1', name: 'Тюбетейка', type: 'clothing' as const, rarity: 'common' as const, price: 50, icon: '🎩', owned: false, equipped: false },
  { id: 'hat2', name: 'Золотая корона', type: 'clothing' as const, rarity: 'legendary' as const, price: 500, icon: '👑', owned: false, equipped: false },
  { id: 'bg1', name: 'Регистан', type: 'background' as const, rarity: 'epic' as const, price: 200, icon: '🕌', owned: true, equipped: true },
  { id: 'acc1', name: 'Золотые серьги', type: 'accessory' as const, rarity: 'rare' as const, price: 100, icon: '💍', owned: true, equipped: false }
];

const mockLeaderboard = [
  { rank: 1, userId: '1', username: 'Тимур', avatar: '👨‍💼', level: 50, soms: 100000, cityName: 'Бухара', isCurrentPlayer: false },
  { rank: 2, userId: '2', username: 'Азиза', avatar: '👩‍🍳', level: 45, soms: 85000, cityName: 'Ташкент', isCurrentPlayer: false },
  { rank: 3, userId: '3', username: 'Рустам', avatar: '👨‍🌾', level: 42, soms: 75000, cityName: 'Самарканд', isCurrentPlayer: true },
  { rank: 4, userId: '4', username: 'Малика', avatar: '👩‍🎨', level: 40, soms: 70000, cityName: 'Наманган', isCurrentPlayer: false },
  { rank: 5, userId: '5', username: 'Жасур', avatar: '👨‍🔧', level: 38, soms: 65000, cityName: 'Андижан', isCurrentPlayer: false }
];

const mockReferrals = [
  { username: 'Алишер', avatar: '👨‍💻', level: 15, registeredAt: '2024-01-15' },
  { username: 'Дилноза', avatar: '👩‍🎓', level: 12, registeredAt: '2024-01-20' }
];

const mockPlayerInfo = {
  username: 'Рустам',
  avatar: '👨‍🌾',
  characterName: 'Трудолюбивый фермер',
  cityName: 'Самарканд',
  joinedDate: '2024-01-01',
  referralCode: 'RUSTAM2024'
};

const mockPlayerStats = {
  level: 5,
  experience: 450,
  experienceToNextLevel: 506,
  soms: 1250,
  crystals: 50,
  totalActivities: 127,
  daysPlayed: 15,
  achievements: 8
};

function MenuCard({ title, description, icon, to }: any) {
  const navigate = useNavigate();
  
  return (
    <motion.button
      onClick={() => navigate(to)}
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

function HomePage() {
  const [currentLang, setCurrentLang] = useState<'ru' | 'uz' | 'uk' | 'en'>('ru');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 transition-colors duration-300">
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50 transition-colors"
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.h1 
            whileHover={{ scale: 1.05 }}
            className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent"
          >
            Узбек Варс
          </motion.h1>
          <div className="flex items-center gap-3">
            <LanguageSwitcher 
              currentLanguage={currentLang} 
              onLanguageChange={setCurrentLang}
            />
            <ThemeToggle />
          </div>
        </div>
      </motion.header>
      
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 transition-colors">
            Добро пожаловать
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg transition-colors">
            Выберите раздел
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          <MenuCard title="Цветовая палитра" description="iOS-style дизайн" icon="🎨" to="/colors" />
          <MenuCard title="Авторизация" description="Google OAuth" icon="🔐" to="/auth" />
          <MenuCard title="Выбор персонажа" description="Свайп анимации" icon="👤" to="/characters" />
          <MenuCard title="Выбор города" description="Балансировка" icon="🏙️" to="/cities" />
          <MenuCard title="Игровой экран" description="Dashboard" icon="🎮" to="/dashboard" />
          <MenuCard title="Магазин косметики" description="Покупка предметов" icon="🛍️" to="/shop" />
          <MenuCard title="Рейтинг" description="Топ игроков" icon="🏆" to="/leaderboard" />
          <MenuCard title="Рефералы" description="Пригласи друзей" icon="👥" to="/referral" />
          <MenuCard title="Донат" description="Поддержать игру" icon="💎" to="/donate" />
          <MenuCard title="Профиль" description="Твой профиль" icon="👤" to="/profile" />
          <MenuCard title="Настройки" description="Параметры игры" icon="⚙️" to="/settings" />
          <MenuCard title="Health Check" description="Статус систем" icon="🏥" to="/health" />
        </div>
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
        <Route path="/colors" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <BackButton />
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
            <BackButton />
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
            <BackButton />
            <div className="fixed top-4 right-4 z-[9999] pointer-events-auto">
              <ThemeToggle />
            </div>
            <CharacterSelection 
              characters={mockCharacters}
              onSelect={(id) => console.log('Selected character:', id)}
            />
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
            <BackButton />
            <div className="fixed top-4 right-4 z-[9999] pointer-events-auto">
              <ThemeToggle />
            </div>
            <CitySelection 
              cities={mockCities}
              onSelect={(id) => console.log('Selected city:', id)}
            />
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
            <BackButton />
            <div className="fixed top-4 right-4 z-[9999] pointer-events-auto">
              <ThemeToggle />
            </div>
            <GameDashboard 
              playerState={mockPlayerState}
              activities={mockActivities}
              onActivitySelect={(id) => console.log('Selected activity:', id)}
            />
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
            <BackButton />
            <div className="fixed top-4 right-4 z-[9999] pointer-events-auto">
              <ThemeToggle />
            </div>
            <CosmeticShop
              items={mockCosmetics}
              playerCrystals={150}
              onPurchase={async (id) => console.log('Purchase:', id)}
              onEquip={async (id) => console.log('Equip:', id)}
            />
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
            <BackButton />
            <div className="fixed top-4 right-4 z-[9999] pointer-events-auto">
              <ThemeToggle />
            </div>
            <Leaderboard
              players={mockLeaderboard}
              currentPlayerId="3"
              type="global"
              onTypeChange={(type) => console.log('Type:', type)}
            />
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
            <BackButton />
            <div className="fixed top-4 right-4 z-[9999] pointer-events-auto">
              <ThemeToggle />
            </div>
            <ReferralPanel
              referralCode="RUSTAM2024"
              referralLink="https://uzbekwars.com/ref/RUSTAM2024"
              referredFriends={mockReferrals}
              totalBonus={{ crystals: 100, soms: 1000 }}
            />
          </motion.div>
        } />
        <Route path="/donate" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 flex items-center justify-center p-4"
          >
            <BackButton />
            <div className="fixed top-4 right-4 z-[9999] pointer-events-auto">
              <ThemeToggle />
            </div>
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
            <BackButton />
            <div className="fixed top-4 right-4 z-[9999] pointer-events-auto">
              <ThemeToggle />
            </div>
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
            <BackButton />
            <div className="fixed top-4 right-4 z-[9999] pointer-events-auto">
              <ThemeToggle />
            </div>
            <PlayerProfile
              playerInfo={mockPlayerInfo}
              stats={mockPlayerStats}
              onEditProfile={() => console.log('Edit profile')}
              isVerified={false}
              telegramUsername=""
              onVerify={() => console.log('Verified!')}
            />
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
            <BackButton />
            <div className="fixed top-4 right-4 z-[9999] pointer-events-auto">
              <ThemeToggle />
            </div>
            <Settings
              currentLanguage="ru"
              onLanguageChange={(lang) => console.log('Language:', lang)}
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
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
}

export default App;
