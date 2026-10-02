/**
 * Single source of truth for the game version shown in the UI (settings/about).
 * Bump it here when you release; the frontend displays the value reported by the API.
 */
export const APP_VERSION = process.env.APP_VERSION || '1.3.0';
