/**
 * Progression Service
 * 
 * Handles player progression mechanics including:
 * - Experience calculation for level requirements
 * - Level-up detection and processing
 * - Experience gain validation
 * 
 * The progression system uses an exponential formula to ensure
 * each level requires progressively more experience, maintaining
 * long-term engagement without excessive grinding.
 */

import { IPlayer } from '../models/Player';
import { logger } from '../utils/logger';
import { awardStatPointsOnLevelUp } from './CombatStatsService';

/**
 * Minimal player interface for progression calculations
 * Used to decouple progression logic from full Player model
 */
export interface IPlayerProgression {
  _id?: any;
  level: number;
  experience: number;
}

/**
 * Result of level-up check operation
 */
export interface ILevelUpResult {
  levelUp: boolean;
  newLevel?: number;
  experienceOverflow?: number;
}

/**
 * Calculates experience required to reach a specific level
 * 
 * Formula: experienceRequired = 100 * (1.5 ^ (level - 1))
 * 
 * This exponential formula ensures:
 * - Level 1→2: 100 XP (accessible for new players)
 * - Level 2→3: 150 XP (gradual increase)
 * - Level 5→6: 506 XP (moderate challenge)
 * - Level 10→11: 3,844 XP (significant investment)
 * 
 * The 1.5 multiplier provides steady progression without
 * becoming prohibitively grindy at higher levels.
 * 
 * @param level - Target level (must be >= 1)
 * @returns Experience points required to reach that level
 * @throws Error if level is less than 1
 */
export function calculateExperienceForLevel(level: number): number {
  if (level < 1) {
    throw new Error('Level must be at least 1');
  }
  
  // Use Math.floor to ensure integer result
  // Math.pow is more explicit than ** operator for clarity
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/**
 * Checks if player has enough experience to level up
 * 
 * Handles the core level-up logic:
 * 1. Calculates XP required for next level
 * 2. Compares player's current XP
 * 3. Returns level-up status and overflow XP
 * 
 * Overflow XP is carried forward to prevent loss of progress
 * when player gains more XP than needed for a single level.
 * 
 * Example:
 * - Player at level 5 with 600 XP
 * - Required for level 6: 506 XP
 * - Result: levelUp=true, newLevel=6, experienceOverflow=94
 * 
 * @param player - Player document with current level and experience
 * @returns Level-up result with new level and overflow XP if applicable
 */
export function checkLevelUp(player: IPlayerProgression): ILevelUpResult {
  const requiredExp = calculateExperienceForLevel(player.level);
  
  if (player.experience >= requiredExp) {
    const newLevel = player.level + 1;
    const experienceOverflow = player.experience - requiredExp;
    
    if (player._id) {
      logger.info(
        `Player ${player._id} leveled up: ${player.level} → ${newLevel} ` +
        `(overflow: ${experienceOverflow} XP)`
      );
    }
    
    return {
      levelUp: true,
      newLevel,
      experienceOverflow,
    };
  }
  
  return { levelUp: false };
}

/**
 * Processes level-up for a player
 * 
 * Applies level-up changes to player document:
 * 1. Increments level
 * 2. Resets experience to overflow amount
 * 3. Checks for consecutive level-ups (rare but possible)
 * 
 * Multiple level-ups can occur if player gains massive XP
 * from a single activity or quest reward.
 * 
 * Note: This function modifies the player object but does NOT save it.
 * Caller is responsible for persisting changes to database.
 * 
 * @param player - Player document to process level-up for
 * @returns Number of levels gained (usually 1, can be more)
 */
export function processLevelUp(player: IPlayerProgression): number {
  let levelsGained = 0;
  let levelUpResult = checkLevelUp(player);
  
  // Handle multiple level-ups in sequence
  while (levelUpResult.levelUp) {
    player.level = levelUpResult.newLevel!;
    player.experience = levelUpResult.experienceOverflow!;
    levelsGained++;
    
    // Check if player can level up again with overflow XP
    levelUpResult = checkLevelUp(player);
  }
  
  if (levelsGained > 0) {
    // Award stat points for level ups (5 points per level)
    if (player._id) {
      awardStatPointsOnLevelUp(player._id.toString(), levelsGained).catch(error => {
        logger.error('Failed to award stat points on level up:', error);
      });
    }
    
    if (levelsGained > 1 && player._id) {
      logger.info(`Player ${player._id} gained ${levelsGained} levels in one operation`);
    }
  }
  
  return levelsGained;
}

/**
 * Calculates experience progress percentage for current level
 * 
 * Useful for UI progress bars and player feedback.
 * Returns value between 0 and 100.
 * 
 * @param player - Player document with current level and experience
 * @returns Progress percentage (0-100)
 */
export function getExperienceProgress(player: IPlayer): number {
  const requiredExp = calculateExperienceForLevel(player.level);
  const progress = (player.experience / requiredExp) * 100;
  
  // Clamp to 0-100 range for safety
  return Math.min(100, Math.max(0, progress));
}
