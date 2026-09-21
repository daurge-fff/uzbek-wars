import { IPlayer } from '../models/Player';
import { CosmeticItem } from '../models/CosmeticItem';
import { getShopItem, getShopItemStats } from '../data/shopCatalog';

interface CosmeticBonus {
  type: 'xp' | 'soms' | 'health' | 'hunger' | 'mood' | 'energy' | 'strength' | 'defense' | 'agility' | 'stamina' | 'intelligence' | 'luck';
  value: number;
}

export class CosmeticBonusService {
  /**
   * Get all active bonuses from equipped items
   */
  static async getActiveBonuses(player: IPlayer): Promise<CosmeticBonus[]> {
    const equippedItemIds = [
      player.cosmetics?.activeClothing,
      player.cosmetics?.activeBackground,
      player.cosmetics?.activeAccessory,
      player.cosmetics?.equippedHead,
      player.cosmetics?.equippedBody,
      player.cosmetics?.equippedFeet,
      player.cosmetics?.equippedWeapon,
      player.cosmetics?.equippedAccessory
    ].filter(Boolean) as string[];

    if (equippedItemIds.length === 0) return [];

    const items = await CosmeticItem.find({ itemId: { $in: equippedItemIds } });
    const bonuses: CosmeticBonus[] = [];
    const foundInDatabase = new Set<string>();

    items.forEach(item => {
      foundInDatabase.add(item.itemId);
      // Background and some items still use legacy hardcoded bonuses or bonus field
      if (item.bonus) {
        if (item.bonus.inventorySlots) bonuses.push({ type: 'xp', value: 0 }); // Just placeholder
        if (item.bonus.incomeBonus) bonuses.push({ type: 'soms', value: item.bonus.incomeBonus });
      }

      // Add actual equipment stats
      if (item.stats) {
        if (item.stats.strength) bonuses.push({ type: 'strength', value: item.stats.strength });
        if (item.stats.defense) bonuses.push({ type: 'defense', value: item.stats.defense });
        if (item.stats.agility) bonuses.push({ type: 'agility', value: item.stats.agility });
        if (item.stats.stamina) bonuses.push({ type: 'stamina', value: item.stats.stamina });
        if (item.stats.intelligence) bonuses.push({ type: 'intelligence', value: item.stats.intelligence });
        if (item.stats.luck) bonuses.push({ type: 'luck', value: item.stats.luck });
      }

      // Add consumable/effect bonuses if equipped (rarely)
      if (item.effects) {
        if (item.effects.health) bonuses.push({ type: 'health', value: item.effects.health });
        if (item.effects.hunger) bonuses.push({ type: 'hunger', value: item.effects.hunger });
        if (item.effects.mood) bonuses.push({ type: 'mood', value: item.effects.mood });
        if (item.effects.energy) bonuses.push({ type: 'energy', value: item.effects.energy });
      }
    });

    // Shop items live in the static catalog, not in the collection: without this the
    // gear bought in the shop gave no bonus at all.
    equippedItemIds
      .filter((id) => !foundInDatabase.has(id))
      .forEach((id) => {
        const stats = getShopItemStats(id);
        (Object.keys(stats) as Array<keyof typeof stats>).forEach((stat) => {
          if (stats[stat]) {
            bonuses.push({ type: stat as CosmeticBonus['type'], value: stats[stat] });
          }
        });

        const bonus = getShopItem(id)?.bonus;
        if (bonus && (bonus.type === 'soms' || bonus.type === 'xp')) {
          bonuses.push({ type: bonus.type, value: bonus.value });
        }
      });

    return bonuses;
  }

  /**
   * Effective combat stats = player's own stats + equipment bonus.
   *
   * Base stats are never mutated: unequipping or selling an item only removes the
   * bonus on top, so inventory changes can not damage player progress.
   */
  static async getEffectiveCombatStats(player: IPlayer) {
    const base = (player.combatStats || {}) as any;
    const bonus = await this.getTotalEquipmentStats(player);

    return {
      strength: (base.strength || 0) + bonus.strength,
      defense: (base.defense || 0) + bonus.defense,
      agility: (base.agility || 0) + bonus.agility,
      stamina: (base.stamina || 0) + bonus.stamina,
      intelligence: (base.intelligence || 0) + bonus.intelligence,
      luck: (base.luck || 0) + bonus.luck,
      statPoints: base.statPoints || 0,
    };
  }

  /**
   * Calculate total stats from all equipped items
   */
  static async getTotalEquipmentStats(player: IPlayer) {
    const bonuses = await this.getActiveBonuses(player);
    return {
      strength: bonuses.filter(b => b.type === 'strength').reduce((sum, b) => sum + b.value, 0),
      defense: bonuses.filter(b => b.type === 'defense').reduce((sum, b) => sum + b.value, 0),
      agility: bonuses.filter(b => b.type === 'agility').reduce((sum, b) => sum + b.value, 0),
      stamina: bonuses.filter(b => b.type === 'stamina').reduce((sum, b) => sum + b.value, 0),
      intelligence: bonuses.filter(b => b.type === 'intelligence').reduce((sum, b) => sum + b.value, 0),
      luck: bonuses.filter(b => b.type === 'luck').reduce((sum, b) => sum + b.value, 0)
    };
  }

  /**
   * Calculate XP multiplier from equipped items
   */
  static async getXPMultiplier(player: IPlayer): Promise<number> {
    const bonuses = await this.getActiveBonuses(player);
    const xpBonuses = bonuses.filter(b => b.type === 'xp');
    const totalBonus = xpBonuses.reduce((sum, b) => sum + b.value, 0);
    return 1 + (totalBonus / 100); // Convert percentage to multiplier
  }

  /**
   * Calculate soms multiplier from equipped items
   */
  static async getSomsMultiplier(player: IPlayer): Promise<number> {
    const bonuses = await this.getActiveBonuses(player);
    const somsBonuses = bonuses.filter(b => b.type === 'soms');
    const totalBonus = somsBonuses.reduce((sum, b) => sum + b.value, 0);
    return 1 + (totalBonus / 100);
  }

  /**
   * Calculate stat bonus from equipped items
   */
  static async getStatBonus(player: IPlayer, stat: 'health' | 'hunger' | 'mood' | 'energy'): Promise<number> {
    const bonuses = await this.getActiveBonuses(player);
    const statBonuses = bonuses.filter(b => b.type === stat);
    const totalBonus = statBonuses.reduce((sum, b) => sum + b.value, 0);
    return totalBonus; // Return absolute bonus value
  }

  /**
   * Apply XP bonus to earned XP
   */
  static async applyXPBonus(player: IPlayer, baseXP: number): Promise<number> {
    const multiplier = await this.getXPMultiplier(player);
    return Math.floor(baseXP * multiplier);
  }

  /**
   * Apply soms bonus to earned soms
   */
  static async applySomsBonus(player: IPlayer, baseSoms: number): Promise<number> {
    const multiplier = await this.getSomsMultiplier(player);
    return Math.floor(baseSoms * multiplier);
  }

  /**
   * Apply stat bonuses to activity effects
   */
  static async applyStatBonuses(player: IPlayer, effects: {
    hunger?: number;
    health?: number;
    mood?: number;
    energy?: number;
  }): Promise<typeof effects> {
    const result = { ...effects };

    if (effects.health !== undefined) {
      const bonus = await this.getStatBonus(player, 'health');
      result.health = Math.min(100, effects.health + bonus);
    }

    if (effects.hunger !== undefined) {
      const bonus = await this.getStatBonus(player, 'hunger');
      result.hunger = Math.min(100, effects.hunger + bonus);
    }

    if (effects.mood !== undefined) {
      const bonus = await this.getStatBonus(player, 'mood');
      result.mood = Math.min(100, effects.mood + bonus);
    }

    if (effects.energy !== undefined) {
      const bonus = await this.getStatBonus(player, 'energy');
      result.energy = Math.min(100, effects.energy + bonus);
    }

    return result;
  }

  /**
   * Get summary of all active bonuses for display
   */
  static async getBonusSummary(player: IPlayer): Promise<{
    xp: number;
    soms: number;
    health: number;
    hunger: number;
    mood: number;
    energy: number;
  }> {
    return {
      xp: (await this.getXPMultiplier(player) - 1) * 100,
      soms: (await this.getSomsMultiplier(player) - 1) * 100,
      health: await this.getStatBonus(player, 'health'),
      hunger: await this.getStatBonus(player, 'hunger'),
      mood: await this.getStatBonus(player, 'mood'),
      energy: await this.getStatBonus(player, 'energy')
    };
  }
}
