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
    avatar?: string;
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
 * OPTIMIZED: Uses lean() for faster queries, minimal field selection
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
    // Get top players - OPTIMIZED with lean() and minimal fields
    const topPlayers = await Player.find()
      .sort({ level: -1, experience: -1, soms: -1 })
      .limit(limit)
      .select('userId level experience soms cityId characterId')
      .populate({
        path: 'userId',
        select: 'displayName avatar',
        options: { lean: true }
      })
      .lean()
      .exec();

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
          characterId: player.characterId,
          avatar: (player.userId as any).avatar
        }
      }));

    // Calculate current player rank if provided
    let currentPlayerRank: number | undefined;
    if (currentPlayerId) {
      currentPlayerRank = await getPlayerGlobalRank(currentPlayerId);
    }

    // Get total player count - OPTIMIZED with estimatedDocumentCount
    const totalPlayers = await Player.estimatedDocumentCount();

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
 * OPTIMIZED: Uses lean() for faster queries, minimal field selection
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
    // Get top players in city - OPTIMIZED
    const topPlayers = await Player.find({ cityId })
      .sort({ level: -1, experience: -1 })
      .limit(limit)
      .select('userId level experience soms cityId characterId')
      .populate({
        path: 'userId',
        select: 'displayName avatar',
        options: { lean: true }
      })
      .lean()
      .exec();

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
          characterId: player.characterId,
          avatar: (player.userId as any).avatar
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
 * OPTIMIZED: Uses lean() for faster queries
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
    // Get top players by soms - OPTIMIZED
    const topPlayers = await Player.find()
      .sort({ soms: -1, level: -1 })
      .limit(limit)
      .select('userId level soms cityId characterId')
      .populate({
        path: 'userId',
        select: 'displayName avatar',
        options: { lean: true }
      })
      .lean()
      .exec();

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
          characterId: player.characterId,
          avatar: (player.userId as any).avatar
        }
      }));

    // Calculate current player rank if provided
    let currentPlayerRank: number | undefined;
    if (currentPlayerId) {
      currentPlayerRank = await getPlayerSomsRank(currentPlayerId);
    }

    // Get total player count
    const totalPlayers = await Player.estimatedDocumentCount();

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

/**
 * Gets leaderboard by crystals (donation currency)
 * OPTIMIZED: Uses lean() and minimal field selection
 */
export async function getCrystalsLeaderboard(
  limit: number = 10,
  currentPlayerId?: string
): Promise<LeaderboardResult> {
  try {
    const topPlayers = await Player.find()
      .sort({ donationCurrency: -1, level: -1 })
      .limit(limit)
      .select('userId level soms donationCurrency cityId characterId')
      .populate({
        path: 'userId',
        select: 'displayName avatar',
        options: { lean: true }
      })
      .lean()
      .exec();

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
          characterId: player.characterId,
          avatar: (player.userId as any).avatar
        }
      }));

    let currentPlayerRank: number | undefined;
    if (currentPlayerId) {
      const player = await Player.findById(currentPlayerId).select('donationCurrency').lean();
      if (player) {
        const higherCount = await Player.countDocuments({
          donationCurrency: { $gt: player.donationCurrency }
        });
        currentPlayerRank = higherCount + 1;
      }
    }

    const totalPlayers = await Player.estimatedDocumentCount();

    return { leaderboard, currentPlayerRank, totalPlayers };
  } catch (error) {
    logger.error('Error getting crystals leaderboard:', error);
    return { leaderboard: [], totalPlayers: 0 };
  }
}

/**
 * Gets city power leaderboard (sum of all players' levels in each city)
 */
export async function getCityPowerLeaderboard(limit: number = 10): Promise<any> {
  try {
    const cityPowers = await Player.aggregate([
      {
        $group: {
          _id: '$cityId',
          totalLevel: { $sum: '$level' },
          playerCount: { $sum: 1 },
          avgLevel: { $avg: '$level' }
        }
      },
      { $sort: { totalLevel: -1 } },
      { $limit: limit }
    ]);

    return cityPowers.map((city, index) => ({
      rank: index + 1,
      cityId: city._id,
      totalLevel: city.totalLevel,
      playerCount: city.playerCount,
      avgLevel: Math.round(city.avgLevel * 10) / 10
    }));
  } catch (error) {
    logger.error('Error getting city power leaderboard:', error);
    return [];
  }
}

/**
 * Gets activity streak leaderboard (players with longest daily login streaks)
 * OPTIMIZED: Uses lean() and minimal field selection
 */
export async function getActivityStreakLeaderboard(
  limit: number = 10,
  currentPlayerId?: string
): Promise<LeaderboardResult> {
  try {
    // Сначала нужно добавить поле activityStreak в модель Player
    // Пока возвращаем пустой результат
    const topPlayers = await Player.find()
      .sort({ level: -1 }) // Временно сортируем по уровню
      .limit(limit)
      .select('userId level soms cityId characterId')
      .populate({
        path: 'userId',
        select: 'displayName avatar',
        options: { lean: true }
      })
      .lean()
      .exec();

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
          characterId: player.characterId,
          avatar: (player.userId as any).avatar
        }
      }));

    let currentPlayerRank: number | undefined;
    if (currentPlayerId) {
      currentPlayerRank = 1; // TODO: Calculate actual rank
    }

    const totalPlayers = await Player.estimatedDocumentCount();

    return { leaderboard, currentPlayerRank, totalPlayers };
  } catch (error) {
    logger.error('Error getting activity streak leaderboard:', error);
    return { leaderboard: [], totalPlayers: 0 };
  }
}

/**
 * Gets total experience leaderboard (level + experience combined)
 * OPTIMIZED: Uses lean() and minimal field selection
 */
export async function getTotalExpLeaderboard(
  limit: number = 10,
  currentPlayerId?: string
): Promise<LeaderboardResult> {
  try {
    const topPlayers = await Player.find()
      .sort({ level: -1, experience: -1 })
      .limit(limit)
      .select('userId level experience soms cityId characterId')
      .populate({
        path: 'userId',
        select: 'displayName avatar',
        options: { lean: true }
      })
      .lean()
      .exec();

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
          characterId: player.characterId,
          avatar: (player.userId as any).avatar
        }
      }));

    let currentPlayerRank: number | undefined;
    if (currentPlayerId) {
      currentPlayerRank = await getPlayerGlobalRank(currentPlayerId);
    }

    const totalPlayers = await Player.estimatedDocumentCount();

    return { leaderboard, currentPlayerRank, totalPlayers };
  } catch (error) {
    logger.error('Error getting total exp leaderboard:', error);
    return { leaderboard: [], totalPlayers: 0 };
  }
}

/**
 * Gets referral leaderboard (players with most referrals)
 * OPTIMIZED: Uses aggregation pipeline with lean()
 */
export async function getReferralLeaderboard(
  limit: number = 10,
  currentPlayerId?: string
): Promise<LeaderboardResult> {
  try {
    // Aggregate to count referrals per player - OPTIMIZED
    const referralCounts = await Player.aggregate([
      {
        $match: {
          referredBy: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$referredBy',
          referralCount: { $sum: 1 }
        }
      },
      { $sort: { referralCount: -1 } },
      { $limit: limit }
    ]);

    // Get player details for top referrers - OPTIMIZED with single query
    const referralCodes = referralCounts.map(r => r._id);
    const players = await Player.find({ referralCode: { $in: referralCodes } })
      .select('referralCode userId level soms cityId characterId')
      .populate({
        path: 'userId',
        select: 'displayName avatar',
        options: { lean: true }
      })
      .lean()
      .exec();

    // Create map for quick lookup
    const playerMap = new Map(players.map(p => [p.referralCode, p]));

    // Build leaderboard
    const leaderboard: LeaderboardEntry[] = [];
    for (let i = 0; i < referralCounts.length; i++) {
      const refCode = referralCounts[i]._id;
      const player = playerMap.get(refCode);
      
      if (player && player.userId && (player.userId as any).displayName) {
        leaderboard.push({
          rank: i + 1,
          player: {
            id: player._id.toString(),
            displayName: (player.userId as any).displayName,
            level: player.level,
            soms: player.soms,
            cityId: player.cityId,
            characterId: player.characterId,
            avatar: (player.userId as any).avatar
          }
        });
      }
    }

    let currentPlayerRank: number | undefined;
    if (currentPlayerId) {
      const player = await Player.findById(currentPlayerId).select('referralCode').lean();
      if (player) {
        const myReferralCount = await Player.countDocuments({ referredBy: player.referralCode });
        const higherCount = await Player.aggregate([
          { $match: { referredBy: { $exists: true, $ne: null } } },
          { $group: { _id: '$referredBy', count: { $sum: 1 } } },
          { $match: { count: { $gt: myReferralCount } } }
        ]);
        currentPlayerRank = higherCount.length + 1;
      }
    }

    const totalPlayers = await Player.estimatedDocumentCount();

    return { leaderboard, currentPlayerRank, totalPlayers };
  } catch (error) {
    logger.error('Error getting referral leaderboard:', error);
    return { leaderboard: [], totalPlayers: 0 };
  }
}
