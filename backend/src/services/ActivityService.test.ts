/**
 * Activity Service Unit Tests
 * 
 * Tests core activity execution logic including:
 * - Activity retrieval and filtering
 * - Cooldown management
 * - Validation logic
 * - Reward calculation
 * - Risk-based penalties
 * - Stat modifications
 * - Level-up integration
 */

import {
  ACTIVITIES,
  getActivityById,
  getAvailableActivities,
  isActivityOnCooldown,
  getRemainingCooldown,
  validateActivityExecution,
  executeActivity,
  getActivityStats,
} from './ActivityService';
import { IPlayer } from '../models/Player';

/**
 * Creates a mock player for testing
 * Default values represent a mid-level player with healthy stats
 */
function createMockPlayer(overrides?: Partial<IPlayer>): IPlayer {
  return {
    _id: 'test-player-id',
    userId: 'test-user-id' as any,
    characterId: 'char1',
    cityId: 'tashkent',
    level: 5,
    experience: 100,
    soms: 1000,
    donationCurrency: 0,
    stats: {
      hunger: 80,
      health: 90,
      mood: 70,
      energy: 60,
    },
    cosmetics: {
      clothing: [],
      backgrounds: [],
    },
    referralCode: 'TEST123',
    lastActivityTime: new Date(Date.now() - 60000), // 1 minute ago
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as IPlayer;
}

describe('ActivityService', () => {
  describe('ACTIVITIES constant', () => {
    it('should have at least 5 activities defined', () => {
      expect(ACTIVITIES.length).toBeGreaterThanOrEqual(5);
    });
    
    it('should include work_svyaznoy activity', () => {
      const activity = ACTIVITIES.find((a) => a.id === 'work_svyaznoy');
      expect(activity).toBeDefined();
      expect(activity?.requiredLevel).toBe(1);
    });
    
    it('should include rob activity', () => {
      const activity = ACTIVITIES.find((a) => a.id === 'rob');
      expect(activity).toBeDefined();
      expect(activity?.requiredLevel).toBe(3);
      expect(activity?.risks).toBeDefined();
    });
    
    it('should include cook_plov activity', () => {
      const activity = ACTIVITIES.find((a) => a.id === 'cook_plov');
      expect(activity).toBeDefined();
      expect(activity?.statModifiers.hunger).toBeGreaterThan(0);
    });
    
    it('should include trade_bazaar activity', () => {
      const activity = ACTIVITIES.find((a) => a.id === 'trade_bazaar');
      expect(activity).toBeDefined();
      expect(activity?.requiredLevel).toBe(4);
    });
    
    it('should include rest activity', () => {
      const activity = ACTIVITIES.find((a) => a.id === 'rest');
      expect(activity).toBeDefined();
      expect(activity?.statModifiers.energy).toBeGreaterThan(0);
    });
    
    it('should include eat activity', () => {
      const activity = ACTIVITIES.find((a) => a.id === 'eat');
      expect(activity).toBeDefined();
      expect(activity?.cost).toBe(50);
    });
    
    it('should have all activities with required fields', () => {
      ACTIVITIES.forEach((activity) => {
        expect(activity.id).toBeDefined();
        expect(activity.name.ru).toBeDefined();
        expect(activity.name.uz).toBeDefined();
        expect(activity.name.uk).toBeDefined();
        expect(activity.name.en).toBeDefined();
        expect(activity.rewards).toBeDefined();
        expect(activity.rewards.experience).toBeGreaterThanOrEqual(0);
        expect(activity.statModifiers).toBeDefined();
        expect(activity.cooldown).toBeGreaterThan(0);
        expect(activity.requiredLevel).toBeGreaterThanOrEqual(1);
      });
    });
  });
  
  describe('getActivityById', () => {
    it('should return activity when ID exists', () => {
      const activity = getActivityById('work_svyaznoy');
      expect(activity).toBeDefined();
      expect(activity?.id).toBe('work_svyaznoy');
    });
    
    it('should return undefined when ID does not exist', () => {
      const activity = getActivityById('nonexistent');
      expect(activity).toBeUndefined();
    });
  });
  
  describe('getAvailableActivities', () => {
    it('should return only level 1 activities for level 1 player', () => {
      const activities = getAvailableActivities(1);
      expect(activities.length).toBeGreaterThan(0);
      activities.forEach((activity) => {
        expect(activity.requiredLevel).toBeLessThanOrEqual(1);
      });
    });
    
    it('should return more activities for higher level players', () => {
      const level1Activities = getAvailableActivities(1);
      const level5Activities = getAvailableActivities(5);
      expect(level5Activities.length).toBeGreaterThan(level1Activities.length);
    });
    
    it('should include all activities for max level player', () => {
      const activities = getAvailableActivities(100);
      expect(activities.length).toBe(ACTIVITIES.length);
    });
  });
  
  describe('isActivityOnCooldown', () => {
    it('should return true when activity is on cooldown', () => {
      const player = createMockPlayer({
        lastActivityTime: new Date(Date.now() - 10000), // 10 seconds ago
      });
      const activity = getActivityById('work_svyaznoy')!;
      
      expect(isActivityOnCooldown(player, activity)).toBe(true);
    });
    
    it('should return false when cooldown has expired', () => {
      const player = createMockPlayer({
        lastActivityTime: new Date(Date.now() - 60000), // 60 seconds ago
      });
      const activity = getActivityById('work_svyaznoy')!; // 30 second cooldown
      
      expect(isActivityOnCooldown(player, activity)).toBe(false);
    });
    
    it('should handle different cooldown durations', () => {
      const player = createMockPlayer({
        lastActivityTime: new Date(Date.now() - 40000), // 40 seconds ago
      });
      
      const shortCooldown = getActivityById('rest')!; // 20 seconds
      const longCooldown = getActivityById('rob')!; // 60 seconds
      
      expect(isActivityOnCooldown(player, shortCooldown)).toBe(false);
      expect(isActivityOnCooldown(player, longCooldown)).toBe(true);
    });
  });
  
  describe('getRemainingCooldown', () => {
    it('should return remaining cooldown time', () => {
      const player = createMockPlayer({
        lastActivityTime: new Date(Date.now() - 10000), // 10 seconds ago
      });
      const activity = getActivityById('work_svyaznoy')!; // 30 second cooldown
      
      const remaining = getRemainingCooldown(player, activity);
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(20);
    });
    
    it('should return 0 when cooldown has expired', () => {
      const player = createMockPlayer({
        lastActivityTime: new Date(Date.now() - 60000), // 60 seconds ago
      });
      const activity = getActivityById('work_svyaznoy')!;
      
      const remaining = getRemainingCooldown(player, activity);
      expect(remaining).toBe(0);
    });
  });
  
  describe('validateActivityExecution', () => {
    it('should pass validation for valid activity execution', () => {
      const player = createMockPlayer({
        level: 5,
        soms: 1000,
        lastActivityTime: new Date(Date.now() - 60000),
      });
      const activity = getActivityById('work_svyaznoy')!;
      
      const result = validateActivityExecution(player, activity);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
    
    it('should fail validation when level is too low', () => {
      const player = createMockPlayer({ level: 1 });
      const activity = getActivityById('rob')!; // Requires level 3
      
      const result = validateActivityExecution(player, activity);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Level');
      expect(result.error).toContain('required');
    });
    
    it('should fail validation when activity is on cooldown', () => {
      const player = createMockPlayer({
        lastActivityTime: new Date(Date.now() - 10000), // 10 seconds ago
      });
      const activity = getActivityById('work_svyaznoy')!;
      
      const result = validateActivityExecution(player, activity);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cooldown');
    });
    
    it('should fail validation when insufficient soms for cost', () => {
      const player = createMockPlayer({
        soms: 30,
        lastActivityTime: new Date(Date.now() - 60000),
      });
      const activity = getActivityById('eat')!; // Costs 50 soms
      
      const result = validateActivityExecution(player, activity);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Insufficient soms');
    });
  });
  
  describe('executeActivity', () => {
    it('should throw error when validation fails', () => {
      const player = createMockPlayer({ level: 1 });
      const activity = getActivityById('rob')!; // Requires level 3
      
      expect(() => executeActivity(player, activity)).toThrow();
    });
    
    it('should grant experience and soms for successful activity', () => {
      const player = createMockPlayer({
        level: 1,
        experience: 0,
        soms: 100,
        lastActivityTime: new Date(Date.now() - 60000),
      });
      const activity = getActivityById('work_svyaznoy')!;
      
      const result = executeActivity(player, activity);
      
      expect(result.success).toBe(true);
      expect(result.experienceGained).toBe(50);
      expect(result.somsGained).toBe(200);
      expect(player.experience).toBe(50);
      expect(player.soms).toBe(300);
    });
    
    it('should modify player stats according to activity', () => {
      const player = createMockPlayer({
        lastActivityTime: new Date(Date.now() - 60000),
        stats: {
          hunger: 100,
          health: 100,
          mood: 100,
          energy: 100,
        },
      });
      const activity = getActivityById('work_svyaznoy')!;
      
      executeActivity(player, activity);
      
      expect(player.stats.energy).toBe(85); // -15
      expect(player.stats.mood).toBe(95); // -5
      expect(player.stats.hunger).toBe(90); // -10
    });
    
    it('should restore stats for rest activity', () => {
      const player = createMockPlayer({
        lastActivityTime: new Date(Date.now() - 60000),
        stats: {
          hunger: 50,
          health: 50,
          mood: 50,
          energy: 30,
        },
      });
      const activity = getActivityById('rest')!;
      
      executeActivity(player, activity);
      
      expect(player.stats.energy).toBe(70); // +40
      expect(player.stats.mood).toBe(65); // +15
    });
    
    it('should deduct cost for activities with cost', () => {
      const player = createMockPlayer({
        soms: 200,
        lastActivityTime: new Date(Date.now() - 60000),
      });
      const activity = getActivityById('eat')!; // Costs 50 soms
      
      const result = executeActivity(player, activity);
      
      // Rewards: 0 soms, Cost: -50 soms, Total: -50 soms
      expect(player.soms).toBe(150);
      expect(result.somsGained).toBe(0);
    });
    
    it('should update last activity time', () => {
      const oldTime = new Date(Date.now() - 60000);
      const player = createMockPlayer({
        lastActivityTime: oldTime,
      });
      const activity = getActivityById('work_svyaznoy')!;
      
      executeActivity(player, activity);
      
      expect(player.lastActivityTime.getTime()).toBeGreaterThan(oldTime.getTime());
    });
    
    it('should trigger level-up when enough experience gained', () => {
      const player = createMockPlayer({
        level: 1,
        experience: 80, // Need 100 for level 2
        lastActivityTime: new Date(Date.now() - 60000),
      });
      const activity = getActivityById('work_svyaznoy')!; // Gives 50 XP
      
      const result = executeActivity(player, activity);
      
      expect(result.levelUp).toBe(true);
      expect(result.newLevel).toBe(2);
      expect(player.level).toBe(2);
      expect(player.experience).toBe(30); // 80 + 50 - 100 = 30 overflow
    });
    
    it('should not trigger level-up when insufficient experience', () => {
      const player = createMockPlayer({
        level: 1,
        experience: 30,
        lastActivityTime: new Date(Date.now() - 60000),
      });
      const activity = getActivityById('work_svyaznoy')!;
      
      const result = executeActivity(player, activity);
      
      expect(result.levelUp).toBe(false);
      expect(result.newLevel).toBeUndefined();
      expect(player.level).toBe(1);
      expect(player.experience).toBe(80);
    });
    
    it('should apply penalty when risk is triggered', () => {
      // Mock Math.random to always trigger penalty
      jest.spyOn(Math, 'random').mockReturnValue(0.1); // Less than 0.3 probability
      
      const player = createMockPlayer({
        level: 3,
        soms: 1000,
        lastActivityTime: new Date(Date.now() - 60000),
      });
      const activity = getActivityById('rob')!; // 30% risk, 300 soms penalty
      
      const result = executeActivity(player, activity);
      
      expect(result.penaltyApplied).toBe(true);
      expect(result.somsGained).toBe(200); // 500 - 300 penalty
      expect(player.soms).toBe(1200); // 1000 + 200
      
      jest.restoreAllMocks();
    });
    
    it('should not apply penalty when risk is not triggered', () => {
      // Mock Math.random to never trigger penalty
      jest.spyOn(Math, 'random').mockReturnValue(0.9); // Greater than 0.3 probability
      
      const player = createMockPlayer({
        level: 3,
        soms: 1000,
        lastActivityTime: new Date(Date.now() - 60000),
      });
      const activity = getActivityById('rob')!;
      
      const result = executeActivity(player, activity);
      
      expect(result.penaltyApplied).toBe(false);
      expect(result.somsGained).toBe(500);
      expect(player.soms).toBe(1500);
      
      jest.restoreAllMocks();
    });
    
    it('should prevent soms from going negative', () => {
      const player = createMockPlayer({
        level: 3,
        soms: 100,
        lastActivityTime: new Date(Date.now() - 60000),
      });
      const activity = getActivityById('rob')!;
      
      // Force penalty
      jest.spyOn(Math, 'random').mockReturnValue(0.1);
      
      executeActivity(player, activity);
      
      expect(player.soms).toBeGreaterThanOrEqual(0);
      
      jest.restoreAllMocks();
    });
    
    it('should return stat changes in result', () => {
      const player = createMockPlayer({
        lastActivityTime: new Date(Date.now() - 60000),
      });
      const activity = getActivityById('work_svyaznoy')!;
      
      const result = executeActivity(player, activity);
      
      expect(result.statChanges).toEqual(activity.statModifiers);
    });
  });
  
  describe('getActivityStats', () => {
    it('should calculate expected value for activity without risk', () => {
      const activity = getActivityById('work_svyaznoy')!;
      const stats = getActivityStats(activity);
      
      expect(stats.expectedValue).toBe(200);
      expect(stats.riskAdjustedValue).toBe(200);
    });
    
    it('should calculate risk-adjusted value for risky activity', () => {
      const activity = getActivityById('rob')!;
      const stats = getActivityStats(activity);
      
      // Expected: 500 - (0.3 * 300) = 410
      expect(stats.expectedValue).toBe(410);
      expect(stats.riskAdjustedValue).toBe(410);
    });
    
    it('should calculate experience per second', () => {
      const activity = getActivityById('work_svyaznoy')!;
      const stats = getActivityStats(activity);
      
      // 50 XP / 30 seconds = 1.666...
      expect(stats.experiencePerSecond).toBeCloseTo(1.67, 1);
    });
    
    it('should calculate soms per second', () => {
      const activity = getActivityById('work_svyaznoy')!;
      const stats = getActivityStats(activity);
      
      // 200 soms / 30 seconds = 6.666...
      expect(stats.somsPerSecond).toBeCloseTo(6.67, 1);
    });
    
    it('should account for activity cost in calculations', () => {
      const activity = getActivityById('eat')!;
      const stats = getActivityStats(activity);
      
      // 0 soms reward - 50 soms cost = -50 net
      expect(stats.expectedValue).toBe(-50);
    });
  });
});
