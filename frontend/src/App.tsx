/**
 * Root application component
 * 
 * Production-ready iOS-style modern design with smooth transitions
 * Full authentication flow with Google OAuth
 * Multi-language support (RU, UZ, UK, EN)
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import toast, { Toaster } from 'react-hot-toast';
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PreferencesProvider, usePreferences } from './contexts/PreferencesContext';
import { HomePage } from './components/HomePage';
import Emoji from './components/Emoji';
import { BottomNavBar } from './components/BottomNavBar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineBanner } from './components/OfflineBanner';
import { ScrollToTop } from './components/ScrollToTop';
import { TelegramBackButton } from './components/TelegramBackButton';
import LoadingScreen from './components/LoadingScreen';
import { cosmeticItems } from './data/cosmeticItems';

// Route-level code splitting: keeps the initial bundle small so the game opens fast on
// mobile. HomePage stays eager (first paint); every other screen loads on demand.
const OnboardingFlow = lazy(() => import('./components/OnboardingFlow').then(m => ({ default: m.OnboardingFlow })));
const GameDashboardContainer = lazy(() => import('./components/GameDashboardContainer').then(m => ({ default: m.GameDashboardContainer })));
const DonationModal = lazy(() => import('./components/DonationModal').then(m => ({ default: m.DonationModal })));
const CosmeticShop = lazy(() => import('./components/CosmeticShop').then(m => ({ default: m.CosmeticShop })));
const Inventory = lazy(() => import('./components/Inventory').then(m => ({ default: m.Inventory })));
const Leaderboard = lazy(() => import('./components/Leaderboard').then(m => ({ default: m.Leaderboard })));
const ReferralPanel = lazy(() => import('./components/ReferralPanel').then(m => ({ default: m.ReferralPanel })));
const PlayerProfile = lazy(() => import('./components/PlayerProfile').then(m => ({ default: m.PlayerProfile })));
const TasksPage = lazy(() => import('./components/TasksPage').then(m => ({ default: m.TasksPage })));
const Settings = lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));
const HealthCheck = lazy(() => import('./components/HealthCheck').then(m => ({ default: m.HealthCheck })));
const ReferralLanding = lazy(() => import('./components/ReferralLanding').then(m => ({ default: m.ReferralLanding })));
const TermsOfService = lazy(() => import('./components/TermsOfService').then(m => ({ default: m.TermsOfService })));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const ClassHall = lazy(() => import('./components/ClassHall'));
const CityMigration = lazy(() => import('./components/CityMigration'));
const ArenaPage = lazy(() => import('./components/ArenaPage').then(m => ({ default: m.ArenaPage })));
const AchievementsPage = lazy(() => import('./components/AchievementsPage').then(m => ({ default: m.AchievementsPage })));
const CraftingPage = lazy(() => import('./components/CraftingPage').then(m => ({ default: m.CraftingPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

const API_URL = import.meta.env.VITE_API_URL || '';

function LogoutPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    logout();
    setTimeout(() => {
      navigate('/');
    }, 2000);
  }, []);

  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="mb-6"
      >
        <Emoji emoji="👋" size={96} />
      </motion.div>
      <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
        {t('auth.loggingOut', 'Выход из системы...')}
      </h2>
      <p className="text-gray-600 dark:text-gray-300">
        {t('auth.redirectingHome', 'Перенаправление на главную...')}
      </p>
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
        <Route path="/onboarding" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="relative"
          >
            <OnboardingFlow />
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
            <GameDashboardContainer />
          </motion.div>
        } />
        <Route path="/logout" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-black dark:from-black dark:via-black dark:to-black flex items-center justify-center"
          >
            <LogoutPage />
          </motion.div>
        } />
        <Route path="/ref/:code" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-black dark:from-black dark:via-black dark:to-black flex items-center justify-center p-4"
          >
            <ReferralLanding />
          </motion.div>
        } />
        <Route path="/auth" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <AuthRedirect />
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
            <CosmeticShopWithData />
          </motion.div>
        } />
        <Route path="/inventory" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="relative"
          >
            <InventoryWithData />
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
            <LeaderboardWithData />
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
            <ReferralPanelWithData />
          </motion.div>
        } />
        <Route path="/donate" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-black dark:from-black dark:via-black dark:to-black"
          >
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
            <PlayerProfileWithData />
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
            <SettingsWithI18n />
          </motion.div>
        } />
        <Route path="/terms" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="relative"
          >
            <TermsOfService />
          </motion.div>
        } />
        <Route path="/privacy" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="relative"
          >
            <PrivacyPolicy />
          </motion.div>
        } />
        <Route path="/classes" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="relative"
          >
            <ClassHall />
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
            <CityMigration />
          </motion.div>
        } />
        <Route path="/tasks" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="relative"
          >
            <TasksPage />
          </motion.div>
        } />
        <Route path="/arena" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="relative"
          >
            <ArenaPage />
          </motion.div>
        } />
        <Route path="/achievements" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="relative"
          >
            <AchievementsPage />
          </motion.div>
        } />
        <Route path="/crafting" element={
          <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="relative"
          >
            <CraftingPage />
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
}

// Redirect /auth to home for proper onboarding
function AuthRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/');
  }, [navigate]);

  return null;
}

// Wrapper components with real data
const CosmeticShopWithData = () => {
  const { player, updatePlayer, token, refreshPlayer } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCosmetics = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/cosmetics`, {
          headers: { Authorization: `Bearer ${token || localStorage.getItem('auth_token')}` }
        });
        setItems(response.data.items);
      } catch (error) {
        console.error('Failed to fetch cosmetics:', error);
        // Fallback to local data
        setItems(cosmeticItems);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchCosmetics();
    } else {
      setItems(cosmeticItems);
      setLoading(false);
    }
  }, [token]);

  const handlePurchase = async (id: string, currency: 'soms' | 'crystals') => {
    try {
      const response = await axios.post(
        `${API_URL}/api/cosmetics/purchase`,
        { itemId: id, currency },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update player balance
      updatePlayer({
        soms: response.data.player.soms,
        donationCurrency: response.data.player.donationCurrency
      });

      // Update items to mark as owned
      setItems(prev => prev.map(item =>
        item.id === id ? { ...item, owned: true } : item
      ));
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Purchase failed');
    }
  };

  const handleEquip = async (id: string) => {
    try {
      await axios.post(
        `${API_URL}/api/cosmetics/equip`,
        { itemId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update items to mark as equipped
      const item = items.find(i => i.id === id);
      if (item) {
        setItems(prev => prev.map(i => ({
          ...i,
          equipped: i.id === id ? true : (i.type === item.type ? false : i.equipped)
        })));
      }

      // Refresh player data to get updated cosmetics
      await refreshPlayer();
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Equip failed');
    }
  };

  const handleUnequip = async (id: string) => {
    try {
      await axios.post(
        `${API_URL}/api/cosmetics/unequip`,
        { itemId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setItems(prev => prev.map(i => (i.id === id ? { ...i, equipped: false } : i)));
      await refreshPlayer();
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Unequip failed');
    }
  };

  /** Sell an owned item back for part of its price */
  const handleSell = async (id: string) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/cosmetics/sell`,
        { itemId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.player) {
        updatePlayer({
          soms: response.data.player.soms,
          donationCurrency: response.data.player.donationCurrency
        });
      }

      setItems(prev => prev.map(i => (i.id === id ? { ...i, owned: false, equipped: false } : i)));
      await refreshPlayer();
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Sell failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-black dark:from-black dark:via-black dark:to-black">
        <div className="animate-bounce"><Emoji emoji="🛍️" size={72} /></div>
      </div>
    );
  }

  return (
    <CosmeticShop
      items={items}
      playerCrystals={player?.donationCurrency || 0}
      playerSoms={player?.soms || 0}
      onPurchase={handlePurchase}
      onEquip={handleEquip}
      onUnequip={handleUnequip}
      onSell={handleSell}
    />
  );
};

const InventoryWithData = () => {
  const { token, refreshPlayer } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCosmetics = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/cosmetics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setItems(response.data.items);
      } catch (error) {
        console.error('Failed to fetch cosmetics:', error);
        setItems(cosmeticItems);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchCosmetics();
    } else {
      setItems(cosmeticItems);
      setLoading(false);
    }
  }, [token]);

  const handleEquip = async (id: string) => {
    try {
      await axios.post(
        `${API_URL}/api/cosmetics/equip`,
        { itemId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const item = items.find(i => i.id === id);
      if (item) {
        setItems(prev => prev.map(i => ({
          ...i,
          equipped: i.id === id ? true : (i.type === item.type ? false : i.equipped)
        })));
      }

      await refreshPlayer();
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Equip failed');
    }
  };

  const handleUnequip = async (id: string) => {
    try {
      await axios.post(
        `${API_URL}/api/cosmetics/unequip`,
        { itemId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setItems(prev => prev.map(i =>
        i.id === id ? { ...i, equipped: false } : i
      ));

      await refreshPlayer();
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Unequip failed');
    }
  };

  /** Sell an owned item back for part of its price */
  const handleSell = async (id: string) => {
    try {
      await axios.post(
        `${API_URL}/api/cosmetics/sell`,
        { itemId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setItems(prev => prev.map(i => (i.id === id ? { ...i, owned: false, equipped: false } : i)));
      await refreshPlayer();
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Sell failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-black dark:from-black dark:via-black dark:to-black">
        <div className="animate-bounce"><Emoji emoji="📦" size={72} /></div>
      </div>
    );
  }

  return (
    <Inventory
      items={items}
      onEquip={handleEquip}
      onUnequip={handleUnequip}
      onSell={handleSell}
    />
  );
};

const LeaderboardWithData = () => {
  return <Leaderboard />;
};

const ReferralPanelWithData = () => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [bonus, setBonus] = useState({ crystals: 0, soms: 0 });

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        // TODO: GET /api/referrals
        setReferrals([]);
        setBonus({ crystals: 0, soms: 0 });
      } catch (error) {
        console.error('Failed to fetch referrals:', error);
      }
    };

    fetchReferrals();
  }, []);

  const referralCode = 'LOADING';
  const referralLink = `${window.location.origin}/ref/${referralCode}`;

  return (
    <ReferralPanel
      referralCode={referralCode}
      referralLink={referralLink}
      referredFriends={referrals}
      totalBonus={bonus}
    />
  );
};

const PlayerProfileWithData = () => {
  const { user, player } = useAuth();

  // Статы считаем сразу из данных игрока. Раньше они приходили из useEffect,
  // первый рендер был со stats=null → страница профиля падала в белый экран.
  const stats = {
    level: player?.level || 1,
    experience: player?.experience || 0,
    experienceToNextLevel: 100,
    soms: player?.soms || 0,
    crystals: player?.donationCurrency || 0,
    totalActivities: 0,
    daysPlayed: 0,
    achievements: 0,
    strength: player?.stats?.strength,
    defense: player?.stats?.defense,
    agility: player?.stats?.agility,
    stamina: player?.stats?.stamina,
    intelligence: player?.stats?.intelligence,
    luck: player?.stats?.luck,
    statPoints: player?.stats?.statPoints,
    combatPower: player?.stats?.combatPower,
  };

  const playerInfo = {
    username: user?.displayName || 'Player',
    avatar: user?.avatar || '👤',
    characterName: player?.characterId || 'Newbie',
    cityName: player?.cityId || 'No city',
    joinedDate: new Date().toISOString(),
    referralCode: ''
  };

  return (
    <PlayerProfile
      playerInfo={playerInfo}
      stats={stats}
      onEditProfile={() => console.log('Edit profile')}
      isVerified={false}
      telegramUsername=""
      onVerify={() => console.log('Verified!')}
    />
  );
};

function GoogleOAuthRedirectHandler() {
  const { login, setLinkingConflict } = useAuth();
  const navigate = useNavigate();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;

    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');

    if (!accessToken) {
      if (params.get('error')) {
        handledRef.current = true;
        navigate('/', { replace: true });
      }
      return;
    }
    handledRef.current = true;

    // Read the session from localStorage, not from context state: this effect runs on
    // mount (before AuthProvider has rehydrated `token`), so context state is still null.
    const pendingLink = localStorage.getItem('pendingGoogleLink');
    const token = localStorage.getItem('auth_token');
    if (!pendingLink || !token) {
      navigate('/', { replace: true });
      return;
    }

    localStorage.removeItem('pendingGoogleLink');

    (async () => {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const userInfo = await userInfoRes.json();
        const pseudoIdToken = btoa(JSON.stringify({
          sub: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          email_verified: userInfo.email_verified,
        }));

        const API_URL = import.meta.env.VITE_API_URL || '';
        const initData = (window as any).Telegram?.WebApp?.initData || '';
        const res = await axios.post(`${API_URL}/api/auth/link/google`, {
          idToken: pseudoIdToken,
          initData,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.conflict) {
          // Show the merge dialog instead of silently dropping the result
          setLinkingConflict(res.data);
        } else {
          const storedUser = localStorage.getItem('auth_user');
          const storedPlayer = localStorage.getItem('auth_player');
          if (storedUser) {
            const user = JSON.parse(storedUser);
            login(token, { ...user, hasGoogle: true }, storedPlayer ? JSON.parse(storedPlayer) : null);
          }
        }
      } catch (err) {
        console.error('Google link redirect failed:', err);
      } finally {
        // navigate() replaces the whole location (path/search/hash), so the access_token
        // is removed from the URL without the extra reloads that location.search = '' caused.
        navigate('/', { replace: true });
      }
    })();
  }, [login, navigate, setLinkingConflict]);

  return null;
}

function GlobalConflictModal() {
  const { linkingConflict, setLinkingConflict, mergeAccounts } = useAuth();
  const { t } = useTranslation();
  const [merging, setMerging] = useState(false);

  if (!linkingConflict) return null;

  const handleMerge = async (keepId: string, removeId: string) => {
    setMerging(true);
    try {
      await mergeAccounts(keepId, removeId);
      setLinkingConflict(null);
      toast.success(t('settings.mergeDone', 'Аккаунты объединены'));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t('settings.mergeFailed', 'Не удалось объединить аккаунты'));
    } finally {
      setMerging(false);
    }
  };

  const otherId = (accId: string) =>
    accId === linkingConflict.keepUser.id ? linkingConflict.removeUser.id : linkingConflict.keepUser.id;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[200]"
        onClick={() => !merging && setLinkingConflict(null)}
      />
      <div className="fixed inset-0 flex items-center justify-center z-[201] pointer-events-none p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-[420px] pointer-events-auto"
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="text-center mb-4">
              <Emoji emoji="⚠️" size={48} />
              <h2 className="text-xl font-black text-gray-900 dark:text-white mt-3 mb-1">
                {t('settings.conflictTitle', 'Обнаружен конфликт аккаунтов')}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('settings.conflictHint', 'У вас уже есть аккаунт с этим входом. Нажмите на аккаунт, который хотите оставить:')}
              </p>
            </div>

            <div className="space-y-3 mb-4">
              {[linkingConflict.keepUser, linkingConflict.removeUser].map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => !merging && handleMerge(acc.id, otherId(acc.id))}
                  disabled={merging}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all disabled:opacity-50 ${
                    acc.id === linkingConflict.suggestedKeep
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Emoji emoji={acc.id === linkingConflict.suggestedKeep ? '⭐' : '👤'} size={24} />
                    <div className="flex-1 min-w-0">
                      <span className="block font-bold text-gray-900 dark:text-white text-sm truncate">
                        {acc.displayName}
                      </span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">
                        {t('settings.level', 'Ур.')} {acc.level} • {acc.soms} {t('common.currency', 'сом')} • {acc.crystals} 💎
                      </span>
                    </div>
                    {acc.id === linkingConflict.suggestedKeep && (
                      <span className="text-xs font-bold text-indigo-500 bg-indigo-100 dark:bg-indigo-900 px-2 py-1 rounded-lg shrink-0">
                        {t('settings.suggested', 'Рекомендуется')}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mb-3">
              {t('settings.mergeHint', 'Данные будут объединены: ресурсы и статы берутся по максимуму.')}
            </p>

            <button
              onClick={() => setLinkingConflict(null)}
              disabled={merging}
              className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-xl border border-gray-200 dark:border-gray-700"
            >
              {merging ? '...' : t('ui.close')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <ThemeProvider>
          <PreferencesProvider>
            <AuthProvider>
              <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                  <ScrollToTop />
                  <TelegramBackButton />
                  <Suspense fallback={<LoadingScreen />}>
                    <AnimatedRoutes />
                  </Suspense>
                  <BottomNavBar />
                  <GlobalConflictModal />
                  <GoogleOAuthRedirectHandler />
                  <OfflineBanner />
                </BrowserRouter>

                <AppToaster />
              </QueryClientProvider>
            </AuthProvider>
          </PreferencesProvider>
        </ThemeProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}

/** Toast styling that follows the app theme (light/dark). */
function AppToaster() {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: dark
          ? {
              background: 'rgba(17, 24, 39, 0.95)',
              backdropFilter: 'blur(10px)',
              color: '#f9fafb',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
            }
          : {
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              color: '#2C1810',
              borderRadius: '16px',
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }
      }}
    />
  );
}

// Wrapper component for Settings with i18n
const SettingsWithI18n = () => {
  const { i18n } = useTranslation();
  const { player, token, user } = useAuth();
  const { sound, music, notifications, togglePreference } = usePreferences();
  const [appStats, setAppStats] = useState<any>(null);

  useEffect(() => {
    const fetchAppStats = async () => {
      if (!token) return;

      try {
        const API_URL = import.meta.env.VITE_API_URL || '';
        const response = await axios.get(`${API_URL}/api/stats/app`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAppStats(response.data);
      } catch (error) {
        console.error('Failed to fetch app stats:', error);
        // Честно показываем «—», а не нули: раньше ошибка выглядела как «0 игроков онлайн»
        setAppStats(null);
      }
    };

    fetchAppStats();
  }, [token, player?.cityId]);

  const handleLanguageChange = async (lang: 'ru' | 'uz' | 'uk' | 'en') => {
    // Change language in i18n
    i18n.changeLanguage(lang);

    // Save to backend
    if (token) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || '';
        await axios.patch(
          `${API_URL}/api/player/language`,
          { language: lang },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Update user in localStorage
        if (user) {
          const updatedUser = { ...user, language: lang };
          localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        }
      } catch (error) {
        console.error('Failed to save language:', error);
      }
    }
  };

  return (
    <Settings
      currentLanguage={i18n.language as 'ru' | 'uz' | 'uk' | 'en'}
      onLanguageChange={handleLanguageChange}
      soundEnabled={sound}
      onSoundToggle={() => togglePreference('sound')}
      musicEnabled={music}
      onMusicToggle={() => togglePreference('music')}
      notificationsEnabled={notifications}
      onNotificationsToggle={() => togglePreference('notifications')}
      appStats={appStats}
    />
  );
};

export default App;
