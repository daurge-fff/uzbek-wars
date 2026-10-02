import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { setTelegramBackButton } from '../utils/telegram';

/** Routes where the native back button makes no sense (entry points). */
const ROOT_PATHS = new Set(['/', '/onboarding', '/logout', '/auth']);

/**
 * Wires Telegram's native header back button to in-app navigation.
 * Hidden on entry screens; on every other screen it goes one step back.
 * No-op outside Telegram.
 */
export function TelegramBackButton() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (ROOT_PATHS.has(location.pathname)) {
      setTelegramBackButton(null);
      return;
    }

    setTelegramBackButton(() => {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/dashboard');
      }
    });

    return () => setTelegramBackButton(null);
  }, [location.pathname, navigate]);

  return null;
}
