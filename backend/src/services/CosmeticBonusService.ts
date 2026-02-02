import { IPlayer } from '../models/Player';

/**
 * Cosmetic Bonus Service
 * Calculates and applies bonuses from equipped cosmetic items
 */

interface CosmeticBonus {
  type: 'xp' | 'soms' | 'health' | 'hunger' | 'mood' | 'energy';
  value: number;
}

const COSMETIC_BONUSES: Record<string, CosmeticBonus> = {
  '1': { type: 'xp', value: 5 },        // Тюбетейка: +5% XP
  '2': { type: 'soms', value: 25 },     // Золотая корона: +25% soms
  '3': { type: 'mood', value: 10 },     // Регистан: +10% mood
  '4': { type: 'soms', value: 10 },     // Золотые серьги: +10% soms
  '5': { type: 'health', value: 5 },    // Чапан: +5% health
  '6': { type: 'hunger', value: 3 },    // Самса: +3% hunger
  '7': { type: 'xp', value: 3 },        // Плов: +3% XP
  '8': { type: 'xp', value: 15 }        // Бухара: +15% XP
};

export class CosmeticBonusService {
  /**
   * Get all active bonuses from equipped cosmetics
   */
  static getActiveBonuses(player: IPlayer): CosmeticBonus[] {
    const equippedItems = [
      player.cosmetics?.activeClothing,
      player.cosmetics?.activeBackground,
      player.cosmetics?.activeAccessory
    ].filter(Boolean) as string[];

    return equippedItems
      .map(itemId => COSMETIC_BONUSES[itemId])
      .filter(Boolean);
  }

  /**
   * Calculate XP multiplier from equipped items
   */
  static getXPMultiplier(player: IPlayer): number {
    const bonuses = this.getActiveBonuses(player);
    const xpBonuses = bonuses.filter(b => b.type === 'xp');
    const totalBonus = xpBonuses.reduce((sum, b) => sum + b.value, 0);
    return 1 + (totalBonus / 100); // Convert percentage to multiplier
  }

  /**
   * Calculate soms multiplier from equipped items
   */
  static getSomsMultiplier(player: IPlayer): number {
    const bonuses = this.getActiveBonuses(player);
    const somsBonuses = bonuses.filter(b => b.type === 'soms');
    const totalBonus = somsBonuses.reduce((sum, b) => sum + b.value, 0);
    return 1 + (totalBonus / 100);
  }

  /**
   * Calculate stat bonus from equipped items
   */
  static getStatBonus(player: IPlayer, stat: 'health' | 'hunger' | 'mood' | 'energy'): number {
    const bonuses = this.getActiveBonuses(player);
    const statBonuses = bonuses.filter(b => b.type === stat);
    const totalBonus = statBonuses.reduce((sum, b) => sum + b.value, 0);
    return totalBonus; // Return absolute bonus value
  }

  /**
   * Apply XP bonus to earned XP
   */
  static applyXPBonus(player: IPlayer, baseXP: number): number {
    const multiplier = this.getXPMultiplier(player);
    return Math.floor(baseXP * multiplier);
  }

  /**
   * Apply soms bonus to earned soms
   */
  static applySomsBonus(player: IPlayer, baseSoms: number): number {
    const multiplier = this.getSomsMultiplier(player);
    return Math.floor(baseSoms * multiplier);
  }

  /**
   * Apply stat bonuses to activity effects
   */
  static applyStatBonuses(player: IPlayer, effects: {
    hunger?: number;
    health?: number;
    mood?: number;
    energy?: number;
  }): typeof effects {
    const result = { ...effects };

    if (effects.health !== undefined) {
      const bonus = this.getStatBonus(player, 'health');
      result.health = Math.min(100, effects.health + bonus);
    }

    if (effects.hunger !== undefined) {
      const bonus = this.getStatBonus(player, 'hunger');
      result.hunger = Math.min(100, effects.hunger + bonus);
    }

    if (effects.mood !== undefined) {
      const bonus = this.getStatBonus(player, 'mood');
      result.mood = Math.min(100, effects.mood + bonus);
    }

    if (effects.energy !== undefined) {
      const bonus = this.getStatBonus(player, 'energy');
      result.energy = Math.min(100, effects.energy + bonus);
    }

    return result;
  }

  /**
   * Get summary of all active bonuses for display
   */
  static getBonusSummary(player: IPlayer): {
    xp: number;
    soms: number;
    health: number;
    hunger: number;
    mood: number;
    energy: number;
  } {
    return {
      xp: (this.getXPMultiplier(player) - 1) * 100,
      soms: (this.getSomsMultiplier(player) - 1) * 100,
      health: this.getStatBonus(player, 'health'),
      hunger: this.getStatBonus(player, 'hunger'),
      mood: this.getStatBonus(player, 'mood'),
      energy: this.getStatBonus(player, 'energy')
    };
  }
}
