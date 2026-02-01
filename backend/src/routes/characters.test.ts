/**
 * Character Routes Integration Tests
 * 
 * Tests character API endpoints:
 * - GET /api/characters
 * - POST /api/player/select-character
 */

import request from 'supertest';
import express, { Application } from 'express';
import characterRoutes from './characters';

// Mock dependencies
jest.mock('../services/CharacterService');
jest.mock('../middleware/auth');
jest.mock('../utils/logger');

describe('Character Routes', () => {
  let app: Application;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create test app
    app = express();
    app.use(express.json());
    app.use('/api', characterRoutes);
  });

  describe('GET /api/characters', () => {
    it('should return list of characters', async () => {
      const { getCharacters } = require('../services/CharacterService');
      (getCharacters as jest.Mock).mockReturnValue([
        {
          id: 'char_merchant',
          name: {
            ru: 'Торговец Азиз',
            uz: 'Savdogar Aziz',
            uk: 'Торговець Азіз',
            en: 'Merchant Aziz'
          },
          description: {
            ru: 'Опытный торговец',
            uz: 'Tajribali savdogar',
            uk: 'Досвідчений торговець',
            en: 'Experienced merchant'
          }
        },
        {
          id: 'char_craftsman',
          name: {
            ru: 'Мастер Рустам',
            uz: 'Usta Rustam',
            uk: 'Майстер Рустам',
            en: 'Craftsman Rustam'
          },
          description: {
            ru: 'Искусный ремесленник',
            uz: 'Mohir hunarmand',
            uk: 'Майстерний ремісник',
            en: 'Skilled craftsman'
          }
        },
        {
          id: 'char_student',
          name: {
            ru: 'Студент Фарход',
            uz: 'Talaba Farhod',
            uk: 'Студент Фархад',
            en: 'Student Farhod'
          },
          description: {
            ru: 'Молодой студент',
            uz: 'Yosh talaba',
            uk: 'Молодий студент',
            en: 'Young student'
          }
        }
      ]);

      const response = await request(app)
        .get('/api/characters')
        .expect(200);

      expect(response.body).toHaveProperty('characters');
      expect(response.body).toHaveProperty('count');
      expect(response.body.characters).toHaveLength(3);
      expect(response.body.count).toBe(3);
    });

    it('should return characters with multilingual support', async () => {
      const { getCharacters } = require('../services/CharacterService');
      (getCharacters as jest.Mock).mockReturnValue([
        {
          id: 'char_merchant',
          name: {
            ru: 'Торговец',
            uz: 'Savdogar',
            uk: 'Торговець',
            en: 'Merchant'
          },
          description: {
            ru: 'Описание',
            uz: 'Tavsif',
            uk: 'Опис',
            en: 'Description'
          }
        }
      ]);

      const response = await request(app)
        .get('/api/characters')
        .expect(200);

      const character = response.body.characters[0];
      expect(character.name).toHaveProperty('ru');
      expect(character.name).toHaveProperty('uz');
      expect(character.name).toHaveProperty('uk');
      expect(character.name).toHaveProperty('en');
    });

    it('should handle service errors gracefully', async () => {
      const { getCharacters } = require('../services/CharacterService');
      (getCharacters as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      const response = await request(app)
        .get('/api/characters')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code', 'CHARACTERS_FETCH_FAILED');
    });
  });

  describe('POST /api/player/select-character', () => {
    beforeEach(() => {
      // Mock authentication middleware
      const { authenticate } = require('../middleware/auth');
      (authenticate as jest.Mock).mockImplementation((req: any, _res, next) => {
        req.user = { id: 'user123' };
        next();
      });
    });

    it('should select character successfully', async () => {
      const { selectCharacter } = require('../services/CharacterService');
      (selectCharacter as jest.Mock).mockResolvedValue({
        _id: 'player123',
        userId: 'user123',
        characterId: 'char_merchant',
        cityId: 'samarkand',
        level: 1,
        experience: 0,
        soms: 100,
        donationCurrency: 0,
        referralCode: 'NEWCODE1'
      } as any);

      const response = await request(app)
        .post('/api/player/select-character')
        .send({
          characterId: 'char_merchant',
          cityId: 'samarkand'
        })
        .expect(201);

      expect(response.body).toHaveProperty('player');
      expect(response.body).toHaveProperty('message');
      expect(response.body.player.characterId).toBe('char_merchant');
      expect(response.body.player.cityId).toBe('samarkand');
    });

    it('should handle referral code', async () => {
      const { selectCharacter } = require('../services/CharacterService');
      (selectCharacter as jest.Mock).mockResolvedValue({
        _id: 'player123',
        userId: 'user123',
        characterId: 'char_merchant',
        cityId: 'tashkent', // Referrer's city
        level: 1,
        experience: 0,
        soms: 100,
        donationCurrency: 0,
        referralCode: 'NEWCODE1',
        referredBy: 'REFER123'
      } as any);

      const response = await request(app)
        .post('/api/player/select-character')
        .send({
          characterId: 'char_merchant',
          cityId: 'samarkand',
          referralCode: 'REFER123'
        })
        .expect(201);

      expect(response.body.player.referredBy).toBe('REFER123');
      expect(selectCharacter).toHaveBeenCalledWith('user123', {
        characterId: 'char_merchant',
        cityId: 'samarkand',
        referralCode: 'REFER123'
      });
    });

    it('should return 401 if not authenticated', async () => {
      const { authenticate } = require('../middleware/auth');
      (authenticate as jest.Mock).mockImplementation((req: any, _res, next) => {
        req.user = undefined;
        next();
      });

      const response = await request(app)
        .post('/api/player/select-character')
        .send({
          characterId: 'char_merchant',
          cityId: 'samarkand'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 400 if characterId missing', async () => {
      const response = await request(app)
        .post('/api/player/select-character')
        .send({
          cityId: 'samarkand'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should return 400 if cityId missing', async () => {
      const response = await request(app)
        .post('/api/player/select-character')
        .send({
          characterId: 'char_merchant'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    it('should return 400 if character already selected', async () => {
      const { selectCharacter } = require('../services/CharacterService');
      (selectCharacter as jest.Mock).mockRejectedValue(
        new Error('Character already selected')
      );

      const response = await request(app)
        .post('/api/player/select-character')
        .send({
          characterId: 'char_merchant',
          cityId: 'samarkand'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('CHARACTER_ALREADY_SELECTED');
    });

    it('should return 400 for invalid character', async () => {
      const { selectCharacter } = require('../services/CharacterService');
      (selectCharacter as jest.Mock).mockRejectedValue(
        new Error('Invalid character ID: invalid_char')
      );

      const response = await request(app)
        .post('/api/player/select-character')
        .send({
          characterId: 'invalid_char',
          cityId: 'samarkand'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('INVALID_CHARACTER');
    });

    it('should return 400 for invalid city', async () => {
      const { selectCharacter } = require('../services/CharacterService');
      (selectCharacter as jest.Mock).mockRejectedValue(
        new Error('Invalid city ID: invalid_city')
      );

      const response = await request(app)
        .post('/api/player/select-character')
        .send({
          characterId: 'char_merchant',
          cityId: 'invalid_city'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('INVALID_CITY');
    });

    it('should return 400 if city is full', async () => {
      const { selectCharacter } = require('../services/CharacterService');
      (selectCharacter as jest.Mock).mockRejectedValue(
        new Error('City samarkand is currently full')
      );

      const response = await request(app)
        .post('/api/player/select-character')
        .send({
          characterId: 'char_merchant',
          cityId: 'samarkand'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('CITY_FULL');
    });

    it('should return 500 for unexpected errors', async () => {
      const { selectCharacter } = require('../services/CharacterService');
      (selectCharacter as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/api/player/select-character')
        .send({
          characterId: 'char_merchant',
          cityId: 'samarkand'
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.code).toBe('CHARACTER_SELECTION_FAILED');
    });
  });
});
