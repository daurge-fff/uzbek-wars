import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleLoginButtonProps {
  onSuccess?: (idToken: string) => void;
  onError?: (error: string) => void;
}

export const GoogleLoginButton = ({ onSuccess, onError }: GoogleLoginButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setGoogleLoaded(true);
    };
    script.onerror = (error) => {
      console.error('❌ Failed to load Google script:', error);
      onError?.(t('auth.googleScriptError', 'Не удалось загрузить Google. Проверьте интернет-соединение.'));
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleLogin = () => {
    if (!googleLoaded || !window.google) {
      console.error('❌ Google not loaded');
      onError?.(t('auth.googleNotLoaded', 'Google не загружен. Обновите страницу.'));
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('❌ Client ID not configured');
      onError?.(t('auth.googleNotConfigured', 'Google OAuth не настроен. Добавьте VITE_GOOGLE_CLIENT_ID в .env'));
      return;
    }

    setLoading(true);
    
    try {
      // Используем OAuth 2.0 Token Flow - открывает popup окно и возвращает ID token напрямую
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: (response: any) => {
          setLoading(false);
          
          if (response.access_token) {
            // Получаем информацию о пользователе с помощью access token
            fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: {
                'Authorization': `Bearer ${response.access_token}`
              }
            })
            .then(res => res.json())
            .then(userInfo => {
              // Создаем простой JWT-подобный токен с информацией о пользователе
              const idToken = btoa(JSON.stringify({
                sub: userInfo.sub,
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
                email_verified: userInfo.email_verified
              }));
              
              onSuccess?.(idToken);
            })
            .catch(error => {
              console.error('❌ Failed to fetch user info:', error);
              onError?.(t('auth.userInfoError', 'Не удалось получить информацию о пользователе'));
            });
          } else if (response.error) {
            console.error('❌ Token error:', response.error);
            onError?.(t('auth.tokenError', 'Ошибка получения токена'));
          }
        },
        error_callback: (error: any) => {
          console.error('❌ OAuth error:', error);
          setLoading(false);
          
          if (error.type !== 'popup_closed') {
            onError?.(t('auth.oauthError', 'Ошибка OAuth'));
          }
        }
      });
      
      // Открываем popup окно с выбором аккаунта Google
      client.requestAccessToken({ prompt: 'select_account' });
      
    } catch (error: any) {
      setLoading(false);
      console.error('❌ Google login error:', error);
      onError?.(error.message || t('auth.loginError', 'Ошибка входа'));
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handleGoogleLogin}
        disabled={loading || !googleLoaded}
        className="min-h-touch min-w-full bg-white/95 backdrop-blur-xl text-gray-900 font-black py-4 px-6 rounded-[24px] shadow-sm hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 hover:scale-105 border border-gray-100"
      >
        <svg className="w-6 h-6" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {loading ? t('auth.logging_in', 'Вход...') : t('auth.login_with_google', 'Войти через Google')}
      </button>
      
      {!googleLoaded && (
        <p className="text-sm text-gray-500 text-center mt-2">
          {t('auth.loadingGoogle', 'Загрузка Google...')}
        </p>
      )}
      
      {googleLoaded && (
        <p className="text-xs text-gray-400 text-center mt-2">
          {t('auth.clickToLogin', 'Нажмите кнопку для входа')}
        </p>
      )}
    </div>
  );
};
