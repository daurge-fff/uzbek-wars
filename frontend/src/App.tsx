/**
 * Root application component
 * 
 * Production-ready iOS-style modern design with smooth transitions
 * Full authentication flow with Google OAuth
 * Multi-language support (RU, UZ, UK, EN)
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HomePage } from './components/HomePage';
import { GameDashboardContainer } from './components/GameDashboardContainer';
import { DonationModal } from './components/DonationModal';
import { CosmeticShop } from './components/CosmeticShop';
import { Inventory } from './components/Inventory';
import { Leaderboard } from './components/Leaderboard';
import { ReferralPanel } from './components/ReferralPanel';
import { PlayerProfile } from './components/PlayerProfile';
import { TasksPage } from './components/TasksPage';
import { Settings } from './components/Settings';
import { HealthCheck } from './components/HealthCheck';
import { ReferralLanding } from './components/ReferralLanding';
import { TermsOfService } from './components/TermsOfService';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import Emoji from './components/Emoji';
import { OnboardingFlow } from './components/OnboardingFlow';
import { BottomNavBar } from './components/BottomNavBar';
import ClassHall from './components/ClassHall';
import CityMigration from './components/CityMigration';
import { ArenaPage } from './components/ArenaPage';
import { AchievementsPage } from './components/AchievementsPage';
import { CraftingPage } from './components/CraftingPage';
import { cosmeticItems } from './data/cosmeticItems';

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
  const { token, login, isTelegram } = useAuth();

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');

    if (!accessToken) return;

    const pendingLink = localStorage.getItem('pendingGoogleLink');
    if (!pendingLink || !token) {
      window.location.hash = '';
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
        const initData = isTelegram ? (window as any).Telegram?.WebApp?.initData || '' : '';
        await axios.post(`${API_URL}/api/auth/link/google`, {
          idToken: pseudoIdToken,
          initData,
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          login(token, { ...user, hasGoogle: true }, JSON.parse(localStorage.getItem('auth_player') || '{}'));
        }
      } catch (err) {
        console.error('Google link redirect failed:', err);
      } finally {
        window.location.hash = '';
        window.location.search = '';
      }
    })();
  }, []);

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
    } catch {
    } finally {
      setMerging(false);
    }
  };

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
                {t('settings.conflictHint', 'У вас уже есть аккаунт с этим входом. Выберите, какой оставить:')}
              </p>
            </div>

            <div className="space-y-3 mb-4">
              {[linkingConflict.keepUser, linkingConflict.removeUser].map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => handleMerge(
                    acc.id === linkingConflict.suggestedKeep ? acc.id : linkingConflict.suggestedKeep,
                    acc.id === linkingConflict.suggestedKeep ? (acc.id === linkingConflict.keepUser.id ? linkingConflict.removeUser.id : linkingConflict.keepUser.id) : acc.id
                  )}
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
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AnimatedRoutes />
            <BottomNavBar />
            <GlobalConflictModal />
            <GoogleOAuthRedirectHandler />
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
      </AuthProvider>
    </ThemeProvider>
  );
}

// Wrapper component for Settings with i18n
const SettingsWithI18n = () => {
  const { i18n } = useTranslation();
  const { player, token, user } = useAuth();
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
      soundEnabled={true}
      onSoundToggle={() => console.log('Toggle sound')}
      musicEnabled={true}
      onMusicToggle={() => console.log('Toggle music')}
      notificationsEnabled={false}
      onNotificationsToggle={() => console.log('Toggle notifications')}
      appStats={appStats}
    />
  );
};

export default App;
