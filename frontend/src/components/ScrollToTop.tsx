import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Resets the scroll position when the route changes. Mobile apps should always open a new
 * screen at the top; without this the previous scroll offset is kept.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    } catch {
      // Older WebViews / test environments may not implement scrollTo
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
