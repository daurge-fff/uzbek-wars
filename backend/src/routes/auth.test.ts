/**
 * Auth Routes Tests
 */

import request from 'supertest';
import { createServer } from '../server';
import jwt from 'jsonwebtoken';

describe('Auth Routes', () => {
  const app = createServer();

  describe('POST /api/auth/google', () => {
    it('should return 400 if idToken is missing', async () => {
      const response = await request(app)
        .post('/api/auth/google')
        .send({
          ipAddress: '127.0.0.1',
          deviceInfo: {
            userAgent: 'test',
            platform: 'test',
            deviceId: 'test'
          }
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 if ipAddress is missing', async () => {
      const response = await request(app)
        .post('/api/auth/google')
        .send({
          idToken: 'test-token',
          deviceInfo: {
            userAgent: 'test',
            platform: 'test',
            deviceId: 'test'
          }
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 if deviceInfo is missing', async () => {
      const response = await request(app)
        .post('/api/auth/google')
        .send({
          idToken: 'test-token',
          ipAddress: '127.0.0.1'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should accept optional referralCode', async () => {
      const response = await request(app)
        .post('/api/auth/google')
        .send({
          idToken: 'test-token',
          ipAddress: '127.0.0.1',
          deviceInfo: {
            userAgent: 'test',
            platform: 'test',
            deviceId: 'test'
          },
          referralCode: 'TEST123'
        });

      // Will fail on token verification, but should pass validation
      expect(response.status).not.toBe(400);
    });
  });

  describe('POST /api/auth/dev-login', () => {
    it('should return 400 if username is missing', async () => {
      const response = await request(app)
        .post('/api/auth/dev-login')
        .send({
          password: 'test'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/dev-login')
        .send({
          username: 'test'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 403 in production mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .post('/api/auth/dev-login')
        .send({
          username: 'dev',
          password: 'dev123'
        });

      process.env.NODE_ENV = originalEnv;

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('DEV_LOGIN_DISABLED');
    });
  });

  describe('POST /api/auth/verification-code', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/auth/verification-code')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should generate verification code with valid token', async () => {
      // Create mock user
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com'
      };

      const token = jwt.sign(mockUser, process.env.JWT_SECRET || 'test-secret');

      const response = await request(app)
        .post('/api/auth/verification-code')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('expiresIn');
      expect(response.body.expiresIn).toBe(300);
      expect(typeof response.body.code).toBe('string');
      expect(response.body.code.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/auth/verification-status', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/auth/verification-status')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return verification status with valid token', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com'
      };

      const token = jwt.sign(mockUser, process.env.JWT_SECRET || 'test-secret');

      const response = await request(app)
        .get('/api/auth/verification-status')
        .set('Authorization', `Bearer ${token}`);

      expect(response.body).toHaveProperty('isVerified');
      expect(typeof response.body.isVerified).toBe('boolean');
    });
  });
});
