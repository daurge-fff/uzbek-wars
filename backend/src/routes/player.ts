/**
 * Player routes
 * 
 * Handles player-related endpoints:
 * - PATCH /api/player/language - Update player's language preference
 */

import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { User, Language } from '../models/User';
import { Player } from '../models/Player';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/player/profile
 * 
 * Gets the authenticated player's full profile data
 */
router.get(
  '/profile',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      const player = await Player.findOne({ userId });
      if (!player) {
        res.status(404).json({ error: 'Player not found' });
        return;
      }

      res.status(200).json({
        player: {
          userId: player.userId,
          characterId: player.characterId,
          level: player.level,
          experience: player.experience,
          soms: player.soms,
          donationCurrency: player.donationCurrency,
          stats: player.stats,
          referralCode: player.referralCode,
          referredBy: player.referredBy,
          lastActivityTime: player.lastActivityTime,
          createdAt: player.createdAt,
          updatedAt: player.updatedAt
        }
      });
    } catch (error) {
      logger.error('Error getting player profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PATCH /api/player/language
 * 
 * Updates the authenticated user's language preference
 * 
 * This endpoint:
 * 1. Validates the language is one of the supported languages (ru, uz, uk, en)
 * 2. Updates the user's language in the database
 * 3. Returns the updated language
 * 
 * Request body:
 *   - language: Language code (ru, uz, uk, en)
 * 
 * Response:
 *   - language: Updated language code
 *   - message: Success message
 * 
 * Error responses:
 *   - 400: Invalid language code
 *   - 401: Not authenticated
 *   - 404: User not found
 *   - 500: Server error
 * 
 * Example request:
 * PATCH /api/player/language
 * Authorization: Bearer <jwt_token>
 * {
 *   "language": "uz"
 * }
 * 
 * Example response:
 * {
 *   "language": "uz",
 *   "message": "Language updated successfully"
 * }
 */
router.patch(
  '/language',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { language } = req.body;
      const userId = req.user?.id;

      // Validate language
      const validLanguages: Language[] = ['ru', 'uz', 'uk', 'en'];
      if (!language || !validLanguages.includes(language)) {
        res.status(400).json({
          error: 'Invalid language',
          code: 'INVALID_LANGUAGE',
          message: 'Language must be one of: ru, uz, uk, en',
        });
        return;
      }

      // Find and update user
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        });
        return;
      }

      // Update language
      user.language = language;
      await user.save();

      logger.info(`User ${userId} changed language to ${language}`);

      res.status(200).json({
        language: user.language,
        message: 'Language updated successfully',
      });
    } catch (error) {
      logger.error('Error updating language:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: 'Failed to update language',
      });
    }
  }
);

/**
 * GET /api/player/current-activity
 * 
 * Gets the player's current active activity
 */
router.get(
  '/current-activity',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      const player = await Player.findOne({ userId });
      if (!player) {
        res.status(404).json({ error: 'Player not found' });
        return;
      }

      // Проверяем есть ли активная активность
      if (player.currentActivity && player.currentActivityEndTime) {
        const now = new Date();
        const endTime = new Date(player.currentActivityEndTime);
        const startTime = player.currentActivityStartTime ? new Date(player.currentActivityStartTime) : new Date(now.getTime() - 60000);
        
        if (endTime > now) {
          // Активность еще идет
          res.status(200).json({
            activity: {
              activityId: player.currentActivity,
              activityName: player.currentActivityName || 'Активность',
              startTime: startTime.getTime(),
              endTime: endTime.getTime()
            }
          });
          return;
        } else {
          // Активность завершена, очищаем
          player.currentActivity = undefined;
          player.currentActivityName = undefined;
          player.currentActivityStartTime = undefined;
          player.currentActivityEndTime = undefined;
          await player.save();
        }
      } else if (player.currentActivity) {
        // Битые данные - очищаем
        logger.warn(`Cleaning up broken activity data for player ${userId}`);
        player.currentActivity = undefined;
        player.currentActivityName = undefined;
        player.currentActivityStartTime = undefined;
        player.currentActivityEndTime = undefined;
        await player.save();
      }

      res.status(200).json({ activity: null });
    } catch (error) {
      logger.error('Error getting current activity:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/player/perform-activity
 * 
 * Starts a new activity for the player
 */
router.post(
  '/perform-activity',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { activityId } = req.body;
      const userId = req.user?.id;

      if (!activityId) {
        res.status(400).json({ error: 'Activity ID required' });
        return;
      }

      const player = await Player.findOne({ userId });
      if (!player) {
        res.status(404).json({ error: 'Player not found' });
        return;
      }

      // Проверяем есть ли уже активная активность
      if (player.currentActivity && player.currentActivityEndTime) {
        const now = new Date();
        const endTime = new Date(player.currentActivityEndTime);
        
        if (endTime > now) {
          res.status(400).json({ 
            error: 'Already performing an activity',
            message: 'Дождись завершения текущей активности'
          });
          return;
        }
      }

      // Импортируем ActivityService для получения информации об активности
      const { getActivityById } = await import('../services/ActivityService');
      const activity = getActivityById(activityId);
      
      if (!activity) {
        res.status(404).json({ error: 'Activity not found' });
        return;
      }

      // Проверяем уровень
      if (player.level < activity.requiredLevel) {
        res.status(400).json({ 
          error: 'Level too low',
          message: `Требуется ${activity.requiredLevel} уровень`
        });
        return;
      }

      // Используем duration из активности (в секундах)
      const durationSeconds = activity.duration;
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + durationSeconds * 1000);

      // Получаем название активности на русском
      const activityName = activity.name.ru;

      // Сохраняем активность
      player.currentActivity = activityId;
      player.currentActivityName = activityName;
      player.currentActivityStartTime = startTime;
      player.currentActivityEndTime = endTime;
      await player.save();

      logger.info(`Player ${userId} started activity ${activityId} for ${durationSeconds} seconds`);

      res.status(200).json({
        message: 'Activity started',
        durationSeconds,
        endTime: endTime.getTime(),
        activityName
      });
    } catch (error) {
      logger.error('Error performing activity:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/player/complete-activity
 * 
 * Completes the current activity and gives rewards
 */
router.post(
  '/complete-activity',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      const player = await Player.findOne({ userId });
      if (!player) {
        res.status(404).json({ error: 'Player not found' });
        return;
      }

      // Проверяем есть ли активная активность
      if (!player.currentActivity || !player.currentActivityEndTime) {
        res.status(400).json({ error: 'No active activity' });
        return;
      }

      const now = new Date();
      const endTime = new Date(player.currentActivityEndTime);

      // Проверяем завершилась ли активность
      if (endTime > now) {
        res.status(400).json({ 
          error: 'Activity not finished',
          message: 'Активность еще не завершена'
        });
        return;
      }

      // Импортируем ActivityService для получения наград
      const { getActivityById } = await import('../services/ActivityService');
      const { processLevelUp } = await import('../services/ProgressionService');
      const { updatePlayerStats } = await import('../services/StatsService');
      
      const activity = getActivityById(player.currentActivity);
      
      if (!activity) {
        // Активность не найдена, просто очищаем
        player.currentActivity = undefined;
        player.currentActivityName = undefined;
        player.currentActivityStartTime = undefined;
        player.currentActivityEndTime = undefined;
        await player.save();
        
        res.status(404).json({ error: 'Activity not found' });
        return;
      }

      // Применяем награды
      let experienceGained = activity.rewards.experience;
      let somsGained = activity.rewards.soms;
      let penaltyApplied = false;

      // Проверяем риски
      if (activity.risks && Math.random() < activity.risks.probability) {
        somsGained -= activity.risks.penalty;
        penaltyApplied = true;
      }

      // Применяем изменения статов
      updatePlayerStats(player, activity.statModifiers);

      // Логируем статы до и после
      logger.info(
        `Stats after activity ${activity.id}: ` +
        `hunger=${player.stats.hunger}, health=${player.stats.health}, ` +
        `mood=${player.stats.mood}, energy=${player.stats.energy}`
      );

      // Добавляем награды
      player.experience += experienceGained;
      player.soms = Math.max(0, player.soms + somsGained);

      // Вычитаем стоимость если есть
      if (activity.cost) {
        player.soms = Math.max(0, player.soms - activity.cost);
      }

      // Проверяем повышение уровня
      const levelsGained = processLevelUp(player);
      const leveledUp = levelsGained > 0;

      // Очищаем текущую активность
      player.currentActivity = undefined;
      player.currentActivityName = undefined;
      player.currentActivityStartTime = undefined;
      player.currentActivityEndTime = undefined;
      player.lastActivityTime = new Date();

      await player.save();

      logger.info(
        `Player ${userId} completed activity ${activity.id}: ` +
        `+${experienceGained} XP, ${somsGained >= 0 ? '+' : ''}${somsGained} soms` +
        (leveledUp ? `, leveled up to ${player.level}` : '')
      );

      res.status(200).json({
        success: true,
        experienceGained,
        somsGained,
        leveledUp,
        newLevel: leveledUp ? player.level : undefined,
        levelsGained: leveledUp ? levelsGained : undefined,
        penaltyApplied,
        statChanges: activity.statModifiers,
        player: {
          level: player.level,
          experience: player.experience,
          soms: player.soms,
          stats: player.stats
        }
      });
    } catch (error) {
      logger.error('Error completing activity:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/player/cancel-activity
 * 
 * Cancels the current activity (for debugging/testing)
 */
router.post(
  '/cancel-activity',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      const player = await Player.findOne({ userId });
      if (!player) {
        res.status(404).json({ error: 'Player not found' });
        return;
      }

      // Очищаем текущую активность
      player.currentActivity = undefined;
      player.currentActivityName = undefined;
      player.currentActivityStartTime = undefined;
      player.currentActivityEndTime = undefined;
      await player.save();

      logger.info(`Player ${userId} cancelled current activity`);

      res.status(200).json({
        message: 'Activity cancelled',
        success: true
      });
    } catch (error) {
      logger.error('Error cancelling activity:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
