import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const BackButton = () => {
  const navigate = useNavigate();

  return (
    <motion.button
      whileHover={{ scale: 1.05, x: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate('/')}
      className="fixed top-4 left-4 z-[9999] px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center gap-2 font-bold text-gray-900 dark:text-white hover:shadow-xl transition-shadow"
    >
      <span className="text-xl">←</span>
      <span className="hidden sm:inline">Назад</span>
    </motion.button>
  );
};
