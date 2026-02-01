/**
 * Telegram Bot for account verification
 * 
 * Usage:
 * 1. Create bot via @BotFather
 * 2. Set TELEGRAM_BOT_TOKEN in .env
 * 3. Start bot: npm run bot
 */

import TelegramBot from 'node-telegram-bot-api';
import { User } from '../models/User';
import { logger } from '../utils/logger';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

if (!BOT_TOKEN) {
  logger.warn('TELEGRAM_BOT_TOKEN not set. Verification bot disabled.');
}

export const bot = BOT_TOKEN ? new TelegramBot(BOT_TOKEN, { polling: true }) : null;

interface VerificationSession {
  userId: string;
  code: string;
  timestamp: number;
}

const verificationSessions = new Map<string, VerificationSession>();

// Clean up old sessions (older than 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [code, session] of verificationSessions.entries()) {
    if (now - session.timestamp > 5 * 60 * 1000) {
      verificationSessions.delete(code);
    }
  }
}, 60 * 1000);

/**
 * Create verification session
 */
export const createVerificationSession = (userId: string): string => {
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  verificationSessions.set(code, {
    userId,
    code,
    timestamp: Date.now()
  });
  return code;
};

/**
 * Initialize bot handlers
 */
export const initBot = () => {
  if (!bot) return;

  // Handle /start command with verification code
  bot.onText(/\/start (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const telegramUserId = msg.from?.id;
    const telegramUsername = msg.from?.username;
    const verificationCode = match?.[1];

    if (!verificationCode) {
      bot.sendMessage(chatId, '❌ Неверная ссылка верификации');
      return;
    }

    const session = verificationSessions.get(verificationCode);
    
    if (!session) {
      bot.sendMessage(chatId, '❌ Код верификации истек или недействителен');
      return;
    }

    try {
      // Update user with Telegram info
      const user = await User.findById(session.userId);
      
      if (!user) {
        bot.sendMessage(chatId, '❌ Пользователь не найден');
        return;
      }

      user.telegramId = telegramUserId?.toString();
      user.telegramUsername = telegramUsername;
      user.isVerified = true;
      await user.save();

      // Remove session
      verificationSessions.delete(verificationCode);

      // Send success message
      await bot.sendMessage(
        chatId,
        `✅ *Верификация успешна!*\n\n` +
        `👤 Аккаунт: ${user.username || user.displayName}\n` +
        `✈️ Telegram: @${telegramUsername || 'не указан'}\n\n` +
        `Теперь у вас есть галочка верификации! 🎉`,
        { parse_mode: 'Markdown' }
      );

      logger.info(`User ${user._id} verified via Telegram: @${telegramUsername}`);
    } catch (error) {
      logger.error('Telegram verification error:', error);
      bot.sendMessage(chatId, '❌ Ошибка верификации. Попробуйте позже.');
    }
  });

  // Handle /start without code
  bot.onText(/\/start$/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      '👋 *Добро пожаловать в Узбек Варс!*\n\n' +
      'Этот бот используется для верификации аккаунтов.\n\n' +
      '🔒 Чтобы верифицировать аккаунт:\n' +
      '1. Откройте игру\n' +
      '2. Перейдите в профиль\n' +
      '3. Нажмите "Верифицировать"\n' +
      '4. Вы будете перенаправлены сюда\n\n' +
      '🎮 Играть: https://uzbekwars.com',
      { parse_mode: 'Markdown' }
    );
  });

  // Handle /help
  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      '📖 *Помощь*\n\n' +
      '/start - Начать верификацию\n' +
      '/help - Показать эту справку\n' +
      '/stats - Статистика игры\n\n' +
      '🎮 Сайт: https://uzbekwars.com\n' +
      '💬 Поддержка: @daurge',
      { parse_mode: 'Markdown' }
    );
  });

  // Handle /stats
  bot.onText(/\/stats/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const totalUsers = await User.countDocuments();
      const verifiedUsers = await User.countDocuments({ isVerified: true });
      
      bot.sendMessage(
        chatId,
        `📊 *Статистика Узбек Варс*\n\n` +
        `👥 Всего игроков: ${totalUsers}\n` +
        `✅ Верифицировано: ${verifiedUsers}\n` +
        `📈 Процент верификации: ${((verifiedUsers / totalUsers) * 100).toFixed(1)}%`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      logger.error('Stats error:', error);
      bot.sendMessage(chatId, '❌ Ошибка получения статистики');
    }
  });

  logger.info('Telegram bot initialized');
};

/**
 * Send notification to user
 */
export const sendTelegramNotification = async (
  telegramId: string,
  message: string
): Promise<boolean> => {
  if (!bot) return false;

  try {
    await bot.sendMessage(telegramId, message, { parse_mode: 'Markdown' });
    return true;
  } catch (error) {
    logger.error('Failed to send Telegram notification:', error);
    return false;
  }
};
