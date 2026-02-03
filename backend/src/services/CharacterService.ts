/**
 * Character Service
 * 
 * Handles character-related business logic including:
 * - Character retrieval
 * - Player character selection
 * - City assignment
 * - Referral code processing
 */

import { Player, IPlayer } from '../models/Player';
import { User } from '../models/User';
import { getCityById } from './CityService';
import { logger } from '../utils/logger';
import { CHARACTERS } from '../scripts/seed';

/**
 * Character definition with multilingual support
 */
export interface ICharacter {
  id: string;
  avatar: string;
  name: {
    ru: string;
    uz: string;
    uk: string;
    en: string;
  };
  description: {
    ru: string;
    uz: string;
    uk: string;
    en: string;
  };
}

/**
 * Request payload for character selection
 */
export interface ISelectCharacterRequest {
  characterId: string;
  cityId: string;
  referralCode?: string;
  displayName?: string;
}

/**
 * Generates a unique referral code
 * Format: 8 uppercase alphanumeric characters
 * 
 * Retries up to 5 times if collision detected.
 * Collision probability is extremely low (~1 in 2.8 trillion)
 * but we handle it defensively.
 * 
 * @returns Unique referral code
 * @throws Error if unable to generate unique code after retries
 */
export async function generateReferralCode(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const maxRetries = 5;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Check if code already exists
    const existing = await Player.findOne({ referralCode: code });
    if (!existing) {
      return code;
    }
    
    logger.warn(`Referral code collision detected: ${code}, retrying...`);
  }
  
  throw new Error('Failed to generate unique referral code after retries');
}

/**
 * Retrieves all available characters
 * 
 * Characters are defined in seed data and represent
 * different Uzbek cultural archetypes.
 * 
 * @returns Array of character definitions
 */
export function getCharacters(): ICharacter[] {
  return CHARACTERS;
}

/**
 * Validates character ID exists in available characters
 * 
 * @param characterId - Character ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidCharacter(characterId: string): boolean {
  return CHARACTERS.some(char => char.id === characterId);
}

/**
 * Handles referral registration bonus
 * 
 * When a new player registers with a referral code:
 * 1. Finds the referring player
 * 2. Awards bonus to referrer (50 crystals + 500 soms)
 * 3. Returns referrer's city for automatic assignment
 * 
 * This encourages player acquisition and ensures
 * referred players join their friend's city.
 * 
 * @param referralCode - Referral code from registration
 * @returns Referrer's city ID or null if code invalid
 */
async function processReferralCode(referralCode: string): Promise<string | null> {
  try {
    const referrer = await Player.findOne({ referralCode });
    
    if (!referrer) {
      logger.warn(`Invalid referral code used: ${referralCode}`);
      return null;
    }
    
    // Award referral bonus to referrer
    referrer.donationCurrency += 50; // 50 crystals
    referrer.soms += 500; // 500 soms
    await referrer.save();
    
    logger.info(`Referral bonus awarded to player ${referrer._id} for code ${referralCode}`);
    
    // Return referrer's city so new player joins same city
    return referrer.cityId;
  } catch (error) {
    logger.error(`Error processing referral code ${referralCode}:`, error);
    return null;
  }
}

/**
 * Selects character and city for a player
 * 
 * This is called during initial registration after Google OAuth.
 * Creates the player profile with selected character and city.
 * 
 * Process:
 * 1. Validates user exists and doesn't have player profile
 * 2. Validates character and city selections
 * 3. Processes referral code if provided
 * 4. Generates unique referral code for new player
 * 5. Creates player profile with initial stats
 * 6. Updates city player count
 * 
 * @param userId - User ID from authentication
 * @param request - Character and city selection data
 * @returns Created player profile
 * @throws Error if validation fails or player already exists
 */
export async function selectCharacter(
  userId: string,
  request: ISelectCharacterRequest
): Promise<IPlayer> {
  try {
    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if player already has character selected
    const existingPlayer = await Player.findOne({ userId });
    if (existingPlayer && existingPlayer.characterId) {
      throw new Error('Character already selected');
    }
    
    // Validate character exists
    if (!isValidCharacter(request.characterId)) {
      throw new Error(`Invalid character ID: ${request.characterId}`);
    }
    
    // Determine city assignment
    let assignedCityId = request.cityId;
    
    // Process referral code if provided
    if (request.referralCode) {
      const referrerCityId = await processReferralCode(request.referralCode);
      if (referrerCityId) {
        // Override city selection with referrer's city
        assignedCityId = referrerCityId;
        logger.info(`Player ${userId} assigned to referrer's city: ${assignedCityId}`);
      }
    }
    
    // Validate city exists and is open
    const city = await getCityById(assignedCityId);
    if (!city) {
      throw new Error(`Invalid city ID: ${assignedCityId}`);
    }
    
    if (!city.isOpen) {
      throw new Error(`City ${assignedCityId} is currently full`);
    }
    
    // Generate unique referral code for new player
    const referralCode = await generateReferralCode();
    
    // Create or update player profile
    let player: IPlayer;
    
    if (existingPlayer) {
      // Update existing player (case where player was created but character not selected)
      existingPlayer.characterId = request.characterId;
      existingPlayer.cityId = assignedCityId;
      existingPlayer.referralCode = referralCode;
      if (request.referralCode) {
        existingPlayer.referredBy = request.referralCode;
      }
      player = await existingPlayer.save();
    } else {
      // Create new player profile
      player = await Player.create({
        userId,
        characterId: request.characterId,
        cityId: assignedCityId,
        level: 1,
        experience: 0,
        soms: 100, // Starting funds
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
        referralCode,
        referredBy: request.referralCode,
        lastActivityTime: new Date(),
      });
    }
    
    // Increment city player count
    city.playerCount += 1;
    
    // Close city if it reached capacity
    if (city.playerCount >= city.maxPlayers) {
      city.isOpen = false;
      logger.info(`City ${assignedCityId} closed after reaching capacity`);
    }
    
    await city.save();
    
    logger.info(`Character selected for user ${userId}: ${request.characterId} in city ${assignedCityId}`);
    
    return player;
  } catch (error) {
    logger.error(`Error selecting character for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Gets player profile by user ID
 * 
 * @param userId - User ID from authentication
 * @returns Player profile or null if not found
 */
export async function getPlayerByUserId(userId: string): Promise<IPlayer | null> {
  try {
    return await Player.findOne({ userId });
  } catch (error) {
    logger.error(`Error getting player for user ${userId}:`, error);
    throw new Error('Failed to retrieve player profile');
  }
}
