/**
 * Authentication Service Tests
 * 
 * Tests authentication logic including Google OAuth and dev login.
 * Uses in-memory MongoDB for isolated testing.
 */

// Load environment variables FIRST
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Mock environment variables BEFORE importing modules
process.env.DB_NAME = 'uzbek_wars_test';
process.env.JWT_SECRET = 'test-secret-key-for-unit-tests-only';
process.env.JWT_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';
process.env.DEV_USERNAME = 'testdev';
process.env.DEV_PASSWORD = 'testpass';

// Explicitly set MONGODB_URI if not loaded
// Test database URI comes from the environment (loaded above from .env).
// Credentials must never be hard-coded in test files.
if (!process.env.MONGODB_URI) {
  throw new Error(
    'MONGODB_URI is not set. Provide it via .env (see .env.example) before running tests.',
  );
}

// NOW import modules
import { authenticateWithGoogle, authenticateDevLogin, verifyToken, detectTwinks } from './AuthService';
import { User } from '../models/User';
import { Player } from '../models/Player';

// Import database connection for real tests
import { connectDatabase, disconnectDatabase } from '../config/database';

// Mock logger to avoid console spam
jest.mock('../utils/logger');

describe('AuthService', () => {
  beforeAll(async () => {
    await connectDatabase();
  }, 30000); // Increase timeout for database connection

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({ email: { $regex: /@example\.com$/ } });
    await Player.deleteMany({});
    await disconnectDatabase();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    // Очистка БД перед каждым тестом
    await User.deleteMany({});
    await Player.deleteMany({});
  });

  describe('authenticateWithGoogle', () => {
    it('should create new user and player on first login', async () => {
      const profile = {
        id: 'google-123',
        email: 'test@example.com',
        displayName: 'Test User',
        avatar: 'https://example.com/avatar.jpg'
      };

      const deviceInfo = {
        userAgent: 'Mozilla/5.0',
        platform: 'MacIntel',
        deviceId: 'device-123'
      };

      const result = await authenticateWithGoogle(
        profile,
        '192.168.1.1',
        deviceInfo
      );

      expect(result.isNewUser).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.player).toBeDefined();
      expect(result.player.level).toBe(1);
      expect(result.player.soms).toBe(100);

      // Verify user was created in database
      const user = await User.findOne({ googleId: 'google-123' });
      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');

      // Verify player was created
      const player = await Player.findOne({ userId: user?._id });
      expect(player).toBeDefined();
      expect(player?.referralCode).toBeDefined();
      expect(player?.referralCode.length).toBe(8);
    });

    it('should load existing user on subsequent login', async () => {
      // Create existing user
      const existingUser = await User.create({
        googleId: 'google-456',
        email: 'existing@example.com',
        displayName: 'Existing User',
        ipAddress: '192.168.1.1',
        deviceInfo: {
          userAgent: 'Mozilla/5.0',
          platform: 'MacIntel',
          deviceId: 'device-456'
        }
      });

      await Player.create({
        userId: existingUser._id,
        characterId: 'char1',
        cityId: 'tashkent',
        referralCode: 'ABCD1234',
        level: 5,
        soms: 1000
      });

      const profile = {
        id: 'google-456',
        email: 'existing@example.com',
        displayName: 'Existing User'
      };

      const deviceInfo = {
        userAgent: 'Mozilla/5.0',
        platform: 'MacIntel',
        deviceId: 'device-456'
      };

      const result = await authenticateWithGoogle(
        profile,
        '192.168.1.2', // Different IP
        deviceInfo
      );

      expect(result.isNewUser).toBe(false);
      expect(result.user.email).toBe('existing@example.com');
      expect(result.player.level).toBe(5);
      expect(result.player.soms).toBe(1000);

      // Verify IP was updated
      const user = await User.findById(existingUser._id);
      expect(user?.ipAddress).toBe('192.168.1.2');
    });

    it('should handle referral code on registration', async () => {
      // Create referrer
      const referrer = await User.create({
        googleId: 'referrer-123',
        email: 'referrer@example.com',
        displayName: 'Referrer',
        ipAddress: '192.168.1.1',
        deviceInfo: {
          userAgent: 'Mozilla/5.0',
          platform: 'MacIntel',
          deviceId: 'device-ref'
        }
      });

      const referrerPlayer = await Player.create({
        userId: referrer._id,
        characterId: 'char1',
        cityId: 'tashkent',
        referralCode: 'REFER123',
        soms: 1000,
        donationCurrency: 100
      });

      // New user with referral code
      const profile = {
        id: 'google-789',
        email: 'newuser@example.com',
        displayName: 'New User'
      };

      const deviceInfo = {
        userAgent: 'Mozilla/5.0',
        platform: 'iPhone',
        deviceId: 'device-789'
      };

      const result = await authenticateWithGoogle(
        profile,
        '192.168.1.3',
        deviceInfo,
        'REFER123' // Referral code
      );

      expect(result.isNewUser).toBe(true);

      // Verify new player has referredBy set
      const newPlayer = await Player.findOne({ userId: result.user.id });
      expect(newPlayer?.referredBy).toBe('REFER123');

      // Verify referrer received bonus (async, may need delay)
      await new Promise(resolve => setTimeout(resolve, 100));
      const updatedReferrer = await Player.findById(referrerPlayer._id);
      expect(updatedReferrer?.soms).toBe(1500); // +500 bonus
      expect(updatedReferrer?.donationCurrency).toBe(150); // +50 bonus
    });
  });

  describe('authenticateDevLogin', () => {
    beforeEach(() => {
      // Set NODE_ENV to development for these tests
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      // Reset to test mode
      process.env.NODE_ENV = 'test';
    });

    it('should authenticate developer with correct credentials', async () => {
      const result = await authenticateDevLogin('testdev', 'testpass');

      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('dev@uzbekwars.local');
      expect(result.player.level).toBe(10);
      expect(result.player.soms).toBe(10000);
      expect(result.player.donationCurrency).toBe(1000);
    });

    it('should reject invalid credentials', async () => {
      await expect(
        authenticateDevLogin('wrong', 'credentials')
      ).rejects.toThrow('Invalid dev credentials');
    });

    it('should reject dev login in production mode', async () => {
      process.env.NODE_ENV = 'production';

      await expect(
        authenticateDevLogin('testdev', 'testpass')
      ).rejects.toThrow('development mode');

      process.env.NODE_ENV = 'development';
    });

    it('should reuse existing dev user on subsequent logins', async () => {
      // First login
      const result1 = await authenticateDevLogin('testdev', 'testpass');
      const userId1 = result1.user.id;

      // Second login
      const result2 = await authenticateDevLogin('testdev', 'testpass');
      const userId2 = result2.user.id;

      expect(userId1.toString()).toBe(userId2.toString());
    });
  });

  describe('verifyToken', () => {
    it('should verify valid JWT token', async () => {
      const user = await User.create({
        googleId: 'google-verify',
        email: 'verify@example.com',
        displayName: 'Verify User',
        ipAddress: '192.168.1.1',
        deviceInfo: {
          userAgent: 'Mozilla/5.0',
          platform: 'MacIntel',
          deviceId: 'device-verify'
        }
      });

      const profile = {
        id: 'google-verify',
        email: 'verify@example.com',
        displayName: 'Verify User'
      };

      const deviceInfo = {
        userAgent: 'Mozilla/5.0',
        platform: 'MacIntel',
        deviceId: 'device-verify'
      };

      const result = await authenticateWithGoogle(
        profile,
        '192.168.1.1',
        deviceInfo
      );

      const decoded = verifyToken(result.token);
      expect(decoded.userId).toBe(user._id.toString());
    });

    it('should reject invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow('Invalid or expired token');
    });

    it('should reject expired token', () => {
      // Create token with immediate expiration
      const jwt = require('jsonwebtoken');
      const expiredToken = jwt.sign(
        { userId: 'test-user' },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );

      // Wait a moment for token to expire
      setTimeout(() => {
        expect(() => verifyToken(expiredToken)).toThrow('Invalid or expired token');
      }, 100);
    });
  });

  describe('detectTwinks', () => {
    it('should detect users with same IP address', async () => {
      // Create first user
      await User.create({
        googleId: 'user1',
        email: 'user1@example.com',
        displayName: 'User 1',
        ipAddress: '192.168.1.100',
        deviceInfo: {
          userAgent: 'Mozilla/5.0',
          platform: 'MacIntel',
          deviceId: 'device-1'
        }
      });

      // Create second user with same IP
      const user2 = await User.create({
        googleId: 'user2',
        email: 'user2@example.com',
        displayName: 'User 2',
        ipAddress: '192.168.1.100', // Same IP
        deviceInfo: {
          userAgent: 'Mozilla/5.0',
          platform: 'MacIntel',
          deviceId: 'device-2'
        }
      });

      const isTwink = await detectTwinks(user2._id.toString());
      expect(isTwink).toBe(true);
    });

    it('should detect users with same device ID', async () => {
      // Create first user
      await User.create({
        googleId: 'user3',
        email: 'user3@example.com',
        displayName: 'User 3',
        ipAddress: '192.168.1.101',
        deviceInfo: {
          userAgent: 'Mozilla/5.0',
          platform: 'MacIntel',
          deviceId: 'shared-device'
        }
      });

      // Create second user with same device
      const user2 = await User.create({
        googleId: 'user4',
        email: 'user4@example.com',
        displayName: 'User 4',
        ipAddress: '192.168.1.102',
        deviceInfo: {
          userAgent: 'Mozilla/5.0',
          platform: 'MacIntel',
          deviceId: 'shared-device' // Same device
        }
      });

      const isTwink = await detectTwinks(user2._id.toString());
      expect(isTwink).toBe(true);
    });

    it('should not flag unique users', async () => {
      const user = await User.create({
        googleId: 'unique-user',
        email: 'unique@example.com',
        displayName: 'Unique User',
        ipAddress: '192.168.1.200',
        deviceInfo: {
          userAgent: 'Mozilla/5.0',
          platform: 'MacIntel',
          deviceId: 'unique-device'
        }
      });

      const isTwink = await detectTwinks(user._id.toString());
      expect(isTwink).toBe(false);
    });
  });
});
