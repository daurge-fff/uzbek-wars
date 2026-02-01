/**
 * Telegram Bot Entry Point
 * 
 * Run: npm run bot
 */

import dotenv from 'dotenv';
import { initBot, bot } from './telegramBot';
import { connectDatabase } from '../config/database';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

const startBot = async () => {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected');

    // Initialize bot
    if (!bot) {
      logger.error('TELEGRAM_BOT_TOKEN not set in .env');
      process.exit(1);
    }

    initBot();
    
    const botInfo = await bot.getMe();
    logger.info(`Bot started: @${botInfo.username}`);
    logger.info('Bot is running. Press Ctrl+C to stop.');

  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Stopping bot...');
  if (bot) {
    bot.stopPolling();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Stopping bot...');
  if (bot) {
    bot.stopPolling();
  }
  process.exit(0);
});

// Start bot
startBot();
