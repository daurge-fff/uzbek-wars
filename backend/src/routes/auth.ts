/**
 * Authentication Routes
 * 
 * Handles user authentication endpoints:
 * - Google OAuth login
 * - Developer login (dev mode only)
 * - Token refresh
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { OAuth2Client } from 'google-auth-library';
import { authenticateWithGoogle, authenticateDevLogin, detectTwinks } from '../services/AuthService';
import { logger } from '../utils/logger';
import { createVerificationSession } from '../bot/telegramBot';
import { User } from '../models/User';
import { authenticate } from '../middleware/auth';
import { env } from '../config/environment';

const router = Router();

// Initialize Google OAuth2 Client
const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

/**
 * POST /api/auth/google
 * 
 * Authenticates user via Google OAuth 2.0
 * 
 * Request body:
 *   - idToken: Google ID token from OAuth flow
 *   - ipAddress: Client IP address
 *   - deviceInfo: Device information (userAgent, platform, deviceId)
 *   - referralCode: Optional referral code
 * 
 * Response:
 *   - token: JWT token for subsequent requests
 *   - user: User profile data
 *   - player: Player game data
 *   - isNewUser: Whether this is first login
 */
router.post(
  '/google',
  [
    body('idToken').notEmpty().withMessage('ID token is required'),
    body('ipAddress').notEmpty().withMessage('IP address is required'),
    body('deviceInfo').isObject().withMessage('Device info is required'),
    body('deviceInfo.userAgent').notEmpty(),
    body('deviceInfo.platform').notEmpty(),
    body('deviceInfo.deviceId').notEmpty(),
    body('referralCode').optional().isString()
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        });
        return;
      }

      const { idToken, ipAddress, deviceInfo, referralCode } = req.body;

      // TODO: Verify Google ID token with Google API
      // For now, we'll extract profile from token payload
      // In production, use google-auth-library to verify token
      
      // Mock profile extraction (replace with actual Google verification)
      const profile = await verifyGoogleToken(idToken);

      // Authenticate user
      const result = await authenticateWithGoogle(
        profile,
        ipAddress,
        deviceInfo,
        referralCode
      );

      // Check for twin accounts (async, don't block response)
      if (result.isNewUser) {
        detectTwinks(result.user.id).catch(error => {
          logger.error('Twin detection failed:', error);
        });
      }

      res.status(200).json(result);
    } catch (error) {
      logger.error('Google auth endpoint error:', error);
      res.status(500).json({
        error: 'Authentication failed',
        code: 'AUTH_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/auth/dev-login
 * 
 * Developer login endpoint (development mode only)
 * 
 * Provides backdoor authentication for testing without Google OAuth.
 * Only works when NODE_ENV=development.
 * 
 * Request body:
 *   - username: Developer username from env
 *   - password: Developer password from env
 * 
 * Response:
 *   - token: JWT token
 *   - user: User profile
 *   - player: Player data with testing bonuses
 */
router.post(
  '/dev-login',
  [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        });
        return;
      }

      const { username, password } = req.body;

      // Authenticate developer
      const result = await authenticateDevLogin(username, password);

      res.status(200).json(result);
    } catch (error) {
      logger.error('Dev login endpoint error:', error);
      
      // Return 403 if not in development mode
      if (error instanceof Error && error.message.includes('development mode')) {
        res.status(403).json({
          error: 'Dev login not available',
          code: 'DEV_LOGIN_DISABLED'
        });
        return;
      }

      res.status(401).json({
        error: 'Authentication failed',
        code: 'AUTH_FAILED',
        message: error instanceof Error ? error.message : 'Invalid credentials'
      });
    }
  }
);

/**
 * POST /api/auth/verification-code
 * 
 * Generate verification code for Telegram bot
 * 
 * Response:
 *   - code: Verification code to use in Telegram bot
 *   - expiresIn: Seconds until code expires (300 = 5 minutes)
 */
router.post(
  '/verification-code',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      
      // Create verification session
      const code = createVerificationSession(userId);
      
      res.status(200).json({
        code,
        expiresIn: 300 // 5 minutes
      });
    } catch (error) {
      logger.error('Verification code generation error:', error);
      res.status(500).json({
        error: 'Failed to generate verification code',
        code: 'VERIFICATION_CODE_FAILED'
      });
    }
  }
);

/**
 * GET /api/auth/verification-status
 * 
 * Check if user is verified
 * 
 * Response:
 *   - isVerified: Boolean indicating verification status
 *   - telegramUsername: Telegram username if verified
 */
router.get(
  '/verification-status',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      
      const user = await User.findById(userId);
      
      if (!user) {
        res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }
      
      res.status(200).json({
        isVerified: user.isVerified || false,
        telegramUsername: user.telegramUsername || null
      });
    } catch (error) {
      logger.error('Verification status check error:', error);
      res.status(500).json({
        error: 'Failed to check verification status',
        code: 'VERIFICATION_STATUS_FAILED'
      });
    }
  }
);

/**
 * Verifies Google ID token using google-auth-library
 * 
 * Validates the token signature and extracts user profile information.
 * Ensures the token is issued by Google and intended for our application.
 */
async function verifyGoogleToken(idToken: string): Promise<{
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
}> {
  try {
    // In development, check if it's a base64 encoded token first
    if (env.NODE_ENV === 'development') {
      try {
        const decoded = JSON.parse(Buffer.from(idToken, 'base64').toString('utf-8'));
        if (decoded.sub && decoded.email) {
          logger.info(`Development mode: Using base64 token for user: ${decoded.email}`);
          return {
            id: decoded.sub,
            email: decoded.email,
            displayName: decoded.name || decoded.email,
            avatar: decoded.picture
          };
        }
      } catch (e) {
        // Not base64, continue to Google verification
        logger.debug('Not base64 format, trying Google verification');
      }
    }

    // Verify token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    
    if (!payload) {
      throw new Error('Invalid token payload');
    }

    if (!payload.sub || !payload.email) {
      throw new Error('Missing required fields in token');
    }

    logger.info(`Google token verified for user: ${payload.email}`);

    return {
      id: payload.sub,
      email: payload.email,
      displayName: payload.name || payload.email,
      avatar: payload.picture
    };
  } catch (error) {
    logger.error('Google token verification failed:', error);
    
    // Fallback for development: try to decode JWT without verification
    if (env.NODE_ENV === 'development') {
      logger.warn('Using fallback JWT decoding (development only)');
      try {
        const parts = idToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          logger.info(`Fallback: decoded token for ${payload.email || 'unknown'}`);
          return {
            id: payload.sub || 'dev-user-' + Date.now(),
            email: payload.email || 'dev@uzbekwars.local',
            displayName: payload.name || 'Dev User',
            avatar: payload.picture
          };
        }
      } catch (fallbackError) {
        logger.error('Fallback decoding also failed:', fallbackError);
      }
    }
    
    throw new Error('Invalid Google token');
  }
}

/**
 * POST /api/auth/check-username
 * Check if username is available
 */
router.post('/check-username', async (req: Request, res: Response) => {
  try {
    const { username } = req.body;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ 
        available: false, 
        error: 'Username is required' 
      });
    }

    // Normalize username
    const normalizedUsername = username.trim().toLowerCase();

    logger.info(`=== Username check request ===`);
    logger.info(`Original: "${username}"`);
    logger.info(`Normalized: "${normalizedUsername}"`);

    if (normalizedUsername.length < 3 || normalizedUsername.length > 20) {
      return res.status(400).json({ 
        available: false, 
        error: 'Username must be 3-20 characters' 
      });
    }

    // Check if username exists in Player collection (case-insensitive)
    // We only check players that have completed onboarding (have real displayName set)
    const Player = (await import('../models/Player')).Player;
    
    // First, let's see all players
    const allPlayers = await Player.find({}).select('displayName characterId cityId');
    logger.info(`Total players in DB: ${allPlayers.length}`);
    allPlayers.forEach(p => {
      logger.info(`  - Player: displayName="${p.displayName}", characterId="${p.characterId}", cityId="${p.cityId}"`);
    });
    
    // Find players with valid displayName (not null, not empty, not "undefined" string)
    const playersWithNames = await Player.find({
      displayName: { $exists: true }
    });
    
    // Filter in JavaScript to handle "undefined" string and check name match
    const existingPlayer = playersWithNames.find(p => {
      const pName = p.displayName;
      // Skip if displayName is null, undefined, empty, or string "undefined"
      if (!pName || pName === '' || pName === 'undefined') {
        return false;
      }
      // Check if names match (case-insensitive)
      return pName.toLowerCase() === normalizedUsername;
    });

    logger.info(`Search result: ${existingPlayer ? 'FOUND' : 'NOT FOUND'}`);
    if (existingPlayer) {
      logger.info(`Existing player: displayName="${existingPlayer.displayName}", ID=${existingPlayer._id}`);
    }
    logger.info(`=== End username check ===`);

    res.json({ 
      available: !existingPlayer,
      message: existingPlayer ? 'Username already taken' : 'Username available'
    });
  } catch (error) {
    logger.error('Check username error:', error);
    res.status(500).json({ 
      available: false, 
      error: 'Failed to check username' 
    });
  }
});

export default router;
