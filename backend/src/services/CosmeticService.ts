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
import { getShopItem, getSellRefund } from '../data/shopCatalog';

/**
 * Item shape used by equip/unequip/sell. Shop items come from the static catalog,
 * seeded items come from the `CosmeticItem` collection; both satisfy this shape.
 */
export interface ResolvedCosmetic {
  itemId: string;
  type: string;
  slot?: string;
  rarity: string;
  name?: any;
  stats?: Record<string, number | undefined>;
  bonus?: any;
  price?: number;
  priceSoms?: number;
  priceCrystals?: number;
}

/** Every list of owned items, regardless of the item type */
function getOwnedLists(player: any): string[][] {
  const cosmetics = player.cosmetics || {};
  return [
    cosmetics.clothing || [],
    cosmetics.backgrounds || [],
    cosmetics.accessories || [],
    cosmetics.backpacks || [],
    cosmetics.equipment || [],
    cosmetics.consumables || [],
  ];
}

/** True when the player owns the item in any of the inventory lists */
export function isItemOwned(player: any, itemId: string): boolean {
  return getOwnedLists(player).some((list) => list.includes(itemId));
}

/** Removes the item from every owned list */
function removeFromOwned(player: any, itemId: string): void {
  getOwnedLists(player).forEach((list) => {
    const index = list.indexOf(itemId);
    if (index >= 0) list.splice(index, 1);
  });
}

/**
 * Recomputes combat power from base stats + equipment bonus.
 *
 * Base `combatStats` are never modified by equipment: bonuses are added on the fly,
 * so unequipping or selling an item can not corrupt the player's own stats.
 */
async function recalculateCombatPower(player: any): Promise<void> {
  const effective = await CosmeticBonusService.getEffectiveCombatStats(player);
  player.combatStats.combatPower = calculateCombatPower(effective);
}

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
/**
 * Looks up a cosmetic item.
 *
 * Shop items live in the static shop catalog while seeded items live in the
 * `CosmeticItem` collection. Equipping used to look in the collection only, so every
 * item bought in the shop was reported as "not owned" and could never be worn.
 */
export async function getCosmeticById(itemId: string): Promise<ResolvedCosmetic | null> {
  try {
    const dbItem = await CosmeticItem.findOne({ itemId });
    if (dbItem) return dbItem as unknown as ResolvedCosmetic;

    const catalogItem = getShopItem(itemId);
    if (!catalogItem) return null;

    return {
      itemId: catalogItem.id,
      type: catalogItem.type,
      slot: catalogItem.slot,
      rarity: catalogItem.rarity,
      name: catalogItem.name,
      stats: catalogItem.stats as Record<string, number | undefined> | undefined,
      bonus: catalogItem.bonus,
      priceSoms: catalogItem.priceSoms,
      priceCrystals: catalogItem.priceCrystals,
    };
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
    const basePrice = cosmetic.price ?? cosmetic.priceSoms ?? cosmetic.priceCrystals ?? 0;
    const finalPrice = applyShopDiscount(basePrice, player.characterId);

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
    } else if (cosmetic.type === 'background') {
      player.cosmetics.backgrounds.push(itemId);
    } else if (cosmetic.type === 'accessory') {
      player.cosmetics.accessories.push(itemId);
    } else if (cosmetic.type === 'equipment') {
      if (!player.cosmetics.equipment) player.cosmetics.equipment = [];
      player.cosmetics.equipment.push(itemId);
    } else if (cosmetic.type === 'backpack') {
      player.cosmetics.backpacks.push(itemId);
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
        name: cosmetic.name?.en ?? cosmetic.itemId,
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

    // Check ownership across all inventory lists (clothing/backgrounds/accessories/equipment/...)
    if (!isItemOwned(player, itemId)) {
      return {
        success: false,
        error: 'Item not owned'
      };
    }

    // Equip item into its slot
    const type = String(cosmetic.type);
    const slot = String(cosmetic.slot || '');

    if (type === 'clothing' || type === 'equipment') {
      if (slot === 'head') player.cosmetics.equippedHead = itemId;
      else if (slot === 'body') player.cosmetics.equippedBody = itemId;
      else if (slot === 'feet') player.cosmetics.equippedFeet = itemId;
      else if (slot === 'weapon') player.cosmetics.equippedWeapon = itemId;
      else if (slot === 'backpack') player.cosmetics.activeBackpack = itemId;
      else if (slot === 'accessory') player.cosmetics.equippedAccessory = itemId;
      else player.cosmetics.activeClothing = itemId; // Fallback
    } else if (type === 'background') {
      player.cosmetics.activeBackground = itemId;
    } else if (type === 'backpack') {
      player.cosmetics.activeBackpack = itemId;
    } else if (type === 'accessory') {
      player.cosmetics.equippedAccessory = itemId;
    } else {
      return {
        success: false,
        error: 'Invalid cosmetic type'
      };
    }

    // Recalculate combat power after equipment change
    await recalculateCombatPower(player);

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
 * Unequips a cosmetic item.
 *
 * Accepts an item id (preferred) or a legacy slot type. Clears every slot that holds
 * the item, so the frontend can simply send the item it wants to take off.
 *
 * @param playerId - Player's database ID
 * @param itemIdOrType - Item id, or a legacy type name (clothing/background/...)
 * @returns Success status
 */
export async function unequipCosmetic(
  playerId: string,
  itemIdOrType: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const player = await Player.findById(playerId);
    if (!player) {
      return {
        success: false,
        error: 'Player not found'
      };
    }

    const legacyTypes = ['clothing', 'background', 'accessory', 'backpack', 'equipment'];
    const cosmetics: any = player.cosmetics;

    if (legacyTypes.includes(itemIdOrType)) {
      // Legacy call: clear the slots that belong to a whole category
      if (itemIdOrType === 'clothing' || itemIdOrType === 'equipment') {
        cosmetics.activeClothing = undefined;
        cosmetics.equippedHead = undefined;
        cosmetics.equippedBody = undefined;
        cosmetics.equippedFeet = undefined;
        cosmetics.equippedWeapon = undefined;
        cosmetics.equippedAccessory = undefined;
      } else if (itemIdOrType === 'background') {
        cosmetics.activeBackground = undefined;
      } else if (itemIdOrType === 'accessory') {
        cosmetics.equippedAccessory = undefined;
        cosmetics.activeAccessory = undefined;
      } else if (itemIdOrType === 'backpack') {
        cosmetics.activeBackpack = undefined;
      }
    } else {
      // Preferred call: drop this exact item from any slot that references it
      const slotFields = [
        'activeClothing',
        'activeBackground',
        'activeAccessory',
        'activeBackpack',
        'equippedHead',
        'equippedBody',
        'equippedFeet',
        'equippedWeapon',
        'equippedAccessory',
      ];

      let cleared = false;
      slotFields.forEach((field) => {
        if (cosmetics[field] === itemIdOrType) {
          cosmetics[field] = undefined;
          cleared = true;
        }
      });

      if (!cleared) {
        return {
          success: false,
          error: 'Item is not equipped'
        };
      }
    }

    // Recalculate combat power after equipment change
    await recalculateCombatPower(player);
    await player.save();

    logger.info(`Cosmetic unequipped`, {
      playerId,
      itemIdOrType
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

/**
 * Sells an owned item back to the shop for part of its price.
 *
 * Removes the item from every owned list and clears any slot that referenced it.
 * Base stats are never touched: equipment bonuses are computed on the fly, so
 * selling or unequipping can not corrupt the player's own stats.
 *
 * @param playerId - Player's database ID
 * @param itemId - Item to sell
 * @returns Refund details
 */
export async function sellCosmetic(
  playerId: string,
  itemId: string
): Promise<{ success: boolean; error?: string; refund?: { currency: 'soms' | 'crystals'; amount: number } }> {
  try {
    const player = await Player.findById(playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    if (!isItemOwned(player, itemId)) {
      return { success: false, error: 'Item not owned' };
    }

    const refund = getSellRefund(itemId);
    if (!refund) {
      return { success: false, error: 'Item cannot be sold' };
    }

    removeFromOwned(player, itemId);

    const cosmetics: any = player.cosmetics;
    const slotFields = [
      'activeClothing',
      'activeBackground',
      'activeAccessory',
      'activeBackpack',
      'equippedHead',
      'equippedBody',
      'equippedFeet',
      'equippedWeapon',
      'equippedAccessory',
    ];
    slotFields.forEach((field) => {
      if (cosmetics[field] === itemId) {
        cosmetics[field] = undefined;
      }
    });

    if (refund.currency === 'soms') {
      player.soms += refund.amount;
    } else {
      player.donationCurrency = (player.donationCurrency || 0) + refund.amount;
    }

    await recalculateCombatPower(player);
    await player.save();

    logger.info(`Cosmetic sold`, { playerId, itemId, refund });

    return { success: true, refund };
  } catch (error) {
    logger.error('Error selling cosmetic:', error);
    throw error;
  }
}
