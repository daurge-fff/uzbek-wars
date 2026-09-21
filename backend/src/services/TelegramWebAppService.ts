/**
 * Telegram Mini App (WebApp) authentication helpers.
 *
 * Telegram passes `initData` to the mini app as a query-string-like payload signed with
 * the bot token. The data must be verified on the server: the client value is only a
 * hint and can be forged.
 *
 * Algorithm (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app):
 *   secret_key = HMAC_SHA256(key="WebAppData", message=bot_token)
 *   hash       = HMAC_SHA256(key=secret_key, message=data_check_string)
 *   data_check_string = every "key=value" pair except `hash`, sorted by key, joined with "\n"
 */

import crypto from 'crypto';
import { logger } from '../utils/logger';

export interface TelegramWebAppUser {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    photo_url?: string;
    is_premium?: boolean;
}

export interface InitDataValidationResult {
    ok: boolean;
    user?: TelegramWebAppUser;
    authDate?: number;
    startParam?: string;
    /** Machine-readable reason, safe to expose as an error code */
    error?: 'MISSING_DATA' | 'MISSING_TOKEN' | 'MISSING_HASH' | 'INVALID_HASH' | 'MISSING_AUTH_DATE' | 'EXPIRED' | 'INVALID_USER' | 'MISSING_USER';
}

/** Freshness window for initData: Telegram docs recommend rejecting stale payloads */
export const DEFAULT_MAX_AUTH_AGE_SECONDS = 24 * 60 * 60;

/**
 * Builds the newline-joined, alphabetically sorted `key=value` payload that Telegram signs.
 * `hash` is excluded; `signature` and all other fields are included.
 * Values are URL-decoded (as Telegram signs the decoded form).
 */
export function buildDataCheckString(initData: string): string {
    const params = new URLSearchParams(initData);
    const pairs: string[] = [];
    params.forEach((value, key) => {
        if (key === 'hash') return;
        pairs.push(`${key}=${value}`);
    });
    return pairs.sort().join('\n');
}

/** Constant-time comparison that also tolerates malformed hex */
function hashesMatch(provided: string, expected: string): boolean {
    try {
        const providedBuffer = Buffer.from(provided, 'hex');
        const expectedBuffer = Buffer.from(expected, 'hex');
        if (providedBuffer.length === 0 || providedBuffer.length !== expectedBuffer.length) return false;
        return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
    } catch {
        return false;
    }
}

/** Computes the expected HMAC-SHA256 hash of the initData payload */
export function computeInitDataHash(initData: string, botToken: string): string {
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    return crypto.createHmac('sha256', secretKey).update(buildDataCheckString(initData)).digest('hex');
}

/**
 * Validates a mini app `initData` payload and extracts the Telegram user.
 * Returns a machine-readable error instead of throwing so callers can map it to HTTP codes.
 */
export function validateInitData(
    initData: string,
    botToken: string,
    maxAuthAgeSeconds: number = DEFAULT_MAX_AUTH_AGE_SECONDS
): InitDataValidationResult {
    if (!initData) return { ok: false, error: 'MISSING_DATA' };
    if (!botToken) return { ok: false, error: 'MISSING_TOKEN' };

    const params = new URLSearchParams(initData);
    const providedHash = params.get('hash');
    if (!providedHash) return { ok: false, error: 'MISSING_HASH' };

    const expectedHash = computeInitDataHash(initData, botToken);
    if (!hashesMatch(providedHash, expectedHash)) {
        logger.warn(`[TelegramAuth] INVALID_HASH`);
        return { ok: false, error: 'INVALID_HASH' };
    }

    const authDate = Number(params.get('auth_date') || 0);
    if (!authDate) return { ok: false, error: 'MISSING_AUTH_DATE' };

    if (maxAuthAgeSeconds > 0 && Date.now() / 1000 - authDate > maxAuthAgeSeconds) {
        return { ok: false, error: 'EXPIRED' };
    }

    const rawUser = params.get('user');
    if (!rawUser) return { ok: false, error: 'MISSING_USER' };

    let user: TelegramWebAppUser;
    try {
        user = JSON.parse(rawUser);
    } catch {
        return { ok: false, error: 'INVALID_USER' };
    }

    if (!user || typeof user.id !== 'number') return { ok: false, error: 'MISSING_USER' };

    const startParam = params.get('startapp') || undefined;

    return { ok: true, user, authDate, startParam };
}

/**
 * Maps a Telegram `language_code` (e.g. "ru", "uz", "en-US") to a supported game language.
 * Falls back to Russian, which is the game default.
 */
export function mapTelegramLanguage(languageCode?: string): 'ru' | 'uz' | 'uk' | 'en' {
    const code = (languageCode || '').slice(0, 2).toLowerCase();
    if (code === 'uz' || code === 'uk' || code === 'en' || code === 'ru') return code;
    return 'ru';
}

/** Display name of a Telegram user, falls back to @username and finally to the id */
export function getTelegramDisplayName(user: TelegramWebAppUser): string {
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    if (fullName) return fullName;
    if (user.username) return `@${user.username}`;
    return `Player ${user.id}`;
}
