import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  getTelegramColorScheme,
  applyTelegramChrome,
  applyTelegramInsets,
  onTelegramThemeChange,
} from '../utils/telegram';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'theme';

function readSavedTheme(): Theme | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'light' || saved === 'dark' ? saved : null;
  } catch {
    return null;
  }
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // A manually chosen theme wins; otherwise follow the Telegram client on first launch.
  const [theme, setTheme] = useState<Theme>(
    () => readSavedTheme() || getTelegramColorScheme() || 'light'
  );

  useEffect(() => {
    try {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
      // Keep the Telegram chrome (header, background, bottom bar) in sync with the theme
      applyTelegramChrome(theme);
      applyTelegramInsets();
    } catch (e) {
      console.error('Theme error:', e);
    }
  }, [theme]);

  // Follow Telegram theme changes until the player explicitly picks a theme.
  useEffect(() => {
    return onTelegramThemeChange((scheme) => {
      if (readSavedTheme()) return; // user already chose — don't override
      setTheme(scheme);
    });
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const next: Theme = prev === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
