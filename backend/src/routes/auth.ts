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
import { authenticateWithGoogle, authenticateDevLogin, detectTwinks } from '../services/AuthService';
import { logger } from '../utils/logger';

const router = Router();

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
 * Verifies Google ID token
 * 
 * TODO: Implement actual Google token verification using google-auth-library
 * For now, this is a mock implementation for development.
 * 
 * In production, use:
 *   const { OAuth2Client } = require('google-auth-library');
 *   const client = new OAuth2Client(GOOGLE_CLIENT_ID);
 *   const ticket = await client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
 *   const payload = ticket.getPayload();
 */
async function verifyGoogleToken(idToken: string): Promise<{
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
}> {
  // Mock implementation for development
  // Replace with actual Google verification in production
  
  try {
    // Decode JWT without verification (UNSAFE - only for development)
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    return {
      id: payload.sub || payload.user_id || 'mock-google-id',
      email: payload.email || 'user@example.com',
      displayName: payload.name || 'Test User',
      avatar: payload.picture
    };
  } catch (error) {
    logger.error('Token verification error:', error);
    throw new Error('Invalid Google token');
  }
}

export default router;
