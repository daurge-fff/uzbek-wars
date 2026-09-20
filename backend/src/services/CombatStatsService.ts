/**
 * Combat Stats Service
 * 
 * Manages player combat statistics for PvP and city battles:
 * - Stat point allocation
 * - Stat upgrades
 * - Combat power calculation
 * - Stat resets
 */

import { Player, IPlayerCombatStats } from '../models/Player';
import { logger } from '../utils/logger';

/**
 * Calculate total combat power from all stats
 * Used for matchmaking and leaderboards
 */
export function calculateCombatPower(stats: {
  strength: number;
  defense: number;
  agility: number;
  stamina: number;
  intelligence: number;
  luck: number;
}): number {
  const { strength, defense, agility, stamina, intelligence, luck } = stats;

  // Base power from main stats
  const basePower = strength + defense + agility + stamina + intelligence;

  // Luck multiplier (0-10% bonus)
  const luckMultiplier = 1 + (luck * 0.1);

  return Math.floor(basePower * luckMultiplier);
}

/**
 * Award stat points on level up
 * Players get 5 stat points per level
 */
export async function awardStatPointsOnLevelUp(
  playerId: string,
  levelsGained: number = 1
): Promise<void> {
  try {
    const pointsToAward = levelsGained * 5;

    await Player.findByIdAndUpdate(playerId, {
      $inc: { 'combatStats.statPoints': pointsToAward }
    });

    logger.info(`Awarded ${pointsToAward} stat points to player ${playerId}`);
  } catch (error) {
    logger.error('Error awarding stat points:', error);
    throw error;
  }
}

/**
 * Allocate stat points to a specific stat
 */
export async function allocateStatPoints(
  playerId: string,
  stat: 'strength' | 'defense' | 'agility' | 'stamina' | 'intelligence',
  points: number
): Promise<IPlayerCombatStats> {
  try {
    if (points <= 0) {
      throw new Error('Points must be positive');
    }

    const player = await Player.findById(playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    // Check if player has enough stat points
    if (player.combatStats.statPoints < points) {
      throw new Error('Not enough stat points');
    }

    // Check if stat would exceed max (100)
    const currentValue = player.combatStats[stat];
    if (currentValue + points > 100) {
      throw new Error(`Cannot exceed maximum stat value of 100`);
    }

    // Allocate points
    player.combatStats[stat] += points;
    player.combatStats.statPoints -= points;

    await player.save();

    logger.info(`Player ${playerId} allocated ${points} points to ${stat}`);

    return player.combatStats;
  } catch (error) {
    logger.error('Error allocating stat points:', error);
    throw error;
  }
}

/**
 * Reset all combat stats (costs crystals)
 * Returns all allocated points back to statPoints pool
 */
export async function resetCombatStats(
  playerId: string,
  costCrystals: number = 100
): Promise<IPlayerCombatStats> {
  try {
    const player = await Player.findById(playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    // Check if player has enough crystals
    if (player.donationCurrency < costCrystals) {
      throw new Error('Not enough crystals');
    }

    // Calculate total allocated points
    const allocatedPoints =
      (player.combatStats.strength - 10) +
      (player.combatStats.defense - 10) +
      (player.combatStats.agility - 10) +
      (player.combatStats.stamina - 10) +
      (player.combatStats.intelligence - 10);

    // Reset stats to base values
    player.combatStats.strength = 10;
    player.combatStats.defense = 10;
    player.combatStats.agility = 10;
    player.combatStats.stamina = 10;
    player.combatStats.intelligence = 10;

    // Return points
    player.combatStats.statPoints += allocatedPoints;

    // Deduct crystals
    player.donationCurrency -= costCrystals;

    await player.save();

    logger.info(`Player ${playerId} reset combat stats for ${costCrystals} crystals`);

    return player.combatStats;
  } catch (error) {
    logger.error('Error resetting combat stats:', error);
    throw error;
  }
}

/**
 * Get player's combat stats
 */
export async function getCombatStats(playerId: string): Promise<IPlayerCombatStats & { combatPower: number }> {
  try {
    const player = await Player.findById(playerId).select('combatStats');
    if (!player) {
      throw new Error('Player not found');
    }

    const combatPower = calculateCombatPower(player.combatStats);

    return {
      strength: player.combatStats.strength,
      defense: player.combatStats.defense,
      agility: player.combatStats.agility,
      stamina: player.combatStats.stamina,
      intelligence: player.combatStats.intelligence,
      luck: player.combatStats.luck,
      statPoints: player.combatStats.statPoints,
      combatPower
    };
  } catch (error) {
    logger.error('Error getting combat stats:', error);
    throw error;
  }
}

/**
 * Increase luck stat (special, can only be increased through rare events/items)
 */
export async function increaseLuck(
  playerId: string,
  amount: number
): Promise<IPlayerCombatStats> {
  try {
    const player = await Player.findById(playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    // Luck is capped at 1
    const newLuck = Math.min(player.combatStats.luck + amount, 1);
    player.combatStats.luck = newLuck;

    await player.save();

    logger.info(`Player ${playerId} luck increased by ${amount} to ${newLuck}`);

    return player.combatStats;
  } catch (error) {
    logger.error('Error increasing luck:', error);
    throw error;
  }
}
