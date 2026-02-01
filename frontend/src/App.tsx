/**
 * Root application component
 * 
 * Sets up routing, state management, and global providers
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ColorPalette } from './components/ColorPalette';
import { GoogleLoginButton } from './components/GoogleLoginButton';
import { CharacterSelection } from './components/CharacterSelection';
import { CitySelection } from './components/CitySelection';
import { GameDashboard } from './components/GameDashboard';
import { LanguageSwitcher } from './components/LanguageSwitcher';

// Create React Query client with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

// Mock data for demo
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
  { id: 'trade', name: 'Торговать', icon: '🏪' }
];

function HomePage() {
  const [currentLang, setCurrentLang] = useState<'ru' | 'uz' | 'uk' | 'en'>('ru');

  return (
    <div className="min-h-screen bg-background-primary">
      <header className="bg-primary text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Узбек Варс - Demo</h1>
          <LanguageSwitcher 
            currentLanguage={currentLang} 
            onLanguageChange={setCurrentLang}
          />
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link to="/colors" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-bold text-text-primary mb-2">🎨 Цветовая палитра</h2>
            <p className="text-text-secondary">Узбекская культурная эстетика</p>
          </Link>
          
          <Link to="/auth" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-bold text-text-primary mb-2">🔐 Авторизация</h2>
            <p className="text-text-secondary">Google OAuth компонент</p>
          </Link>
          
          <Link to="/characters" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-bold text-text-primary mb-2">👤 Выбор персонажа</h2>
            <p className="text-text-secondary">Свайп между персонажами</p>
          </Link>
          
          <Link to="/cities" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-bold text-text-primary mb-2">🏙️ Выбор города</h2>
            <p className="text-text-secondary">Балансировка городов</p>
          </Link>
          
          <Link to="/dashboard" className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-bold text-text-primary mb-2">🎮 Игровой экран</h2>
            <p className="text-text-secondary">Dashboard с активностями</p>
          </Link>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/colors" element={<ColorPalette />} />
          <Route path="/auth" element={
            <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
              <div className="max-w-md w-full">
                <h1 className="text-2xl font-bold text-text-primary mb-8 text-center">Вход в игру</h1>
                <GoogleLoginButton />
              </div>
            </div>
          } />
          <Route path="/characters" element={
            <CharacterSelection 
              characters={mockCharacters}
              onSelect={(id) => console.log('Selected character:', id)}
            />
          } />
          <Route path="/cities" element={
            <CitySelection 
              cities={mockCities}
              onSelect={(id) => console.log('Selected city:', id)}
            />
          } />
          <Route path="/dashboard" element={
            <GameDashboard 
              playerState={mockPlayerState}
              activities={mockActivities}
              onActivitySelect={(id) => console.log('Selected activity:', id)}
            />
          } />
        </Routes>
      </BrowserRouter>
      
      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#FFF8DC',
            color: '#2C1810'
          }
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
