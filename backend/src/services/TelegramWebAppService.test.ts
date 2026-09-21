/**
 * Telegram mini app initData validation tests.
 *
 * The signing helper below builds the payload exactly as Telegram does (sorted
 * `key=value` lines, secret derived from "WebAppData"), so these tests verify the real
 * signature check instead of re-using the implementation under test.
 */

import crypto from 'crypto';
import {
    buildDataCheckString,
    computeInitDataHash,
    validateInitData,
    mapTelegramLanguage,
    getTelegramDisplayName,
} from './TelegramWebAppService';

const BOT_TOKEN = '123456:TEST-BOT-TOKEN-for-unit-tests';

/** Signs fields the way Telegram signs initData */
function signInitData(fields: Record<string, string>, botToken = BOT_TOKEN): string {
    const params = new URLSearchParams(fields);
    const dataCheckString = [...params.entries()]
        .map(([key, value]) => `${key}=${value}`)
        .sort()
        .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    params.append('hash', hash);
    return params.toString();
}

const TELEGRAM_USER = {
    id: 555000111,
    first_name: 'German',
    last_name: 'Vitiaz',
    username: 'german',
    language_code: 'ru',
    photo_url: 'https://t.me/i/userpic/320/german.jpg',
};

function validInitData(overrides: Record<string, string> = {}): string {
    const now = Math.floor(Date.now() / 1000);
    return signInitData({
        auth_date: String(now),
        query_id: 'AAF_test_query',
        user: JSON.stringify(TELEGRAM_USER),
        ...overrides,
    });
}

describe('TelegramWebAppService.validateInitData', () => {
    it('accepts correctly signed initData and returns the Telegram profile', () => {
        const result = validateInitData(validInitData(), BOT_TOKEN);

        expect(result.ok).toBe(true);
        expect(result.user?.id).toBe(TELEGRAM_USER.id);
        expect(result.user?.username).toBe('german');
        expect(result.user?.first_name).toBe('German');
        expect(result.user?.photo_url).toContain('german.jpg');
    });

    it('rejects a payload that was modified after signing', () => {
        const initData = validInitData();
        const tampered = initData.replace(encodeURIComponent('German'), encodeURIComponent('Impostor'));

        const result = validateInitData(tampered, BOT_TOKEN);

        expect(result.ok).toBe(false);
        expect(result.error).toBe('INVALID_HASH');
    });

    it('rejects a payload signed with a different bot token', () => {
        const initData = validInitData();
        const result = validateInitData(initData, '999999:ANOTHER-BOT-TOKEN');

        expect(result.ok).toBe(false);
        expect(result.error).toBe('INVALID_HASH');
    });

    it('rejects stale initData (auth_date older than the freshness window)', () => {
        const twoDaysAgo = Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60;
        const result = validateInitData(validInitData({ auth_date: String(twoDaysAgo) }), BOT_TOKEN);

        expect(result.ok).toBe(false);
        expect(result.error).toBe('EXPIRED');
    });

    it('accepts initData inside the freshness window', () => {
        const oneHourAgo = Math.floor(Date.now() / 1000) - 60 * 60;
        const result = validateInitData(validInitData({ auth_date: String(oneHourAgo) }), BOT_TOKEN);

        expect(result.ok).toBe(true);
    });

    it('reports a machine-readable reason for malformed payloads', () => {
        expect(validateInitData('', BOT_TOKEN).error).toBe('MISSING_DATA');
        expect(validateInitData(validInitData(), '').error).toBe('MISSING_TOKEN');

        const withoutHash = new URLSearchParams({ auth_date: '1', user: '{}' }).toString();
        expect(validateInitData(withoutHash, BOT_TOKEN).error).toBe('MISSING_HASH');

        const brokenUser = signInitData({
            auth_date: String(Math.floor(Date.now() / 1000)),
            user: '{not-json',
        });
        expect(validateInitData(brokenUser, BOT_TOKEN).error).toBe('INVALID_USER');

        const userWithoutId = signInitData({
            auth_date: String(Math.floor(Date.now() / 1000)),
            user: JSON.stringify({ first_name: 'NoId' }),
        });
        expect(validateInitData(userWithoutId, BOT_TOKEN).error).toBe('MISSING_USER');
    });

    it('ignores the hash and signature fields when building the signed payload', () => {
        const signed = validInitData();
        const withSignature = `${signed}&signature=not-a-real-signature`;

        // The signature field is Ed25519 and not part of the HMAC data check string
        expect(buildDataCheckString(withSignature)).not.toContain('signature=');
        expect(validateInitData(withSignature, BOT_TOKEN).ok).toBe(true);
    });

    it('computes the documented hash for a known payload', () => {
        const initData = validInitData();
        const hash = new URLSearchParams(initData).get('hash');

        expect(computeInitDataHash(initData, BOT_TOKEN)).toBe(hash);
    });
});

describe('TelegramWebAppService helpers', () => {
    it('maps Telegram locales to supported game languages', () => {
        expect(mapTelegramLanguage('uz')).toBe('uz');
        expect(mapTelegramLanguage('uk')).toBe('uk');
        expect(mapTelegramLanguage('en-US')).toBe('en');
        expect(mapTelegramLanguage('ru')).toBe('ru');
        expect(mapTelegramLanguage('de')).toBe('ru');
        expect(mapTelegramLanguage(undefined)).toBe('ru');
    });

    it('builds a display name from first/last name, username or id', () => {
        expect(getTelegramDisplayName({ id: 1, first_name: 'German', last_name: 'Vitiaz' })).toBe('German Vitiaz');
        expect(getTelegramDisplayName({ id: 1, username: 'german' })).toBe('@german');
        expect(getTelegramDisplayName({ id: 42 })).toBe('Player 42');
    });
});
