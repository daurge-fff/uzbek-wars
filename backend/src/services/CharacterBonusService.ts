/**
 * Character Bonus Service
 * 
 * Applies character class bonuses and penalties to gameplay
 * Each character class has unique stat modifiers that affect:
 * - Income and expenses
 * - Stat recovery rates
 * - Activity durations
 * - Combat effectiveness
 */

import { ALL_CLASSES } from '../data/characters';

/**
 * Character stat modifiers interface
 */
export interface CharacterModifiers {
  // Economic modifiers
  incomeBonus?: number;
  shopDiscount?: number;
  ingredientCost?: number;
  craftingCost?: number;
  
  // Inventory modifiers
  inventoryBonus?: number;
  
  // Recovery modifiers
  energyRecovery?: number;
  foodRecovery?: number;
  healthFromFood?: number;
  
  // Drain modifiers (negative = faster drain)
  energyDrain?: number;
  hungerDrain?: number;
  healthDrain?: number;
  
  // Activity modifiers
  activityTime?: number;
  cookingSpeed?: number;
  craftingSpeed?: number;
  
  // Work modifiers
  moodFromWork?: number;
  
  // Experience modifiers
  experienceBonus?: number;
  
  // Combat modifiers
  maxHealthBonus?: number;
  damageBonus?: number;
  defenseBonus?: number;
}

/**
 * Gets character modifiers by character ID
 * Searches across all tiers
 */
export function getCharacterModifiers(characterId: string): CharacterModifiers {
  const character = ALL_CLASSES.find(c => c.id === characterId);
  if (!character) {
    return {};
  }
  
  return character.statModifiers || {};
}

/**
 * Applies income bonus to earned soms
 */
export function applyIncomeBonus(baseSoms: number, characterId: string): number {
  const modifiers = getCharacterModifiers(characterId);
  const bonus = modifiers.incomeBonus || 0;
  
  return Math.floor(baseSoms * (1 + bonus / 100));
}

/**
 * Applies shop discount to purchase price
 */
export function applyShopDiscount(basePrice: number, characterId: string): number {
  const modifiers = getCharacterModifiers(characterId);
  const discount = modifiers.shopDiscount || 0;
  
  return Math.floor(basePrice * (1 - discount / 100));
}

/**
 * Applies experience bonus to gained XP
 */
export function applyExperienceBonus(baseXP: number, characterId: string): number {
  const modifiers = getCharacterModifiers(characterId);
  const bonus = modifiers.experienceBonus || 0;
  
  return Math.floor(baseXP * (1 + bonus / 100));
}

/**
 * Applies energy recovery modifier
 */
export function applyEnergyRecovery(baseRecovery: number, characterId: string): number {
  const modifiers = getCharacterModifiers(characterId);
  const bonus = modifiers.energyRecovery || 0;
  
  return Math.floor(baseRecovery * (1 + bonus / 100));
}

/**
 * Applies food recovery modifier
 */
export function applyFoodRecovery(baseRecovery: number, characterId: string): number {
  const modifiers = getCharacterModifiers(characterId);
  const bonus = modifiers.foodRecovery || 0;
  
  return Math.floor(baseRecovery * (1 + bonus / 100));
}

/**
 * Applies health from food modifier
 */
export function applyHealthFromFood(baseHealth: number, characterId: string): number {
  const modifiers = getCharacterModifiers(characterId);
  const bonus = modifiers.healthFromFood || 0;
  
  return Math.floor(baseHealth * (1 + bonus / 100));
}

/**
 * Applies energy drain modifier (for passive decay)
 */
export function applyEnergyDrain(baseDrain: number, characterId: string): number {
  const modifiers = getCharacterModifiers(characterId);
  const penalty = modifiers.energyDrain || 0;
  
  return Math.floor(baseDrain * (1 + penalty / 100));
}

/**
 * Applies hunger drain modifier (for passive decay)
 */
export function applyHungerDrain(baseDrain: number, characterId: string): number {
  const modifiers = getCharacterModifiers(characterId);
  const penalty = modifiers.hungerDrain || 0;
  
  return Math.floor(baseDrain * (1 + penalty / 100));
}

/**
 * Applies health drain modifier (for passive decay)
 */
export function applyHealthDrain(baseDrain: number, characterId: string): number {
  const modifiers = getCharacterModifiers(characterId);
  const penalty = modifiers.healthDrain || 0;
  
  return Math.floor(baseDrain * (1 + penalty / 100));
}

/**
 * Applies activity time modifier
 */
export function applyActivityTime(baseTime: number, characterId: string): number {
  const modifiers = getCharacterModifiers(characterId);
  const penalty = modifiers.activityTime || 0;
  
  return Math.floor(baseTime * (1 + penalty / 100));
}

/**
 * Applies cooking speed modifier
 */
export function applyCookingSpeed(baseTime: number, characterId: string): number {
  const modifiers = getCharacterModifiers(characterId);
  const bonus = modifiers.cookingSpeed || 0;
  
  return Math.floor(baseTime * (1 - bonus / 100));
}

/**
 * Applies crafting speed modifier
 */
export function applyCraftingSpeed(baseTime: number, characterId: string): number {
  const modifiers = getCharacterModifiers(characterId);
  const bonus = modifiers.craftingSpeed || 0;
  
  return Math.floor(baseTime * (1 - bonus / 100));
}

/**
 * Applies crafting cost modifier
 */
export function applyCraftingCost(baseCost: number, characterId: string): number {
  const modifiers = getCharacterModifiers(characterId);
  const bonus = modifiers.craftingCost || 0;
  
  return Math.floor(baseCost * (1 + bonus / 100));
}

/**
 * Applies mood from work modifier
 */
export function applyMoodFromWork(baseMood: number, characterId: string): number {
  const modifiers = getCharacterModifiers(characterId);
  const bonus = modifiers.moodFromWork || 0;
  
  return Math.floor(baseMood * (1 + bonus / 100));
}

/**
 * Gets max health bonus
 */
export function getMaxHealthBonus(characterId: string): number {
  const modifiers = getCharacterModifiers(characterId);
  return modifiers.maxHealthBonus || 0;
}

/**
 * Gets damage bonus for combat
 */
export function getDamageBonus(characterId: string): number {
  const modifiers = getCharacterModifiers(characterId);
  return modifiers.damageBonus || 0;
}

/**
 * Gets defense bonus for combat
 */
export function getDefenseBonus(characterId: string): number {
  const modifiers = getCharacterModifiers(characterId);
  return modifiers.defenseBonus || 0;
}

/**
 * Gets inventory bonus slots
 */
export function getInventoryBonus(characterId: string): number {
  const modifiers = getCharacterModifiers(characterId);
  return modifiers.inventoryBonus || 0;
}

/**
 * Gets all character info including modifiers
 * Searches across all tiers
 */
export function getCharacterInfo(characterId: string) {
  const character = ALL_CLASSES.find(c => c.id === characterId);
  if (!character) {
    return null;
  }
  
  return {
    ...character,
    modifiers: getCharacterModifiers(characterId),
  };
}
