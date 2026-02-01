/**
 * Cities Routes Integration Tests
 * 
 * Tests the cities API endpoints
 */

import request from 'supertest';
import express, { Application } from 'express';
import citiesRoutes from './cities';
import * as CityService from '../services/CityService';

// Mock the CityService
jest.mock('../services/CityService');
jest.mock('../utils/logger');

describe('Cities Routes', () => {
  let app: Application;

  beforeEach(() => {
    // Create a minimal Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/cities', citiesRoutes);
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/cities', () => {
    it('should return all cities with availability', async () => {
      const mockCities = [
        {
          cityId: 'samarkand',
          name: { ru: 'Самарканд', uz: 'Samarqand', uk: 'Самарканд', en: 'Samarkand' },
          playerCount: 450,
          maxPlayers: 1000,
          isOpen: true,
          fillPercentage: 45,
          theme: {
            primaryColor: '#4A90E2',
            backgroundImage: '/assets/cities/samarkand.jpg',
            description: 'Ancient city on the Silk Road'
          }
        },
        {
          cityId: 'tashkent',
          name: { ru: 'Ташкент', uz: 'Toshkent', uk: 'Ташкент', en: 'Tashkent' },
          playerCount: 800,
          maxPlayers: 1000,
          isOpen: true,
          fillPercentage: 80,
          theme: {
            primaryColor: '#50C878',
            backgroundImage: '/assets/cities/tashkent.jpg',
            description: 'Capital of Uzbekistan'
          }
        }
      ];

      (CityService.getCityAvailability as jest.Mock).mockResolvedValue(mockCities);

      const response = await request(app)
        .get('/api/cities')
        .expect(200);

      expect(response.body).toHaveProperty('cities');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.cities).toHaveLength(2);
      expect(response.body.cities[0].cityId).toBe('samarkand');
      expect(response.body.cities[0].fillPercentage).toBe(45);
      expect(response.body.cities[1].cityId).toBe('tashkent');
      expect(response.body.cities[1].fillPercentage).toBe(80);
    });

    it('should return empty array when no cities exist', async () => {
      (CityService.getCityAvailability as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/cities')
        .expect(200);

      expect(response.body.cities).toEqual([]);
    });

    it('should handle service errors', async () => {
      (CityService.getCityAvailability as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/cities')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('CITIES_FETCH_FAILED');
    });

    it('should include all required city fields', async () => {
      const mockCity = {
        cityId: 'bukhara',
        name: { ru: 'Бухара', uz: 'Buxoro', uk: 'Бухара', en: 'Bukhara' },
        playerCount: 200,
        maxPlayers: 1000,
        isOpen: true,
        fillPercentage: 20,
        theme: {
          primaryColor: '#DAA520',
          backgroundImage: '/assets/cities/bukhara.jpg',
          description: 'Sacred city of Central Asia'
        }
      };

      (CityService.getCityAvailability as jest.Mock).mockResolvedValue([mockCity]);

      const response = await request(app)
        .get('/api/cities')
        .expect(200);

      const city = response.body.cities[0];
      expect(city).toHaveProperty('cityId');
      expect(city).toHaveProperty('name');
      expect(city.name).toHaveProperty('ru');
      expect(city.name).toHaveProperty('uz');
      expect(city.name).toHaveProperty('uk');
      expect(city.name).toHaveProperty('en');
      expect(city).toHaveProperty('playerCount');
      expect(city).toHaveProperty('maxPlayers');
      expect(city).toHaveProperty('isOpen');
      expect(city).toHaveProperty('fillPercentage');
      expect(city).toHaveProperty('theme');
    });
  });

  describe('GET /api/cities/:cityId', () => {
    it('should return specific city details', async () => {
      const mockCity = {
        cityId: 'samarkand',
        name: { ru: 'Самарканд', uz: 'Samarqand', uk: 'Самарканд', en: 'Samarkand' },
        playerCount: 450,
        maxPlayers: 1000,
        isOpen: true,
        theme: {
          primaryColor: '#4A90E2',
          backgroundImage: '/assets/cities/samarkand.jpg',
          description: 'Ancient city on the Silk Road'
        }
      };

      (CityService.getCityById as jest.Mock).mockResolvedValue(mockCity);

      const response = await request(app)
        .get('/api/cities/samarkand')
        .expect(200);

      expect(response.body).toHaveProperty('city');
      expect(response.body.city.cityId).toBe('samarkand');
      expect(response.body.city.playerCount).toBe(450);
    });

    it('should return 404 when city not found', async () => {
      (CityService.getCityById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/cities/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('City not found');
      expect(response.body.code).toBe('CITY_NOT_FOUND');
      expect(response.body.cityId).toBe('nonexistent');
    });

    it('should handle service errors', async () => {
      (CityService.getCityById as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .get('/api/cities/samarkand')
        .expect(500);

      expect(response.body.error).toBe('Failed to retrieve city');
      expect(response.body.code).toBe('CITY_FETCH_FAILED');
    });
  });
});
