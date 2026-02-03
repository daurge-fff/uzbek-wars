/**
 * Character Routes
 * 
 * Handles character-related endpoints:
 * - GET /api/characters - Retrieve all available characters
 * - GET /api/characters/by-tier - Retrieve characters grouped by tier
 * - POST /api/player/select-character - Select character and city during registration
 */

import { Router, Request, Response } from 'express';
import { getCharacters, getAllClassesByTier } from '../services/CharacterService';
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
router.get('/', (_req: Request, res: Response): void => {
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
 * GET /api/characters/by-tier
 * 
 * Retrieves all characters grouped by tier
 * 
 * Response:
 *   - tier1: Starter classes (Level 1+)
 *   - tier2: Advanced classes (Level 20+)
 *   - tier3: Master classes (Level 50+)
 */
router.get('/by-tier', (_req: Request, res: Response): void => {
  try {
    const classesByTier = getAllClassesByTier();
    
    res.status(200).json(classesByTier);
  } catch (error) {
    logger.error('Characters by tier endpoint error:', error);
    res.status(500).json({
      error: 'Failed to retrieve characters by tier',
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
export default router;
