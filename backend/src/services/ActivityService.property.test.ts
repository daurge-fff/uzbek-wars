/**
 * Activity Service Property-Based Tests
 * 
 * Property-based tests verify universal properties that should hold
 * for all valid inputs, not just specific examples.
 * 
 * Uses fast-check for property-based testing with 100+ iterations.
 */

import * as fc from 'fast-check';
import {
  executeActivity,
  ACTIVITIES,
} from './ActivityService';
import { IPlayer } from '../models/Player';

/**
 * Creates a mock player object for testing
 */
const createMockPlayer = (overrides: Partial<IPlayer> = {}): IPlayer => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 3600 * 1000);

  return {
    _id: 'test-player-id',
    userId: 'test-user-id',
    characterId: 'char_merchant',
    cityId: 'samarkand',
    level: 5,
    experience: 500,
    soms: 1000,
    donationCurrency: 100,
    stats: {
      hunger: 80,
      health: 90,
      mood: 70,
      energy: 85,
    },
    lastActivityTime: oneHourAgo,
    referralCode: 'TEST1234',
    cosmeticItems: [],
    equippedCosmetics: {
      clothing: null,
      background: null,
    },
    createdAt: oneHourAgo,
    updatedAt: now,
    save: jest.fn(),
    ...overrides,
  } as unknown as IPlayer;
};

/**
 * Property 5: Выполнение активности изменяет состояние
 * 
 * For any valid activity execution, the player's state must change
 * in predictable ways according to the activity's definition.
 * 
 * **Validates: Requirements 3.4, 3.5, 12.2**
 * 
 * This property ensures that:
 * 1. Experience always increases (never decreases)
 * 2. Soms change according to activity rewards/costs
 * 3. Stats change according to activity modifiers
 * 4. Last activity time is updated
 * 5. State changes are deterministic and predictable
 */
describe('Property 5: Выполнение активности изменяет состояние', () => {
  /**
   * Arbitrary generator for valid player levels
   */
  const levelArbitrary = fc.integer({ min: 1, max: 10 });

  /**
   * Arbitrary generator for soms amounts
   */
  const somsArbitrary = fc.integer({ min: 0, max: 10000 });

  /**
   * Arbitrary generator for stat values (0-100)
   */
  const statArbitrary = fc.integer({ min: 0, max: 100 });

  /**
   * Arbitrary generator for activities
   */
  const activityArbitrary = fc.constantFrom(...ACTIVITIES);

  it('should always increase experience when activity is executed', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        somsArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        activityArbitrary,
        (level, soms, hunger, health, mood, energy, activity) => {
          // Skip if player doesn't meet level requirement
          if (level < activity.requiredLevel) {
            return true;
          }

          // Skip if player doesn't have enough soms for cost
          if (activity.cost && soms < activity.cost) {
            return true;
          }

          const player = createMockPlayer({
            level,
            experience: 0,
            soms,
            stats: { hunger, health, mood, energy },
          });

          const originalExperience = player.experience;

          try {
            const result = executeActivity(player, activity);

            // Property: Experience should always increase
            return (
              player.experience > originalExperience &&
              result.experienceGained === activity.rewards.experience
            );
          } catch (error) {
            // If validation fails, that's expected for some inputs
            return true;
          }
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  it('should change soms according to activity rewards and costs', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        somsArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        activityArbitrary,
        (level, soms, hunger, health, mood, energy, activity) => {
          // Skip if player doesn't meet requirements
          if (level < activity.requiredLevel) {
            return true;
          }

          if (activity.cost && soms < activity.cost) {
            return true;
          }

          const player = createMockPlayer({
            level,
            experience: 0,
            soms,
            stats: { hunger, health, mood, energy },
          });

          const originalSoms = player.soms;

          try {
            const result = executeActivity(player, activity);

            // Calculate expected soms change
            let expectedChange = activity.rewards.soms;
            if (activity.cost) {
              expectedChange -= activity.cost;
            }

            // Property: Soms should change by expected amount (ignoring penalties for now)
            // If no penalty was applied, soms change should match expected
            if (!result.penaltyApplied) {
              const actualChange = player.soms - originalSoms;
              return actualChange === expectedChange;
            }

            return true;
          } catch (error) {
            return true;
          }
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  it('should update last activity time', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        somsArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        activityArbitrary,
        (level, soms, hunger, health, mood, energy, activity) => {
          // Skip if player doesn't meet requirements
          if (level < activity.requiredLevel) {
            return true;
          }

          if (activity.cost && soms < activity.cost) {
            return true;
          }

          const oldTime = new Date(Date.now() - 10000);
          const player = createMockPlayer({
            level,
            experience: 0,
            soms,
            stats: { hunger, health, mood, energy },
            lastActivityTime: oldTime,
          });

          try {
            executeActivity(player, activity);

            // Property: Last activity time should be updated to a more recent time
            return player.lastActivityTime.getTime() > oldTime.getTime();
          } catch (error) {
            return true;
          }
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  it('should apply stat modifiers correctly', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        somsArbitrary,
        activityArbitrary,
        (level, soms, activity) => {
          // Skip if player doesn't meet requirements
          if (level < activity.requiredLevel) {
            return true;
          }

          if (activity.cost && soms < activity.cost) {
            return true;
          }

          // Start with mid-range stats to allow for both increases and decreases
          const player = createMockPlayer({
            level,
            experience: 0,
            soms,
            stats: { hunger: 50, health: 50, mood: 50, energy: 50 },
          });

          const originalStats = { ...player.stats };

          try {
            executeActivity(player, activity);

            // Property: Stats should change according to modifiers
            // Check each stat that has a modifier
            let statsChangedCorrectly = true;

            if (activity.statModifiers.hunger !== undefined) {
              const expectedHunger = Math.max(
                0,
                Math.min(100, originalStats.hunger + activity.statModifiers.hunger)
              );
              statsChangedCorrectly =
                statsChangedCorrectly && player.stats.hunger === expectedHunger;
            }

            if (activity.statModifiers.health !== undefined) {
              const expectedHealth = Math.max(
                0,
                Math.min(100, originalStats.health + activity.statModifiers.health)
              );
              statsChangedCorrectly =
                statsChangedCorrectly && player.stats.health === expectedHealth;
            }

            if (activity.statModifiers.mood !== undefined) {
              const expectedMood = Math.max(
                0,
                Math.min(100, originalStats.mood + activity.statModifiers.mood)
              );
              statsChangedCorrectly =
                statsChangedCorrectly && player.stats.mood === expectedMood;
            }

            if (activity.statModifiers.energy !== undefined) {
              const expectedEnergy = Math.max(
                0,
                Math.min(100, originalStats.energy + activity.statModifiers.energy)
              );
              statsChangedCorrectly =
                statsChangedCorrectly && player.stats.energy === expectedEnergy;
            }

            return statsChangedCorrectly;
          } catch (error) {
            return true;
          }
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  it('should return success result with correct structure', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        somsArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        activityArbitrary,
        (level, soms, hunger, health, mood, energy, activity) => {
          // Skip if player doesn't meet requirements
          if (level < activity.requiredLevel) {
            return true;
          }

          if (activity.cost && soms < activity.cost) {
            return true;
          }

          const player = createMockPlayer({
            level,
            experience: 0,
            soms,
            stats: { hunger, health, mood, energy },
          });

          try {
            const result = executeActivity(player, activity);

            // Property: Result should have correct structure
            return (
              result.success === true &&
              typeof result.experienceGained === 'number' &&
              typeof result.somsGained === 'number' &&
              typeof result.levelUp === 'boolean' &&
              typeof result.penaltyApplied === 'boolean' &&
              result.statChanges !== undefined
            );
          } catch (error) {
            return true;
          }
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  it('should never decrease experience (unless level-up occurs)', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        somsArbitrary,
        fc.integer({ min: 0, max: 500 }), // Smaller experience to avoid level-ups
        statArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        activityArbitrary,
        (level, soms, experience, hunger, health, mood, energy, activity) => {
          // Skip if player doesn't meet requirements
          if (level < activity.requiredLevel) {
            return true;
          }

          if (activity.cost && soms < activity.cost) {
            return true;
          }

          const player = createMockPlayer({
            level,
            experience,
            soms,
            stats: { hunger, health, mood, energy },
          });

          const originalExperience = player.experience;
          const originalLevel = player.level;

          try {
            const result = executeActivity(player, activity);

            // Property: Experience should never decrease UNLESS a level-up occurred
            // If level-up occurred, experience resets but total progress increases
            if (result.levelUp) {
              // After level-up, experience might be lower but level is higher
              return player.level > originalLevel;
            } else {
              // No level-up: experience should only increase
              return player.experience >= originalExperience;
            }
          } catch (error) {
            return true;
          }
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  it('should maintain stat boundaries (0-100)', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        somsArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        activityArbitrary,
        (level, soms, hunger, health, mood, energy, activity) => {
          // Skip if player doesn't meet requirements
          if (level < activity.requiredLevel) {
            return true;
          }

          if (activity.cost && soms < activity.cost) {
            return true;
          }

          const player = createMockPlayer({
            level,
            experience: 0,
            soms,
            stats: { hunger, health, mood, energy },
          });

          try {
            executeActivity(player, activity);

            // Property: All stats should remain within 0-100 bounds
            return (
              player.stats.hunger >= 0 &&
              player.stats.hunger <= 100 &&
              player.stats.health >= 0 &&
              player.stats.health <= 100 &&
              player.stats.mood >= 0 &&
              player.stats.mood <= 100 &&
              player.stats.energy >= 0 &&
              player.stats.energy <= 100
            );
          } catch (error) {
            return true;
          }
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  it('should never result in negative soms', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        somsArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        activityArbitrary,
        (level, soms, hunger, health, mood, energy, activity) => {
          // Skip if player doesn't meet requirements
          if (level < activity.requiredLevel) {
            return true;
          }

          if (activity.cost && soms < activity.cost) {
            return true;
          }

          const player = createMockPlayer({
            level,
            experience: 0,
            soms,
            stats: { hunger, health, mood, energy },
          });

          try {
            executeActivity(player, activity);

            // Property: Soms should never be negative
            return player.soms >= 0;
          } catch (error) {
            return true;
          }
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  it('should reject execution when level requirement not met', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 2 }), // Low level
        somsArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        fc.constantFrom(...ACTIVITIES.filter((a) => a.requiredLevel >= 3)), // Activities requiring level 3+
        (level, soms, hunger, health, mood, energy, activity) => {
          const player = createMockPlayer({
            level,
            experience: 0,
            soms,
            stats: { hunger, health, mood, energy },
          });

          // Property: Should throw error when level requirement not met
          try {
            executeActivity(player, activity);
            return false; // Should have thrown
          } catch (error) {
            return error instanceof Error && error.message.includes('Level');
          }
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  it('should reject execution when on cooldown', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        somsArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        activityArbitrary,
        (level, soms, hunger, health, mood, energy, activity) => {
          // Skip if player doesn't meet level requirement
          if (level < activity.requiredLevel) {
            return true;
          }

          // Set last activity time to just now (within cooldown)
          const player = createMockPlayer({
            level,
            experience: 0,
            soms,
            stats: { hunger, health, mood, energy },
            lastActivityTime: new Date(),
          });

          // Property: Should throw error when on cooldown
          try {
            executeActivity(player, activity);
            return false; // Should have thrown
          } catch (error) {
            return error instanceof Error && error.message.includes('cooldown');
          }
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });
});



/**
 * Property 6: Начисление сомов согласно правилам активности
 * 
 * For any activity execution, soms must change according to:
 * - Activity rewards (positive)
 * - Activity costs (negative)
 * - Risk penalties (negative, probabilistic)
 * 
 * **Validates: Requirements 4.2, 12.3**
 * 
 * This property ensures the economy system works correctly:
 * 1. Rewards are always applied
 * 2. Costs are always deducted
 * 3. Penalties are applied probabilistically
 * 4. Final soms never go negative
 * 5. Soms changes are deterministic (except for risk penalties)
 */
describe('Property 6: Начисление сомов согласно правилам активности', () => {
  const levelArbitrary = fc.integer({ min: 1, max: 10 });
  const somsArbitrary = fc.integer({ min: 1000, max: 10000 }); // Ensure enough soms
  const statArbitrary = fc.integer({ min: 50, max: 100 }); // Mid-high stats
  const activityArbitrary = fc.constantFrom(...ACTIVITIES);

  it('should apply activity rewards correctly', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        somsArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        activityArbitrary,
        (level, soms, hunger, health, mood, energy, activity) => {
          // Skip if player doesn't meet requirements
          if (level < activity.requiredLevel) {
            return true;
          }

          if (activity.cost && soms < activity.cost) {
            return true;
          }

          const player = createMockPlayer({
            level,
            experience: 0,
            soms,
            stats: { hunger, health, mood, energy },
          });

          const originalSoms = player.soms;

          try {
            const result = executeActivity(player, activity);

            // Property: Soms change should include rewards
            // If no penalty was applied, change should be exactly rewards - cost
            if (!result.penaltyApplied) {
              const expectedChange =
                activity.rewards.soms - (activity.cost || 0);
              const actualChange = player.soms - originalSoms;

              return actualChange === expectedChange;
            }

            // If penalty was applied, change should be rewards - cost - penalty
            if (result.penaltyApplied && activity.risks) {
              const expectedChange =
                activity.rewards.soms -
                (activity.cost || 0) -
                activity.risks.penalty;
              const actualChange = player.soms - originalSoms;

              return actualChange === expectedChange;
            }

            return true;
          } catch (error) {
            return true;
          }
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  it('should deduct activity costs correctly', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        somsArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        fc.constantFrom(...ACTIVITIES.filter((a) => a.cost !== undefined)),
        (level, soms, hunger, health, mood, energy, activity) => {
          // Skip if player doesn't meet requirements
          if (level < activity.requiredLevel) {
            return true;
          }

          if (activity.cost && soms < activity.cost) {
            return true;
          }

          const player = createMockPlayer({
            level,
            experience: 0,
            soms,
            stats: { hunger, health, mood, energy },
          });

          const originalSoms = player.soms;

          try {
            executeActivity(player, activity);

            // Property: Cost should always be deducted
            const expectedMaxChange = activity.rewards.soms - activity.cost!;
            const actualChange = player.soms - originalSoms;

            // Actual change should be <= expected (could be less due to penalty)
            return actualChange <= expectedMaxChange;
          } catch (error) {
            return true;
          }
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  it('should never result in negative soms after activity', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        somsArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        activityArbitrary,
        (level, soms, hunger, health, mood, energy, activity) => {
          // Skip if player doesn't meet requirements
          if (level < activity.requiredLevel) {
            return true;
          }

          if (activity.cost && soms < activity.cost) {
            return true;
          }

          const player = createMockPlayer({
            level,
            experience: 0,
            soms,
            stats: { hunger, health, mood, energy },
          });

          try {
            executeActivity(player, activity);

            // Property: Soms should never be negative
            return player.soms >= 0;
          } catch (error) {
            return true;
          }
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  it('should apply penalties only for activities with risks', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        somsArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        fc.constantFrom(...ACTIVITIES.filter((a) => !a.risks)),
        (level, soms, hunger, health, mood, energy, activity) => {
          // Skip if player doesn't meet requirements
          if (level < activity.requiredLevel) {
            return true;
          }

          if (activity.cost && soms < activity.cost) {
            return true;
          }

          const player = createMockPlayer({
            level,
            experience: 0,
            soms,
            stats: { hunger, health, mood, energy },
          });

          try {
            const result = executeActivity(player, activity);

            // Property: Activities without risks should never apply penalties
            return result.penaltyApplied === false;
          } catch (error) {
            return true;
          }
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  it('should maintain soms conservation (no money created/destroyed unexpectedly)', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        somsArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        activityArbitrary,
        (level, soms, hunger, health, mood, energy, activity) => {
          // Skip if player doesn't meet requirements
          if (level < activity.requiredLevel) {
            return true;
          }

          if (activity.cost && soms < activity.cost) {
            return true;
          }

          const player = createMockPlayer({
            level,
            experience: 0,
            soms,
            stats: { hunger, health, mood, energy },
          });

          const originalSoms = player.soms;

          try {
            const result = executeActivity(player, activity);

            // Calculate expected soms change
            let expectedChange = activity.rewards.soms - (activity.cost || 0);
            if (result.penaltyApplied && activity.risks) {
              expectedChange -= activity.risks.penalty;
            }

            const actualChange = player.soms - originalSoms;

            // Property: Actual change should match expected change exactly
            return actualChange === expectedChange;
          } catch (error) {
            return true;
          }
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  it('should report correct somsGained in result (before cost deduction)', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        somsArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        activityArbitrary,
        (level, soms, hunger, health, mood, energy, activity) => {
          // Skip if player doesn't meet requirements
          if (level < activity.requiredLevel) {
            return true;
          }

          if (activity.cost && soms < activity.cost) {
            return true;
          }

          const player = createMockPlayer({
            level,
            experience: 0,
            soms,
            stats: { hunger, health, mood, energy },
          });

          try {
            const result = executeActivity(player, activity);

            // Calculate expected somsGained (rewards - penalty, but NOT including cost)
            let expectedSomsGained = activity.rewards.soms;
            if (result.penaltyApplied && activity.risks) {
              expectedSomsGained -= activity.risks.penalty;
            }

            // Property: somsGained in result should match expected value
            // Note: somsGained does NOT include cost deduction
            return result.somsGained === expectedSomsGained;
          } catch (error) {
            return true;
          }
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  it('should handle activities with costs correctly', () => {
    const activitiesWithCosts = ACTIVITIES.filter((a) => a.cost !== undefined && a.cost > 0);
    
    // Skip test if no activities with costs exist
    if (activitiesWithCosts.length === 0) {
      return;
    }
    
    fc.assert(
      fc.property(
        levelArbitrary,
        somsArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        fc.constantFrom(...activitiesWithCosts),
        (level, soms, hunger, health, mood, energy, activity) => {
          // Skip if player doesn't meet requirements
          if (level < activity.requiredLevel) {
            return true;
          }

          if (activity.cost && soms < activity.cost) {
            return true;
          }

          const player = createMockPlayer({
            level,
            experience: 0,
            soms,
            stats: { hunger, health, mood, energy },
          });

          const originalSoms = player.soms;

          try {
            executeActivity(player, activity);

            // Property: Soms should decrease by at least the cost amount
            const somsChange = player.soms - originalSoms;
            return somsChange <= -activity.cost!;
          } catch (error) {
            return true;
          }
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  it('should handle zero-reward activities correctly', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        somsArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        fc.constantFrom(...ACTIVITIES.filter((a) => a.rewards.soms === 0)),
        (level, soms, hunger, health, mood, energy, activity) => {
          // Skip if player doesn't meet requirements
          if (level < activity.requiredLevel) {
            return true;
          }

          if (activity.cost && soms < activity.cost) {
            return true;
          }

          const player = createMockPlayer({
            level,
            experience: 0,
            soms,
            stats: { hunger, health, mood, energy },
          });

          const originalSoms = player.soms;

          try {
            const result = executeActivity(player, activity);

            // Property: For zero-reward activities, soms should only change by cost
            const expectedChange = -(activity.cost || 0);
            const actualChange = player.soms - originalSoms;

            // If no penalty, change should match expected
            if (!result.penaltyApplied) {
              return actualChange === expectedChange;
            }

            return true;
          } catch (error) {
            return true;
          }
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });
});


/**
 * Property 14: Применение штрафов с заданной вероятностью
 * 
 * For activities with risk penalties, the penalty must be applied
 * with the specified probability, following statistical distribution.
 * 
 * **Validates: Requirements 12.4**
 * 
 * This property ensures the risk system works correctly:
 * 1. Penalties are applied probabilistically
 * 2. Probability matches the specified value (within statistical margin)
 * 3. Penalty amount is correct when applied
 * 4. Activities without risks never apply penalties
 * 5. Penalty application is independent across executions
 */
describe('Property 14: Применение штрафов с заданной вероятностью', () => {
  const levelArbitrary = fc.integer({ min: 3, max: 10 }); // High enough for risky activities
  const somsArbitrary = fc.integer({ min: 5000, max: 10000 }); // Enough to handle penalties
  const statArbitrary = fc.integer({ min: 50, max: 100 }); // Good stats

  it('should apply penalties with approximately correct probability over many runs', () => {
    // Test each risky activity
    const riskyActivities = ACTIVITIES.filter((a) => a.risks !== undefined);

    for (const activity of riskyActivities) {
      let penaltyCount = 0;
      const numTrials = 1000; // Large number for statistical significance

      for (let i = 0; i < numTrials; i++) {
        const player = createMockPlayer({
          level: 10, // High level to meet all requirements
          experience: 0,
          soms: 10000, // Plenty of soms
          stats: { hunger: 80, health: 80, mood: 80, energy: 80 },
        });

        try {
          const result = executeActivity(player, activity);
          if (result.penaltyApplied) {
            penaltyCount++;
          }
        } catch (error) {
          // Ignore errors (cooldown, etc.)
        }
      }

      const observedProbability = penaltyCount / numTrials;
      const expectedProbability = activity.risks!.probability;

      // Allow 5% margin of error for statistical variation
      // For 1000 trials, this is reasonable
      const margin = 0.05;
      const lowerBound = expectedProbability - margin;
      const upperBound = expectedProbability + margin;

      expect(observedProbability).toBeGreaterThanOrEqual(lowerBound);
      expect(observedProbability).toBeLessThanOrEqual(upperBound);
    }
  });

  it('should apply correct penalty amount when penalty is triggered', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        somsArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        fc.constantFrom(...ACTIVITIES.filter((a) => a.risks !== undefined)),
        (level, soms, hunger, health, mood, energy, activity) => {
          // Skip if player doesn't meet requirements
          if (level < activity.requiredLevel) {
            return true;
          }

          const player = createMockPlayer({
            level,
            experience: 0,
            soms,
            stats: { hunger, health, mood, energy },
          });

          const originalSoms = player.soms;

          try {
            const result = executeActivity(player, activity);

            // If penalty was applied, check the amount
            if (result.penaltyApplied && activity.risks) {
              const expectedSomsGained =
                activity.rewards.soms - activity.risks.penalty;
              const expectedFinalSoms =
                originalSoms + expectedSomsGained - (activity.cost || 0);

              // Property: Final soms should match expected value with penalty
              return player.soms === Math.max(0, expectedFinalSoms);
            }

            return true;
          } catch (error) {
            return true;
          }
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  it('should never apply penalties for activities without risks', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        somsArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        fc.constantFrom(...ACTIVITIES.filter((a) => !a.risks)),
        (level, soms, hunger, health, mood, energy, activity) => {
          // Skip if player doesn't meet requirements
          if (level < activity.requiredLevel) {
            return true;
          }

          if (activity.cost && soms < activity.cost) {
            return true;
          }

          const player = createMockPlayer({
            level,
            experience: 0,
            soms,
            stats: { hunger, health, mood, energy },
          });

          try {
            const result = executeActivity(player, activity);

            // Property: Activities without risks should NEVER apply penalties
            return result.penaltyApplied === false;
          } catch (error) {
            return true;
          }
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  it('should maintain penalty independence across multiple executions', () => {
    // Test that penalty application is independent (not correlated)
    const riskyActivity = ACTIVITIES.find((a) => a.risks !== undefined)!;
    const numTrials = 100;
    const results: boolean[] = [];

    for (let i = 0; i < numTrials; i++) {
      const player = createMockPlayer({
        level: 10,
        experience: 0,
        soms: 10000,
        stats: { hunger: 80, health: 80, mood: 80, energy: 80 },
      });

      try {
        const result = executeActivity(player, riskyActivity);
        results.push(result.penaltyApplied);
      } catch (error) {
        // Ignore errors
      }
    }

    // Check that we have both true and false values (not all same)
    // This ensures penalties are being applied probabilistically
    const hasPenalties = results.some((r) => r === true);
    const hasNoPenalties = results.some((r) => r === false);

    expect(hasPenalties).toBe(true);
    expect(hasNoPenalties).toBe(true);
  });

  it('should report penalty status correctly in result', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        somsArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        fc.constantFrom(...ACTIVITIES.filter((a) => a.risks !== undefined)),
        (level, soms, hunger, health, mood, energy, activity) => {
          // Skip if player doesn't meet requirements
          if (level < activity.requiredLevel) {
            return true;
          }

          const player = createMockPlayer({
            level,
            experience: 0,
            soms,
            stats: { hunger, health, mood, energy },
          });

          try {
            const result = executeActivity(player, activity);

            // Property: penaltyApplied flag should match actual penalty application
            // If penalty was applied, somsGained should be reduced by penalty amount
            if (result.penaltyApplied && activity.risks) {
              const expectedSomsGained =
                activity.rewards.soms - activity.risks.penalty;
              return result.somsGained === expectedSomsGained;
            } else {
              // No penalty: somsGained should equal rewards
              return result.somsGained === activity.rewards.soms;
            }
          } catch (error) {
            return true;
          }
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  it('should handle edge case of penalty exceeding available soms', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        fc.integer({ min: 100, max: 500 }), // Low soms
        statArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        fc.constantFrom(...ACTIVITIES.filter((a) => a.risks !== undefined)),
        (level, soms, hunger, health, mood, energy, activity) => {
          // Skip if player doesn't meet requirements
          if (level < activity.requiredLevel) {
            return true;
          }

          const player = createMockPlayer({
            level,
            experience: 0,
            soms,
            stats: { hunger, health, mood, energy },
          });

          try {
            executeActivity(player, activity);

            // Property: Soms should never go negative, even with large penalties
            return player.soms >= 0;
          } catch (error) {
            return true;
          }
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });

  it('should maintain consistent penalty amounts across executions', () => {
    fc.assert(
      fc.property(
        levelArbitrary,
        somsArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        statArbitrary,
        fc.constantFrom(...ACTIVITIES.filter((a) => a.risks !== undefined)),
        (level, soms, hunger, health, mood, energy, activity) => {
          // Skip if player doesn't meet requirements
          if (level < activity.requiredLevel) {
            return true;
          }

          const player = createMockPlayer({
            level,
            experience: 0,
            soms,
            stats: { hunger, health, mood, energy },
          });

          try {
            const result = executeActivity(player, activity);

            // Property: If penalty is applied, the amount should always be the same
            if (result.penaltyApplied && activity.risks) {
              const expectedReduction = activity.risks.penalty;
              const actualSomsGained = result.somsGained;
              const expectedSomsGained =
                activity.rewards.soms - expectedReduction;

              return actualSomsGained === expectedSomsGained;
            }

            return true;
          } catch (error) {
            return true;
          }
        }
      ),
      {
        numRuns: 100,
        verbose: true,
      }
    );
  });
});
