/**
 * Integration test: Activity execution with character modifiers
 * 
 * Tests that character class bonuses are correctly applied when executing activities
 */

import { executeActivity, getActivityById } from './ActivityService';
import { Player, IPlayer } from '../models/Player';
import mongoose from 'mongoose';

describe('Activity Execution with Character Modifiers', () => {
  let mockPlayer: IPlayer;

  beforeEach(() => {
    // Create a mock player document
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
      lastActivityTime: new Date(Date.now() - 120000), // 2 minutes ago
    });
  });

  describe('Trader class (char_trader)', () => {
    it('should apply +12% income bonus to work activity', () => {
      const activity = getActivityById('work_svyaznoy');
      expect(activity).toBeDefined();

      const result = executeActivity(mockPlayer, activity!);

      // Base: 200 soms, with +12% = 224 soms
      expect(result.somsGained).toBe(224);
      expect(result.success).toBe(true);
    });

    it('should not modify experience (no exp bonus)', () => {
      const activity = getActivityById('work_svyaznoy');
      expect(activity).toBeDefined();

      const result = executeActivity(mockPlayer, activity!);

      // Base: 50 XP, no bonus = 50 XP
      expect(result.experienceGained).toBe(50);
    });
  });

  describe('Student class (char_student)', () => {
    beforeEach(() => {
      mockPlayer.characterId = 'char_student';
    });

    it('should apply +18% experience bonus', () => {
      const activity = getActivityById('work_svyaznoy');
      expect(activity).toBeDefined();

      const result = executeActivity(mockPlayer, activity!);

      // Base: 50 XP, with +18% = 59 XP
      expect(result.experienceGained).toBe(59);
    });

    it('should apply -10% income penalty', () => {
      const activity = getActivityById('work_svyaznoy');
      expect(activity).toBeDefined();

      const result = executeActivity(mockPlayer, activity!);

      // Base: 200 soms, with -10% = 180 soms
      expect(result.somsGained).toBe(180);
    });
  });

  describe('Cook class (char_cook)', () => {
    beforeEach(() => {
      mockPlayer.characterId = 'char_cook';
      mockPlayer.stats.hunger = 50; // Low hunger to see recovery
    });

    it('should apply +22% food recovery bonus to cook_plov', () => {
      const activity = getActivityById('cook_plov');
      expect(activity).toBeDefined();

      const initialHunger = mockPlayer.stats.hunger;
      executeActivity(mockPlayer, activity!);

      // Base: +30 hunger, with +22% = +36 hunger
      const expectedHunger = Math.min(100, initialHunger + 36);
      expect(mockPlayer.stats.hunger).toBe(expectedHunger);
    });

    it('should apply -12% income penalty', () => {
      const activity = getActivityById('cook_plov');
      expect(activity).toBeDefined();

      const result = executeActivity(mockPlayer, activity!);

      // Base: 300 soms, with -12% = 264 soms
      expect(result.somsGained).toBe(264);
    });
  });

  describe('Worker class (char_worker)', () => {
    beforeEach(() => {
      mockPlayer.characterId = 'char_worker';
      mockPlayer.stats.energy = 50; // Low energy to see recovery
    });

    it('should apply +10% energy recovery bonus to rest', () => {
      const activity = getActivityById('rest');
      expect(activity).toBeDefined();

      const initialEnergy = mockPlayer.stats.energy;
      executeActivity(mockPlayer, activity!);

      // Base: +40 energy, with +10% = +44 energy
      const expectedEnergy = Math.min(100, initialEnergy + 44);
      expect(mockPlayer.stats.energy).toBe(expectedEnergy);
    });

    it('should apply +8% mood from work bonus', () => {
      const activity = getActivityById('rest');
      expect(activity).toBeDefined();

      const initialMood = mockPlayer.stats.mood;
      executeActivity(mockPlayer, activity!);

      // Base: +15 mood, with +8% = +16 mood
      const expectedMood = Math.min(100, initialMood + 16);
      expect(mockPlayer.stats.mood).toBe(expectedMood);
    });
  });

  describe('Merchant class (char_merchant)', () => {
    beforeEach(() => {
      mockPlayer.characterId = 'char_merchant';
      mockPlayer.level = 15; // Merchant requires level 15
      mockPlayer.lastActivityTime = new Date(Date.now() - 300000); // 5 minutes ago
    });

    it('should apply +28% income bonus', () => {
      const activity = getActivityById('trade_bazaar');
      expect(activity).toBeDefined();

      const result = executeActivity(mockPlayer, activity!);

      // Base: 400 soms, with +28% = 512 soms
      expect(result.somsGained).toBe(512);
    });
  });

  describe('Scholar class (char_scholar)', () => {
    beforeEach(() => {
      mockPlayer.characterId = 'char_scholar';
      mockPlayer.level = 15; // Scholar requires level 15
      mockPlayer.stats.energy = 50;
    });

    it('should apply +35% experience bonus', () => {
      const activity = getActivityById('work_svyaznoy');
      expect(activity).toBeDefined();

      const result = executeActivity(mockPlayer, activity!);

      // Base: 50 XP, with +35% = 67 XP
      expect(result.experienceGained).toBe(67);
    });

    it('should apply +28% energy recovery bonus', () => {
      const activity = getActivityById('rest');
      expect(activity).toBeDefined();

      const initialEnergy = mockPlayer.stats.energy;
      executeActivity(mockPlayer, activity!);

      // Base: +40 energy, with +28% = +51 energy
      const expectedEnergy = Math.min(100, initialEnergy + 51);
      expect(mockPlayer.stats.energy).toBe(expectedEnergy);
    });

    it('should apply -12% income penalty', () => {
      const activity = getActivityById('work_svyaznoy');
      expect(activity).toBeDefined();

      const result = executeActivity(mockPlayer, activity!);

      // Base: 200 soms, with -12% = 176 soms
      expect(result.somsGained).toBe(176);
    });
  });

  describe('Edge cases', () => {
    it('should handle character without modifiers', () => {
      mockPlayer.characterId = 'unknown_character';

      const activity = getActivityById('work_svyaznoy');
      expect(activity).toBeDefined();

      const result = executeActivity(mockPlayer, activity!);

      // Should use base values
      expect(result.experienceGained).toBe(50);
      expect(result.somsGained).toBe(200);
    });

    it('should not overflow stats above 100', () => {
      mockPlayer.characterId = 'char_cook';
      mockPlayer.stats.hunger = 90; // Already high

      const activity = getActivityById('cook_plov');
      expect(activity).toBeDefined();

      executeActivity(mockPlayer, activity!);

      // Should cap at 100
      expect(mockPlayer.stats.hunger).toBe(100);
    });

    it('should handle negative stat modifiers', () => {
      mockPlayer.characterId = 'char_trader';
      mockPlayer.stats.energy = 100;

      const activity = getActivityById('work_svyaznoy');
      expect(activity).toBeDefined();

      executeActivity(mockPlayer, activity!);

      // Base: -15 energy, no modifier for negative values
      expect(mockPlayer.stats.energy).toBe(85);
    });
  });
});
