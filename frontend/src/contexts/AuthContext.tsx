/**
 * Authentication Context
 * 
 * Manages user authentication state across the application.
 * Provides login, logout, and user session management.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatar: string;
  language: string;
}

interface Player {
  id: string;
  level: number;
  experience: number;
  soms: number;
  characterId: string;
  cityId: string;
  donationCurrency: number;
  stats?: {
    hunger: number;
    health: number;
    mood: number;
    energy: number;
  };
}

interface AuthContextType {
  user: User | null;
  player: Player | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User, player: Player) => void;
  logout: () => void;
  updatePlayer: (player: Partial<Player>) => void;
  refreshPlayer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { i18n } = useTranslation();

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    const storedPlayer = localStorage.getItem('auth_player');

    if (storedToken && storedUser && storedPlayer) {
      const parsedUser = JSON.parse(storedUser);
      setToken(storedToken);
      setUser(parsedUser);
      setPlayer(JSON.parse(storedPlayer));
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      
      // Sync language from user profile
      if (parsedUser.language && ['ru', 'uz', 'uk', 'en'].includes(parsedUser.language)) {
        i18n.changeLanguage(parsedUser.language);
      }
    }
    
    setIsLoading(false);
  }, [i18n]);

  const login = (newToken: string, newUser: User, newPlayer: Player) => {
    setToken(newToken);
    setUser(newUser);
    setPlayer(newPlayer);
    
    // Persist to localStorage
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    localStorage.setItem('auth_player', JSON.stringify(newPlayer));
    
    // Set axios default header
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    
    // Sync language from user profile
    if (newUser.language && ['ru', 'uz', 'uk', 'en'].includes(newUser.language)) {
      i18n.changeLanguage(newUser.language);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setPlayer(null);
    
    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_player');
    
    // Remove axios default header
    delete axios.defaults.headers.common['Authorization'];
  };

  const updatePlayer = (updates: Partial<Player>) => {
    if (player) {
      const updatedPlayer = { ...player, ...updates };
      setPlayer(updatedPlayer);
      localStorage.setItem('auth_player', JSON.stringify(updatedPlayer));
    } else {
      // If player doesn't exist yet, create it from updates
      const newPlayer = updates as Player;
      setPlayer(newPlayer);
      localStorage.setItem('auth_player', JSON.stringify(newPlayer));
    }
  };

  const refreshPlayer = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${API_URL}/api/player/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.player) {
        const updatedPlayer = {
          id: response.data.player.userId,
          level: response.data.player.level,
          experience: response.data.player.experience,
          soms: response.data.player.soms,
          characterId: response.data.player.characterId,
          cityId: player?.cityId || '',
          donationCurrency: response.data.player.donationCurrency,
          stats: response.data.player.stats
        };
        setPlayer(updatedPlayer);
        localStorage.setItem('auth_player', JSON.stringify(updatedPlayer));
        console.log('Player refreshed successfully:', updatedPlayer);
      }
    } catch (error) {
      console.error('Failed to refresh player:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        player,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        updatePlayer,
        refreshPlayer
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
