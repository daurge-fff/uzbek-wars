/**
 * City Service Unit Tests
 * 
 * Tests city balancing logic and availability calculations
 */

import { getCityAvailability, getCityById, incrementCityPlayerCount, decrementCityPlayerCount } from './CityService';
import { City } from '../models/City';
import { Player } from '../models/Player';

// Mock the models
jest.mock('../models/City');
jest.mock('../models/Player');
jest.mock('../utils/logger');

describe('CityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getCityAvailability', () => {
    it('should return empty array when no cities exist', async () => {
      (City.find as jest.Mock).mockResolvedValue([]);

      const result = await getCityAvailability();

      expect(result).toEqual([]);
    });

    it('should calculate fill percentage correctly', async () => {
      const mockCity = {
        cityId: 'samarkand',
        name: { ru: 'Самарканд', uz: 'Samarqand', uk: 'Самарканд', en: 'Samarkand' },
        playerCount: 0,
        maxPlayers: 1000,
        isOpen: true,
        theme: { primaryColor: '#4A90E2', backgroundImage: '/samarkand.jpg', description: 'Ancient city' },
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnThis()
      };

      (City.find as jest.Mock).mockResolvedValue([mockCity]);
      (Player.countDocuments as jest.Mock).mockResolvedValue(450);

      const result = await getCityAvailability();

      expect(result).toHaveLength(1);
      expect(result[0].fillPercentage).toBe(45);
      expect(result[0].playerCount).toBe(450);
    });

    it('should close city when reaching max capacity', async () => {
      const mockCity = {
        cityId: 'tashkent',
        playerCount: 0,
        maxPlayers: 1000,
        isOpen: true,
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnThis()
      };

      (City.find as jest.Mock).mockResolvedValue([mockCity]);
      (Player.countDocuments as jest.Mock).mockResolvedValue(1000);

      await getCityAvailability();

      expect(mockCity.isOpen).toBe(false);
      expect(mockCity.save).toHaveBeenCalled();
    });

    it('should open city when below max capacity', async () => {
      const mockCity = {
        cityId: 'bukhara',
        playerCount: 1000,
        maxPlayers: 1000,
        isOpen: false,
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnThis()
      };

      (City.find as jest.Mock).mockResolvedValue([mockCity]);
      (Player.countDocuments as jest.Mock).mockResolvedValue(800);

      await getCityAvailability();

      expect(mockCity.isOpen).toBe(true);
      expect(mockCity.save).toHaveBeenCalled();
    });

    it('should open city with minimum players when all cities are full', async () => {
      const mockCity1 = {
        cityId: 'samarkand',
        playerCount: 1000,
        maxPlayers: 1000,
        isOpen: false,
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({ cityId: 'samarkand', playerCount: 1000, isOpen: false })
      };

      const mockCity2 = {
        cityId: 'tashkent',
        playerCount: 950,
        maxPlayers: 1000,
        isOpen: false,
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({ cityId: 'tashkent', playerCount: 950, isOpen: false })
      };

      (City.find as jest.Mock).mockResolvedValue([mockCity1, mockCity2]);
      (Player.countDocuments as jest.Mock)
        .mockResolvedValueOnce(1000)
        .mockResolvedValueOnce(950);
      
      // Mock findOne to return the city with minimum players
      (City.findOne as jest.Mock).mockResolvedValue({
        cityId: 'tashkent',
        isOpen: false,
        save: jest.fn().mockResolvedValue(true)
      });

      await getCityAvailability();

      // Verify that City.findOne was called to open the minimum city
      expect(City.findOne).toHaveBeenCalledWith({ cityId: 'tashkent' });
    });

    it('should handle database errors gracefully', async () => {
      (City.find as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      await expect(getCityAvailability()).rejects.toThrow('Failed to retrieve city availability');
    });
  });

  describe('getCityById', () => {
    it('should return city when found', async () => {
      const mockCity = {
        cityId: 'samarkand',
        name: { ru: 'Самарканд', uz: 'Samarqand', uk: 'Самарканд', en: 'Samarkand' }
      };

      (City.findOne as jest.Mock).mockResolvedValue(mockCity);

      const result = await getCityById('samarkand');

      expect(result).toEqual(mockCity);
      expect(City.findOne).toHaveBeenCalledWith({ cityId: 'samarkand' });
    });

    it('should return null when city not found', async () => {
      (City.findOne as jest.Mock).mockResolvedValue(null);

      const result = await getCityById('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      (City.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(getCityById('samarkand')).rejects.toThrow('Failed to retrieve city');
    });
  });

  describe('incrementCityPlayerCount', () => {
    it('should increment player count', async () => {
      const mockCity = {
        cityId: 'samarkand',
        playerCount: 500,
        maxPlayers: 1000,
        isOpen: true,
        save: jest.fn().mockResolvedValue(true)
      };

      (City.findOne as jest.Mock).mockResolvedValue(mockCity);

      await incrementCityPlayerCount('samarkand');

      expect(mockCity.playerCount).toBe(501);
      expect(mockCity.isOpen).toBe(true);
      expect(mockCity.save).toHaveBeenCalled();
    });

    it('should close city when reaching capacity', async () => {
      const mockCity = {
        cityId: 'tashkent',
        playerCount: 999,
        maxPlayers: 1000,
        isOpen: true,
        save: jest.fn().mockResolvedValue(true)
      };

      (City.findOne as jest.Mock).mockResolvedValue(mockCity);

      await incrementCityPlayerCount('tashkent');

      expect(mockCity.playerCount).toBe(1000);
      expect(mockCity.isOpen).toBe(false);
      expect(mockCity.save).toHaveBeenCalled();
    });

    it('should throw error when city not found', async () => {
      (City.findOne as jest.Mock).mockResolvedValue(null);

      await expect(incrementCityPlayerCount('nonexistent')).rejects.toThrow('City nonexistent not found');
    });
  });

  describe('decrementCityPlayerCount', () => {
    it('should decrement player count', async () => {
      const mockCity = {
        cityId: 'bukhara',
        playerCount: 500,
        maxPlayers: 1000,
        isOpen: true,
        save: jest.fn().mockResolvedValue(true)
      };

      (City.findOne as jest.Mock).mockResolvedValue(mockCity);

      await decrementCityPlayerCount('bukhara');

      expect(mockCity.playerCount).toBe(499);
      expect(mockCity.isOpen).toBe(true);
      expect(mockCity.save).toHaveBeenCalled();
    });

    it('should not go below zero', async () => {
      const mockCity = {
        cityId: 'shymkent',
        playerCount: 0,
        maxPlayers: 1000,
        isOpen: true,
        save: jest.fn().mockResolvedValue(true)
      };

      (City.findOne as jest.Mock).mockResolvedValue(mockCity);

      await decrementCityPlayerCount('shymkent');

      expect(mockCity.playerCount).toBe(0);
      expect(mockCity.save).toHaveBeenCalled();
    });

    it('should open city when below capacity', async () => {
      const mockCity = {
        cityId: 'tashkent',
        playerCount: 1000,
        maxPlayers: 1000,
        isOpen: false,
        save: jest.fn().mockResolvedValue(true)
      };

      (City.findOne as jest.Mock).mockResolvedValue(mockCity);

      await decrementCityPlayerCount('tashkent');

      expect(mockCity.playerCount).toBe(999);
      expect(mockCity.isOpen).toBe(true);
      expect(mockCity.save).toHaveBeenCalled();
    });

    it('should throw error when city not found', async () => {
      (City.findOne as jest.Mock).mockResolvedValue(null);

      await expect(decrementCityPlayerCount('nonexistent')).rejects.toThrow('City nonexistent not found');
    });
  });
});
