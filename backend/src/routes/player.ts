/**
 * Player routes
 * 
 * Handles player-related endpoints:
 * - PATCH /api/player/language - Update player's language preference
 */

import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { User, Language } from '../models/User';
import { logger } from '../utils/logger';

const router = Router();

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

export default router;
