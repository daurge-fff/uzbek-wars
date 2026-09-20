/**
 * Cosmetic Service
 * 
 * Manages cosmetic items system including:
 * - Cosmetic item catalog
 * - Purchase validation and processing
 * - Equipment management
 * - Player cosmetic collection
 * 
 * Requirements: 16.3, 16.4, 16.5
 */

import { Player } from '../models/Player';
import { CosmeticItem } from '../models/CosmeticItem';
import { logger } from '../utils/logger';
import { applyShopDiscount } from './CharacterBonusService';
import { calculateCombatPower } from './CombatStatsService';
import { CosmeticBonusService } from './CosmeticBonusService';

/**
 * Cosmetic purchase result
 */
export interface CosmeticPurchaseResult {
  success: boolean;
  item?: {
    id: string;
    name: string;
    type: string;
    rarity: string;
  };
  remainingCurrency: number;
  error?: string;
}

/**
 * Gets all available cosmetic items
 * 
 * Returns all cosmetic items from database
 * Used for displaying shop catalog
 * 
 * @param type - Optional filter by type (clothing/background)
 * @param rarity - Optional filter by rarity
 * @returns Array of cosmetic items
 */
export async function getAllCosmetics(
  type?: string,
  rarity?: string
): Promise<any[]> {
  try {
    const filter: any = {};

    if (type) {
      filter.type = type;
    }

    if (rarity) {
      filter.rarity = rarity;
    }

    const cosmetics = await CosmeticItem.find(filter).sort({ price: 1 });
    return cosmetics;
  } catch (error) {
    logger.error('Error getting cosmetics:', error);
    return [];
  }
}

/**
 * Gets cosmetic item by ID
 * 
 * @param itemId - Cosmetic item ID
 * @returns Cosmetic item or null
 */
export async function getCosmeticById(itemId: string) {
  try {
    return await CosmeticItem.findOne({ itemId });
  } catch (error) {
    logger.error('Error getting cosmetic by ID:', error);
    return null;
  }
}

/**
 * Purchases a cosmetic item
 * 
 * Process:
 * 1. Validate player has enough donation currency
 * 2. Check if player already owns the item
 * 3. Deduct currency from player
 * 4. Add item to player's collection
 * 
 * Requirements: 16.3
 * 
 * @param playerId - Player's database ID
 * @param itemId - Cosmetic item ID
 * @returns Purchase result
 */
export async function purchaseCosmetic(
  playerId: string,
  itemId: string
): Promise<CosmeticPurchaseResult> {
  try {
    // Find player
    const player = await Player.findById(playerId);
    if (!player) {
      return {
        success: false,
        remainingCurrency: 0,
        error: 'Player not found'
      };
    }

    // Find cosmetic item
    const cosmetic = await getCosmeticById(itemId);
    if (!cosmetic) {
      return {
        success: false,
        remainingCurrency: player.donationCurrency,
        error: 'Cosmetic item not found'
      };
    }

    // Check if player already owns the item
    const ownedItems = cosmetic.type === 'clothing'
      ? player.cosmetics.clothing
      : player.cosmetics.backgrounds;

    const alreadyOwned = ownedItems.includes(itemId);
    if (alreadyOwned) {
      return {
        success: false,
        remainingCurrency: player.donationCurrency,
        error: 'Item already owned'
      };
    }

    // Apply character class discount
    const finalPrice = applyShopDiscount(cosmetic.price, player.characterId);

    // Check if player has enough currency
    if (player.donationCurrency < finalPrice) {
      return {
        success: false,
        remainingCurrency: player.donationCurrency,
        error: `Insufficient crystals. Required: ${finalPrice}, Available: ${player.donationCurrency}`
      };
    }

    // Deduct currency
    player.donationCurrency -= finalPrice;

    // Add item to collection
    if (cosmetic.type === 'clothing') {
      player.cosmetics.clothing.push(itemId);
    } else {
      player.cosmetics.backgrounds.push(itemId);
    }

    await player.save();

    logger.info(`Cosmetic purchased`, {
      playerId,
      itemId,
      price: cosmetic.price,
      remainingCurrency: player.donationCurrency
    });

    return {
      success: true,
      item: {
        id: cosmetic.itemId,
        name: cosmetic.name.en,
        type: cosmetic.type,
        rarity: cosmetic.rarity
      },
      remainingCurrency: player.donationCurrency
    };
  } catch (error) {
    logger.error('Error purchasing cosmetic:', error);
    throw error;
  }
}

/**
 * Equips a cosmetic item
 * 
 * Process:
 * 1. Validate player owns the item
 * 2. Unequip current item of same type (if any)
 * 3. Equip new item
 * 
 * Requirements: 16.4, 16.5
 * 
 * @param playerId - Player's database ID
 * @param itemId - Cosmetic item ID
 * @returns Success status
 */
export async function equipCosmetic(
  playerId: string,
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find player
    const player = await Player.findById(playerId);
    if (!player) {
      return {
        success: false,
        error: 'Player not found'
      };
    }

    // Find cosmetic item
    const cosmetic = await getCosmeticById(itemId);
    if (!cosmetic) {
      return {
        success: false,
        error: 'Cosmetic item not found'
      };
    }

    // Check if player owns the item
    const ownedItems = cosmetic.type === 'clothing'
      ? player.cosmetics.clothing
      : player.cosmetics.backgrounds;

    const ownsItem = ownedItems.includes(itemId);
    if (!ownsItem) {
      return {
        success: false,
        error: 'Item not owned'
      };
    }

    // Equip item based on type and slot
    if (cosmetic.type === 'clothing' || cosmetic.type === 'equipment') {
      const slot = cosmetic.slot;
      if (slot === 'head') player.cosmetics.equippedHead = itemId;
      else if (slot === 'body') player.cosmetics.equippedBody = itemId;
      else if (slot === 'feet') player.cosmetics.equippedFeet = itemId;
      else if (slot === 'backpack') player.cosmetics.activeBackpack = itemId;
      else if (slot === 'accessory') player.cosmetics.equippedAccessory = itemId;
      else player.cosmetics.activeClothing = itemId; // Fallback
    } else if (cosmetic.type === 'background') {
      player.cosmetics.activeBackground = itemId;
    } else if (cosmetic.type === 'backpack') {
      player.cosmetics.activeBackpack = itemId;
    } else {
      return {
        success: false,
        error: 'Invalid cosmetic type'
      };
    }

    // Recalculate combat power after equipment change
    const equipmentStats = await CosmeticBonusService.getTotalEquipmentStats(player);
    const baseStats = player.combatStats;
    const combinedStats = {
      strength: baseStats.strength + equipmentStats.strength,
      defense: baseStats.defense + equipmentStats.defense,
      agility: baseStats.agility + equipmentStats.agility,
      stamina: baseStats.stamina + equipmentStats.stamina,
      intelligence: baseStats.intelligence + equipmentStats.intelligence,
      luck: baseStats.luck + equipmentStats.luck,
      statPoints: baseStats.statPoints
    };

    player.combatStats.combatPower = calculateCombatPower(combinedStats);

    await player.save();

    logger.info(`Item equipped and power recalculated`, {
      playerId,
      itemId,
      type: cosmetic.type,
      newPower: player.combatStats.combatPower
    });

    return { success: true };
  } catch (error) {
    logger.error('Error equipping cosmetic:', error);
    throw error;
  }
}

/**
 * Unequips a cosmetic item
 * 
 * @param playerId - Player's database ID
 * @param type - Cosmetic type (clothing/background)
 * @returns Success status
 */
export async function unequipCosmetic(
  playerId: string,
  type: 'clothing' | 'background'
): Promise<{ success: boolean; error?: string }> {
  try {
    const player = await Player.findById(playerId);
    if (!player) {
      return {
        success: false,
        error: 'Player not found'
      };
    }

    if (type === 'clothing') {
      player.cosmetics.activeClothing = undefined;
      player.cosmetics.equippedHead = undefined;
      player.cosmetics.equippedBody = undefined;
      player.cosmetics.equippedFeet = undefined;
    } else if (type === 'background') {
      player.cosmetics.activeBackground = undefined;
    } else if ((type as string) === 'accessory') {
      player.cosmetics.equippedAccessory = undefined;
    } else if ((type as string) === 'backpack') {
      player.cosmetics.activeBackpack = undefined;
    } else {
      return {
        success: false,
        error: 'Invalid cosmetic type'
      };
    }

    // Recalculate combat power after equipment change
    const equipmentStats = await CosmeticBonusService.getTotalEquipmentStats(player);
    const baseStats = player.combatStats;
    const combinedStats = {
      strength: baseStats.strength + equipmentStats.strength,
      defense: baseStats.defense + equipmentStats.defense,
      agility: baseStats.agility + equipmentStats.agility,
      stamina: baseStats.stamina + equipmentStats.stamina,
      intelligence: baseStats.intelligence + equipmentStats.intelligence,
      luck: baseStats.luck + equipmentStats.luck,
      statPoints: baseStats.statPoints
    };

    player.combatStats.combatPower = calculateCombatPower(combinedStats);

    await player.save();

    logger.info(`Cosmetic unequipped`, {
      playerId,
      type
    });

    return { success: true };
  } catch (error) {
    logger.error('Error unequipping cosmetic:', error);
    throw error;
  }
}

/**
 * Gets player's cosmetic collection
 * 
 * Returns all cosmetics owned by player with equipped status
 * 
 * @param playerId - Player's database ID
 * @returns Player's cosmetic collection
 */
export async function getPlayerCosmetics(playerId: string): Promise<{
  owned: any[];
  equipped: {
    clothing: any | null;
    background: any | null;
  };
}> {
  try {
    const player = await Player.findById(playerId);
    if (!player) {
      return {
        owned: [],
        equipped: {
          clothing: null,
          background: null
        }
      };
    }

    // Get all owned cosmetics
    const allOwnedIds = [
      ...player.cosmetics.clothing,
      ...player.cosmetics.backgrounds
    ];

    const ownedCosmetics = await CosmeticItem.find({
      itemId: { $in: allOwnedIds }
    });

    // Get equipped cosmetics
    let equippedClothing = null;
    let equippedBackground = null;

    if (player.cosmetics.activeClothing) {
      equippedClothing = await getCosmeticById(player.cosmetics.activeClothing);
    }

    if (player.cosmetics.activeBackground) {
      equippedBackground = await getCosmeticById(player.cosmetics.activeBackground);
    }

    return {
      owned: ownedCosmetics,
      equipped: {
        clothing: equippedClothing,
        background: equippedBackground
      }
    };
  } catch (error) {
    logger.error('Error getting player cosmetics:', error);
    return {
      owned: [],
      equipped: {
        clothing: null,
        background: null
      }
    };
  }
}

/**
 * Gets cosmetics by rarity
 * 
 * Used for filtering shop by rarity tiers
 * 
 * @param rarity - Rarity level
 * @returns Array of cosmetics
 */
export async function getCosmeticsByRarity(
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
): Promise<any[]> {
  return getAllCosmetics(undefined, rarity);
}

/**
 * Gets cosmetics by type
 * 
 * Used for filtering shop by item type
 * 
 * @param type - Cosmetic type
 * @returns Array of cosmetics
 */
export async function getCosmeticsByType(
  type: 'clothing' | 'background'
): Promise<any[]> {
  return getAllCosmetics(type);
}
