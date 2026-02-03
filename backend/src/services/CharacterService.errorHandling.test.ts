/**
 * Character Service - Error Handling Tests
 * 
 * Tests that the system gracefully handles invalid/deleted characters
 */

import { 
  isValidCharacter, 
  getDefaultCharacterId, 
  ensureValidCharacter 
} from './CharacterService';
import { Player, IPlayer } from '../models/Player';
import mongoose from 'mongoose';

describe('CharacterService - Error Handling', () => {
  describe('isValidCharacter', () => {
    it('should return true for valid starter class', () => {
      expect(isValidCharacter('char_trader')).toBe(true);
      expect(isValidCharacter('char_worker')).toBe(true);
      expect(isValidCharacter('char_student')).toBe(true);
    });

    it('should return true for valid advanced class', () => {
      expect(isValidCharacter('char_merchant')).toBe(true);
      expect(isValidCharacter('char_warrior')).toBe(true);
      expect(isValidCharacter('char_scholar')).toBe(true);
    });

    it('should return true for valid master class', () => {
      expect(isValidCharacter('char_tycoon')).toBe(true);
      expect(isValidCharacter('char_legend')).toBe(true);
      expect(isValidCharacter('char_sage')).toBe(true);
    });

    it('should return false for invalid character', () => {
      expect(isValidCharacter('char_invalid')).toBe(false);
      expect(isValidCharacter('char_deleted')).toBe(false);
      expect(isValidCharacter('char_chef')).toBe(false); // Old name
      expect(isValidCharacter('')).toBe(false);
    });
  });

  describe('getDefaultCharacterId', () => {
    it('should return a valid character ID', () => {
      const defaultId = getDefaultCharacterId();
      expect(defaultId).toBeDefined();
      expect(isValidCharacter(defaultId)).toBe(true);
    });

    it('should return char_trader as default', () => {
      expect(getDefaultCharacterId()).toBe('char_trader');
    });
  });

  describe('ensureValidCharacter', () => {
    let mockPlayer: IPlayer;

    beforeEach(() => {
      mockPlayer = new Player({
        _id: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId().toString(),
        characterId: 'char_trader',
        cityId: 'tashkent',
        level: 5,
        experience: 0,
        experienceToNextLevel: 100,
        soms: 1000,
        donationCurrency: 0,
        stats: {
          hunger: 100,
          health: 100,
          mood: 100,
          energy: 100,
        },
        referralCode: 'TEST1234',
        lastActivityTime: new Date(),
      });

      // Mock save method
      mockPlayer.save = jest.fn().mockResolvedValue(mockPlayer);
    });

    it('should not reset valid character', async () => {
      mockPlayer.characterId = 'char_trader';
      const wasReset = await ensureValidCharacter(mockPlayer);
      
      expect(wasReset).toBe(false);
      expect(mockPlayer.characterId).toBe('char_trader');
      expect(mockPlayer.save).not.toHaveBeenCalled();
    });

    it('should reset invalid character to default', async () => {
      mockPlayer.characterId = 'char_invalid';
      const wasReset = await ensureValidCharacter(mockPlayer);
      
      expect(wasReset).toBe(true);
      expect(mockPlayer.characterId).toBe('char_trader');
      expect(mockPlayer.save).toHaveBeenCalled();
    });

    it('should reset deleted character (char_chef) to default', async () => {
      mockPlayer.characterId = 'char_chef'; // Old character name
      const wasReset = await ensureValidCharacter(mockPlayer);
      
      expect(wasReset).toBe(true);
      expect(mockPlayer.characterId).toBe('char_trader');
      expect(mockPlayer.save).toHaveBeenCalled();
    });

    it('should reset empty character ID to default', async () => {
      mockPlayer.characterId = '';
      const wasReset = await ensureValidCharacter(mockPlayer);
      
      expect(wasReset).toBe(true);
      expect(mockPlayer.characterId).toBe('char_trader');
      expect(mockPlayer.save).toHaveBeenCalled();
    });
  });
});
