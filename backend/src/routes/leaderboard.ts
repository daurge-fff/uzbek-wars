/**
 * Leaderboard API Routes
 * 
 * Endpoints for leaderboard system:
 * - GET /api/leaderboard/global - Global leaderboard (top players by level)
 * - GET /api/leaderboard/city/:cityId - City leaderboard (top players in city)
 * - GET /api/leaderboard/soms - Wealth leaderboard (top players by soms)
 * 
 * Requirements: 21.1, 21.2, 21.3, 21.4
 */

import { Router, Response } from 'express';
import { AuthRequest, optionalAuth } from '../middleware/auth';
import {
  getGlobalLeaderboard,
  getCityLeaderboard,
  getSomsLeaderboard,
  getPlayerGlobalRank,
  getPlayerCityRank,
  getPlayerSomsRank
} from '../services/LeaderboardService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/leaderboard/global
 * 
 * Get global leaderboard (top players by level and experience)
 * 
 * Query params:
 * - limit: Number of players to return (default: 10, max: 100)
 * - playerId: Optional player ID to include rank for
 * 
 * Returns:
 * - leaderboard: Array of top players
 * - playerRank: Current player's rank (if authenticated or playerId provided)
 * 
 * Requirements: 21.1, 21.4
 */
router.get('/global', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const queryPlayerId = req.query.playerId as string;
    
    // Get leaderboard
    const result = await getGlobalLeaderboard(limit);
    
    // Get player rank if authenticated or playerId provided
    let playerRank = null;
    const playerId = queryPlayerId || req.player?.id;
    
    if (playerId) {
      playerRank = await getPlayerGlobalRank(playerId);
    }
    
    res.json({
      success: true,
      data: {
        leaderboard: result.leaderboard,
        playerRank,
        total: result.leaderboard.length
      }
    });
    
    logger.info(`Global leaderboard retrieved (limit: ${limit})`);
  } catch (error) {
    logger.error('Error retrieving global leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/leaderboard/city/:cityId
 * 
 * Get city leaderboard (top players in specific city)
 * 
 * Path params:
 * - cityId: City ID to get leaderboard for
 * 
 * Query params:
 * - limit: Number of players to return (default: 10, max: 100)
 * - playerId: Optional player ID to include rank for
 * 
 * Returns:
 * - leaderboard: Array of top players in city
 * - playerRank: Current player's rank in city (if authenticated or playerId provided)
 * 
 * Requirements: 21.2, 21.4
 */
router.get('/city/:cityId', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cityId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const queryPlayerId = req.query.playerId as string;
    
    // Validate cityId
    if (!cityId) {
      res.status(400).json({
        success: false,
        error: 'City ID is required'
      });
      return;
    }
    
    // Get leaderboard
    const result = await getCityLeaderboard(cityId, limit);
    
    // Get player rank if authenticated or playerId provided
    let playerRank = null;
    const playerId = queryPlayerId || req.player?.id;
    
    if (playerId) {
      playerRank = await getPlayerCityRank(playerId, cityId);
    }
    
    res.json({
      success: true,
      data: {
        cityId,
        leaderboard: result.leaderboard,
        playerRank,
        total: result.leaderboard.length
      }
    });
    
    logger.info(`City leaderboard retrieved for city ${cityId} (limit: ${limit})`);
  } catch (error) {
    logger.error('Error retrieving city leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/leaderboard/soms
 * 
 * Get wealth leaderboard (top players by soms)
 * 
 * Query params:
 * - limit: Number of players to return (default: 10, max: 100)
 * - playerId: Optional player ID to include rank for
 * 
 * Returns:
 * - leaderboard: Array of wealthiest players
 * - playerRank: Current player's wealth rank (if authenticated or playerId provided)
 * 
 * Requirements: 21.3, 21.4
 */
router.get('/soms', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const queryPlayerId = req.query.playerId as string;
    
    // Get leaderboard
    const result = await getSomsLeaderboard(limit);
    
    // Get player rank if authenticated or playerId provided
    let playerRank = null;
    const playerId = queryPlayerId || req.player?.id;
    
    if (playerId) {
      playerRank = await getPlayerSomsRank(playerId);
    }
    
    res.json({
      success: true,
      data: {
        leaderboard: result.leaderboard,
        playerRank,
        total: result.leaderboard.length
      }
    });
    
    logger.info(`Soms leaderboard retrieved (limit: ${limit})`);
  } catch (error) {
    logger.error('Error retrieving soms leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
