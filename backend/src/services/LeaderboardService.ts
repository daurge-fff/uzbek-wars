/**
 * Leaderboard Service
 * 
 * Manages leaderboard/ranking system including:
 * - Global leaderboard (by level)
 * - City leaderboard (by level within city)
 * - Soms leaderboard (by wealth)
 * - Player rank calculation
 * 
 * Requirements: 21.1, 21.2, 21.3, 21.4, 21.6
 */

import { Player } from '../models/Player';
import { logger } from '../utils/logger';

/**
 * Leaderboard entry interface
 */
export interface LeaderboardEntry {
  rank: number;
  player: {
    id: string;
    displayName: string;
    level: number;
    soms: number;
    cityId: string;
    characterId: string;
  };
}

/**
 * Leaderboard result interface
 */
export interface LeaderboardResult {
  leaderboard: LeaderboardEntry[];
  currentPlayerRank?: number;
  totalPlayers: number;
}

/**
 * Gets global leaderboard sorted by level
 * 
 * Returns top players sorted by:
 * 1. Level (descending)
 * 2. Experience (descending) - tiebreaker
 * 3. Soms (descending) - second tiebreaker
 * 
 * Requirements: 21.1, 21.4
 * 
 * @param limit - Number of top players to return (default: 10)
 * @param currentPlayerId - Optional player ID to calculate rank
 * @returns Leaderboard with top players
 */
export async function getGlobalLeaderboard(
  limit: number = 10,
  currentPlayerId?: string
): Promise<LeaderboardResult> {
  try {
    // Get top players
    const topPlayers = await Player.find()
      .sort({ level: -1, experience: -1, soms: -1 })
      .limit(limit)
      .populate('userId', 'displayName');

    // Build leaderboard entries, filtering out players with missing users
    const leaderboard: LeaderboardEntry[] = topPlayers
      .filter(player => player.userId && (player.userId as any).displayName)
      .map((player, index) => ({
        rank: index + 1,
        player: {
          id: player._id.toString(),
          displayName: (player.userId as any).displayName,
          level: player.level,
          soms: player.soms,
          cityId: player.cityId,
          characterId: player.characterId
        }
      }));

    // Calculate current player rank if provided
    let currentPlayerRank: number | undefined;
    if (currentPlayerId) {
      currentPlayerRank = await getPlayerGlobalRank(currentPlayerId);
    }

    // Get total player count
    const totalPlayers = await Player.countDocuments();

    return {
      leaderboard,
      currentPlayerRank,
      totalPlayers
    };
  } catch (error) {
    logger.error('Error getting global leaderboard:', error);
    return {
      leaderboard: [],
      totalPlayers: 0
    };
  }
}

/**
 * Gets city leaderboard sorted by level
 * 
 * Returns top players in specific city sorted by:
 * 1. Level (descending)
 * 2. Experience (descending) - tiebreaker
 * 
 * Requirements: 21.2, 21.3, 21.4
 * 
 * @param cityId - City identifier
 * @param limit - Number of top players to return (default: 10)
 * @param currentPlayerId - Optional player ID to calculate rank
 * @returns Leaderboard with top players in city
 */
export async function getCityLeaderboard(
  cityId: string,
  limit: number = 10,
  currentPlayerId?: string
): Promise<LeaderboardResult> {
  try {
    // Get top players in city
    const topPlayers = await Player.find({ cityId })
      .sort({ level: -1, experience: -1 })
      .limit(limit)
      .populate('userId', 'displayName');

    // Build leaderboard entries, filtering out players with missing users
    const leaderboard: LeaderboardEntry[] = topPlayers
      .filter(player => player.userId && (player.userId as any).displayName)
      .map((player, index) => ({
        rank: index + 1,
        player: {
          id: player._id.toString(),
          displayName: (player.userId as any).displayName,
          level: player.level,
          soms: player.soms,
          cityId: player.cityId,
          characterId: player.characterId
        }
      }));

    // Calculate current player rank if provided
    let currentPlayerRank: number | undefined;
    if (currentPlayerId) {
      currentPlayerRank = await getPlayerCityRank(currentPlayerId, cityId);
    }

    // Get total players in city
    const totalPlayers = await Player.countDocuments({ cityId });

    return {
      leaderboard,
      currentPlayerRank,
      totalPlayers
    };
  } catch (error) {
    logger.error('Error getting city leaderboard:', error);
    return {
      leaderboard: [],
      totalPlayers: 0
    };
  }
}

/**
 * Gets soms leaderboard (wealth ranking)
 * 
 * Returns top players sorted by soms (wealth)
 * 
 * Requirements: 21.2
 * 
 * @param limit - Number of top players to return (default: 10)
 * @param currentPlayerId - Optional player ID to calculate rank
 * @returns Leaderboard with wealthiest players
 */
export async function getSomsLeaderboard(
  limit: number = 10,
  currentPlayerId?: string
): Promise<LeaderboardResult> {
  try {
    // Get top players by soms
    const topPlayers = await Player.find()
      .sort({ soms: -1, level: -1 })
      .limit(limit)
      .populate('userId', 'displayName');

    // Build leaderboard entries, filtering out players with missing users
    const leaderboard: LeaderboardEntry[] = topPlayers
      .filter(player => player.userId && (player.userId as any).displayName)
      .map((player, index) => ({
        rank: index + 1,
        player: {
          id: player._id.toString(),
          displayName: (player.userId as any).displayName,
          level: player.level,
          soms: player.soms,
          cityId: player.cityId,
          characterId: player.characterId
        }
      }));

    // Calculate current player rank if provided
    let currentPlayerRank: number | undefined;
    if (currentPlayerId) {
      currentPlayerRank = await getPlayerSomsRank(currentPlayerId);
    }

    // Get total player count
    const totalPlayers = await Player.countDocuments();

    return {
      leaderboard,
      currentPlayerRank,
      totalPlayers
    };
  } catch (error) {
    logger.error('Error getting soms leaderboard:', error);
    return {
      leaderboard: [],
      totalPlayers: 0
    };
  }
}

/**
 * Gets player's global rank
 * 
 * Calculates player's position in global leaderboard
 * 
 * Requirements: 21.6
 * 
 * @param playerId - Player's database ID
 * @returns Player's rank (1-based) or undefined if not found
 */
export async function getPlayerGlobalRank(playerId: string): Promise<number | undefined> {
  try {
    const player = await Player.findById(playerId);
    if (!player) {
      return undefined;
    }

    // Count players with higher level
    const higherLevelCount = await Player.countDocuments({
      level: { $gt: player.level }
    });

    // Count players with same level but higher experience
    const sameLevelHigherExpCount = await Player.countDocuments({
      level: player.level,
      experience: { $gt: player.experience }
    });

    // Count players with same level and experience but higher soms
    const sameLevelSameExpHigherSomsCount = await Player.countDocuments({
      level: player.level,
      experience: player.experience,
      soms: { $gt: player.soms }
    });

    // Rank is 1 + number of players ahead
    const rank = 1 + higherLevelCount + sameLevelHigherExpCount + sameLevelSameExpHigherSomsCount;

    return rank;
  } catch (error) {
    logger.error('Error getting player global rank:', error);
    return undefined;
  }
}

/**
 * Gets player's city rank
 * 
 * Calculates player's position within their city
 * 
 * Requirements: 21.6
 * 
 * @param playerId - Player's database ID
 * @param cityId - City identifier
 * @returns Player's rank (1-based) or undefined if not found
 */
export async function getPlayerCityRank(
  playerId: string,
  cityId: string
): Promise<number | undefined> {
  try {
    const player = await Player.findById(playerId);
    if (!player || player.cityId !== cityId) {
      return undefined;
    }

    // Count players in same city with higher level
    const higherLevelCount = await Player.countDocuments({
      cityId,
      level: { $gt: player.level }
    });

    // Count players in same city with same level but higher experience
    const sameLevelHigherExpCount = await Player.countDocuments({
      cityId,
      level: player.level,
      experience: { $gt: player.experience }
    });

    // Rank is 1 + number of players ahead
    const rank = 1 + higherLevelCount + sameLevelHigherExpCount;

    return rank;
  } catch (error) {
    logger.error('Error getting player city rank:', error);
    return undefined;
  }
}

/**
 * Gets player's soms rank
 * 
 * Calculates player's position in wealth ranking
 * 
 * Requirements: 21.6
 * 
 * @param playerId - Player's database ID
 * @returns Player's rank (1-based) or undefined if not found
 */
export async function getPlayerSomsRank(playerId: string): Promise<number | undefined> {
  try {
    const player = await Player.findById(playerId);
    if (!player) {
      return undefined;
    }

    // Count players with more soms
    const higherSomsCount = await Player.countDocuments({
      soms: { $gt: player.soms }
    });

    // Count players with same soms but higher level (tiebreaker)
    const sameSomsHigherLevelCount = await Player.countDocuments({
      soms: player.soms,
      level: { $gt: player.level }
    });

    // Rank is 1 + number of players ahead
    const rank = 1 + higherSomsCount + sameSomsHigherLevelCount;

    return rank;
  } catch (error) {
    logger.error('Error getting player soms rank:', error);
    return undefined;
  }
}
