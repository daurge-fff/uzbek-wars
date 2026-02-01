import { IPlayer, IPlayerStats } from '../models/Player';

/**
 * Stat modifiers applied to player characteristics
 * Used by activities and other game mechanics to modify stats
 */
export interface StatModifiers {
  hunger?: number;
  health?: number;
  mood?: number;
  energy?: number;
}

/**
 * Configuration for passive stat decay rates
 * Stats decay over time when player is inactive
 */
const DECAY_CONFIG = {
  DECAY_PER_HOUR: 5, // Base decay rate per hour
  MOOD_DECAY_MULTIPLIER: 0.5, // Mood decays at half the rate
  CRITICAL_THRESHOLD: 20, // Stats below this trigger penalties
  HUNGER_HEALTH_PENALTY: 10, // Health penalty when hunger is critical
  ENERGY_MOOD_PENALTY: 10, // Mood penalty when energy is critical
};

/**
 * Updates player stats with given modifiers
 * 
 * Clamps all stats to valid range [0, 100] to prevent overflow/underflow.
 * This is the primary method for modifying player characteristics from activities.
 * 
 * @param player - Player document to modify
 * @param modifiers - Stat changes to apply (positive or negative)
 */
export function updatePlayerStats(player: IPlayer, modifiers: StatModifiers): void {
  if (modifiers.hunger !== undefined) {
    player.stats.hunger = clampStat(player.stats.hunger + modifiers.hunger);
  }
  if (modifiers.health !== undefined) {
    player.stats.health = clampStat(player.stats.health + modifiers.health);
  }
  if (modifiers.mood !== undefined) {
    player.stats.mood = clampStat(player.stats.mood + modifiers.mood);
  }
  if (modifiers.energy !== undefined) {
    player.stats.energy = clampStat(player.stats.energy + modifiers.energy);
  }
}

/**
 * Applies passive decay to player stats based on time elapsed
 * 
 * Stats naturally decrease over time to encourage regular gameplay.
 * Decay rate is 5 points per hour for hunger/energy, 2.5 for mood.
 * Critical stats (< 20) trigger additional penalties to other stats.
 * 
 * @param player - Player document to apply decay to
 * @returns void - Modifies player stats in place
 */
export async function applyPassiveDecay(player: IPlayer): Promise<void> {
  const now = Date.now();
  const lastActivity = player.lastActivityTime.getTime();
  const hoursPassed = (now - lastActivity) / (1000 * 60 * 60);

  // Calculate decay amount based on time elapsed
  const decay = Math.floor(hoursPassed * DECAY_CONFIG.DECAY_PER_HOUR);
  const moodDecay = Math.floor(decay * DECAY_CONFIG.MOOD_DECAY_MULTIPLIER);

  // Apply passive decay to stats
  updatePlayerStats(player, {
    hunger: -decay,
    energy: -decay,
    mood: -moodDecay,
  });

  // Apply critical penalties when stats are dangerously low
  applyCriticalPenalties(player);
}

/**
 * Applies penalties when stats reach critical levels
 * 
 * Low hunger damages health, low energy damages mood.
 * This creates cascading effects that encourage players to maintain all stats.
 * 
 * @param player - Player document to check and penalize
 */
function applyCriticalPenalties(player: IPlayer): void {
  // Critical hunger damages health
  if (player.stats.hunger < DECAY_CONFIG.CRITICAL_THRESHOLD) {
    player.stats.health = Math.max(
      0,
      player.stats.health - DECAY_CONFIG.HUNGER_HEALTH_PENALTY
    );
  }

  // Critical energy damages mood
  if (player.stats.energy < DECAY_CONFIG.CRITICAL_THRESHOLD) {
    player.stats.mood = Math.max(
      0,
      player.stats.mood - DECAY_CONFIG.ENERGY_MOOD_PENALTY
    );
  }
}

/**
 * Clamps a stat value to valid range [0, 100]
 * 
 * @param value - Raw stat value to clamp
 * @returns Clamped value between 0 and 100
 */
function clampStat(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/**
 * Gets current stat values for a player
 * 
 * @param player - Player document
 * @returns Copy of player stats
 */
export function getPlayerStats(player: IPlayer): IPlayerStats {
  return {
    hunger: player.stats.hunger,
    health: player.stats.health,
    mood: player.stats.mood,
    energy: player.stats.energy,
  };
}

/**
 * Checks if any player stat is in critical condition
 * 
 * @param player - Player document to check
 * @returns true if any stat is below critical threshold
 */
export function hasAnyCriticalStat(player: IPlayer): boolean {
  return (
    player.stats.hunger < DECAY_CONFIG.CRITICAL_THRESHOLD ||
    player.stats.health < DECAY_CONFIG.CRITICAL_THRESHOLD ||
    player.stats.mood < DECAY_CONFIG.CRITICAL_THRESHOLD ||
    player.stats.energy < DECAY_CONFIG.CRITICAL_THRESHOLD
  );
}

/**
 * Gets list of critical stats for a player
 * 
 * @param player - Player document to check
 * @returns Array of stat names that are critical
 */
export function getCriticalStats(player: IPlayer): string[] {
  const critical: string[] = [];
  
  if (player.stats.hunger < DECAY_CONFIG.CRITICAL_THRESHOLD) {
    critical.push('hunger');
  }
  if (player.stats.health < DECAY_CONFIG.CRITICAL_THRESHOLD) {
    critical.push('health');
  }
  if (player.stats.mood < DECAY_CONFIG.CRITICAL_THRESHOLD) {
    critical.push('mood');
  }
  if (player.stats.energy < DECAY_CONFIG.CRITICAL_THRESHOLD) {
    critical.push('energy');
  }
  
  return critical;
}
