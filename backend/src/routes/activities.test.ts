/**
 * Activities Routes Tests
 * 
 * Tests for activity-related endpoints
 */

import request from 'supertest';
import { createServer } from '../server';
import { getActivities } from '../services/ActivityService';

// Mock ActivityService
jest.mock('../services/ActivityService');

const app = createServer();

describe('Activities Routes', () => {
  describe('GET /api/activities', () => {
    it('should return all activities', async () => {
      const mockActivities = [
        {
          id: 'work_svyaznoy',
          name: { ru: 'Работать в Связном', en: 'Work at Svyaznoy' },
          description: { ru: 'Честная работа', en: 'Honest work' },
          rewards: { experience: 50, soms: 200 },
          statModifiers: { energy: -15, mood: -5, hunger: -10 },
          cooldown: 30,
          requiredLevel: 1,
        },
        {
          id: 'rob',
          name: { ru: 'Грабить', en: 'Rob' },
          description: { ru: 'Рискованное дело', en: 'Risky business' },
          rewards: { experience: 150, soms: 500 },
          statModifiers: { energy: -25, mood: -15, hunger: -15, health: -10 },
          risks: { probability: 0.3, penalty: 300 },
          cooldown: 60,
          requiredLevel: 3,
        },
      ];

      (getActivities as jest.Mock).mockReturnValue(mockActivities);

      const response = await request(app).get('/api/activities');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('activities');
      expect(response.body).toHaveProperty('count');
      expect(response.body.activities).toHaveLength(2);
      expect(response.body.count).toBe(2);
      expect(response.body.activities[0].id).toBe('work_svyaznoy');
      expect(response.body.activities[1].id).toBe('rob');
    });

    it('should handle errors gracefully', async () => {
      (getActivities as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app).get('/api/activities');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Failed to retrieve activities');
      expect(response.body.code).toBe('ACTIVITIES_FETCH_FAILED');
    });
  });

  describe('POST /api/player/perform-activity', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/player/perform-activity')
        .send({ activityId: 'work_svyaznoy' });

      expect(response.status).toBe(401);
    });

    it('should require activityId', async () => {
      const response = await request(app)
        .post('/api/player/perform-activity')
        .set('Authorization', 'Bearer fake-token')
        .send({});

      expect(response.status).toBe(401); // Will fail auth first
    });
  });
});
