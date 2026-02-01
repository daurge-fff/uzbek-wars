/**
 * Cosmetic API Routes
 * 
 * Endpoints for cosmetic system:
 * - GET /api/cosmetics - Get all available cosmetics
 * - GET /api/cosmetics/owned - Get player's cosmetic collection
 * - POST /api/cosmetics/purchase - Purchase a cosmetic item
 * - POST /api/cosmetics/equip - Equip a cosmetic item
 * - POST /api/cosmetics/unequip - Unequip a cosmetic item
 * 
 * Requirements: 16.3, 16.4, 16.5
 */

import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  getAllCosmetics,
  purchaseCosmetic,
  equipCosmetic,
  unequipCosmetic,
  getPlayerCosmetics
} from '../services/CosmeticService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/cosmetics
 * 
 * Get all available cosmetic items
 * 
 * Query parameters:
 * - type: Filter by type (clothing/background)
 * - rarity: Filter by rarity (common/rare/epic/legendary)
 * 
 * Returns array of cosmetics with:
 * - itemId: Unique identifier
 * - type: Item type
 * - name: Localized names
 * - description: Localized descriptions
 * - price: Price in crystals
 * - imageUrl: Item image
 * - rarity: Rarity level
 * 
 * Requirements: 16.3
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, rarity } = req.query;
    
    const cosmetics = await getAllCosmetics(
      type as string,
      rarity as string
    );
    
    res.json({
      success: true,
      data: cosmetics
    });
  } catch (error) {
    logger.error('Error getting cosmetics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/cosmetics/owned
 * 
 * Get player's cosmetic collection
 * 
 * Returns:
 * - owned: Array of owned cosmetics
 * - equipped: Currently equipped items
 *   - clothing: Equipped clothing item
 *   - background: Equipped background
 * 
 * Requirements: 16.4
 */
router.get('/owned', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const playerId = req.player!.id;
    
    const collection = await getPlayerCosmetics(playerId);
    
    res.json({
      success: true,
      data: collection
    });
  } catch (error) {
    logger.error('Error getting player cosmetics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/cosmetics/purchase
 * 
 * Purchase a cosmetic item
 * 
 * Request body:
 * - itemId: Cosmetic item ID
 * 
 * Validates:
 * - Player has enough donation currency
 * - Player doesn't already own the item
 * 
 * Returns:
 * - item: Purchased item details
 * - remainingCurrency: Player's remaining crystals
 * 
 * Requirements: 16.3
 */
router.post('/purchase', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const playerId = req.player!.id;
    const { itemId } = req.body;

    if (!itemId) {
      res.status(400).json({
        success: false,
        error: 'Item ID is required'
      });
      return;
    }

    const result = await purchaseCosmetic(playerId, itemId);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error
      });
      return;
    }

    res.json({
      success: true,
      data: {
        item: result.item,
        remainingCurrency: result.remainingCurrency
      }
    });

    logger.info(`Cosmetic purchased by player ${playerId}`, {
      itemId,
      remainingCurrency: result.remainingCurrency
    });
  } catch (error) {
    logger.error('Error purchasing cosmetic:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/cosmetics/equip
 * 
 * Equip a cosmetic item
 * 
 * Request body:
 * - itemId: Cosmetic item ID
 * 
 * Validates:
 * - Player owns the item
 * 
 * Automatically unequips current item of same type
 * 
 * Requirements: 16.4, 16.5
 */
router.post('/equip', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const playerId = req.player!.id;
    const { itemId } = req.body;

    if (!itemId) {
      res.status(400).json({
        success: false,
        error: 'Item ID is required'
      });
      return;
    }

    const result = await equipCosmetic(playerId, itemId);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error
      });
      return;
    }

    res.json({
      success: true,
      message: 'Cosmetic equipped successfully'
    });

    logger.info(`Cosmetic equipped by player ${playerId}`, { itemId });
  } catch (error) {
    logger.error('Error equipping cosmetic:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/cosmetics/unequip
 * 
 * Unequip a cosmetic item
 * 
 * Request body:
 * - type: Cosmetic type (clothing/background)
 * 
 * Requirements: 16.5
 */
router.post('/unequip', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const playerId = req.player!.id;
    const { type } = req.body;

    if (!type || (type !== 'clothing' && type !== 'background')) {
      res.status(400).json({
        success: false,
        error: 'Valid type is required (clothing or background)'
      });
      return;
    }

    const result = await unequipCosmetic(playerId, type);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: result.error
      });
      return;
    }

    res.json({
      success: true,
      message: 'Cosmetic unequipped successfully'
    });

    logger.info(`Cosmetic unequipped by player ${playerId}`, { type });
  } catch (error) {
    logger.error('Error unequipping cosmetic:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
