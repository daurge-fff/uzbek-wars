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
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

  if (!BOT_TOKEN) {
    logger.warn('TELEGRAM_BOT_TOKEN not set. Verification bot disabled.');
    return;
  }

  bot = new TelegramBot(BOT_TOKEN, { polling: true });

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
    if (!bot) return;
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
