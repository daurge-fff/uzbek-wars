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
import { ColorPalette } from './components/ColorPalette';
import { GoogleLoginButton } from './components/GoogleLoginButton';
import { CharacterSelection } from './components/CharacterSelection';
import { CitySelection } from './components/CitySelection';
import { GameDashboard } from './components/GameDashboard';
import { LanguageSwitcher } from './components/LanguageSwitcher';

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
  { id: 'cook', name: 'Готовить плов', icon: '🍲' },
  { id: 'trade', name: 'Торговать', icon: '🏪' },
  { id: 'samsa', name: 'Печь самсу', icon: '🥟' }
];

function MenuCard({ title, description, icon, to }: any) {
  const navigate = useNavigate();
  
  return (
    <motion.button
      onClick={() => navigate(to)}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg hover:shadow-2xl transition-all text-left w-full border border-gray-100"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h2 className="text-xl font-bold text-text-primary mb-2">{title}</h2>
      <p className="text-text-secondary text-sm">{description}</p>
    </motion.button>
  );
}

function HomePage() {
  const [currentLang, setCurrentLang] = useState<'ru' | 'uz' | 'uk' | 'en'>('ru');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-white to-background-secondary">
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/70 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50"
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.h1 
            whileHover={{ scale: 1.05 }}
            className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
          >
            Узбек Варс
          </motion.h1>
          <LanguageSwitcher 
            currentLanguage={currentLang} 
            onLanguageChange={setCurrentLang}
          />
        </div>
      </motion.header>
      
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-text-primary mb-4">
            Добро пожаловать
          </h2>
          <p className="text-text-secondary text-lg">
            Выберите компонент для просмотра
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          <MenuCard
            title="Цветовая палитра"
            description="Современный iOS-style дизайн"
            icon="🎨"
            to="/colors"
          />
          <MenuCard
            title="Авторизация"
            description="Google OAuth компонент"
            icon="🔐"
            to="/auth"
          />
          <MenuCard
            title="Выбор персонажа"
            description="Drag & физика анимаций"
            icon="👤"
            to="/characters"
          />
          <MenuCard
            title="Выбор города"
            description="Интеллектуальная балансировка"
            icon="🏙️"
            to="/cities"
          />
          <MenuCard
            title="Игровой экран"
            description="Dashboard с активностями"
            icon="🎮"
            to="/dashboard"
          />
        </div>
      </main>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/colors" element={
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            <ColorPalette />
          </motion.div>
        } />
        <Route path="/auth" element={
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen bg-gradient-to-br from-background-primary to-background-secondary flex items-center justify-center p-4"
          >
            <div className="max-w-md w-full">
              <h1 className="text-3xl font-bold text-text-primary mb-8 text-center">Вход в игру</h1>
              <GoogleLoginButton />
            </div>
          </motion.div>
        } />
        <Route path="/characters" element={
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
          >
            <CharacterSelection 
              characters={mockCharacters}
              onSelect={(id) => console.log('Selected character:', id)}
            />
          </motion.div>
        } />
        <Route path="/cities" element={
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <CitySelection 
              cities={mockCities}
              onSelect={(id) => console.log('Selected city:', id)}
            />
          </motion.div>
        } />
        <Route path="/dashboard" element={
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GameDashboard 
              playerState={mockPlayerState}
              activities={mockActivities}
              onActivitySelect={(id) => console.log('Selected activity:', id)}
            />
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
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
  );
}

export default App;
