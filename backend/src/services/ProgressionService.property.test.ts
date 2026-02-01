/**
 * Progression Service Property-Based Tests
 * 
 * Property-based tests verify universal properties that should hold
 * for all valid inputs, not just specific examples.
 * 
 * Uses fast-check for property-based testing with 100+ iterations.
 */

import * as fc from 'fast-check';
import { 
  calculateExperienceForLevel, 
  checkLevelUp, 
  processLevelUp,
  IPlayerProgression 
} from './ProgressionService';

/**
 * Property 13: Формула расчета опыта монотонно возрастает
 * 
 * For any two levels L1 and L2 where L2 > L1, the experience required
 * for L2 must be strictly greater than the experience required for L1.
 * 
 * **Validates: Requirements 12.1**
 * 
 * This property ensures the progression system maintains a consistent
 * difficulty curve where each level requires more experience than the
 * previous level. This is fundamental to game balance and player engagement.
 * 
 * Mathematical property:
 * ∀ L1, L2 ∈ ℕ : L2 > L1 ⇒ XP(L2) > XP(L1)
 * 
 * Where XP(L) = calculateExperienceForLevel(L)
 */
describe('Property 13: Формула расчета опыта монотонно возрастает', () => {
  /**
   * Arbitrary generator for valid level values
   * Generates levels from 1 to 100 (reasonable game level range)
   */
  const levelArbitrary = fc.integer({ min: 1, max: 100 });

  it('should require strictly more experience for higher levels', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        levelArbitrary,
        (level1, level2) => {
          // Ensure level2 > level1 for the test
          if (level1 >= level2) {
            // Swap to ensure level2 is always greater
            [level1, level2] = [level2, level1];
          }

          // Skip if levels are equal after swap
          if (level1 === level2) {
            return true;
          }

          // Calculate experience for both levels
          const exp1 = calculateExperienceForLevel(level1);
          const exp2 = calculateExperienceForLevel(level2);

          // Property: Experience for higher level must be strictly greater
          // This ensures monotonic increase
          return exp2 > exp1;
        }
      ),
      {
        numRuns: 100, // Run 100 iterations with different level pairs
        verbose: true
      }
    );
  });

  it('should have strictly increasing experience for consecutive levels', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        (level) => {
          // Skip level 100 as we can't test level 101
          if (level >= 100) {
            return true;
          }

          const currentLevelExp = calculateExperienceForLevel(level);
          const nextLevelExp = calculateExperienceForLevel(level + 1);

          // Property: Next level always requires more experience
          return nextLevelExp > currentLevelExp;
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });

  it('should maintain monotonic increase across level ranges', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 95 }),
        fc.integer({ min: 1, max: 5 }),
        (startLevel, gap) => {
          const level1 = startLevel;
          const level2 = startLevel + gap;

          const exp1 = calculateExperienceForLevel(level1);
          const exp2 = calculateExperienceForLevel(level2);

          // Property: Experience increases with level gap
          // Larger gap should mean larger experience difference
          return exp2 > exp1;
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });

  it('should have positive experience difference between any two distinct levels', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        levelArbitrary,
        (level1, level2) => {
          // Skip if levels are equal
          if (level1 === level2) {
            return true;
          }

          const exp1 = calculateExperienceForLevel(level1);
          const exp2 = calculateExperienceForLevel(level2);

          // Property: Experience difference is always positive for different levels
          const difference = Math.abs(exp2 - exp1);
          return difference > 0;
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });

  it('should maintain exponential growth rate', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 98 }),
        (level) => {
          const exp1 = calculateExperienceForLevel(level);
          const exp2 = calculateExperienceForLevel(level + 1);
          const exp3 = calculateExperienceForLevel(level + 2);

          // Property: Growth rate should be consistent (exponential)
          // The ratio between consecutive level differences should be approximately constant
          const diff1 = exp2 - exp1;
          const diff2 = exp3 - exp2;

          // For exponential growth with base 1.5, ratio should be approximately 1.5
          const ratio = diff2 / diff1;

          // Allow small floating point tolerance
          return ratio >= 1.4 && ratio <= 1.6;
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });

  it('should return positive integer experience values', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        (level) => {
          const exp = calculateExperienceForLevel(level);

          // Property: Experience must be a positive integer
          return exp > 0 && Number.isInteger(exp);
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });

  it('should have experience values that grow exponentially', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        (level) => {
          const exp = calculateExperienceForLevel(level);
          
          // Property: Experience should follow the formula 100 * 1.5^(level-1)
          // Calculate expected value
          const expected = Math.floor(100 * Math.pow(1.5, level - 1));
          
          // Experience should match the formula exactly
          return exp === expected;
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });

  it('should maintain strict ordering for any sequence of levels', () => {
    fc.assert(
      fc.property(
        fc.array(levelArbitrary, { minLength: 2, maxLength: 10 }),
        (levels) => {
          // Sort levels in ascending order
          const sortedLevels = [...levels].sort((a, b) => a - b);
          
          // Calculate experience for each level
          const experiences = sortedLevels.map(calculateExperienceForLevel);
          
          // Property: Experience values should also be in ascending order
          for (let i = 0; i < experiences.length - 1; i++) {
            if (sortedLevels[i] === sortedLevels[i + 1]) {
              // Same level should have same experience
              if (experiences[i] !== experiences[i + 1]) {
                return false;
              }
            } else {
              // Different levels should have strictly increasing experience
              if (experiences[i] >= experiences[i + 1]) {
                return false;
              }
            }
          }
          
          return true;
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });

  it('should have minimum experience of 100 for level 1', () => {
    fc.assert(
      fc.property(
        fc.constant(1),
        (level) => {
          const exp = calculateExperienceForLevel(level);
          
          // Property: Level 1 should require exactly 100 experience
          // This is the base case for the exponential formula
          return exp === 100;
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });

  it('should scale reasonably for high levels', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 80 }),
        (level) => {
          const exp = calculateExperienceForLevel(level);
          
          // Property: Experience should be reasonable (not overflow, not too small)
          // For levels up to 80, exp should be large but not exceed Number.MAX_SAFE_INTEGER
          // Note: Level 81+ exceeds MAX_SAFE_INTEGER due to exponential growth
          return exp > 0 && exp <= Number.MAX_SAFE_INTEGER && Number.isFinite(exp);
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });
});

/**
 * Property 3: Повышение уровня при достаточном опыте
 * 
 * For any player with experience >= required for next level,
 * the system must increase the player's level by exactly 1
 * and reset experience appropriately.
 * 
 * **Validates: Requirements 2.3**
 * 
 * This property ensures the level-up system works correctly:
 * 1. Level increases by exactly 1 when sufficient XP is gained
 * 2. Experience is reset to overflow amount (XP beyond requirement)
 * 3. No experience is lost in the process
 * 4. Multiple level-ups are handled correctly for massive XP gains
 * 
 * Mathematical properties:
 * - If XP >= XP_required(level), then new_level = level + 1
 * - new_XP = XP - XP_required(level)
 * - Total XP progress is conserved: old_level + old_XP ≈ new_level + new_XP
 */
describe('Property 3: Повышение уровня при достаточном опыте', () => {
  /**
   * Creates a mock player object for testing
   * Uses minimal interface with only required fields
   */
  const createMockPlayer = (level: number, experience: number): IPlayerProgression => {
    return {
      level,
      experience,
    };
  };

  /**
   * Arbitrary generator for valid player levels
   * Generates levels from 1 to 50 (reasonable test range)
   */
  const levelArbitrary = fc.integer({ min: 1, max: 50 });

  /**
   * Arbitrary generator for experience values
   * Generates experience from 0 to 10,000 (covers most scenarios)
   */
  const experienceArbitrary = fc.integer({ min: 0, max: 10000 });

  it('should increase level by exactly 1 when player has sufficient experience', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        (level) => {
          // Calculate required XP for this level
          const requiredExp = calculateExperienceForLevel(level);
          
          // Create player with exactly enough XP to level up
          const player = createMockPlayer(level, requiredExp);
          
          // Check level-up
          const result = checkLevelUp(player);
          
          // Property: Should level up and new level should be exactly level + 1
          return result.levelUp === true && result.newLevel === level + 1;
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });

  it('should reset experience to overflow amount after level-up', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        fc.integer({ min: 0, max: 500 }),
        (level, overflow) => {
          // Calculate required XP for this level
          const requiredExp = calculateExperienceForLevel(level);
          
          // Create player with required XP + overflow
          const totalExp = requiredExp + overflow;
          const player = createMockPlayer(level, totalExp);
          
          // Check level-up
          const result = checkLevelUp(player);
          
          // Property: Overflow XP should match the excess experience
          return result.levelUp === true && result.experienceOverflow === overflow;
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });

  it('should not level up when experience is insufficient', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        (level) => {
          // Calculate required XP for this level
          const requiredExp = calculateExperienceForLevel(level);
          
          // Create player with insufficient XP (1 less than required)
          const player = createMockPlayer(level, Math.max(0, requiredExp - 1));
          
          // Check level-up
          const result = checkLevelUp(player);
          
          // Property: Should NOT level up
          return result.levelUp === false && result.newLevel === undefined;
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });

  it('should process level-up correctly and update player state', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        fc.integer({ min: 0, max: 500 }),
        (level, overflow) => {
          // Calculate required XP for this level
          const requiredExp = calculateExperienceForLevel(level);
          
          // Create player with required XP + overflow
          const totalExp = requiredExp + overflow;
          const player = createMockPlayer(level, totalExp);
          
          // Store original values
          const originalLevel = player.level;
          
          // Process level-up
          const levelsGained = processLevelUp(player);
          
          // Property: After processing level-ups:
          // 1. Player should have leveled up at least once (we gave them enough XP)
          // 2. Final level should equal original level + levels gained
          // 3. Final experience should be non-negative
          // 4. Final experience should be less than what's needed for next level
          const didLevelUp = levelsGained >= 1;
          const levelIncreased = player.level === originalLevel + levelsGained;
          const experienceValid = player.experience >= 0;
          const cannotLevelUpAgain = player.experience < calculateExperienceForLevel(player.level);
          
          return didLevelUp && levelIncreased && experienceValid && cannotLevelUpAgain;
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });

  it('should handle multiple level-ups when experience is very high', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (level) => {
          // Calculate XP needed for multiple level-ups
          // Give enough XP to level up at least twice
          const requiredForLevel1 = calculateExperienceForLevel(level);
          const requiredForLevel2 = calculateExperienceForLevel(level + 1);
          const totalExp = requiredForLevel1 + requiredForLevel2 + 50;
          
          const player = createMockPlayer(level, totalExp);
          const originalLevel = player.level;
          
          // Process level-up
          const levelsGained = processLevelUp(player);
          
          // Property: Should gain at least 2 levels
          // and final level should match levels gained
          return (
            levelsGained >= 2 &&
            player.level === originalLevel + levelsGained &&
            player.experience >= 0
          );
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });

  it('should conserve total experience progress across level-ups', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        experienceArbitrary,
        (level, experience) => {
          const player = createMockPlayer(level, experience);
          
          // Calculate total "progress" before level-up
          // This is a rough measure: sum of all XP needed for previous levels + current XP
          let totalProgressBefore = experience;
          for (let i = 1; i < level; i++) {
            totalProgressBefore += calculateExperienceForLevel(i);
          }
          
          // Process level-up
          processLevelUp(player);
          
          // Calculate total "progress" after level-up
          let totalProgressAfter = player.experience;
          for (let i = 1; i < player.level; i++) {
            totalProgressAfter += calculateExperienceForLevel(i);
          }
          
          // Property: Total progress should be conserved (no XP lost)
          return totalProgressBefore === totalProgressAfter;
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });

  it('should maintain level and experience invariants after processing', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        experienceArbitrary,
        (level, experience) => {
          const player = createMockPlayer(level, experience);
          
          // Process level-up
          processLevelUp(player);
          
          // Property: After processing, player should not be able to level up again
          // (all possible level-ups should have been processed)
          const result = checkLevelUp(player);
          
          return (
            result.levelUp === false &&
            player.level >= level &&
            player.experience >= 0
          );
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });

  it('should handle edge case of exactly required experience', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        (level) => {
          const requiredExp = calculateExperienceForLevel(level);
          const player = createMockPlayer(level, requiredExp);
          
          // Process level-up
          processLevelUp(player);
          
          // Property: Should level up exactly once with 0 overflow
          return (
            player.level === level + 1 &&
            player.experience === 0
          );
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });

  it('should not modify player when experience is insufficient', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        (level) => {
          const requiredExp = calculateExperienceForLevel(level);
          const insufficientExp = Math.max(0, requiredExp - 1);
          const player = createMockPlayer(level, insufficientExp);
          
          const originalLevel = player.level;
          const originalExp = player.experience;
          
          // Process level-up (should do nothing)
          const levelsGained = processLevelUp(player);
          
          // Property: Player state should remain unchanged
          return (
            levelsGained === 0 &&
            player.level === originalLevel &&
            player.experience === originalExp
          );
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });

  it('should handle zero experience correctly', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        (level) => {
          const player = createMockPlayer(level, 0);
          
          // Check level-up
          const result = checkLevelUp(player);
          
          // Property: Should not level up with 0 experience
          return result.levelUp === false;
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });

  it('should maintain monotonic level progression', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        experienceArbitrary,
        (level, experience) => {
          const player = createMockPlayer(level, experience);
          const originalLevel = player.level;
          
          // Process level-up
          processLevelUp(player);
          
          // Property: New level should always be >= original level
          return player.level >= originalLevel;
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });
});
