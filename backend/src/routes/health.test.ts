/**
 * Health Check Routes Tests
 */

import request from 'supertest';
import { createServer } from '../server';
import mongoose from 'mongoose';

/**
 * The route only checks whether a bot instance exists. Tests fake a running instance so
 * the overall verdict is not permanently "degraded" merely because the bot isn't started.
 */
jest.mock('../bot/telegramBot', () => ({ bot: { isRunning: () => true } }));

/**
 * mongoose exposes `readyState` as a non-configurable getter, so `jest.spyOn` can not
 * wrap it. Defining an own property shadows the prototype getter; `afterEach` removes it.
 */
const setReadyState = (value: number): void => {
  Object.defineProperty(mongoose.connection, 'readyState', {
    value,
    configurable: true,
    writable: true
  });
};

/**
 * The route pings the real database handle when it looks connected. Tests must not
 * touch Atlas, so they install a fake handle that answers the ping instantly.
 */
const setFakeDb = (): void => {
  Object.defineProperty(mongoose.connection, 'db', {
    value: { admin: () => ({ command: jest.fn().mockResolvedValue({ ok: 1 }) }) },
    configurable: true,
    writable: true
  });
};

/** Removes the own properties installed above so the prototype getters work again */
const clearConnectionOverrides = (): void => {
  delete (mongoose.connection as any).readyState;
  delete (mongoose.connection as any).db;
};

describe('Health Check Routes', () => {
  const app = createServer();

  afterEach(() => {
    clearConnectionOverrides();
    jest.restoreAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toHaveProperty('api');
      expect(response.body.services).toHaveProperty('database');
      expect(response.body.services).toHaveProperty('bot');
    });

    it('should return healthy status when all services are up', async () => {
      setReadyState(1);
      setFakeDb();

      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.services.database.status).toBe('healthy');
    });

    it('should report a down service when the database is unavailable', async () => {
      // Database down is a critical failure: overall status is `down`, HTTP 503
      setReadyState(0);

      const response = await request(app)
        .get('/api/health')
        .expect(503);

      expect(response.body.status).toBe('down');
      expect(response.body.services.database.status).toBe('down');
    });

    it('should include API uptime and memory usage', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/);

      expect(response.body.services.api).toHaveProperty('uptime');
      expect(response.body.services.api).toHaveProperty('memory');
      expect(typeof response.body.services.api.uptime).toBe('number');
      expect(response.body.services.api.uptime).toBeGreaterThan(0);
    });
  });

  describe('GET /api/health/ready', () => {
    it('should return ready when database is connected', async () => {
      setReadyState(1);
      const response = await request(app)
        .get('/api/health/ready')
        .expect(200);

      expect(response.body.ready).toBe(true);
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return not ready when database is disconnected', async () => {
      setReadyState(0);

      const response = await request(app)
        .get('/api/health/ready')
        .expect(503);

      expect(response.body.ready).toBe(false);
      expect(response.body).toHaveProperty('reason');
    });
  });

  describe('GET /api/health/live', () => {
    it('should always return alive', async () => {
      const response = await request(app)
        .get('/api/health/live')
        .expect(200);

      expect(response.body.alive).toBe(true);
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return alive even when database is down', async () => {
      setReadyState(0);

      const response = await request(app)
        .get('/api/health/live')
        .expect(200);

      expect(response.body.alive).toBe(true);
    });
  });
});
