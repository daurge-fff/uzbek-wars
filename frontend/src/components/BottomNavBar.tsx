import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Emoji from './Emoji';

interface NavItem {
  id: string;
  icon: string;
  path: string;
}

export const BottomNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);

  const navItems: NavItem[] = [
    { id: 'arena', icon: '⚔️', path: '/arena' },
    { id: 'shop', icon: '🛍️', path: '/shop' },
    { id: 'home', icon: '🏠', path: '/dashboard' },
    { id: 'tasks', icon: '📜', path: '/tasks' },
    { id: 'settings', icon: '⚙️', path: '/settings' },
  ];

  useEffect(() => {
    const currentIndex = navItems.findIndex(item => item.path === location.pathname);
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex);
    }
  }, [location.pathname]);

  const handleNavClick = (item: NavItem, index: number) => {
    setActiveIndex(index);
    navigate(item.path);
  };

  // Don't show navbar on certain pages
  const hideNavbarPaths = ['/', '/onboarding', '/logout', '/auth', '/terms', '/privacy'];
  const shouldHide = hideNavbarPaths.some(path =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  );

  if (shouldHide) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-6 pointer-events-none">
      <div className="max-w-sm mx-auto px-8">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="pointer-events-auto"
        >
          {/* Floating pill container */}
          <div className="relative rounded-full overflow-hidden">
            {/* Border wrapper */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-gray-300/30 to-gray-200/10 dark:from-white/10 dark:to-transparent p-[1.5px] glass-premium">
              <div className="w-full h-full rounded-full bg-white/40 dark:bg-black/40 backdrop-blur-md" />
            </div>

            {/* Content */}
            <div className="relative flex items-center justify-around px-1.5 py-2">
              {navItems.map((item, index) => {
                const isActive = index === activeIndex;

                return (
                  <NavButton
                    key={item.id}
                    item={item}
                    isActive={isActive}
                    onClick={() => handleNavClick(item, index)}
                  />
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

interface NavButtonProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

const NavButton = ({ item, isActive, onClick }: NavButtonProps) => {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.85 }}
      className="relative flex items-center justify-center w-14 h-14"
    >
      {/* Active glass background - perfect circle */}
      {isActive && (
        <motion.div
          layoutId="active-glass"
          className="absolute inset-0 rounded-full bg-white/40 dark:bg-white/10 backdrop-blur-sm border border-white/50 dark:border-white/20"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}

      {/* Icon */}
      <Emoji
        emoji={item.icon}
        size={28}
        className={isActive ? '' : 'grayscale opacity-50'}
      />

      {/* Active indicator dot */}
      {isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="absolute bottom-1.5 w-1 h-1 rounded-full bg-gray-800 dark:bg-gray-200 z-10"
        />
      )}
    </motion.button>
  );
};
