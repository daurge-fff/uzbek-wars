/**
 * Player-facing preferences (sound, music, haptics, notifications) persisted locally and
 * applied to the feedback engines. Also exposes a `useFeedback()` hook that plays a sound
 * AND a haptic according to the current preferences, so game code doesn't have to think
 * about which is enabled.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { setSoundEnabled, playSound, startMusic, stopMusic, SoundName } from '../utils/sound';
import {
  hapticTap,
  hapticSuccess,
  hapticError,
  hapticSelection,
  hapticWarning,
} from '../utils/haptics';

interface Preferences {
  sound: boolean;
  music: boolean;
  haptics: boolean;
  notifications: boolean;
}

interface PreferencesContextType extends Preferences {
  setPreference: (key: keyof Preferences, value: boolean) => void;
  togglePreference: (key: keyof Preferences) => void;
}

const STORAGE_KEY = 'uzbek_prefs';

const DEFAULTS: Preferences = {
  sound: true,
  music: false,
  haptics: true,
  notifications: false,
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

/** Used when a component is rendered outside the provider (e.g. isolated tests). */
const FALLBACK_CONTEXT: PreferencesContextType = {
  ...DEFAULTS,
  setPreference: () => {},
  togglePreference: () => {},
};

function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(loadPreferences);

  useEffect(() => {
    setSoundEnabled(prefs.sound);
  }, [prefs.sound]);

  useEffect(() => {
    if (prefs.music) {
      startMusic();
    } else {
      stopMusic();
    }
  }, [prefs.music]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // localStorage may be unavailable (private mode) — preferences stay in memory
    }
  }, [prefs]);

  const setPreference = useCallback((key: keyof Preferences, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const togglePreference = useCallback((key: keyof Preferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <PreferencesContext.Provider value={{ ...prefs, setPreference, togglePreference }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextType {
  return useContext(PreferencesContext) ?? FALLBACK_CONTEXT;
}

interface Feedback {
  /** Light tap for buttons / navigation */
  tap: () => void;
  /** Positive confirmation (purchase, equip, claim) */
  success: () => void;
  /** Something went wrong */
  error: () => void;
  /** Warning (low stats, insufficient funds) */
  warning: () => void;
  /** Subtle selection change for tabs / carousels */
  selection: () => void;
  /** Play a specific game sound */
  sound: (name: SoundName) => void;
}

/**
 * Combined sound + haptic feedback that respects the player's preferences.
 *
 *   const fb = useFeedback();
 *   fb.tap();          // navigation / generic button
 *   fb.success();      // completed an action
 *   fb.sound('coin');  // play a specific sound
 */
export function useFeedback(): Feedback {
  const { sound, haptics } = usePreferences();

  const tap = useCallback(() => {
    if (sound) playSound('tap');
    if (haptics) hapticTap('light');
  }, [sound, haptics]);

  const success = useCallback(() => {
    if (sound) playSound('success');
    if (haptics) hapticSuccess();
  }, [sound, haptics]);

  const error = useCallback(() => {
    if (sound) playSound('error');
    if (haptics) hapticError();
  }, [sound, haptics]);

  const warning = useCallback(() => {
    if (haptics) hapticWarning();
  }, [haptics]);

  const selection = useCallback(() => {
    if (haptics) hapticSelection();
  }, [haptics]);

  const play = useCallback(
    (name: SoundName) => {
      if (sound) playSound(name);
    },
    [sound]
  );

  return { tap, success, error, warning, selection, sound: play };
}
