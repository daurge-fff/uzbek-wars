/**
 * Telegram Mini App helpers.
 *
 * `window.Telegram.WebApp` only exists inside the Telegram client. Everything here must
 * stay optional: the exact same bundle is served as a normal website, where the SDK is
 * absent and these functions simply report "not in Telegram".
 *
 * Security note: values from `initDataUnsafe` are NOT trustworthy. Only the raw
 * `initData` string is signed, and the backend verifies it with the bot token.
 */

export interface TelegramUserProfile {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    photo_url?: string;
    is_premium?: boolean;
}

interface TelegramWebAppLike {
    initData?: string;
    initDataUnsafe?: { user?: TelegramUserProfile };
    platform?: string;
    version?: string;
    colorScheme?: 'light' | 'dark';
    isExpanded?: boolean;
    ready?: () => void;
    expand?: () => void;
    disableVerticalSwipes?: () => void;
    setHeaderColor?: (color: string) => void;
    setBackgroundColor?: (color: string) => void;
    onEvent?: (event: string, handler: () => void) => void;
    openTelegramLink?: (url: string) => void;
    startParam?: string;
}

/** Returns the Telegram WebApp object, or null when not running inside Telegram */
export function getTelegramWebApp(): TelegramWebAppLike | null {
    if (typeof window === 'undefined') return null;
    const telegram = (window as any).Telegram;
    return telegram?.WebApp ?? null;
}

/**
 * True when the page runs inside a Telegram mini app.
 * Uses `platform` (available before auth) rather than `initData`, so the UI can switch
 * immediately while login is still in flight.
 */
export function isTelegramMiniApp(): boolean {
    const app = getTelegramWebApp();
    if (!app) return false;
    return Boolean(app.platform && app.platform !== 'unknown');
}

/** Raw signed initData string; empty outside Telegram or before the SDK initialises */
export function getTelegramInitData(): string {
    return getTelegramWebApp()?.initData || '';
}

/** Telegram profile for display only — never use it for authentication */
export function getTelegramUser(): TelegramUserProfile | null {
    return getTelegramWebApp()?.initDataUnsafe?.user ?? null;
}

/** startapp parameter from Telegram (e.g. "link_ABC123") */
export function getStartParam(): string | null {
    return getTelegramWebApp()?.startParam || null;
}

/** Applies Telegram-specific UI defaults: full height, no accidental swipe-to-close */
export function initTelegramUi(): void {
    const app = getTelegramWebApp();
    if (!app) return;

    try {
        app.ready?.();
        app.expand?.();
        app.disableVerticalSwipes?.();
        if (app.colorScheme === 'dark') {
            app.setHeaderColor?.('#0b0b0f');
            app.setBackgroundColor?.('#0b0b0f');
        } else {
            app.setHeaderColor?.('#ffffff');
            app.setBackgroundColor?.('#ffffff');
        }
    } catch {
        // Older SDK versions may not expose every method — UI defaults are optional
    }
}

/** Device info sent with every login; the id is stable per browser and per Telegram user */
export function getDeviceInfo(): { userAgent: string; platform: string; deviceId: string } {
    const app = getTelegramWebApp();
    const telegramUser = getTelegramUser();

    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
        deviceId = `${telegramUser?.id ? `tg${telegramUser.id}` : 'web'}-${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem('deviceId', deviceId);
    }

    return {
        userAgent: navigator.userAgent,
        platform: app?.platform || (navigator as any).userAgentData?.platform || 'unknown',
        deviceId,
    };
}

/** Deep link to the bot, used by the website to promote the mini app */
export function getBotLink(botUsername?: string): string {
    const username = botUsername || (import.meta.env.VITE_TELEGRAM_BOT_USERNAME as string) || 'uzbekwars_bot';
    return `https://t.me/${username.replace(/^@/, '')}`;
}
