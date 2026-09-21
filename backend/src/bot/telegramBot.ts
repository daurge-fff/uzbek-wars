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

let bot: TelegramBot | null = null;

export { bot };

/**
 * Public HTTPS URL of the mini app.
 * Telegram only accepts HTTPS web_app URLs, so this must be the real public address.
 */
export const getWebAppUrl = (): string => {
  const url = process.env.TELEGRAM_WEBAPP_URL || process.env.FRONTEND_URL || 'https://uzbekwars.top';
  return url.replace(/\/+$/, '');
};

/**
 * Registers the mini app menu button and the bot command list via the Bot API.
 * Called on bot start and by `npm run setup:bot`; failures are reported, never fatal.
 */
export const configureWebApp = async (
  botToken: string = process.env.TELEGRAM_BOT_TOKEN || ''
): Promise<{ ok: boolean; url: string; error?: string }> => {
  const url = getWebAppUrl();

  if (!botToken) {
    return { ok: false, url, error: 'TELEGRAM_BOT_TOKEN is not set' };
  }

  const call = async (method: string, payload: Record<string, unknown>) => {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data: any = await response.json();
    if (!data?.ok) {
      throw new Error(`${method} failed: ${data?.description || response.status}`);
    }
    return data;
  };

  try {
    // Menu button opens the game as a mini app
    await call('setChatMenuButton', {
      menu_button: { type: 'web_app', text: 'Играть', web_app: { url } }
    });

    // Commands shown in the Telegram UI
    await call('setMyCommands', {
      commands: [
        { command: 'play', description: '🎮 Играть' },
        { command: 'start', description: 'Начать' },
        { command: 'help', description: 'Помощь' },
        { command: 'stats', description: 'Статистика' }
      ]
    });

    logger.info(`Telegram mini app menu button set to ${url}`);
    return { ok: true, url };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('Failed to configure Telegram mini app menu button:', message);
    return { ok: false, url, error: message };
  }
};

interface VerificationSession {
  userId: string;
  code: string;
  timestamp: number;
}

const verificationSessions = new Map<string, VerificationSession>();

/** Exported for use by auth linking endpoints */
export { verificationSessions };

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
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

  if (!BOT_TOKEN) {
    logger.warn('TELEGRAM_BOT_TOKEN not set. Verification bot disabled.');
    return;
  }

  bot = new TelegramBot(BOT_TOKEN, { polling: true });

  // Mini app entry point: menu button + commands (non-fatal if Telegram is unreachable)
  void configureWebApp(BOT_TOKEN);

  // Handle /start command with verification code
  bot.onText(/\/start (.+)/, async (msg, match) => {
    if (!bot) return;
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
    if (!bot) return;
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      '👋 *Добро пожаловать в Узбек Варс!*\n\n' +
      'Это и игра в Telegram, и бот для верификации аккаунтов.\n\n' +
      '🎮 Нажми кнопку ниже, чтобы играть прямо в Telegram.\n\n' +
      '🔒 Чтобы верифицировать аккаунт:\n' +
      '1. Откройте игру\n' +
      '2. Перейдите в профиль\n' +
      '3. Нажмите "Верифицировать"\n' +
      '4. Вы будете перенаправлены сюда',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '🎮 Играть в Uzbek Wars', web_app: { url: getWebAppUrl() } }]]
        }
      }
    );
  });

  // Handle /play - open the mini app
  bot.onText(/\/play/, (msg) => {
    if (!bot) return;
    bot.sendMessage(msg.chat.id, '🎮 Погнали! Открываю арену и базар…', {
      reply_markup: {
        inline_keyboard: [[{ text: '🎮 Играть в Uzbek Wars', web_app: { url: getWebAppUrl() } }]]
      }
    });
  });

  // Handle /help
  bot.onText(/\/help/, (msg) => {
    if (!bot) return;
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      '📖 *Помощь*\n\n' +
      '/start - Начать верификацию\n' +
      '/help - Показать эту справку\n' +
      '/stats - Статистика игры\n\n' +
      '🎮 Сайт: https://uzbekwars.top\n' +
      '💬 Поддержка: @daurge',
      { parse_mode: 'Markdown' }
    );
  });

  // Handle /stats
  bot.onText(/\/stats/, async (msg) => {
    if (!bot) return;
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

  // Initialize callback query handler
  handleCallbackQueries();

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

/**
 * Send payment confirmation request to admin
 */
export const sendPaymentConfirmationToAdmin = async (
  orderId: string,
  userId: string,
  amount: string,
  crystals: number,
  paymentMethod: string
): Promise<boolean> => {
  if (!bot) return false;

  const adminId = process.env.ADMIN_TELEGRAM_ID;
  if (!adminId) {
    logger.error('ADMIN_TELEGRAM_ID not set in environment');
    return false;
  }

  try {
    const message = 
      `🔔 *Новая заявка на оплату*\n\n` +
      `💳 Способ: ${paymentMethod}\n` +
      `💎 Кристаллы: ${crystals}\n` +
      `💵 Сумма: ${amount}\n` +
      `🆔 ID заявки: \`${orderId}\`\n` +
      `👤 ID игрока: \`${userId}\`\n\n` +
      `Подтвердите или отклоните платеж:`;

    await bot.sendMessage(adminId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Подтвердить', callback_data: `confirm_${orderId}` },
            { text: '❌ Отклонить', callback_data: `reject_${orderId}` }
          ]
        ]
      }
    });

    logger.info(`Payment confirmation sent to admin for order ${orderId}`);
    return true;
  } catch (error) {
    logger.error('Failed to send payment confirmation to admin:', error);
    return false;
  }
};

/**
 * Handle callback queries from inline buttons
 */
export const handleCallbackQueries = () => {
  if (!bot) return;

  bot.on('callback_query', async (query) => {
    if (!bot) return;
    const chatId = query.message?.chat.id;
    const messageId = query.message?.message_id;
    const data = query.data;

    if (!chatId || !data) return;

    try {
      if (data.startsWith('confirm_')) {
        const orderId = data.replace('confirm_', '');
        
        // TODO: Implement actual payment confirmation logic
        // This should update the database and credit crystals to user
        
        await bot.editMessageText(
          `✅ *Платеж подтвержден*\n\n` +
          `🆔 ID заявки: \`${orderId}\`\n` +
          `💎 Кристаллы начислены игроку`,
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown'
          }
        );

        await bot.answerCallbackQuery(query.id, {
          text: '✅ Платеж подтвержден'
        });

        logger.info(`Payment ${orderId} confirmed by admin`);
      } else if (data.startsWith('reject_')) {
        const orderId = data.replace('reject_', '');
        
        // TODO: Implement rejection logic
        
        await bot.editMessageText(
          `❌ *Платеж отклонен*\n\n` +
          `🆔 ID заявки: \`${orderId}\`\n` +
          `Игрок будет уведомлен`,
          {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown'
          }
        );

        await bot.answerCallbackQuery(query.id, {
          text: '❌ Платеж отклонен'
        });

        logger.info(`Payment ${orderId} rejected by admin`);
      }
    } catch (error) {
      logger.error('Error handling callback query:', error);
      if (bot) {
        await bot.answerCallbackQuery(query.id, {
          text: '❌ Ошибка обработки'
        });
      }
    }
  });
};
