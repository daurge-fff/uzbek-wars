/**
 * Authentication Middleware Tests
 * 
 * Tests JWT validation and request authentication.
 */

// Load environment variables FIRST
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Set test environment variables BEFORE importing any modules
// Test database URI comes from the environment (loaded above from .env).
// Credentials must never be hard-coded in test files.
if (!process.env.MONGODB_URI) {
  throw new Error(
    'MONGODB_URI is not set. Provide it via .env (see .env.example) before running tests.',
  );
}
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-unit-tests-only';
process.env.JWT_EXPIRES_IN = '7d';
process.env.DB_NAME = 'uzbek_wars_test';

// NOW import modules
import { Response, NextFunction } from 'express';
import { authenticate, optionalAuth, AuthRequest } from './auth';
import { User } from '../models/User';
import { Player } from '../models/Player';
import { authenticateWithGoogle } from '../services/AuthService';
import { connectDatabase, disconnectDatabase } from '../config/database';

describe('Authentication Middleware', () => {
  let validToken: string;

  beforeAll(async () => {
    await connectDatabase();
    
    // Clean up any existing test data
    await User.deleteMany({});
    await Player.deleteMany({});

    // Create test user and get valid token
    const profile = {
      id: 'google-test-middleware',
      email: 'test-middleware@example.com',
      displayName: 'Test User'
    };

    const deviceInfo = {
      userAgent: 'Mozilla/5.0',
      platform: 'MacIntel',
      deviceId: 'test-device-middleware'
    };

    const result = await authenticateWithGoogle(
      profile,
      '192.168.1.1',
      deviceInfo
    );

    validToken = result.token;
  }, 30000);

  afterAll(async () => {
    // Only clean up middleware test users
    await User.deleteMany({ email: 'test-middleware@example.com' });
    await Player.deleteMany({ userId: { $exists: true } }); // Clean up players for middleware test user
    await disconnectDatabase();
  });

  beforeEach(async () => {
    // Ensure test user exists before each test
    const existingUser = await User.findOne({ email: 'test-middleware@example.com' });
    if (!existingUser) {
      // Recreate user if it was deleted by another test suite
      const profile = {
        id: 'google-test-middleware',
        email: 'test-middleware@example.com',
        displayName: 'Test User'
      };

      const deviceInfo = {
        userAgent: 'Mozilla/5.0',
        platform: 'MacIntel',
        deviceId: 'test-device-middleware'
      };

      const result = await authenticateWithGoogle(
        profile,
        '192.168.1.1',
        deviceInfo
      );

      validToken = result.token;
    }
  });

  describe('authenticate', () => {
    it('should authenticate request with valid token', async () => {
      const req = {
        headers: {
          authorization: `Bearer ${validToken}`
        }
      } as AuthRequest;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as Response;

      const next = jest.fn() as NextFunction;

      await authenticate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.email).toBe('test-middleware@example.com');
      expect(req.player).toBeDefined();
      expect(req.player?.level).toBe(1);
    });

    it('should reject request without token', async () => {
      const req = {
        headers: {}
      } as AuthRequest;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as Response;

      const next = jest.fn() as NextFunction;

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        code: 'NO_TOKEN'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with invalid token', async () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      } as AuthRequest;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as Response;

      const next = jest.fn() as NextFunction;

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject request with malformed authorization header', async () => {
      const req = {
        headers: {
          authorization: 'InvalidFormat token'
        }
      } as AuthRequest;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as Response;

      const next = jest.fn() as NextFunction;

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        code: 'NO_TOKEN'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should authenticate request with valid token', async () => {
      const req = {
        headers: {
          authorization: `Bearer ${validToken}`
        }
      } as AuthRequest;

      const res = {} as Response;
      const next = jest.fn() as NextFunction;

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.email).toBe('test-middleware@example.com');
    });

    it('should continue without auth when no token provided', async () => {
      const req = {
        headers: {}
      } as AuthRequest;

      const res = {} as Response;
      const next = jest.fn() as NextFunction;

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
      expect(req.player).toBeUndefined();
    });

    it('should continue without auth when invalid token provided', async () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      } as AuthRequest;

      const res = {} as Response;
      const next = jest.fn() as NextFunction;

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeUndefined();
    });
  });
});
