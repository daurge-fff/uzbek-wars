/**
 * Authentication Middleware
 * 
 * Validates JWT tokens and attaches user data to requests.
 * Protects routes that require authentication.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/AuthService';
import { User } from '../models/User';
import { Player } from '../models/Player';
import { logger } from '../utils/logger';

/**
 * Extended Express Request with authenticated user data
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    displayName: string;
    language: string;
  };
  player?: {
    id: string;
    level: number;
    soms: number;
    characterId: string;
    cityId: string;
  };
}

/**
 * Authentication middleware
 * 
 * Extracts JWT from Authorization header, validates it,
 * and attaches user/player data to request object.
 * 
 * Returns 401 if token is missing or invalid.
 * Returns 404 if user/player not found in database.
 * 
 * Usage:
 *   router.get('/protected', authenticate, handler);
 */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'NO_TOKEN'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
      return;
    }

    // Load user from database
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    // Load player from database
    const player = await Player.findOne({ userId: user._id });
    
    if (!player) {
      res.status(404).json({
        error: 'Player not found',
        code: 'PLAYER_NOT_FOUND'
      });
      return;
    }

    // Attach user and player to request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      language: user.language
    };

    req.player = {
      id: player._id.toString(),
      level: player.level,
      soms: player.soms,
      characterId: player.characterId,
      cityId: player.cityId
    };

    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'AUTH_ERROR'
    });
  }
}

/**
 * Optional authentication middleware
 * 
 * Similar to authenticate() but doesn't fail if no token provided.
 * Useful for endpoints that work both authenticated and unauthenticated.
 * 
 * Usage:
 *   router.get('/public', optionalAuth, handler);
 */
export async function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without auth
      next();
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId);
      
      if (user) {
        const player = await Player.findOne({ userId: user._id });
        
        req.user = {
          id: user._id.toString(),
          email: user.email,
          displayName: user.displayName,
          language: user.language
        };

        if (player) {
          req.player = {
            id: player._id.toString(),
            level: player.level,
            soms: player.soms,
            characterId: player.characterId,
            cityId: player.cityId
          };
        }
      }
    } catch (error) {
      // Invalid token, but continue without auth
      logger.debug('Optional auth: invalid token provided');
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next();
  }
}
