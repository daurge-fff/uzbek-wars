/**
 * Player routes
 * 
 * Handles player-related endpoints:
 * - PATCH /api/player/language - Update player's language preference
 */

import { Router, Response } from 'express';
import { authenticate, authenticateUser, AuthRequest } from '../middleware/auth';
import { 
  validateSelectCharacter, 
  validatePerformActivity, 
  validateLanguage,
  rateLimit 
} from '../middleware/validation';
import { User, Language } from '../models/User';
import { Player } from '../models/Player';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Test endpoint
 */
router.get('/test', (_req, res) => {
  res.json({ message: 'Player routes working!' });
});

/**
 * Test POST endpoint without auth
 */
router.post('/test-post', (req, res) => {
  res.json({ message: 'POST working!', body: req.body });
});

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
  validateLanguage,
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
  validatePerformActivity,
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

/**
 * POST /api/player/select-character
 * 
 * Selects character and city for authenticated user during onboarding
 */
router.post(
  '/select-character',
  authenticateUser,
  validateSelectCharacter,
  rateLimit(10, 60000), // 10 requests per minute
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      logger.info('=== SELECT CHARACTER REQUEST ===');
      logger.info(`Headers: ${JSON.stringify(req.headers)}`);
      logger.info(`Request body: ${JSON.stringify(req.body)}`);
      logger.info(`Auth user object: ${JSON.stringify(req.user)}`);
      
      const userId = req.user?.id;
      
      logger.info(`User ID from token: ${userId}`);
      
      if (!userId) {
        logger.error('No user ID in request');
        res.status(401).json({
          error: 'User not authenticated',
          code: 'UNAUTHORIZED'
        });
        return;
      }
      
      const { characterId, cityId, referralCode, displayName } = req.body;
      
      if (!characterId || !cityId) {
        res.status(400).json({
          error: 'Character ID and City ID are required',
          code: 'MISSING_REQUIRED_FIELDS'
        });
        return;
      }
      
      // Select character and create player profile
      const { selectCharacter } = await import('../services/CharacterService');
      const player = await selectCharacter(userId, {
        characterId,
        cityId,
        referralCode
      });

      // Update user displayName if provided
      if (displayName && displayName.trim()) {
        const User = (await import('../models/User')).User;
        await User.findByIdAndUpdate(userId, { displayName: displayName.trim() });
      }

      // Get updated user
      const User = (await import('../models/User')).User;
      const user = await User.findById(userId).select('-password');
      
      res.status(201).json({
        player,
        user,
        message: 'Character selected successfully'
      });
    } catch (error) {
      logger.error('Select character endpoint error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('already selected')) {
          res.status(400).json({
            error: 'Character already selected',
            code: 'CHARACTER_ALREADY_SELECTED',
            message: error.message
          });
          return;
        }
        
        if (error.message.includes('Invalid character')) {
          res.status(400).json({
            error: 'Invalid character ID',
            code: 'INVALID_CHARACTER',
            message: error.message
          });
          return;
        }
        
        if (error.message.includes('Invalid city')) {
          res.status(400).json({
            error: 'Invalid city ID',
            code: 'INVALID_CITY',
            message: error.message
          });
          return;
        }
        
        if (error.message.includes('full')) {
          res.status(400).json({
            error: 'City is full',
            code: 'CITY_FULL',
            message: error.message
          });
          return;
        }
      }
      
      res.status(500).json({
        error: 'Failed to select character',
        code: 'CHARACTER_SELECTION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * PUT /api/player/update-profile
 * 
 * Updates player's character or city
 */
router.put(
  '/update-profile',
  authenticateUser,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          error: 'User not authenticated',
          code: 'UNAUTHORIZED'
        });
        return;
      }
      
      const { characterId, cityId, displayName } = req.body;
      
      // Update user displayName if provided
      if (displayName && displayName.trim()) {
        const User = (await import('../models/User')).User;
        await User.findByIdAndUpdate(userId, { displayName: displayName.trim() });
      }
      
      let player: any = await Player.findOne({ userId });
      
      // If player doesn't exist, create new one
      if (!player) {
        logger.info(`Player not found for userId ${userId}, creating new player`);
        
        if (!characterId || !cityId) {
          res.status(400).json({
            error: 'Character ID and City ID are required for new player',
            code: 'MISSING_REQUIRED_FIELDS'
          });
          return;
        }
        
        const { selectCharacter } = await import('../services/CharacterService');
        player = await selectCharacter(userId, { characterId, cityId, displayName });
        
        res.status(201).json({
          player,
          message: 'Player created successfully'
        });
        return;
      }
      
      // Update character if provided
      if (characterId) {
        const { isValidCharacter } = await import('../services/CharacterService');
        if (!isValidCharacter(characterId)) {
          res.status(400).json({
            error: 'Invalid character ID',
            code: 'INVALID_CHARACTER'
          });
          return;
        }
        player.characterId = characterId;
      }
      
      // Update city if provided
      if (cityId) {
        const { getCityById } = await import('../services/CityService');
        const city = await getCityById(cityId);
        
        if (!city) {
          res.status(400).json({
            error: 'Invalid city ID',
            code: 'INVALID_CITY'
          });
          return;
        }
        
        if (!city.isOpen) {
          res.status(400).json({
            error: 'City is full',
            code: 'CITY_FULL'
          });
          return;
        }
        
        player.cityId = cityId;
      }
      
      await player.save();
      
      res.status(200).json({
        player,
        message: 'Player profile updated successfully'
      });
    } catch (error) {
      logger.error('Update player profile endpoint error:', error);
      res.status(500).json({
        error: 'Failed to update player profile',
        code: 'UPDATE_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/player/change-class
 * 
 * Changes player's character class
 * 
 * Requirements:
 * - Player must meet level requirement for new class
 * - Cost: 5000 soms + 100 crystals
 * - Cannot change to same class
 * 
 * Request body:
 *   - characterId: New character class ID (required)
 * 
 * Response:
 *   - player: Updated player profile
 *   - message: Success message
 * 
 * Error responses:
 *   - 400: Invalid class, insufficient funds, or level too low
 *   - 401: Not authenticated
 *   - 404: Player not found
 *   - 500: Server error
 */
router.post(
  '/change-class',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          error: 'User not authenticated',
          code: 'UNAUTHORIZED'
        });
        return;
      }
      
      const { characterId } = req.body;
      
      if (!characterId) {
        res.status(400).json({
          error: 'Character ID is required',
          code: 'MISSING_CHARACTER_ID'
        });
        return;
      }
      
      // Change class
      const { changeClass } = await import('../services/CharacterService');
      const player = await changeClass(userId, characterId);
      
      res.status(200).json({
        player,
        message: 'Class changed successfully'
      });
    } catch (error) {
      logger.error('Change class endpoint error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            error: 'Player not found',
            code: 'PLAYER_NOT_FOUND',
            message: error.message
          });
          return;
        }
        
        if (error.message.includes('same class')) {
          res.status(400).json({
            error: 'Already using this class',
            code: 'SAME_CLASS',
            message: error.message
          });
          return;
        }
        
        if (error.message.includes('Invalid character')) {
          res.status(400).json({
            error: 'Invalid character class',
            code: 'INVALID_CLASS',
            message: error.message
          });
          return;
        }
        
        if (error.message.includes('Level') || error.message.includes('required')) {
          res.status(400).json({
            error: 'Level requirement not met',
            code: 'LEVEL_TOO_LOW',
            message: error.message
          });
          return;
        }
        
        if (error.message.includes('Insufficient')) {
          res.status(400).json({
            error: 'Insufficient funds',
            code: 'INSUFFICIENT_FUNDS',
            message: error.message
          });
          return;
        }
      }
      
      res.status(500).json({
        error: 'Failed to change class',
        code: 'CLASS_CHANGE_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/player/available-classes
 * 
 * Gets all classes available to the player based on their level
 */
router.get(
  '/available-classes',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          error: 'User not authenticated',
          code: 'UNAUTHORIZED'
        });
        return;
      }
      
      const player = await Player.findOne({ userId });
      if (!player) {
        res.status(404).json({ error: 'Player not found' });
        return;
      }
      
      const { getAvailableClasses, getAllClassesByTier } = await import('../services/CharacterService');
      
      res.status(200).json({
        currentClass: player.characterId,
        currentLevel: player.level,
        availableClasses: getAvailableClasses(player.level),
        allClassesByTier: getAllClassesByTier(),
        changeCost: {
          soms: 5000,
          crystals: 100
        }
      });
    } catch (error) {
      logger.error('Get available classes endpoint error:', error);
      res.status(500).json({
        error: 'Failed to get available classes',
        code: 'FETCH_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
