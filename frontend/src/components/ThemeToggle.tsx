import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="w-12 h-12 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-lg flex items-center justify-center border border-gray-200 dark:border-gray-700 transition-colors"
      aria-label="Toggle theme"
    >
      <span className="text-2xl">
        {theme === 'light' ? '🌙' : '☀️'}
      </span>
    </motion.button>
  );
};
