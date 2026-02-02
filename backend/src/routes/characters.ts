/**
 * Character Routes
 * 
 * Handles character-related endpoints:
 * - GET /api/characters - Retrieve all available characters
 * - POST /api/player/select-character - Select character and city during registration
 */

import { Router, Request, Response } from 'express';
import { getCharacters, selectCharacter, ISelectCharacterRequest } from '../services/CharacterService';
import { authenticate } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/characters
 * 
 * Retrieves all available characters for selection
 * 
 * Characters represent different Uzbek cultural archetypes:
 * - Merchant (Торговец)
 * - Craftsman (Мастер)
 * - Student (Студент)
 * - Chef (Повар)
 * 
 * Each character has multilingual names and descriptions
 * supporting ru, uz, uk, en languages.
 * 
 * Response:
 *   - characters: Array of character objects
 *     - id: Unique character identifier
 *     - name: Localized character names
 *     - description: Localized character descriptions
 * 
 * Example response:
 * {
 *   "characters": [
 *     {
 *       "id": "char_merchant",
 *       "name": {
 *         "ru": "Торговец Азиз",
 *         "uz": "Savdogar Aziz",
 *         "uk": "Торговець Азіз",
 *         "en": "Merchant Aziz"
 *       },
 *       "description": { ... }
 *     }
 *   ]
 * }
 */
router.get('/characters', (_req: Request, res: Response): void => {
  try {
    const characters = getCharacters();
    
    res.status(200).json({
      characters,
      count: characters.length
    });
  } catch (error) {
    logger.error('Characters endpoint error:', error);
    res.status(500).json({
      error: 'Failed to retrieve characters',
      code: 'CHARACTERS_FETCH_FAILED',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/player/select-character
 * 
 * Selects character and city for authenticated user
 * 
 * This endpoint is called during initial registration flow:
 * 1. User authenticates via Google OAuth
 * 2. User selects character from available options
 * 3. User selects city (or inherits from referrer)
 * 4. Player profile is created with initial stats
 * 
 * Request body:
 *   - characterId: Selected character ID (required)
 *   - cityId: Selected city ID (required)
 *   - referralCode: Optional referral code from friend
 * 
 * Referral code behavior:
 *   - If valid, player joins referrer's city (overrides cityId)
 *   - Referrer receives bonus: 50 crystals + 500 soms
 *   - New player's referredBy field is set
 * 
 * Response:
 *   - player: Created player profile with all fields
 *   - message: Success message
 * 
 * Error responses:
 *   - 400: Invalid character/city or character already selected
 *   - 401: Not authenticated
 *   - 500: Server error
 * 
 * Example request:
 * POST /api/player/select-character
 * Authorization: Bearer <jwt_token>
 * {
 *   "characterId": "char_merchant",
 *   "cityId": "samarkand",
 *   "referralCode": "ABC12345"
 * }
 */
router.post(
  '/player/select-character',
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
      const { characterId, cityId, referralCode, displayName } = req.body as ISelectCharacterRequest;
      
      if (!characterId || !cityId) {
        res.status(400).json({
          error: 'Character ID and City ID are required',
          code: 'MISSING_REQUIRED_FIELDS'
        });
        return;
      }
      
      // Select character and create player profile
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
      
      // Handle specific error cases
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
      
      // Generic error response
      res.status(500).json({
        error: 'Failed to select character',
        code: 'CHARACTER_SELECTION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
