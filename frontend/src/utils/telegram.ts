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

export type HapticImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
export type HapticNotificationType = 'error' | 'success' | 'warning';

interface TelegramSafeAreaInset {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

interface TelegramWebAppLike {
    initData?: string;
    initDataUnsafe?: { user?: TelegramUserProfile; start_param?: string };
    platform?: string;
    version?: string;
    colorScheme?: 'light' | 'dark';
    themeParams?: Record<string, string>;
    isExpanded?: boolean;
    viewportHeight?: number;
    viewportStableHeight?: number;
    safeAreaInset?: TelegramSafeAreaInset;
    contentSafeAreaInset?: TelegramSafeAreaInset;
    HapticFeedback?: {
        impactOccurred?: (style: HapticImpactStyle) => void;
        notificationOccurred?: (type: HapticNotificationType) => void;
        selectionChanged?: () => void;
    };
    BackButton?: {
        isVisible?: boolean;
        show?: () => void;
        hide?: () => void;
        onClick?: (cb: () => void) => void;
        offClick?: (cb: () => void) => void;
    };
    isVersionAtLeast?: (version: string) => boolean;
    ready?: () => void;
    expand?: () => void;
    disableVerticalSwipes?: () => void;
    setHeaderColor?: (color: string) => void;
    setBackgroundColor?: (color: string) => void;
    setBottomBarColor?: (color: string) => void;
    onEvent?: (event: string, handler: () => void) => void;
    offEvent?: (event: string, handler: () => void) => void;
    openTelegramLink?: (url: string) => void;
    openLink?: (url: string, options?: Record<string, unknown>) => void;
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

/**
 * startapp parameter from Telegram (e.g. "link_ABC123").
 *
 * Telegram exposes it as `start_param` (snake_case) inside `initDataUnsafe` and as a
 * `start_param=...` pair inside the signed `initData` string. There is no top-level
 * `startParam` property on the WebApp object, so we read both reliable sources.
 */
export function getStartParam(): string | null {
    const app = getTelegramWebApp();
    if (!app) return null;

    const unsafe = app.initDataUnsafe as { start_param?: string } | undefined;
    if (unsafe?.start_param) return unsafe.start_param;

    const initData = app.initData || '';
    if (initData) {
        return new URLSearchParams(initData).get('start_param');
    }

    return null;
}

/** Telegram's current color scheme, or null outside Telegram */
export function getTelegramColorScheme(): 'light' | 'dark' | null {
    const scheme = getTelegramWebApp()?.colorScheme;
    return scheme === 'dark' || scheme === 'light' ? scheme : null;
}

/** Subscribe to Telegram theme changes; returns an unsubscribe function */
export function onTelegramThemeChange(handler: (scheme: 'light' | 'dark') => void): () => void {
    const app = getTelegramWebApp();
    if (!app?.onEvent) return () => {};

    const wrapped = () => {
        const scheme = app.colorScheme;
        if (scheme === 'dark' || scheme === 'light') handler(scheme);
    };

    app.onEvent('themeChanged', wrapped);
    return () => app.offEvent?.('themeChanged', wrapped);
}

/** Paints the Telegram chrome (header / background / bottom bar) to match the app theme */
export function applyTelegramChrome(theme: 'light' | 'dark'): void {
    const app = getTelegramWebApp();
    if (!app) return;

    const bg = theme === 'dark' ? '#000000' : '#ffffff';
    try {
        app.setHeaderColor?.(bg);
        app.setBackgroundColor?.(bg);
        app.setBottomBarColor?.(bg);
    } catch {
        // Older SDK versions may not support every method — chrome is cosmetic
    }
}

/**
 * Writes Telegram's safe-area insets to CSS custom properties so the layout can respect
 * the notch and the home indicator:
 *   --tg-safe-top / -bottom / -left / -right   (device safe area)
 *   --tg-content-top / -bottom                 (Telegram UI overlap)
 */
export function applyTelegramInsets(): void {
    if (typeof document === 'undefined') return;
    const app = getTelegramWebApp();
    const root = document.documentElement;

    const safe = app?.safeAreaInset;
    if (safe) {
        root.style.setProperty('--tg-safe-top', `${safe.top}px`);
        root.style.setProperty('--tg-safe-bottom', `${safe.bottom}px`);
        root.style.setProperty('--tg-safe-left', `${safe.left}px`);
        root.style.setProperty('--tg-safe-right', `${safe.right}px`);
    }

    const content = app?.contentSafeAreaInset;
    if (content) {
        root.style.setProperty('--tg-content-top', `${content.top}px`);
        root.style.setProperty('--tg-content-bottom', `${content.bottom}px`);
    }
}

/**
 * Shows or hides the native Telegram back button and wires it to a handler.
 * Pass `null` to hide it. Outside Telegram this is a no-op.
 */
let currentBackHandler: (() => void) | null = null;

export function setTelegramBackButton(handler: (() => void) | null): void {
    const app = getTelegramWebApp();
    if (!app?.BackButton) return;

    try {
        // Always remove the previous handler — `onClick` stacks callbacks, and stacked
        // handlers would call navigate(-1) several times per tap.
        if (currentBackHandler) {
            app.BackButton.offClick?.(currentBackHandler);
            currentBackHandler = null;
        }

        if (!handler) {
            app.BackButton.hide?.();
            return;
        }

        app.BackButton.onClick?.(handler);
        currentBackHandler = handler;
        app.BackButton.show?.();
    } catch {
        // Back button support varies between SDK versions
    }
}

/** Applies Telegram-specific UI defaults: full height, no accidental swipe-to-close */
export function initTelegramUi(): void {
    const app = getTelegramWebApp();
    if (!app) return;

    try {
        app.ready?.();
        app.expand?.();
        app.disableVerticalSwipes?.();
        const scheme = app.colorScheme === 'dark' ? 'dark' : 'light';
        applyTelegramChrome(scheme);
        applyTelegramInsets();
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
