/**
 * Health Check Routes Tests
 */

import request from 'supertest';
import { createServer } from '../server';
import mongoose from 'mongoose';

describe('Health Check Routes', () => {
  const app = createServer();

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
      // Mock mongoose connection
      jest.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1);

      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.services.database.status).toBe('healthy');
    });

    it('should return degraded status when database is down', async () => {
      // Mock mongoose connection as disconnected
      jest.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(0);

      const response = await request(app)
        .get('/api/health')
        .expect(503);

      expect(response.body.status).toBe('degraded');
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
      jest.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1);

      const response = await request(app)
        .get('/api/health/ready')
        .expect(200);

      expect(response.body.ready).toBe(true);
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return not ready when database is disconnected', async () => {
      jest.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(0);

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
      jest.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(0);

      const response = await request(app)
        .get('/api/health/live')
        .expect(200);

      expect(response.body.alive).toBe(true);
    });
  });
});
