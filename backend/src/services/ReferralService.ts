/**
 * Referral Service
 * 
 * Manages the referral system including:
 * - Referral code generation
 * - Referral registration handling
 * - Bonus rewards distribution
 * - Referral tracking and statistics
 */

import { Player } from '../models/Player';
import { logger } from '../utils/logger';

/**
 * Referral bonus configuration
 * Awards given to referrer when someone registers with their code
 */
export const REFERRAL_BONUS = {
  CRYSTALS: 50,  // Donation currency (crystals)
  SOMS: 500      // In-game currency (soms)
} as const;

/**
 * Referral code configuration
 */
const REFERRAL_CODE_LENGTH = 8;
const REFERRAL_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const MAX_GENERATION_RETRIES = 5;

/**
 * Generates a unique referral code
 * 
 * Creates an 8-character alphanumeric code for player referrals.
 * Format: Uppercase letters and numbers only (e.g., "A3B7XY2Z")
 * 
 * Collision handling:
 * - Checks database for uniqueness before returning
 * - Retries up to 5 times if collision detected
 * - Collision probability is ~1 in 2.8 trillion per attempt
 * 
 * @returns Unique referral code
 * @throws Error if unable to generate unique code after max retries
 */
export async function generateReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_GENERATION_RETRIES; attempt++) {
    let code = '';
    
    // Generate random 8-character code
    for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
      const randomIndex = Math.floor(Math.random() * REFERRAL_CODE_CHARS.length);
      code += REFERRAL_CODE_CHARS.charAt(randomIndex);
    }
    
    // Verify uniqueness
    const existingPlayer = await Player.findOne({ referralCode: code });
    if (!existingPlayer) {
      return code;
    }
    
    logger.warn(`Referral code collision detected: ${code}, attempt ${attempt + 1}/${MAX_GENERATION_RETRIES}`);
  }
  
  throw new Error('Failed to generate unique referral code after maximum retries');
}

/**
 * Handles referral registration and bonus distribution
 * 
 * Process:
 * 1. Validates referral code exists
 * 2. Awards bonus to referrer (50 crystals + 500 soms)
 * 3. Returns referrer's city for automatic assignment
 * 
 * This ensures:
 * - Referrers are rewarded for bringing new players
 * - New players join their friend's city automatically
 * - Social connections are maintained within cities
 * 
 * Requirements: 19.2, 19.3, 19.4
 * 
 * @param referralCode - Referral code from registration link
 * @returns Referrer's city ID if code valid, null otherwise
 */
export async function handleReferralRegistration(
  referralCode: string
): Promise<string | null> {
  try {
    // Find referrer by code
    const referrer = await Player.findOne({ referralCode });
    
    if (!referrer) {
      logger.warn(`Invalid referral code attempted: ${referralCode}`);
      return null;
    }
    
    // Award referral bonuses
    referrer.donationCurrency += REFERRAL_BONUS.CRYSTALS;
    referrer.soms += REFERRAL_BONUS.SOMS;
    await referrer.save();
    
    logger.info(`Referral bonus awarded to player ${referrer._id}`, {
      referralCode,
      crystalsAwarded: REFERRAL_BONUS.CRYSTALS,
      somsAwarded: REFERRAL_BONUS.SOMS,
      newTotals: {
        crystals: referrer.donationCurrency,
        soms: referrer.soms
      }
    });
    
    // Return referrer's city for automatic assignment
    return referrer.cityId;
  } catch (error) {
    logger.error(`Error processing referral code ${referralCode}:`, error);
    return null;
  }
}

/**
 * Gets referral statistics for a player
 * 
 * Counts how many players have registered using this player's referral code.
 * Used for displaying referral progress and achievements.
 * 
 * Requirements: 19.5
 * 
 * @param referralCode - Player's referral code
 * @returns Number of players referred
 */
export async function getReferralCount(referralCode: string): Promise<number> {
  try {
    const count = await Player.countDocuments({ referredBy: referralCode });
    return count;
  } catch (error) {
    logger.error(`Error getting referral count for ${referralCode}:`, error);
    return 0;
  }
}

/**
 * Gets list of players referred by a specific referral code
 * 
 * Returns basic information about referred players for display
 * in the referral panel. Excludes sensitive data.
 * 
 * Requirements: 19.5
 * 
 * @param referralCode - Player's referral code
 * @returns Array of referred player information
 */
export async function getReferredPlayers(referralCode: string): Promise<Array<{
  level: number;
  cityId: string;
  joinedAt: Date;
}>> {
  try {
    const referredPlayers = await Player.find(
      { referredBy: referralCode },
      { level: 1, cityId: 1, createdAt: 1 }
    ).sort({ createdAt: -1 });
    
    return referredPlayers.map(player => ({
      level: player.level,
      cityId: player.cityId,
      joinedAt: player.createdAt
    }));
  } catch (error) {
    logger.error(`Error getting referred players for ${referralCode}:`, error);
    return [];
  }
}

/**
 * Validates referral code format
 * 
 * Checks if code matches expected format without database lookup.
 * Used for client-side validation before API calls.
 * 
 * @param code - Referral code to validate
 * @returns true if format is valid
 */
export function isValidReferralCodeFormat(code: string): boolean {
  if (!code || code.length !== REFERRAL_CODE_LENGTH) {
    return false;
  }
  
  const validPattern = new RegExp(`^[${REFERRAL_CODE_CHARS}]{${REFERRAL_CODE_LENGTH}}$`);
  return validPattern.test(code);
}

/**
 * Gets player's referral information
 * 
 * Returns complete referral data for a player including:
 * - Their referral code
 * - Number of referrals
 * - List of referred players
 * - Total bonuses earned
 * 
 * Requirements: 19.5, 19.6
 * 
 * @param playerId - Player's database ID
 * @returns Referral information or null if player not found
 */
export async function getPlayerReferralInfo(playerId: string): Promise<{
  referralCode: string;
  referralCount: number;
  referredPlayers: Array<{
    level: number;
    cityId: string;
    joinedAt: Date;
  }>;
  totalBonusesEarned: {
    crystals: number;
    soms: number;
  };
} | null> {
  try {
    const player = await Player.findById(playerId);
    if (!player) {
      return null;
    }
    
    const referralCount = await getReferralCount(player.referralCode);
    const referredPlayers = await getReferredPlayers(player.referralCode);
    
    return {
      referralCode: player.referralCode,
      referralCount,
      referredPlayers,
      totalBonusesEarned: {
        crystals: referralCount * REFERRAL_BONUS.CRYSTALS,
        soms: referralCount * REFERRAL_BONUS.SOMS
      }
    };
  } catch (error) {
    logger.error(`Error getting referral info for player ${playerId}:`, error);
    return null;
  }
}
