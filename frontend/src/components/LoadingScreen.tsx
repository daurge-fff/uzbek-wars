import { motion } from 'framer-motion';
import Emoji from './Emoji';

interface LoadingScreenProps {
  /** Optional label under the spinner */
  label?: string;
  /** Full-screen vs inline block */
  fullScreen?: boolean;
}

/**
 * Branded loading state. Replaces bare spinners so route transitions and data fetches
 * never show an empty flash.
 */
export function LoadingScreen({ label = 'Загрузка…', fullScreen = true }: LoadingScreenProps) {
  return (
    <div
      className={
        fullScreen
          ? 'min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-black dark:from-black dark:via-black dark:to-black'
          : 'flex flex-col items-center justify-center gap-3 py-12'
      }
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
      >
        <Emoji emoji="⚔️" size={fullScreen ? 56 : 36} />
      </motion.div>
      <motion.p
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, repeat: Infinity, repeatType: 'reverse' }}
        className="text-sm font-bold text-gray-500 dark:text-gray-400"
      >
        {label}
      </motion.p>
    </div>
  );
}

/** Inline skeleton card used while a list/route is loading. */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-gray-200/70 dark:bg-gray-800/70 ${className}`}
    />
  );
}

export default LoadingScreen;
