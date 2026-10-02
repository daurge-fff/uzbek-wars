/**
 * Application entry point
 * 
 * Initializes React app with providers and PWA registration
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n'; // Initialize i18next

// Register service worker for PWA functionality.
//
// `autoUpdate` in vite.config makes a new service worker activate immediately, but the
// already-open page keeps running the old JS until it reloads. We listen for the
// controller change and reload once, so a fresh deploy actually reaches the player
// (the website and the Telegram mini app were showing different versions before).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const wasControlled = Boolean(navigator.serviceWorker.controller);
  let reloaded = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded || !wasControlled) return;
    reloaded = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // Proactively check for a new version on every load
        registration.update().catch(() => {});
      })
      .catch((error) => {
        console.error('SW registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
