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
      initializeGoogleSignIn();
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const initializeGoogleSignIn = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.error('VITE_GOOGLE_CLIENT_ID not configured');
      onError?.(t('auth.googleNotConfigured', 'Google OAuth не настроен'));
      return;
    }

    console.log('Initializing Google Sign-In with Client ID:', clientId);

    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
    }
  };

  const handleCredentialResponse = (response: any) => {
    setLoading(false);
    if (response.credential) {
      console.log('Google login successful, got credential');
      onSuccess?.(response.credential);
    } else {
      console.error('No credential in response');
      onError?.(t('auth.loginError', 'Ошибка входа'));
    }
  };

  const handleGoogleLogin = () => {
    if (!googleLoaded || !window.google) {
      onError?.(t('auth.googleNotLoaded', 'Google не загружен. Обновите страницу.'));
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      onError?.(t('auth.googleNotConfigured', 'Google OAuth не настроен. Добавьте VITE_GOOGLE_CLIENT_ID в .env'));
      return;
    }

    setLoading(true);
    
    try {
      console.log('Attempting Google login...');
      
      // Use renderButton instead of prompt for better compatibility
      const buttonContainer = document.getElementById('google-signin-button');
      if (buttonContainer) {
        buttonContainer.innerHTML = ''; // Clear previous button
        window.google.accounts.id.renderButton(
          buttonContainer,
          {
            theme: 'filled_blue',
            size: 'large',
            width: buttonContainer.offsetWidth,
            text: 'signin_with',
            shape: 'pill'
          }
        );
        setLoading(false);
      } else {
        // Fallback to prompt
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            console.log('One Tap not displayed, reason:', notification.getNotDisplayedReason());
            setLoading(false);
            onError?.(t('auth.googleBlocked', 'Google вход заблокирован. Попробуйте обновить страницу.'));
          } else if (notification.isSkippedMoment()) {
            console.log('One Tap skipped');
            setLoading(false);
          }
        });
      }
    } catch (error: any) {
      setLoading(false);
      console.error('Google login error:', error);
      onError?.(error.message || t('auth.loginError', 'Ошибка входа'));
    }
  };

  return (
    <div className="w-full">
      {/* Hidden container for Google's native button */}
      <div id="google-signin-button" className="hidden"></div>
      
      <button
        onClick={handleGoogleLogin}
        disabled={loading || !googleLoaded}
        className="min-h-touch min-w-full bg-white/95 backdrop-blur-xl text-gray-900 font-black py-4 px-6 rounded-[24px] shadow-2xl hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 hover:scale-105 border border-gray-100"
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
