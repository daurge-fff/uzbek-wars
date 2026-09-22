import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { createPortal } from 'react-dom';
import axios from 'axios';
import Emoji from './Emoji';
import { useAuth } from '../contexts/AuthContext';
import { getTelegramInitData } from '../utils/telegram';

interface SettingsProps {
  currentLanguage: 'ru' | 'uz' | 'uk' | 'en';
  onLanguageChange: (lang: 'ru' | 'uz' | 'uk' | 'en') => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  musicEnabled: boolean;
  onMusicToggle: () => void;
  notificationsEnabled: boolean;
  onNotificationsToggle: () => void;
  appStats?: {
    uptime: number;
    lastRestart: string;
    onlinePlayersTotal: number;
    onlinePlayersCity: number;
    cityName: string;
    version: string;
  } | null;
}

const languageOptions = [
  { code: 'ru' as const, name: 'Русский', flag: '🇷🇺' },
  { code: 'uz' as const, name: "O'zbekcha", flag: '🇺🇿' },
  { code: 'uk' as const, name: 'Українська', flag: '🇺🇦' },
  { code: 'en' as const, name: 'English', flag: '🇬🇧' }
];

/** Login-related keys: resetting settings must not log the player out */
const AUTH_STORAGE_KEYS = ['auth_token', 'auth_user', 'auth_player'];

/** Unified card style: no heavy shadows or blur, which "drifted" during scroll */
const CARD_CLASS = 'bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5';
const ROW_CLASS = 'w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between';

export const Settings = ({
  currentLanguage,
  onLanguageChange,
  soundEnabled,
  onSoundToggle,
  musicEnabled,
  onMusicToggle,
  notificationsEnabled,
  onNotificationsToggle,
  appStats
}: SettingsProps) => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, token, login, isTelegram, setLinkingConflict } = useAuth();
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [linkingCode, setLinkingCode] = useState<string | null>(null);
  const [linkingLoading, setLinkingLoading] = useState(false);
  const [linkingError, setLinkingError] = useState<string | null>(null);
  const [linkingBonus, setLinkingBonus] = useState<boolean | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || '';

  const handleRequestLinkCode = useCallback(async () => {
    if (!token) return;
    setLinkingLoading(true);
    setLinkingError(null);
    try {
      const res = await axios.post(`${API_URL}/api/auth/link/request-code`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLinkingCode(res.data.code);
    } catch (err: any) {
      setLinkingError(err.response?.data?.error || 'Failed to generate code');
    } finally {
      setLinkingLoading(false);
    }
  }, [token, API_URL]);

  const handleLinkTelegram = useCallback(async () => {
    if (!linkingCode) return;
    const telegramUrl = `https://t.me/uzbekwars_bot/UzbekWars?startapp=link_${linkingCode}`;
    window.open(telegramUrl, '_blank');
  }, [linkingCode]);

  const handleLinkGoogle = useCallback(async () => {
    if (!token) return;
    setLinkingLoading(true);
    setLinkingError(null);

    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
      if (!clientId) {
        setLinkingError('Google client ID not configured');
        setLinkingLoading(false);
        return;
      }

      if (isTelegram) {
        // In Telegram WebView, GSI popup can't postMessage back.
        // Use redirect flow: save state, redirect to Google, handle on return.
        localStorage.setItem('pendingGoogleLink', token);
        const redirectUri = window.location.origin;
        const scope = 'email profile openid';
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}&prompt=select_account`;
        window.location.href = authUrl;
        return;
      }

      // Browser: use GSI popup (works fine outside WebView)
      if (!window.google?.accounts?.oauth2) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Google script'));
          document.body.appendChild(script);
        });
      }

      const initData = getTelegramInitData();

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (response: any) => {
          if (response.access_token) {
            try {
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${response.access_token}` }
              });
              const userInfo = await userInfoRes.json();
              const pseudoIdToken = btoa(JSON.stringify({
                sub: userInfo.sub,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
                email_verified: userInfo.email_verified,
              }));

              const res = await axios.post(`${API_URL}/api/auth/link/google`, {
                idToken: pseudoIdToken,
                initData,
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (res.data.conflict) {
                setLinkingConflict(res.data);
              } else {
                setLinkingBonus(res.data.bonusAwarded);
                if (user) {
                  login(token, { ...user, hasGoogle: true } as any, user as any);
                }
              }
            } catch (err: any) {
              setLinkingError(err.response?.data?.error || 'Failed to link Google');
            } finally {
              setLinkingLoading(false);
            }
          } else if (response.error) {
            setLinkingLoading(false);
            if (response.error !== 'popup_closed') {
              setLinkingError('Google OAuth error');
            }
          }
        },
        error_callback: (error: any) => {
          setLinkingLoading(false);
          if (error.type !== 'popup_closed') {
            setLinkingError('Google OAuth error');
          }
        }
      });

      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err: any) {
      setLinkingError(err.message || 'Failed to link Google');
      setLinkingLoading(false);
    }
  }, [token, isTelegram, API_URL, user, login, setLinkingConflict]);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const parts: string[] = [];
    if (days > 0) parts.push(`${days}${t('common.daysShort', 'д')}`);
    if (days > 0 || hours > 0) parts.push(`${hours}${t('common.hoursShort', 'ч')}`);
    parts.push(`${minutes}${t('common.minutesShort', 'м')}`);
    return parts.join(' ');
  };

  /**
   * Settings reset: we clear the cache and local data, but keep the session.
   * Previously there was a localStorage.clear() here, which silently logged the player out.
   */
  const handleResetApp = async () => {
    if (!window.confirm(t('settings.resetAppConfirm', 'Сбросить настройки и очистить кэш приложения? Вы останетесь в аккаунте.'))) {
      return;
    }

    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
    } catch {
      // The cache may be unavailable — that doesn't block the reset
    }

    Object.keys(localStorage).forEach((key) => {
      if (!AUTH_STORAGE_KEYS.includes(key)) {
        localStorage.removeItem(key);
      }
    });

    setResetDone(true);
    window.location.reload();
  };

  const statsValue = (value?: number) => (appStats ? String(value ?? 0) : '—');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 pb-32">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">
          {t('settings.title', 'Настройки')}
        </h1>

        {/* Language */}
        <div className={CARD_CLASS}>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
            {t('settings.language', 'Язык')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {languageOptions.map((lang) => (
              <button
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
                className={`p-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${
                  currentLanguage === lang.code
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                }`}
              >
                <Emoji emoji={lang.flag} size={24} />
                <span className="text-sm">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Account linking */}
        <div className={CARD_CLASS}>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
            {t('settings.account', 'Аккаунт')}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {t('settings.accountHint', 'Свяжите Telegram и Google для защиты аккаунта и получения бонуса')}
          </p>

          <div className="space-y-3">
            {/* Google status */}
            <div className={ROW_CLASS}>
              <span className="flex items-center gap-3">
                <Emoji emoji="🔵" size={22} />
                <span>
                  <span className="block font-bold text-gray-900 dark:text-white text-sm">Google</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {user?.hasGoogle
                      ? (user.email || t('settings.linked', 'Привязан'))
                      : t('settings.notLinked', 'Не привязан')
                    }
                  </span>
                </span>
              </span>
              {user?.hasGoogle ? (
                <span className="text-green-500 font-bold text-sm">✓</span>
              ) : isTelegram ? (
                <button
                  onClick={handleLinkGoogle}
                  disabled={linkingLoading}
                  className="px-3 py-1.5 bg-indigo-500 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  {linkingLoading ? '...' : t('settings.link', 'Привязать')}
                </button>
              ) : (
                <span className="text-xs text-gray-400">{t('settings.loginViaTelegram', 'Войдите через Telegram')}</span>
              )}
            </div>

            {/* Telegram status */}
            <div className={ROW_CLASS}>
              <span className="flex items-center gap-3">
                <Emoji emoji="✈️" size={22} />
                <span>
                  <span className="block font-bold text-gray-900 dark:text-white text-sm">Telegram</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    {user?.hasTelegram
                      ? (user.telegramUsername ? `@${user.telegramUsername}` : t('settings.linked', 'Привязан'))
                      : t('settings.notLinked', 'Не привязан')
                    }
                  </span>
                </span>
              </span>
              {user?.hasTelegram ? (
                <span className="text-green-500 font-bold text-sm">✓</span>
              ) : (
                <button
                  onClick={handleRequestLinkCode}
                  disabled={linkingLoading}
                  className="px-3 py-1.5 bg-sky-500 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  {linkingLoading ? '...' : t('settings.link', 'Привязать')}
                </button>
              )}
            </div>

            {/* Linking code flow (Telegram → browser link) */}
            {linkingCode && !user?.hasTelegram && (
              <div className="p-3 bg-sky-50 dark:bg-sky-900/20 rounded-xl border border-sky-200 dark:border-sky-800">
                <p className="text-xs text-sky-700 dark:text-sky-300 mb-2 font-semibold">
                  {t('settings.openTelegramLink', 'Откройте Telegram по ссылке:')}
                </p>
                <button
                  onClick={handleLinkTelegram}
                  className="w-full py-2 bg-sky-500 text-white text-sm font-bold rounded-lg"
                >
                  {t('settings.openInTelegram', 'Открыть в Telegram')}
                </button>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1.5 text-center">
                  {t('settings.linkCodeExpires', 'Код действителен 5 минут')}
                </p>
              </div>
            )}

            {/* Bonus badge */}
            {linkingBonus && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 text-center">
                <Emoji emoji="🎉" size={20} />
                <p className="text-sm font-bold text-amber-700 dark:text-amber-300 mt-1">
                  {t('settings.bonusAwarded', '+500 XP и +100 кристаллов за привязку!')}
                </p>
              </div>
            )}

            {/* Error */}
            {linkingError && (
              <p className="text-xs text-red-500 text-center">{linkingError}</p>
            )}
          </div>
        </div>

        {/* Appearance */}
        <div className={CARD_CLASS}>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
            {t('settings.appearance', 'Внешний вид')}
          </h2>
          <button
            onClick={toggleTheme}
            className={ROW_CLASS}
          >
            <span className="flex items-center gap-3">
              <Emoji emoji={theme === 'light' ? '🌙' : '☀️'} size={22} />
              <span className="font-bold text-gray-900 dark:text-white text-sm">
                {theme === 'light'
                  ? t('settings.darkMode', 'Темная тема')
                  : t('settings.lightMode', 'Светлая тема')
                }
              </span>
            </span>
            <span className={`w-11 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-indigo-500' : 'bg-gray-300'}`}>
              <motion.span
                animate={{ x: theme === 'dark' ? 20 : 0 }}
                className="block w-6 h-6 bg-white rounded-full shadow"
              />
            </span>
          </button>
        </div>

        {/* Sound and notifications */}
        <div className={CARD_CLASS}>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
            {t('settings.audio', 'Звук')}
          </h2>
          <div className="space-y-3">
            <ToggleButton
              icon={<Emoji emoji="🔊" size={22} />}
              label={t('settings.soundEffects', 'Звуковые эффекты')}
              enabled={soundEnabled}
              onToggle={onSoundToggle}
            />
            <ToggleButton
              icon={<Emoji emoji="🎵" size={22} />}
              label={t('settings.music', 'Музыка')}
              enabled={musicEnabled}
              onToggle={onMusicToggle}
            />
            <ToggleButton
              icon={<Emoji emoji="🔔" size={22} />}
              label={t('settings.pushNotifications', 'Push-уведомления')}
              enabled={notificationsEnabled}
              onToggle={onNotificationsToggle}
            />
          </div>
        </div>

        {/* Application */}
        <div className={CARD_CLASS}>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
            <Emoji emoji="⚙️" size={18} className="inline" /> {t('settings.application', 'Приложение')}
          </h2>
          <button
            onClick={handleResetApp}
            className={`${ROW_CLASS} text-left`}
          >
            <span className="flex items-center gap-3">
              <Emoji emoji="🔄" size={22} />
              <span>
                <span className="block font-bold text-gray-900 dark:text-white text-sm">
                  {t('settings.resetApp', 'Сбросить настройки')}
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {resetDone ? t('settings.resetAppDone', 'Готово') : t('settings.resetAppHint', 'Очистит кэш и локальные данные, аккаунт останется')}
                </span>
              </span>
            </span>
          </button>
        </div>

        {/* About */}
        <div className={CARD_CLASS}>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
            {t('settings.about', 'О приложении')}
          </h2>

          <div className="space-y-2 mb-4">
            <StatRow
              icon="🌍"
              label={t('settings.onlineTotal', 'Онлайн всего')}
              hint={t('settings.onlineTotalHint')}
              value={statsValue(appStats?.onlinePlayersTotal)}
            />
            <StatRow
              icon="🏙️"
              label={`${t('settings.onlineCity', 'Игроки в городе')}${
                appStats?.cityName && appStats.cityName !== 'unknown'
                  ? ` ${t(`cities.${appStats.cityName.toLowerCase()}`, '')}`.trimEnd()
                  : ''
              }`}
              hint={t('settings.onlineCityHint')}
              value={statsValue(appStats?.onlinePlayersCity)}
            />
            <StatRow
              icon="⏱️"
              label={t('settings.uptime', 'Время работы')}
              hint={t('settings.uptimeHint')}
              value={appStats ? formatUptime(appStats.uptime) : '—'}
            />
          </div>

          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <div className="flex justify-between">
              <span>{t('settings.version')}:</span>
              <span className="font-bold text-gray-900 dark:text-white">{appStats?.version || '1.2.1'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>{t('settings.license')}:</span>
              <span className="flex items-center gap-2">
                <span className="font-bold text-gray-900 dark:text-white text-right">{t('settings.licenseType')}</span>
                <span className="group relative">
                  <Emoji emoji="ℹ️" size={12} />
                  <span className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <span className="block font-bold mb-1"><Emoji emoji="📜" size={14} className="inline" /> {t('settings.licenseType')}</span>
                    {t('settings.licenseHint')}
                  </span>
                </span>
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setShowDeveloperModal(true)}
              className="w-full p-4 bg-indigo-500 text-white font-bold rounded-xl"
            >
              <Emoji emoji="👨‍💻" size={20} className="inline mr-2" /> {t('settings.developer')}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <a
                href="/privacy"
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center font-semibold text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-gray-700"
              >
                <Emoji emoji="🔒" size={16} className="inline" /> Privacy
              </a>
              <a
                href="/terms"
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center font-semibold text-gray-900 dark:text-white text-sm border border-gray-200 dark:border-gray-700"
              >
                <Emoji emoji="📜" size={16} className="inline" /> Terms
              </a>
            </div>
          </div>
        </div>

        {/* Developer modal */}
        {createPortal(
          <AnimatePresence>
            {showDeveloperModal && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowDeveloperModal(false)}
                  className="fixed inset-0 bg-black/60 z-[100]"
                />

                <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-[420px] pointer-events-auto"
                  >
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                      <div className="text-center mb-5">
                        <Emoji emoji="👨‍💻" size={64} />
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-3 mb-1">
                          {t('settings.developerName', 'Разработчик')}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {t('settings.developerRole', 'Full-Stack Developer')}
                        </p>
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-2">
                          <span className="flex items-center gap-1"><Emoji emoji="🚀" size={14} /> React</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Emoji emoji="⚡" size={14} /> Node.js</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><Emoji emoji="🎨" size={14} /> TypeScript</span>
                        </div>
                      </div>

                      <div className="space-y-3 mb-5">
                        <a
                          href="https://t.me/uzbekwars"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 bg-blue-500 text-white rounded-xl font-bold"
                        >
                          <Emoji emoji="✈️" size={32} />
                          <span className="flex-1 text-left">
                            <span className="block text-sm opacity-90">Telegram</span>
                            <span className="block text-lg">@uzbekwars</span>
                          </span>
                          <span className="text-xl">→</span>
                        </a>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center border border-gray-200 dark:border-gray-700">
                            <Emoji emoji="⭐" size={22} />
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('settings.qualityCode', 'Качество кода')}</div>
                          </div>
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center border border-gray-200 dark:border-gray-700">
                            <Emoji emoji="🎯" size={22} />
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('settings.fastWork', 'Быстрая работа')}</div>
                          </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-700 dark:text-gray-300 text-center">
                            <Emoji emoji="💝" size={14} className="inline" /> {t('settings.thankYou', 'Спасибо за использование Uzbek Wars!')}<br />
                            {t('settings.starOnGithub', 'Если нравится игра - поставь ⭐ на GitHub')}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowDeveloperModal(false)}
                        className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-xl border border-gray-200 dark:border-gray-700"
                      >
                        {t('ui.close')}
                      </button>
                    </div>
                  </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    </div>
  );
};

const StatRow = ({ icon, label, hint, value }: { icon: string; label: string; hint?: string; value: string }) => (
  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
    <div className="flex items-center gap-2 min-w-0">
      <Emoji emoji={icon} size={16} />
      <span className="text-sm text-gray-700 dark:text-gray-300 font-semibold truncate">{label}</span>
      {hint && (
        <span className="group relative shrink-0">
          <Emoji emoji="ℹ️" size={12} />
          <span className="absolute bottom-full left-0 mb-2 w-52 p-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {hint}
          </span>
        </span>
      )}
    </div>
    <span className="font-black text-gray-900 dark:text-white">{value}</span>
  </div>
);

interface ToggleButtonProps {
  icon: React.ReactNode;
  label: string;
  enabled: boolean;
  onToggle: () => void;
}

const ToggleButton = ({ icon, label, enabled, onToggle }: ToggleButtonProps) => (
  <button
    onClick={onToggle}
    className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between"
  >
    <span className="flex items-center gap-3">
      {typeof icon === 'string' ? <Emoji emoji={icon} size={22} /> : icon}
      <span className="font-bold text-gray-900 dark:text-white text-sm">{label}</span>
    </span>
    <span className={`w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
      <span className={`block w-6 h-6 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
    </span>
  </button>
);

export default Settings;
