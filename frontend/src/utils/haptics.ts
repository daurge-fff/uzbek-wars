/**
 * Haptic feedback helpers.
 *
 * Inside Telegram these use the native `HapticFeedback` API; on the web they fall back
 * to the Vibration API where available. Everything is a safe no-op otherwise, so they
 * can be called from anywhere without guards.
 */

import {
  getTelegramWebApp,
  HapticImpactStyle,
  HapticNotificationType,
} from './telegram';

/** Short tap feedback. Style defaults to a light tap. */
export function hapticTap(style: HapticImpactStyle = 'light'): void {
  try {
    const tg = getTelegramWebApp();
    if (tg?.HapticFeedback?.impactOccurred) {
      tg.HapticFeedback.impactOccurred(style);
      return;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(style === 'heavy' ? 20 : 10);
    }
  } catch {
    // Haptics are a nice-to-have; never let them break an interaction
  }
}

/** Success / warning / error notification feedback. */
export function hapticNotify(type: HapticNotificationType): void {
  try {
    const tg = getTelegramWebApp();
    if (tg?.HapticFeedback?.notificationOccurred) {
      tg.HapticFeedback.notificationOccurred(type);
      return;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(type === 'error' ? [30, 40, 30] : type === 'warning' ? [20, 30, 20] : 15);
    }
  } catch {
    // ignore
  }
}

/** Subtle selection feedback, ideal for toggles, tabs and carousels. */
export function hapticSelection(): void {
  try {
    const tg = getTelegramWebApp();
    if (tg?.HapticFeedback?.selectionChanged) {
      tg.HapticFeedback.selectionChanged();
      return;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(5);
    }
  } catch {
    // ignore
  }
}

export const hapticSuccess = () => hapticNotify('success');
export const hapticError = () => hapticNotify('error');
export const hapticWarning = () => hapticNotify('warning');
