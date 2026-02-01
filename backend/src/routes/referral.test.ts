/**
 * Referral API Routes Tests
 * 
 * Tests referral endpoints for retrieving referral codes and referred players
 */

// Load environment variables FIRST
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

process.env.DB_NAME = 'uzbek_wars_test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

if (!process.env.MONGODB_URI || process.env.MONGODB_URI === 'mongodb://localhost:27017') {
  process.env.MONGODB_URI = 'mongodb+srv://daurge:OJ4zQI5UXKItJMRD@github.hb9s83g.mongodb.net/?retryWrites=true&w=majority';
}

import request from 'supertest';
import express, { Application } from 'express';
import referralRoutes from './referral';
import { User } from '../models/User';
import { Player } from '../models/Player';
import { connectDatabase, disconnectDatabase } from '../config/database';
import jwt from 'jsonwebtoken';

describe('Referral API Routes', () => {
  let app: Application;
  
  beforeAll(async () => {
    await connectDatabase();
    
    app = express();
    app.use(express.json());
    app.use('/api/referral', referralRoutes);
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  beforeEach(async () => {
    await Player.deleteMany({});
    await User.deleteMany({});
  });

  /**
   * Helper to create test user and player
   */
  async function createTestPlayer(overrides: {
    googleId?: string;
    email?: string;
    referralCode: string;
    cityId?: string;
    level?: number;
    soms?: number;
    donationCurrency?: number;
    referredBy?: string;
  }) {
    const user = await User.create({
      googleId: overrides.googleId || `google-${Date.now()}-${Math.random()}`,
      email: overrides.email || `test-${Date.now()}@example.com`,
      displayName: 'Test User',
      ipAddress: '127.0.0.1',
      deviceInfo: {
        userAgent: 'Test Agent',
        platform: 'Test',
        deviceId: `device-${Date.now()}`
      }
    });

    const player = await Player.create({
      userId: user._id,
      characterId: 'char1',
      cityId: overrides.cityId || 'tashkent',
      referralCode: overrides.referralCode,
      referredBy: overrides.referredBy,
      level: overrides.level || 1,
      experience: 0,
      soms: overrides.soms || 100,
      donationCurrency: overrides.donationCurrency || 0,
      stats: {
        hunger: 100,
        health: 100,
        mood: 100,
        energy: 100
      }
    });

    return { user, player };
  }

  /**
   * Helper to generate JWT token
   */
  function generateToken(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
  }

  describe('GET /api/referral/code', () => {
    it('should return referral code and statistics', async () => {
      const { user } = await createTestPlayer({
        referralCode: 'TEST1234',
        level: 5,
        soms: 1000,
        donationCurrency: 100
      });

      // Create 2 referred players
      await createTestPlayer({
        referralCode: 'REF1',
        referredBy: 'TEST1234'
      });
      await createTestPlayer({
        referralCode: 'REF2',
        referredBy: 'TEST1234'
      });

      const token = generateToken(user._id.toString());

      const response = await request(app)
        .get('/api/referral/code')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        referralCode: 'TEST1234',
        referralCount: 2,
        totalBonusesEarned: {
          crystals: 100, // 2 * 50
          soms: 1000     // 2 * 500
        }
      });
      expect(response.body.data.referralUrl).toContain('TEST1234');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/referral/code');

      expect(response.status).toBe(401);
    });

    it('should return 404 if player not found', async () => {
      const user = await User.create({
        googleId: 'google-no-player',
        email: 'noplayer@example.com',
        displayName: 'No Player',
        ipAddress: '127.0.0.1',
        deviceInfo: {
          userAgent: 'Test',
          platform: 'Test',
          deviceId: 'device-test'
        }
      });

      const token = generateToken(user._id.toString());

      const response = await request(app)
        .get('/api/referral/code')
        .set('Authorization', `Bearer ${token}`);

      // Middleware returns 404 when player not found
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/referral/referred', () => {
    it('should return list of referred players', async () => {
      const { user } = await createTestPlayer({
        referralCode: 'MAIN1234',
        level: 10,
        soms: 5000
      });

      // Create referred players
      await createTestPlayer({
        referralCode: 'REF1',
        referredBy: 'MAIN1234',
        level: 2,
        cityId: 'samarkand'
      });
      await createTestPlayer({
        referralCode: 'REF2',
        referredBy: 'MAIN1234',
        level: 3,
        cityId: 'bukhara'
      });

      const token = generateToken(user._id.toString());

      const response = await request(app)
        .get('/api/referral/referred')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalCount).toBe(2);
      expect(response.body.data.referredPlayers).toHaveLength(2);
      
      // Check structure of referred players
      const firstPlayer = response.body.data.referredPlayers[0];
      expect(firstPlayer).toHaveProperty('level');
      expect(firstPlayer).toHaveProperty('cityId');
      expect(firstPlayer).toHaveProperty('joinedAt');
    });

    it('should return empty list when no referrals', async () => {
      const { user } = await createTestPlayer({
        referralCode: 'NOREFS12',
        level: 1
      });

      const token = generateToken(user._id.toString());

      const response = await request(app)
        .get('/api/referral/referred')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalCount).toBe(0);
      expect(response.body.data.referredPlayers).toEqual([]);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/referral/referred');

      expect(response.status).toBe(401);
    });

    it('should return 404 if player not found', async () => {
      const user = await User.create({
        googleId: 'google-no-player-2',
        email: 'noplayer2@example.com',
        displayName: 'No Player 2',
        ipAddress: '127.0.0.1',
        deviceInfo: {
          userAgent: 'Test',
          platform: 'Test',
          deviceId: 'device-test-2'
        }
      });

      const token = generateToken(user._id.toString());

      const response = await request(app)
        .get('/api/referral/referred')
        .set('Authorization', `Bearer ${token}`);

      // Middleware returns 404 when player not found
      expect(response.status).toBe(404);
    });
  });
});
