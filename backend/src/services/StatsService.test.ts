import {
  updatePlayerStats,
  applyPassiveDecay,
  getPlayerStats,
  hasAnyCriticalStat,
  getCriticalStats,
} from './StatsService';
import { IPlayer } from '../models/Player';

/**
 * Creates a mock player for testing
 * Default stats are all at 100 (full)
 */
function createMockPlayer(overrides?: Partial<IPlayer>): IPlayer {
  return {
    stats: {
      hunger: 100,
      health: 100,
      mood: 100,
      energy: 100,
    },
    lastActivityTime: new Date(),
    ...overrides,
  } as IPlayer;
}

describe('StatsService', () => {
  describe('updatePlayerStats', () => {
    it('should increase stats with positive modifiers', () => {
      const player = createMockPlayer({
        stats: { hunger: 50, health: 50, mood: 50, energy: 50 },
      });

      updatePlayerStats(player, {
        hunger: 20,
        health: 15,
        mood: 10,
        energy: 25,
      });

      expect(player.stats.hunger).toBe(70);
      expect(player.stats.health).toBe(65);
      expect(player.stats.mood).toBe(60);
      expect(player.stats.energy).toBe(75);
    });

    it('should decrease stats with negative modifiers', () => {
      const player = createMockPlayer({
        stats: { hunger: 80, health: 90, mood: 70, energy: 85 },
      });

      updatePlayerStats(player, {
        hunger: -30,
        health: -20,
        mood: -15,
        energy: -25,
      });

      expect(player.stats.hunger).toBe(50);
      expect(player.stats.health).toBe(70);
      expect(player.stats.mood).toBe(55);
      expect(player.stats.energy).toBe(60);
    });

    it('should clamp stats at maximum of 100', () => {
      const player = createMockPlayer({
        stats: { hunger: 90, health: 95, mood: 85, energy: 92 },
      });

      updatePlayerStats(player, {
        hunger: 50,
        health: 50,
        mood: 50,
        energy: 50,
      });

      expect(player.stats.hunger).toBe(100);
      expect(player.stats.health).toBe(100);
      expect(player.stats.mood).toBe(100);
      expect(player.stats.energy).toBe(100);
    });

    it('should clamp stats at minimum of 0', () => {
      const player = createMockPlayer({
        stats: { hunger: 10, health: 15, mood: 8, energy: 12 },
      });

      updatePlayerStats(player, {
        hunger: -50,
        health: -50,
        mood: -50,
        energy: -50,
      });

      expect(player.stats.hunger).toBe(0);
      expect(player.stats.health).toBe(0);
      expect(player.stats.mood).toBe(0);
      expect(player.stats.energy).toBe(0);
    });

    it('should only modify specified stats', () => {
      const player = createMockPlayer({
        stats: { hunger: 50, health: 60, mood: 70, energy: 80 },
      });

      updatePlayerStats(player, {
        hunger: 10,
        energy: -20,
      });

      expect(player.stats.hunger).toBe(60);
      expect(player.stats.health).toBe(60); // Unchanged
      expect(player.stats.mood).toBe(70); // Unchanged
      expect(player.stats.energy).toBe(60);
    });

    it('should handle zero modifiers', () => {
      const player = createMockPlayer({
        stats: { hunger: 50, health: 60, mood: 70, energy: 80 },
      });

      updatePlayerStats(player, {
        hunger: 0,
        health: 0,
        mood: 0,
        energy: 0,
      });

      expect(player.stats.hunger).toBe(50);
      expect(player.stats.health).toBe(60);
      expect(player.stats.mood).toBe(70);
      expect(player.stats.energy).toBe(80);
    });

    it('should handle empty modifiers object', () => {
      const player = createMockPlayer({
        stats: { hunger: 50, health: 60, mood: 70, energy: 80 },
      });

      updatePlayerStats(player, {});

      expect(player.stats.hunger).toBe(50);
      expect(player.stats.health).toBe(60);
      expect(player.stats.mood).toBe(70);
      expect(player.stats.energy).toBe(80);
    });
  });

  describe('applyPassiveDecay', () => {
    it('should decay stats based on time elapsed', async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const player = createMockPlayer({
        stats: { hunger: 100, health: 100, mood: 100, energy: 100 },
        lastActivityTime: oneHourAgo,
      });

      await applyPassiveDecay(player);

      // After 1 hour: hunger and energy decay by 5, mood by 2.5 (rounded to 2)
      expect(player.stats.hunger).toBe(95);
      expect(player.stats.energy).toBe(95);
      expect(player.stats.mood).toBe(98); // 100 - floor(1 * 5 * 0.5) = 98
      expect(player.stats.health).toBe(100); // Health doesn't decay passively
    });

    it('should apply larger decay for longer time periods', async () => {
      const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
      const player = createMockPlayer({
        stats: { hunger: 100, health: 100, mood: 100, energy: 100 },
        lastActivityTime: fiveHoursAgo,
      });

      await applyPassiveDecay(player);

      // After 5 hours: hunger and energy decay by 25, mood by 12
      expect(player.stats.hunger).toBe(75);
      expect(player.stats.energy).toBe(75);
      expect(player.stats.mood).toBe(88); // 100 - floor(5 * 5 * 0.5) = 88
      expect(player.stats.health).toBe(100);
    });

    it('should not decay if no time has passed', async () => {
      const player = createMockPlayer({
        stats: { hunger: 80, health: 90, mood: 85, energy: 75 },
        lastActivityTime: new Date(), // Just now
      });

      await applyPassiveDecay(player);

      expect(player.stats.hunger).toBe(80);
      expect(player.stats.health).toBe(90);
      expect(player.stats.mood).toBe(85);
      expect(player.stats.energy).toBe(75);
    });

    it('should apply critical hunger penalty to health', async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const player = createMockPlayer({
        stats: { hunger: 15, health: 100, mood: 100, energy: 100 },
        lastActivityTime: oneHourAgo,
      });

      await applyPassiveDecay(player);

      // Hunger decays to 10 (critical), health should be penalized by 10
      expect(player.stats.hunger).toBe(10);
      expect(player.stats.health).toBe(90); // 100 - 10 penalty
    });

    it('should apply critical energy penalty to mood', async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const player = createMockPlayer({
        stats: { hunger: 100, health: 100, mood: 100, energy: 18 },
        lastActivityTime: oneHourAgo,
      });

      await applyPassiveDecay(player);

      // Energy decays to 13 (critical), mood should be penalized by 10
      expect(player.stats.energy).toBe(13);
      expect(player.stats.mood).toBe(88); // 100 - 2 (decay) - 10 (penalty)
    });

    it('should not reduce health below 0 from critical hunger', async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const player = createMockPlayer({
        stats: { hunger: 15, health: 5, mood: 100, energy: 100 },
        lastActivityTime: oneHourAgo,
      });

      await applyPassiveDecay(player);

      expect(player.stats.health).toBe(0); // Should clamp at 0, not go negative
    });

    it('should not reduce mood below 0 from critical energy', async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const player = createMockPlayer({
        stats: { hunger: 100, health: 100, mood: 8, energy: 15 },
        lastActivityTime: oneHourAgo,
      });

      await applyPassiveDecay(player);

      expect(player.stats.mood).toBe(0); // Should clamp at 0, not go negative
    });

    it('should handle multiple critical stats simultaneously', async () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const player = createMockPlayer({
        stats: { hunger: 18, health: 50, mood: 50, energy: 18 },
        lastActivityTime: twoHoursAgo,
      });

      await applyPassiveDecay(player);

      // Both hunger and energy become critical after decay
      expect(player.stats.hunger).toBe(8); // 18 - 10 = 8 (critical)
      expect(player.stats.energy).toBe(8); // 18 - 10 = 8 (critical)
      expect(player.stats.health).toBe(40); // 50 - 10 (hunger penalty)
      expect(player.stats.mood).toBe(35); // 50 - 5 (decay) - 10 (energy penalty)
    });
  });

  describe('getPlayerStats', () => {
    it('should return copy of player stats', () => {
      const player = createMockPlayer({
        stats: { hunger: 75, health: 85, mood: 65, energy: 90 },
      });

      const stats = getPlayerStats(player);

      expect(stats.hunger).toBe(75);
      expect(stats.health).toBe(85);
      expect(stats.mood).toBe(65);
      expect(stats.energy).toBe(90);
    });

    it('should return independent copy (not reference)', () => {
      const player = createMockPlayer({
        stats: { hunger: 50, health: 60, mood: 70, energy: 80 },
      });

      const stats = getPlayerStats(player);
      stats.hunger = 100;

      // Original player stats should be unchanged
      expect(player.stats.hunger).toBe(50);
    });
  });

  describe('hasAnyCriticalStat', () => {
    it('should return false when all stats are above critical threshold', () => {
      const player = createMockPlayer({
        stats: { hunger: 50, health: 60, mood: 70, energy: 80 },
      });

      expect(hasAnyCriticalStat(player)).toBe(false);
    });

    it('should return true when hunger is critical', () => {
      const player = createMockPlayer({
        stats: { hunger: 15, health: 60, mood: 70, energy: 80 },
      });

      expect(hasAnyCriticalStat(player)).toBe(true);
    });

    it('should return true when health is critical', () => {
      const player = createMockPlayer({
        stats: { hunger: 50, health: 10, mood: 70, energy: 80 },
      });

      expect(hasAnyCriticalStat(player)).toBe(true);
    });

    it('should return true when mood is critical', () => {
      const player = createMockPlayer({
        stats: { hunger: 50, health: 60, mood: 5, energy: 80 },
      });

      expect(hasAnyCriticalStat(player)).toBe(true);
    });

    it('should return true when energy is critical', () => {
      const player = createMockPlayer({
        stats: { hunger: 50, health: 60, mood: 70, energy: 18 },
      });

      expect(hasAnyCriticalStat(player)).toBe(true);
    });

    it('should return true when multiple stats are critical', () => {
      const player = createMockPlayer({
        stats: { hunger: 10, health: 15, mood: 8, energy: 12 },
      });

      expect(hasAnyCriticalStat(player)).toBe(true);
    });

    it('should return false when stats are exactly at threshold', () => {
      const player = createMockPlayer({
        stats: { hunger: 20, health: 20, mood: 20, energy: 20 },
      });

      expect(hasAnyCriticalStat(player)).toBe(false);
    });

    it('should return true when stats are just below threshold', () => {
      const player = createMockPlayer({
        stats: { hunger: 19, health: 50, mood: 50, energy: 50 },
      });

      expect(hasAnyCriticalStat(player)).toBe(true);
    });
  });

  describe('getCriticalStats', () => {
    it('should return empty array when no stats are critical', () => {
      const player = createMockPlayer({
        stats: { hunger: 50, health: 60, mood: 70, energy: 80 },
      });

      const critical = getCriticalStats(player);

      expect(critical).toEqual([]);
    });

    it('should return array with single critical stat', () => {
      const player = createMockPlayer({
        stats: { hunger: 15, health: 60, mood: 70, energy: 80 },
      });

      const critical = getCriticalStats(player);

      expect(critical).toEqual(['hunger']);
    });

    it('should return array with multiple critical stats', () => {
      const player = createMockPlayer({
        stats: { hunger: 10, health: 15, mood: 70, energy: 12 },
      });

      const critical = getCriticalStats(player);

      expect(critical).toEqual(['hunger', 'health', 'energy']);
    });

    it('should return all stats when all are critical', () => {
      const player = createMockPlayer({
        stats: { hunger: 5, health: 10, mood: 8, energy: 15 },
      });

      const critical = getCriticalStats(player);

      expect(critical).toEqual(['hunger', 'health', 'mood', 'energy']);
    });

    it('should not include stats at exactly threshold', () => {
      const player = createMockPlayer({
        stats: { hunger: 20, health: 20, mood: 20, energy: 20 },
      });

      const critical = getCriticalStats(player);

      expect(critical).toEqual([]);
    });

    it('should include stats just below threshold', () => {
      const player = createMockPlayer({
        stats: { hunger: 19, health: 50, mood: 50, energy: 50 },
      });

      const critical = getCriticalStats(player);

      expect(critical).toEqual(['hunger']);
    });
  });
});
