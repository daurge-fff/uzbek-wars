/**
 * Referral API Routes
 * 
 * Endpoints for referral system:
 * - GET /api/referral/code - Get player's referral code and stats
 * - GET /api/referral/referred - Get list of referred players
 * 
 * Requirements: 19.5, 19.6
 */

import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getPlayerReferralInfo } from '../services/ReferralService';
import { Player } from '../models/Player';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/referral/code
 * 
 * Get player's referral code and statistics
 * 
 * Returns:
 * - referralCode: Player's unique referral code
 * - referralUrl: Full URL for sharing
 * - referralCount: Number of players referred
 * - totalBonusesEarned: Total crystals and soms earned from referrals
 * 
 * Requirements: 19.5
 */
router.get('/code', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    // Find player
    const player = await Player.findOne({ userId });
    if (!player) {
      res.status(404).json({
        success: false,
        error: 'Player not found'
      });
      return;
    }
    
    // Get referral information
    const referralInfo = await getPlayerReferralInfo(player._id.toString());
    if (!referralInfo) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve referral information'
      });
      return;
    }
    
    // Construct referral URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const referralUrl = `${baseUrl}/register?ref=${referralInfo.referralCode}`;
    
    res.json({
      success: true,
      data: {
        referralCode: referralInfo.referralCode,
        referralUrl,
        referralCount: referralInfo.referralCount,
        totalBonusesEarned: referralInfo.totalBonusesEarned
      }
    });
    
    logger.info(`Referral code retrieved for player ${player._id}`);
  } catch (error) {
    logger.error('Error retrieving referral code:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/referral/referred
 * 
 * Get list of players referred by current player
 * 
 * Returns array of referred players with:
 * - level: Player's current level
 * - cityId: City where player is located
 * - joinedAt: Date when player joined
 * 
 * Requirements: 19.6
 */
router.get('/referred', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    
    // Find player
    const player = await Player.findOne({ userId });
    if (!player) {
      res.status(404).json({
        success: false,
        error: 'Player not found'
      });
      return;
    }
    
    // Get referral information
    const referralInfo = await getPlayerReferralInfo(player._id.toString());
    if (!referralInfo) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve referral information'
      });
      return;
    }
    
    res.json({
      success: true,
      data: {
        referredPlayers: referralInfo.referredPlayers,
        totalCount: referralInfo.referralCount
      }
    });
    
    logger.info(`Referred players list retrieved for player ${player._id}`);
  } catch (error) {
    logger.error('Error retrieving referred players:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
