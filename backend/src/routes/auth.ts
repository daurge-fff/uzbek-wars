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
import jwt from 'jsonwebtoken';
import { authenticateWithGoogle, authenticateDevLogin, authenticateWithTelegramWebApp, detectTwinks, linkTelegramToUser, linkGoogleToUser } from '../services/AuthService';
import { validateInitData, mapTelegramLanguage } from '../services/TelegramWebAppService';
import { logger } from '../utils/logger';
import { createVerificationSession, verificationSessions } from '../bot/telegramBot';
import { User } from '../models/User';
import { authenticate } from '../middleware/auth';
import { validateUsernameCheck, rateLimit } from '../middleware/validation';
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
router.post(
  '/check-username',
  rateLimit(20, 60000), // 20 requests per minute
  validateUsernameCheck,
  async (req: Request, res: Response) => {
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

    if (normalizedUsername.length < 3 || normalizedUsername.length > 20) {
      return res.status(400).json({ 
        available: false, 
        error: 'Username must be 3-20 characters' 
      });
    }

    // Get User model to check displayNames
    const User = (await import('../models/User')).User;
    
    // Get current user ID from token if available (optional, for editing profile)
    let currentUserId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        currentUserId = decoded.userId;
      } catch (error) {
        // Token invalid or expired, ignore
      }
    }
    
    // Check if any OTHER user has this displayName (case-insensitive)
    const query: any = {
      displayName: { $regex: new RegExp(`^${normalizedUsername}$`, 'i') }
    };
    
    // Exclude current user if logged in
    if (currentUserId) {
      query._id = { $ne: currentUserId };
    }
    
    const existingUser = await User.findOne(query);

    logger.info(`Username check: "${username}" - ${existingUser ? 'TAKEN' : 'AVAILABLE'}${currentUserId ? ` (excluding user ${currentUserId})` : ''}`);

    return res.json({ 
      available: !existingUser,
      message: existingUser ? 'Username already taken' : 'Username available'
    });
  } catch (error) {
    logger.error('Check username error:', error);
    return res.status(500).json({ 
      available: false, 
      error: 'Failed to check username' 
    });
  }
});

/**
 * POST /api/auth/telegram-webapp
 *
 * Signs in a player who opened the game as a Telegram mini app.
 *
 * The client posts the raw `initData` string from the Telegram WebApp SDK; the server
 * verifies its signature with the bot token and only then trusts telegram id, username,
 * first/last name, photo and language code. Those values are stored on the user, so the
 * site can later show "signed in with Telegram" data as well.
 *
 * Response mirrors POST /api/auth/google: { token, user, player, isNewUser }
 */
router.post(
  '/telegram-webapp',
  rateLimit(30, 60000),
  [body('initData').isString().notEmpty().withMessage('initData is required')],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        });
        return;
      }

      const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
      if (!botToken) {
        logger.error('TELEGRAM_BOT_TOKEN is not configured - mini app login unavailable');
        res.status(503).json({
          error: 'Telegram mini app login is not configured on this server',
          code: 'TELEGRAM_NOT_CONFIGURED'
        });
        return;
      }

      const validation = validateInitData(req.body.initData, botToken);
      if (!validation.ok || !validation.user) {
        logger.warn(`Rejected Telegram init data: ${validation.error}`);
        res.status(401).json({
          error: 'Invalid Telegram init data',
          code: validation.error || 'INVALID_INIT_DATA'
        });
        return;
      }

      const telegramUser = validation.user;
      const deviceInfo = {
        userAgent: req.body?.deviceInfo?.userAgent || String(req.headers['user-agent'] || 'telegram-webapp'),
        platform: req.body?.deviceInfo?.platform || 'telegram',
        deviceId: req.body?.deviceInfo?.deviceId || `tg-${telegramUser.id}`
      };
      const forwardedFor = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
      const ipAddress = forwardedFor || req.ip || 'unknown';

      const result = await authenticateWithTelegramWebApp(
        telegramUser,
        ipAddress,
        deviceInfo,
        mapTelegramLanguage(telegramUser.language_code)
      );

      logger.info(`Telegram mini app login: id=${telegramUser.id} username=${telegramUser.username || '-'} new=${result.isNewUser}`);
      res.json(result);
    } catch (error) {
      logger.error('Telegram mini app auth error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }
);

// ─── Account Linking ────────────────────────────────────────────

/**
 * POST /api/auth/link/request-code
 * Generates a verification code for linking Telegram to the current Google account.
 * The user opens https://t.me/uzbekwars_bot/UzbekWars?startapp=link_<CODE>
 */
router.post(
  '/link/request-code',
  authenticate,
  rateLimit(5, 60000),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const code = createVerificationSession(userId);
      res.status(200).json({ code, expiresIn: 300 });
    } catch (error) {
      logger.error('Failed to generate linking code:', error);
      res.status(500).json({ error: 'Failed to generate code' });
    }
  }
);

/**
 * POST /api/auth/link/verify
 * Called from the Telegram mini app when opened with startapp=link_<CODE>.
 * Links the Telegram account to the user who generated the code.
 */
router.post(
  '/link/verify',
  rateLimit(10, 60000),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { code, initData } = req.body;
      if (!code || !initData) {
        res.status(400).json({ error: 'code and initData are required' });
        return;
      }

      // Verify the Telegram identity
      const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
      if (!botToken) {
        res.status(503).json({ error: 'Telegram not configured' });
        return;
      }

      const validation = validateInitData(initData, botToken);
      if (!validation.ok || !validation.user) {
        res.status(401).json({ error: 'Invalid Telegram init data', code: validation.error });
        return;
      }

      // Look up the verification session (created by /api/auth/link/request-code)
      const session = verificationSessions.get(code);
      if (!session) {
        res.status(400).json({ error: 'Invalid or expired code' });
        return;
      }

      const result = await linkTelegramToUser(
        session.userId,
        String(validation.user.id),
        validation.user
      );

      // Clean up the session
      verificationSessions.delete(code);

      logger.info(`Telegram linked to user ${session.userId} via code${result.bonusAwarded ? ' + bonus' : ''}`);
      res.status(200).json({ ok: true, bonusAwarded: result.bonusAwarded });
    } catch (error: any) {
      logger.error('Telegram link verify error:', error);
      res.status(400).json({ error: error.message || 'Linking failed' });
    }
  }
);

/**
 * POST /api/auth/link/google
 * Called from the Telegram mini app to link a Google account.
 * Accepts the same Google pseudo-ID-token as POST /api/auth/google,
 * but links to the existing Telegram user instead of creating a new one.
 */
router.post(
  '/link/google',
  rateLimit(5, 60000),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { idToken, initData } = req.body;
      if (!idToken || !initData) {
        res.status(400).json({ error: 'idToken and initData are required' });
        return;
      }

      // Verify Telegram identity
      const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
      if (!botToken) {
        res.status(503).json({ error: 'Telegram not configured' });
        return;
      }

      const tgValidation = validateInitData(initData, botToken);
      if (!tgValidation.ok || !tgValidation.user) {
        res.status(401).json({ error: 'Invalid Telegram init data' });
        return;
      }

      // Find the Telegram user
      const telegramId = String(tgValidation.user.id);
      const user = await User.findOne({ telegramId });
      if (!user) {
        res.status(404).json({ error: 'Telegram user not found. Please login first.' });
        return;
      }

      // Verify Google token
      const profile = await verifyGoogleToken(idToken);
      if (!profile) {
        res.status(401).json({ error: 'Invalid Google token' });
        return;
      }

      // Check if this Google account is already linked to someone else
      const existingGoogleUser = await User.findOne({ googleId: profile.id });
      if (existingGoogleUser && existingGoogleUser._id.toString() !== user._id.toString()) {
        res.status(409).json({ error: 'This Google account is already linked to another user' });
        return;
      }

      const result = await linkGoogleToUser(
        user._id.toString(),
        profile.id,
        profile.email,
        profile.displayName,
        profile.avatar
      );

      logger.info(`Google linked to user ${user._id}${result.bonusAwarded ? ' + bonus' : ''}`);
      res.status(200).json({ ok: true, bonusAwarded: result.bonusAwarded });
    } catch (error: any) {
      logger.error('Google link error:', error);
      res.status(400).json({ error: error.message || 'Linking failed' });
    }
  }
);

export default router;
