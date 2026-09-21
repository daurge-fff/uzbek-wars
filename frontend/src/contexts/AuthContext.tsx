/**
 * Authentication Context
 * 
 * Manages user authentication state across the application.
 * Provides login, logout, and user session management.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {
  getDeviceInfo,
  getTelegramInitData,
  getTelegramUser,
  initTelegramUi,
  isTelegramMiniApp,
  getStartParam,
  TelegramUserProfile,
} from '../utils/telegram';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatar: string;
  language: string;
  hasGoogle?: boolean;
  hasTelegram?: boolean;
  telegramId?: string;
  telegramUsername?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
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
    strength?: number;
    defense?: number;
    agility?: number;
    stamina?: number;
    intelligence?: number;
    luck?: number;
    statPoints?: number;
    combatPower?: number;
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
  /** True when the page is opened inside the Telegram mini app */
  isTelegram: boolean;
  /** Telegram profile from initDataUnsafe — display only, never for auth */
  telegramUser: TelegramUserProfile | null;
  telegramAuthPending: boolean;
  telegramAuthError: string | null;
  /** Signs in with the signed initData string (auto-called on mini app open) */
  loginWithTelegram: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || '';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [telegramAuthPending, setTelegramAuthPending] = useState(false);
  const [telegramAuthError, setTelegramAuthError] = useState<string | null>(null);
  const { i18n } = useTranslation();

  const isTelegram = isTelegramMiniApp();
  const telegramUser = getTelegramUser();

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

  /**
   * Signs in through the Telegram mini app.
   *
   * The raw signed initData string is verified on the server with the bot token, and the
   * backend stores the Telegram profile (id, username, first/last name, photo, language).
   * Works both for auto-login on open and for the manual retry button.
   */
  const loginWithTelegram = async () => {
    const initData = getTelegramInitData();

    if (!initData) {
      setTelegramAuthError('NO_INIT_DATA');
      return;
    }

    setTelegramAuthPending(true);
    setTelegramAuthError(null);

    try {
      const response = await axios.post(`${API_URL}/api/auth/telegram-webapp`, {
        initData,
        deviceInfo: getDeviceInfo(),
      });

      const { token: newToken, user: newUser, player: newPlayer } = response.data;
      login(newToken, newUser, newPlayer);

      // Handle start_param for account linking (e.g. "link_ABC123")
      const startParam = getStartParam();
      if (startParam?.startsWith('link_')) {
        const code = startParam.slice(5);
        try {
          const linkRes = await axios.post(`${API_URL}/api/auth/link/verify`, {
            code,
            initData,
          }, {
            headers: { Authorization: `Bearer ${newToken}` }
          });
          if (linkRes.data.bonusAwarded) {
            login(newToken, { ...newUser, hasTelegram: true }, newPlayer);
          }
        } catch (err: any) {
          console.error('Link verify failed:', err.response?.data?.error || err.message);
        }
      }
    } catch (error: any) {
      const code = error?.response?.data?.code || 'AUTH_FAILED';
      setTelegramAuthError(code);
      console.error('Telegram mini app login failed:', code, error);
    } finally {
      setTelegramAuthPending(false);
    }
  };

  // Telegram mini app: prepare the UI and sign in automatically on open
  useEffect(() => {
    initTelegramUi();

    const alreadyAuthenticated = Boolean(localStorage.getItem('auth_token'));
    if (!isTelegram || alreadyAuthenticated || !getTelegramInitData()) {
      return;
    }

    void loginWithTelegram();
    // Runs once on mount: the mini app is opened fresh from Telegram each time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          // id = the Player document (not userId): that's what the battle logs
          // and the leaderboard compare, previously the comparisons were always false
          id: response.data.player.id || response.data.player.userId,
          level: response.data.player.level,
          experience: response.data.player.experience,
          soms: response.data.player.soms,
          characterId: response.data.player.characterId,
          cityId: player?.cityId || '',
          donationCurrency: response.data.player.donationCurrency,
          stats: {
            ...response.data.player.stats,
            // Merge combat stats
            ...(response.data.player.combatStats || {})
          }
        };
        setPlayer(updatedPlayer);
        localStorage.setItem('auth_player', JSON.stringify(updatedPlayer));
        console.log('Player refreshed successfully:', updatedPlayer);
      }
    } catch (error: any) {
      console.error('Failed to refresh player:', error);
      // If player not found (404), logout to clear stale token
      if (error.response?.status === 404) {
        console.warn('Player not found, logging out...');
        logout();
      }
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
        refreshPlayer,
        isTelegram,
        telegramUser,
        telegramAuthPending,
        telegramAuthError,
        loginWithTelegram
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
