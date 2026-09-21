/**
 * Registers the Telegram mini app entry point for the bot:
 *  - chat menu button (opens the game as a mini app)
 *  - bot command list (/play, /start, /help, /stats)
 *
 * Usage (from backend/): npm run setup:bot
 *
 * Requires TELEGRAM_BOT_TOKEN and TELEGRAM_WEBAPP_URL (or FRONTEND_URL) in .env.
 * The web app URL must be HTTPS — Telegram rejects plain http web_app buttons.
 */

import { configureWebApp, getWebAppUrl } from '../bot/telegramBot';

async function main(): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN || '';

    if (!token) {
        console.error('TELEGRAM_BOT_TOKEN is not set. Add it to .env before running this script.');
        process.exit(1);
    }

    console.log(`Configuring mini app menu button for: ${getWebAppUrl()}`);

    const result = await configureWebApp(token);

    if (!result.ok) {
        console.error(`Failed: ${result.error}`);
        process.exit(1);
    }

    console.log('✓ Menu button set: "Играть" → ' + result.url);
    console.log('✓ Commands set: /play, /start, /help, /stats');
    console.log('Now set the Mini App URL in @BotFather to the same address if you use the "Open App" button.');
    process.exit(0);
}

main().catch((error) => {
    console.error('Error configuring bot:', error);
    process.exit(1);
});
