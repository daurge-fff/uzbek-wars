/**
 * Unit tests for Progression Service
 * 
 * Tests cover:
 * - Experience formula correctness
 * - Level-up detection logic
 * - Edge cases and boundary conditions
 * - Multiple level-up scenarios
 */

import {
  calculateExperienceForLevel,
  checkLevelUp,
  processLevelUp,
  getExperienceProgress,
} from './ProgressionService';
import { IPlayer } from '../models/Player';

/**
 * Creates a mock player for testing
 * Avoids database dependencies in unit tests
 */
function createMockPlayer(level: number, experience: number): Partial<IPlayer> {
  return {
    level,
    experience,
    _id: 'test-player-id' as any,
    userId: 'test-user-id' as any,
    characterId: 'test-char',
    cityId: 'test-city',
    soms: 100,
    donationCurrency: 0,
    stats: {
      hunger: 100,
      health: 100,
      mood: 100,
      energy: 100,
    },
    cosmetics: {
      clothing: [],
      backgrounds: [],
    },
    referralCode: 'TEST1234',
    lastActivityTime: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe('ProgressionService', () => {
  describe('calculateExperienceForLevel', () => {
    it('should calculate correct XP for level 1', () => {
      // Level 1: 100 * (1.5 ^ 0) = 100
      expect(calculateExperienceForLevel(1)).toBe(100);
    });

    it('should calculate correct XP for level 2', () => {
      // Level 2: 100 * (1.5 ^ 1) = 150
      expect(calculateExperienceForLevel(2)).toBe(150);
    });

    it('should calculate correct XP for level 3', () => {
      // Level 3: 100 * (1.5 ^ 2) = 225
      expect(calculateExperienceForLevel(3)).toBe(225);
    });

    it('should calculate correct XP for level 5', () => {
      // Level 5: 100 * (1.5 ^ 4) = 506.25 → 506
      expect(calculateExperienceForLevel(5)).toBe(506);
    });

    it('should calculate correct XP for level 10', () => {
      // Level 10: 100 * (1.5 ^ 9) = 3844.30 → 3844
      expect(calculateExperienceForLevel(10)).toBe(3844);
    });

    it('should return integer values', () => {
      // All results should be integers (no decimals)
      for (let level = 1; level <= 20; level++) {
        const xp = calculateExperienceForLevel(level);
        expect(Number.isInteger(xp)).toBe(true);
      }
    });

    it('should be monotonically increasing', () => {
      // Each level should require more XP than the previous
      let previousXp = 0;
      for (let level = 1; level <= 50; level++) {
        const currentXp = calculateExperienceForLevel(level);
        expect(currentXp).toBeGreaterThan(previousXp);
        previousXp = currentXp;
      }
    });

    it('should throw error for level less than 1', () => {
      expect(() => calculateExperienceForLevel(0)).toThrow('Level must be at least 1');
      expect(() => calculateExperienceForLevel(-1)).toThrow('Level must be at least 1');
    });
  });

  describe('checkLevelUp', () => {
    it('should detect level-up when XP is exactly required amount', () => {
      const player = createMockPlayer(1, 100) as IPlayer;
      const result = checkLevelUp(player);
      
      expect(result.levelUp).toBe(true);
      expect(result.newLevel).toBe(2);
      expect(result.experienceOverflow).toBe(0);
    });

    it('should detect level-up when XP exceeds required amount', () => {
      const player = createMockPlayer(1, 150) as IPlayer;
      const result = checkLevelUp(player);
      
      expect(result.levelUp).toBe(true);
      expect(result.newLevel).toBe(2);
      expect(result.experienceOverflow).toBe(50);
    });

    it('should not detect level-up when XP is insufficient', () => {
      const player = createMockPlayer(1, 99) as IPlayer;
      const result = checkLevelUp(player);
      
      expect(result.levelUp).toBe(false);
      expect(result.newLevel).toBeUndefined();
      expect(result.experienceOverflow).toBeUndefined();
    });

    it('should handle level 5 to 6 transition correctly', () => {
      // Level 5→6 requires 506 XP
      const player = createMockPlayer(5, 600) as IPlayer;
      const result = checkLevelUp(player);
      
      expect(result.levelUp).toBe(true);
      expect(result.newLevel).toBe(6);
      expect(result.experienceOverflow).toBe(94); // 600 - 506
    });

    it('should handle player at level 1 with 0 XP', () => {
      const player = createMockPlayer(1, 0) as IPlayer;
      const result = checkLevelUp(player);
      
      expect(result.levelUp).toBe(false);
    });

    it('should handle high level player', () => {
      // Level 20→21 requires 100 * (1.5^19) = 1,162,261 XP
      const player = createMockPlayer(20, 1162261) as IPlayer;
      const result = checkLevelUp(player);
      
      expect(result.levelUp).toBe(true);
      expect(result.newLevel).toBe(21);
    });
  });

  describe('processLevelUp', () => {
    it('should process single level-up correctly', () => {
      const player = createMockPlayer(1, 100) as IPlayer;
      const levelsGained = processLevelUp(player);
      
      expect(levelsGained).toBe(1);
      expect(player.level).toBe(2);
      expect(player.experience).toBe(0);
    });

    it('should carry over overflow XP', () => {
      const player = createMockPlayer(1, 150) as IPlayer;
      const levelsGained = processLevelUp(player);
      
      expect(levelsGained).toBe(1);
      expect(player.level).toBe(2);
      expect(player.experience).toBe(50); // Overflow carried forward
    });

    it('should handle multiple level-ups in sequence', () => {
      // Give player enough XP to jump from level 1 to level 3
      // Level 1→2: 100 XP
      // Level 2→3: 150 XP
      // Total: 250 XP needed
      const player = createMockPlayer(1, 300) as IPlayer;
      const levelsGained = processLevelUp(player);
      
      expect(levelsGained).toBe(2);
      expect(player.level).toBe(3);
      expect(player.experience).toBe(50); // 300 - 100 - 150 = 50
    });

    it('should not modify player if no level-up', () => {
      const player = createMockPlayer(1, 50) as IPlayer;
      const originalLevel = player.level;
      const originalXp = player.experience;
      
      const levelsGained = processLevelUp(player);
      
      expect(levelsGained).toBe(0);
      expect(player.level).toBe(originalLevel);
      expect(player.experience).toBe(originalXp);
    });

    it('should handle massive XP gain (3+ levels)', () => {
      // Level 1→2: 100 XP
      // Level 2→3: 150 XP
      // Level 3→4: 225 XP
      // Total: 475 XP for 3 levels
      const player = createMockPlayer(1, 500) as IPlayer;
      const levelsGained = processLevelUp(player);
      
      expect(levelsGained).toBe(3);
      expect(player.level).toBe(4);
      expect(player.experience).toBe(25); // 500 - 475 = 25
    });

    it('should stop at exact level boundary', () => {
      // Exactly enough XP for 2 levels, no overflow
      const player = createMockPlayer(1, 250) as IPlayer; // 100 + 150
      const levelsGained = processLevelUp(player);
      
      expect(levelsGained).toBe(2);
      expect(player.level).toBe(3);
      expect(player.experience).toBe(0);
    });
  });

  describe('getExperienceProgress', () => {
    it('should return 0% at start of level', () => {
      const player = createMockPlayer(1, 0) as IPlayer;
      expect(getExperienceProgress(player)).toBe(0);
    });

    it('should return 50% at halfway point', () => {
      const player = createMockPlayer(1, 50) as IPlayer;
      expect(getExperienceProgress(player)).toBe(50);
    });

    it('should return 100% when ready to level up', () => {
      const player = createMockPlayer(1, 100) as IPlayer;
      expect(getExperienceProgress(player)).toBe(100);
    });

    it('should cap at 100% even with overflow XP', () => {
      const player = createMockPlayer(1, 200) as IPlayer;
      expect(getExperienceProgress(player)).toBe(100);
    });

    it('should handle fractional percentages', () => {
      const player = createMockPlayer(1, 33) as IPlayer;
      const progress = getExperienceProgress(player);
      expect(progress).toBeCloseTo(33, 0); // Within 1% tolerance
    });

    it('should work correctly for higher levels', () => {
      // Level 5 requires 506 XP
      const player = createMockPlayer(5, 253) as IPlayer; // Exactly 50%
      const progress = getExperienceProgress(player);
      expect(progress).toBeCloseTo(50, 0);
    });
  });

  describe('Edge cases and integration', () => {
    it('should handle level 1 player with massive XP correctly', () => {
      const player = createMockPlayer(1, 10000) as IPlayer;
      const levelsGained = processLevelUp(player);
      
      // Should gain multiple levels
      expect(levelsGained).toBeGreaterThan(5);
      expect(player.level).toBeGreaterThan(6);
      
      // Should have some overflow XP remaining
      expect(player.experience).toBeGreaterThanOrEqual(0);
      
      // Should not be ready for another level-up
      const checkResult = checkLevelUp(player);
      expect(checkResult.levelUp).toBe(false);
    });

    it('should maintain consistency between checkLevelUp and processLevelUp', () => {
      const player = createMockPlayer(3, 300) as IPlayer;
      
      // Check should detect level-up
      const checkResult = checkLevelUp(player);
      expect(checkResult.levelUp).toBe(true);
      
      // Process should actually perform the level-up
      const levelsGained = processLevelUp(player);
      expect(levelsGained).toBeGreaterThan(0);
      
      // After processing, check should not detect another level-up
      const recheckResult = checkLevelUp(player);
      expect(recheckResult.levelUp).toBe(false);
    });

    it('should handle boundary between levels correctly', () => {
      // Test at exact boundary: 1 XP before level-up
      const player1 = createMockPlayer(1, 99) as IPlayer;
      expect(checkLevelUp(player1).levelUp).toBe(false);
      
      // Test at exact boundary: exactly enough XP
      const player2 = createMockPlayer(1, 100) as IPlayer;
      expect(checkLevelUp(player2).levelUp).toBe(true);
      
      // Test at exact boundary: 1 XP over
      const player3 = createMockPlayer(1, 101) as IPlayer;
      const result = checkLevelUp(player3);
      expect(result.levelUp).toBe(true);
      expect(result.experienceOverflow).toBe(1);
    });
  });
});
