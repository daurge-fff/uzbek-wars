/**
 * Combat Stats API Routes
 * 
 * Endpoints for managing player combat statistics:
 * - GET /api/combat-stats - Get player's combat stats
 * - POST /api/combat-stats/allocate - Allocate stat points
 * - POST /api/combat-stats/reset - Reset all stats (costs crystals)
 */

import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthRequest, authenticate } from '../middleware/auth';
import {
  getCombatStats,
  allocateStatPoints,
  resetCombatStats
} from '../services/CombatStatsService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/combat-stats
 * Get player's combat statistics
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const playerId = req.player!.id;
    
    const stats = await getCombatStats(playerId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting combat stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get combat stats'
    });
  }
});

/**
 * POST /api/combat-stats/allocate
 * Allocate stat points to a specific stat
 * 
 * Body:
 * - stat: 'strength' | 'defense' | 'agility' | 'stamina' | 'intelligence'
 * - points: number (1-100)
 */
router.post(
  '/allocate',
  authenticate,
  [
    body('stat')
      .isIn(['strength', 'defense', 'agility', 'stamina', 'intelligence'])
      .withMessage('Invalid stat type'),
    body('points')
      .isInt({ min: 1, max: 100 })
      .withMessage('Points must be between 1 and 100')
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const playerId = req.player!.id;
      const { stat, points } = req.body;

      const updatedStats = await allocateStatPoints(playerId, stat, points);

      res.json({
        success: true,
        data: updatedStats,
        message: `Allocated ${points} points to ${stat}`
      });
    } catch (error: any) {
      logger.error('Error allocating stat points:', error);
      
      if (error.message === 'Not enough stat points') {
        res.status(400).json({
          success: false,
          error: 'Not enough stat points available'
        });
        return;
      }
      
      if (error.message.includes('Cannot exceed maximum')) {
        res.status(400).json({
          success: false,
          error: 'Cannot exceed maximum stat value of 100'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to allocate stat points'
      });
    }
  }
);

/**
 * POST /api/combat-stats/reset
 * Reset all combat stats (costs 100 crystals by default)
 * Returns all allocated points back to statPoints pool
 */
router.post('/reset', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const playerId = req.player!.id;
    const costCrystals = 100; // Fixed cost

    const updatedStats = await resetCombatStats(playerId, costCrystals);

    res.json({
      success: true,
      data: updatedStats,
      message: `Combat stats reset for ${costCrystals} crystals`
    });
  } catch (error: any) {
    logger.error('Error resetting combat stats:', error);
    
    if (error.message === 'Not enough crystals') {
      res.status(400).json({
        success: false,
        error: 'Not enough crystals to reset stats'
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to reset combat stats'
    });
  }
});

export default router;
