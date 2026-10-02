import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Thin banner that slides down when the device goes offline, so a failed request doesn't
 * look like a game bug. Reconnecting shows a short confirmation.
 */
export function OfflineBanner() {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[300] flex justify-center pointer-events-none"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 6px)' }}
        >
          <div className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-red-500 text-white text-xs font-bold shadow-lg">
            <span>📡</span>
            <span>Нет соединения</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
