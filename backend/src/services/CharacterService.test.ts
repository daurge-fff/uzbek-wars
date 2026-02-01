/**
 * Character Service Unit Tests
 * 
 * Tests character-related business logic including:
 * - Character retrieval
 * - Character validation
 * - Referral code generation
 * - Character selection with city assignment
 */

import { 
  getCharacters, 
  isValidCharacter, 
  generateReferralCode,
  selectCharacter 
} from './CharacterService';
import { Player } from '../models/Player';
import { User } from '../models/User';

// Mock dependencies
jest.mock('../models/Player');
jest.mock('../models/User');
jest.mock('../utils/logger');
jest.mock('./CityService');

describe('CharacterService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCharacters', () => {
    it('should return array of characters', () => {
      const characters = getCharacters();
      
      expect(Array.isArray(characters)).toBe(true);
      expect(characters.length).toBeGreaterThanOrEqual(3);
    });

    it('should return characters with required fields', () => {
      const characters = getCharacters();
      
      characters.forEach(char => {
        expect(char).toHaveProperty('id');
        expect(char).toHaveProperty('name');
        expect(char).toHaveProperty('description');
        
        // Check multilingual support
        expect(char.name).toHaveProperty('ru');
        expect(char.name).toHaveProperty('uz');
        expect(char.name).toHaveProperty('uk');
        expect(char.name).toHaveProperty('en');
        
        expect(char.description).toHaveProperty('ru');
        expect(char.description).toHaveProperty('uz');
        expect(char.description).toHaveProperty('uk');
        expect(char.description).toHaveProperty('en');
      });
    });

    it('should return at least 3 different characters', () => {
      const characters = getCharacters();
      const uniqueIds = new Set(characters.map(c => c.id));
      
      expect(uniqueIds.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('isValidCharacter', () => {
    it('should return true for valid character IDs', () => {
      const characters = getCharacters();
      const validId = characters[0].id;
      
      expect(isValidCharacter(validId)).toBe(true);
    });

    it('should return false for invalid character IDs', () => {
      expect(isValidCharacter('invalid_char')).toBe(false);
      expect(isValidCharacter('')).toBe(false);
      expect(isValidCharacter('char_nonexistent')).toBe(false);
    });

    it('should validate all seeded characters', () => {
      const characters = getCharacters();
      
      characters.forEach(char => {
        expect(isValidCharacter(char.id)).toBe(true);
      });
    });
  });

  describe('generateReferralCode', () => {
    it('should generate 8-character code', async () => {
      (Player.findOne as jest.Mock).mockResolvedValue(null);
      
      const code = await generateReferralCode();
      
      expect(code).toHaveLength(8);
    });

    it('should generate uppercase alphanumeric code', async () => {
      (Player.findOne as jest.Mock).mockResolvedValue(null);
      
      const code = await generateReferralCode();
      
      expect(code).toMatch(/^[A-Z0-9]{8}$/);
    });

    it('should generate unique codes', async () => {
      (Player.findOne as jest.Mock).mockResolvedValue(null);
      
      const codes = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const code = await generateReferralCode();
        codes.add(code);
      }
      
      // All codes should be unique
      expect(codes.size).toBe(10);
    });

    it('should retry on collision', async () => {
      // First call returns existing player (collision)
      // Second call returns null (unique code)
      (Player.findOne as jest.Mock)
        .mockResolvedValueOnce({ referralCode: 'EXISTING1' } as any)
        .mockResolvedValueOnce(null);
      
      const code = await generateReferralCode();
      
      expect(code).toHaveLength(8);
      expect(Player.findOne).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries', async () => {
      // Always return collision
      (Player.findOne as jest.Mock).mockResolvedValue({ referralCode: 'COLLISION' } as any);
      
      await expect(generateReferralCode()).rejects.toThrow('Failed to generate unique referral code');
    });
  });

  describe('selectCharacter', () => {
    const mockUserId = 'user123';
    const mockCharacterId = 'char_merchant';
    const mockCityId = 'samarkand';

    beforeEach(() => {
      // Mock user exists
      (User.findById as jest.Mock).mockResolvedValue({
        _id: mockUserId,
        email: 'test@example.com'
      } as any);

      // Mock no existing player
      (Player.findOne as jest.Mock).mockResolvedValue(null);

      // Mock city exists and is open
      const { getCityById } = require('./CityService');
      (getCityById as jest.Mock).mockResolvedValue({
        cityId: mockCityId,
        isOpen: true,
        playerCount: 100,
        maxPlayers: 1000,
        save: jest.fn().mockResolvedValue(true)
      });

      // Mock player creation
      (Player.create as jest.Mock).mockResolvedValue({
        _id: 'player123',
        userId: mockUserId,
        characterId: mockCharacterId,
        cityId: mockCityId,
        level: 1,
        experience: 0,
        soms: 100,
        referralCode: 'NEWCODE1'
      } as any);
    });

    it('should create player with selected character and city', async () => {
      const player = await selectCharacter(mockUserId, {
        characterId: mockCharacterId,
        cityId: mockCityId
      });

      expect(player.characterId).toBe(mockCharacterId);
      expect(player.cityId).toBe(mockCityId);
      expect(player.level).toBe(1);
      expect(player.soms).toBe(100);
    });

    it('should throw error if user not found', async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        selectCharacter(mockUserId, {
          characterId: mockCharacterId,
          cityId: mockCityId
        })
      ).rejects.toThrow('User not found');
    });

    it('should throw error if character already selected', async () => {
      (Player.findOne as jest.Mock).mockResolvedValue({
        characterId: 'existing_char',
        userId: mockUserId
      } as any);

      await expect(
        selectCharacter(mockUserId, {
          characterId: mockCharacterId,
          cityId: mockCityId
        })
      ).rejects.toThrow('Character already selected');
    });

    it('should throw error for invalid character ID', async () => {
      await expect(
        selectCharacter(mockUserId, {
          characterId: 'invalid_char',
          cityId: mockCityId
        })
      ).rejects.toThrow('Invalid character ID');
    });

    it('should throw error for invalid city ID', async () => {
      const { getCityById } = require('./CityService');
      (getCityById as jest.Mock).mockResolvedValue(null);

      await expect(
        selectCharacter(mockUserId, {
          characterId: mockCharacterId,
          cityId: 'invalid_city'
        })
      ).rejects.toThrow('Invalid city ID');
    });

    it('should throw error if city is full', async () => {
      const { getCityById } = require('./CityService');
      (getCityById as jest.Mock).mockResolvedValue({
        cityId: mockCityId,
        isOpen: false,
        playerCount: 1000,
        maxPlayers: 1000
      });

      await expect(
        selectCharacter(mockUserId, {
          characterId: mockCharacterId,
          cityId: mockCityId
        })
      ).rejects.toThrow('full');
    });

    it('should process referral code and assign referrer city', async () => {
      const referralCode = 'REFER123';
      const referrerCityId = 'tashkent';

      // Mock referrer exists
      (Player.findOne as jest.Mock).mockImplementation((query: any) => {
        if (query.referralCode === referralCode) {
          return Promise.resolve({
            _id: 'referrer123',
            cityId: referrerCityId,
            donationCurrency: 0,
            soms: 1000,
            save: jest.fn().mockResolvedValue(true)
          } as any);
        }
        return Promise.resolve(null);
      });

      // Mock referrer's city
      const { getCityById } = require('./CityService');
      (getCityById as jest.Mock).mockResolvedValue({
        cityId: referrerCityId,
        isOpen: true,
        playerCount: 50,
        maxPlayers: 1000,
        save: jest.fn().mockResolvedValue(true)
      });

      // Mock player creation with referrer's city
      (Player.create as jest.Mock).mockResolvedValue({
        _id: 'player123',
        userId: mockUserId,
        characterId: mockCharacterId,
        cityId: referrerCityId, // Should be referrer's city
        level: 1,
        experience: 0,
        soms: 100,
        referralCode: 'NEWCODE1'
      } as any);

      const player = await selectCharacter(mockUserId, {
        characterId: mockCharacterId,
        cityId: mockCityId, // This should be overridden
        referralCode
      });

      // Player should be in referrer's city, not selected city
      expect(player.cityId).toBe(referrerCityId);
    });

    it('should award bonus to referrer', async () => {
      const referralCode = 'REFER123';
      const mockReferrer = {
        _id: 'referrer123',
        cityId: 'tashkent',
        donationCurrency: 100,
        soms: 1000,
        save: jest.fn().mockResolvedValue(true)
      };

      (Player.findOne as jest.Mock).mockImplementation((query: any) => {
        if (query.referralCode === referralCode) {
          return Promise.resolve(mockReferrer as any);
        }
        return Promise.resolve(null);
      });

      const { getCityById } = require('./CityService');
      (getCityById as jest.Mock).mockResolvedValue({
        cityId: 'tashkent',
        isOpen: true,
        playerCount: 50,
        maxPlayers: 1000,
        save: jest.fn().mockResolvedValue(true)
      });

      await selectCharacter(mockUserId, {
        characterId: mockCharacterId,
        cityId: mockCityId,
        referralCode
      });

      // Referrer should receive bonus
      expect(mockReferrer.donationCurrency).toBe(150); // +50 crystals
      expect(mockReferrer.soms).toBe(1500); // +500 soms
      expect(mockReferrer.save).toHaveBeenCalled();
    });

    it('should increment city player count', async () => {
      const mockCity = {
        cityId: mockCityId,
        isOpen: true,
        playerCount: 100,
        maxPlayers: 1000,
        save: jest.fn().mockResolvedValue(true)
      };

      const { getCityById } = require('./CityService');
      (getCityById as jest.Mock).mockResolvedValue(mockCity);

      await selectCharacter(mockUserId, {
        characterId: mockCharacterId,
        cityId: mockCityId
      });

      expect(mockCity.playerCount).toBe(101);
      expect(mockCity.save).toHaveBeenCalled();
    });

    it('should close city when reaching capacity', async () => {
      const mockCity = {
        cityId: mockCityId,
        isOpen: true,
        playerCount: 999,
        maxPlayers: 1000,
        save: jest.fn().mockResolvedValue(true)
      };

      const { getCityById } = require('./CityService');
      (getCityById as jest.Mock).mockResolvedValue(mockCity);

      await selectCharacter(mockUserId, {
        characterId: mockCharacterId,
        cityId: mockCityId
      });

      expect(mockCity.playerCount).toBe(1000);
      expect(mockCity.isOpen).toBe(false);
      expect(mockCity.save).toHaveBeenCalled();
    });
  });
});
