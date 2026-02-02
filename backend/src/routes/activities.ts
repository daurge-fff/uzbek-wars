/**
 * Activity Routes
 * 
 * Handles activity-related endpoints:
 * - GET /api/activities - Retrieve all available activities
 * - POST /api/player/perform-activity - Perform an activity
 */

import { Router, Request, Response } from 'express';
import { getActivities } from '../services/ActivityService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/activities
 * 
 * Retrieves all available activities
 * 
 * Activities represent different actions players can perform:
 * - Work (Работа) - Earn soms, costs energy
 * - Study (Учеба) - Gain XP, costs energy
 * - Eat (Поесть) - Restore hunger, costs soms
 * - Sleep (Спать) - Restore energy, takes time
 * - Entertainment (Развлечения) - Restore mood, costs soms
 * - Exercise (Спорт) - Restore health, costs energy
 * 
 * Each activity has multilingual names and descriptions
 * supporting ru, uz, uk, en languages.
 * 
 * Response:
 *   - activities: Array of activity objects
 *     - id: Unique activity identifier
 *     - name: Localized activity names
 *     - description: Localized activity descriptions
 *     - effects: What the activity does (XP, stats, currency)
 *     - requirements: What's needed to perform (energy, soms)
 *     - duration: How long the activity takes (seconds)
 * 
 * Example response:
 * {
 *   "activities": [
 *     {
 *       "id": "work",
 *       "name": {
 *         "ru": "Работа",
 *         "uz": "Ish",
 *         "uk": "Робота",
 *         "en": "Work"
 *       },
 *       "description": { ... },
 *       "effects": { "soms": 100 },
 *       "requirements": { "energy": 20 },
 *       "duration": 3600
 *     }
 *   ]
 * }
 */
router.get('/activities', (_req: Request, res: Response): void => {
  try {
    const activities = getActivities();
    
    res.status(200).json({
      activities,
      count: activities.length
    });
  } catch (error) {
    logger.error('Activities endpoint error:', error);
    res.status(500).json({
      error: 'Failed to retrieve activities',
      code: 'ACTIVITIES_FETCH_FAILED',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/player/perform-activity
 * 
 * Performs an activity for authenticated user
 * 
 * This endpoint handles all activity execution:
 * 1. Validates player has required resources (energy, soms)
 * 2. Validates player stats are sufficient (not dead/exhausted)
 * 3. Applies activity effects (XP, stats, currency)
 * 4. Handles level-ups if XP threshold reached
 * 5. Logs activity in player's activity history
 * 
 * Request body:
 *   - activityId: Activity to perform (required)
 * 
 * Response:
 *   - player: Updated player profile with new stats
 *   - leveledUp: Boolean indicating if player leveled up
 *   - newLevel: New level if leveledUp is true
 *   - message: Success message
 * 
 * Error responses:
 *   - 400: Invalid activity, insufficient resources, or player cannot perform
 *   - 401: Not authenticated
 *   - 404: Player not found
 *   - 500: Server error
 * 
 * Example request:
 * POST /api/player/perform-activity
 * Authorization: Bearer <jwt_token>
 * {
 *   "activityId": "work"
 * }
 */
/**
 * POST /api/player/perform-activity
 * 
 * DEPRECATED: This route is now handled in player.ts
 * Keeping for backwards compatibility but should not be used
 */
/*
router.post(
  '/player/perform-activity',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Extract user ID from authenticated request
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({
          error: 'User not authenticated',
          code: 'UNAUTHORIZED'
        });
        return;
      }
      
      // Validate request body
      const { activityId } = req.body;
      
      if (!activityId) {
        res.status(400).json({
          error: 'Activity ID is required',
          code: 'MISSING_ACTIVITY_ID'
        });
        return;
      }
      
      // Perform activity
      const result = await performActivity(userId, activityId);
      
      res.status(200).json({
        player: result.player,
        leveledUp: result.leveledUp,
        newLevel: result.newLevel,
        message: 'Activity performed successfully'
      });
    } catch (error) {
      logger.error('Perform activity endpoint error:', error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('Player not found')) {
          res.status(404).json({
            error: 'Player not found',
            code: 'PLAYER_NOT_FOUND',
            message: error.message
          });
          return;
        }
        
        if (error.message.includes('Invalid activity')) {
          res.status(400).json({
            error: 'Invalid activity ID',
            code: 'INVALID_ACTIVITY',
            message: error.message
          });
          return;
        }
        
        if (error.message.includes('Insufficient')) {
          res.status(400).json({
            error: 'Insufficient resources',
            code: 'INSUFFICIENT_RESOURCES',
            message: error.message
          });
          return;
        }
        
        if (error.message.includes('cannot perform') || error.message.includes('too low')) {
          res.status(400).json({
            error: 'Cannot perform activity',
            code: 'ACTIVITY_BLOCKED',
            message: error.message
          });
          return;
        }
      }
      
      // Generic error response
      res.status(500).json({
        error: 'Failed to perform activity',
        code: 'ACTIVITY_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);
*/

export default router;
