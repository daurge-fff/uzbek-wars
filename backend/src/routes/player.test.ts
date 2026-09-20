/**
 * Player API Routes Tests
 * 
 * Tests player endpoints for language updates
 */

// Load environment variables FIRST
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

process.env.DB_NAME = 'uzbek_wars_test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

// Test database URI comes from the environment (loaded above from .env).
// Credentials must never be hard-coded in test files.
if (!process.env.MONGODB_URI) {
  throw new Error(
    'MONGODB_URI is not set. Provide it via .env (see .env.example) before running tests.',
  );
}

import request from 'supertest';
import express, { Application } from 'express';
import playerRoutes from './player';
import { User } from '../models/User';
import { Player } from '../models/Player';
import { connectDatabase, disconnectDatabase } from '../config/database';
import jwt from 'jsonwebtoken';

describe('Player Routes', () => {
  let app: Application;

  beforeAll(async () => {
    await connectDatabase();
    
    app = express();
    app.use(express.json());
    app.use('/api/player', playerRoutes);
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Player.deleteMany({});
  });

  /**
   * Helper to create test user and JWT token
   */
  async function createTestUser(language: 'ru' | 'uz' | 'uk' | 'en' = 'ru') {
    const user = await User.create({
      googleId: `google-test-${Date.now()}-${Math.random()}`,
      email: `test-${Date.now()}@example.com`,
      displayName: 'Test User',
      language,
      ipAddress: '127.0.0.1',
      deviceInfo: {
        userAgent: 'test-agent',
        platform: 'test-platform',
        deviceId: `test-device-${Date.now()}`,
      },
    });

    // Create player for the user (required by auth middleware)
    const player = await Player.create({
      userId: user._id,
      characterId: 'char1',
      cityId: 'tashkent',
      referralCode: `REF${Date.now()}`,
      level: 1,
      experience: 0,
      soms: 100,
      donationCurrency: 0,
      stats: {
        hunger: 100,
        health: 100,
        mood: 100,
        energy: 100,
      },
    });

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '7d' }
    );

    return { user, player, token };
  }

  describe('PATCH /api/player/language', () => {
    it('should update user language to Uzbek', async () => {
      const { user, token } = await createTestUser('ru');

      const response = await request(app)
        .patch('/api/player/language')
        .set('Authorization', `Bearer ${token}`)
        .send({ language: 'uz' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('language', 'uz');
      expect(response.body).toHaveProperty('message', 'Language updated successfully');

      // Verify database was updated
      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.language).toBe('uz');
    });

    it('should update user language to Ukrainian', async () => {
      const { user, token } = await createTestUser('ru');

      const response = await request(app)
        .patch('/api/player/language')
        .set('Authorization', `Bearer ${token}`)
        .send({ language: 'uk' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('language', 'uk');

      // Verify database was updated
      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.language).toBe('uk');
    });

    it('should update user language to English', async () => {
      const { user, token } = await createTestUser('ru');

      const response = await request(app)
        .patch('/api/player/language')
        .set('Authorization', `Bearer ${token}`)
        .send({ language: 'en' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('language', 'en');

      // Verify database was updated
      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.language).toBe('en');
    });

    it('should reject invalid language code', async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .patch('/api/player/language')
        .set('Authorization', `Bearer ${token}`)
        .send({ language: 'fr' }); // French not supported

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid language');
      expect(response.body).toHaveProperty('code', 'INVALID_LANGUAGE');
    });

    it('should reject empty language', async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .patch('/api/player/language')
        .set('Authorization', `Bearer ${token}`)
        .send({ language: '' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid language');
    });

    it('should reject missing language field', async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .patch('/api/player/language')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Invalid language');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .patch('/api/player/language')
        .send({ language: 'uz' });

      expect(response.status).toBe(401);
    });

    it('should return 404 if user not found', async () => {
      // Create token with non-existent user ID
      const fakeUserId = '507f1f77bcf86cd799439011';
      const token = jwt.sign(
        { userId: fakeUserId },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .patch('/api/player/language')
        .set('Authorization', `Bearer ${token}`)
        .send({ language: 'uz' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
      expect(response.body).toHaveProperty('code', 'USER_NOT_FOUND');
    });
  });
});
