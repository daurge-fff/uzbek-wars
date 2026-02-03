import { Player } from '../models/Player';
import { City } from '../models/City';

/**
 * Service for handling city migration with progressive pricing
 * Cost increases based on player level and combat stats
 */
export class CityMigrationService {
  /**
   * Calculate migration cost based on player stats and target city population relative to other cities
   * Formula: baseCost * (1 + level/10) * (1 + totalCombatStats/500) * (1 + relativePopulation * 0.5)
   */
  static calculateMigrationCost(
    level: number,
    combatStats: {
      strength: number;
      defense: number;
      agility: number;
      stamina: number;
      intelligence: number;
    },
    cityPopulation: number,
    averagePopulation: number
  ): { somsCost: number; crystalCost: number } {
    const totalCombatStats =
      combatStats.strength +
      combatStats.defense +
      combatStats.agility +
      combatStats.stamina +
      combatStats.intelligence;

    // Base costs
    const baseSomsCost = 50000; // Very expensive in soms
    const baseCrystalCost = 100; // Reasonable in crystals

    // Progressive multipliers
    const levelMultiplier = 1 + level / 10;
    const statsMultiplier = 1 + totalCombatStats / 500;
    
    // Population multiplier - relative to average population across all cities
    // If city has more players than average, it's more expensive (up to 35% increase)
    // If city has fewer players than average, it's cheaper (up to 35% discount)
    const relativePopulation = averagePopulation > 0 
      ? (cityPopulation - averagePopulation) / averagePopulation 
      : 0;
    const populationMultiplier = 1 + relativePopulation * 0.35;
    
    // Ensure multiplier doesn't go below 0.65 (65% of base price minimum)
    const finalPopulationMultiplier = Math.max(0.65, populationMultiplier);

    const somsCost = Math.round(baseSomsCost * levelMultiplier * statsMultiplier * finalPopulationMultiplier);
    const crystalCost = Math.round(baseCrystalCost * levelMultiplier * statsMultiplier * finalPopulationMultiplier);

    return { somsCost, crystalCost };
  }

  /**
   * Get available cities for migration
   */
  static async getAvailableCities(currentCityId: string) {
    const cities = await City.find({ isOpen: true }).lean();
    return cities.filter((city) => city.cityId !== currentCityId);
  }

  /**
   * Migrate player to new city
   */
  static async migrateCity(
    userId: string,
    targetCityId: string,
    paymentMethod: 'soms' | 'crystals'
  ): Promise<{ success: boolean; message: string; newCityId?: string }> {
    const player = await Player.findOne({ userId });
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    // Check if player has active activity
    if (player.currentActivity && player.currentActivityEndTime) {
      const now = Date.now();
      if (player.currentActivityEndTime.getTime() > now) {
        return { success: false, message: 'Cannot migrate while activity is in progress' };
      }
    }

    // Check if already in target city
    if (player.cityId === targetCityId) {
      return { success: false, message: 'Already in this city' };
    }

    // Check if target city exists and is open
    const targetCity = await City.findOne({ cityId: targetCityId, isOpen: true });
    if (!targetCity) {
      return { success: false, message: 'Target city not available' };
    }

    // Check if target city is full
    if (targetCity.playerCount >= targetCity.maxPlayers) {
      return { success: false, message: 'Target city is full' };
    }

    // Calculate average population to determine relative cost
    const allCities = await City.find({ isOpen: true }).lean();
    const totalPopulation = allCities.reduce((sum, city) => sum + city.playerCount, 0);
    const averagePopulation = allCities.length > 0 ? totalPopulation / allCities.length : 0;

    // Calculate cost based on target city population relative to average
    const { somsCost, crystalCost } = this.calculateMigrationCost(
      player.level,
      player.combatStats,
      targetCity.playerCount,
      averagePopulation
    );

    // Check if player can afford
    if (paymentMethod === 'soms') {
      if (player.soms < somsCost) {
        return { success: false, message: 'Insufficient soms' };
      }
      player.soms -= somsCost;
    } else {
      if (player.donationCurrency < crystalCost) {
        return { success: false, message: 'Insufficient crystals' };
      }
      player.donationCurrency -= crystalCost;
    }

    // Update city player counts
    const oldCity = await City.findOne({ cityId: player.cityId });
    if (oldCity) {
      oldCity.playerCount = Math.max(0, oldCity.playerCount - 1);
      await oldCity.save();
    }

    targetCity.playerCount += 1;
    await targetCity.save();

    // Set migration as current activity (60 minutes)
    const now = Date.now();
    const migrationDuration = 60 * 60 * 1000; // 60 minutes in milliseconds
    
    player.currentActivity = 'city_migration';
    player.currentActivityName = `Migration to ${targetCity.name.en}`;
    player.currentActivityStartTime = new Date(now);
    player.currentActivityEndTime = new Date(now + migrationDuration);
    
    // Update player city (will take effect after migration completes)
    const oldCityId = player.cityId;
    player.cityId = targetCityId;
    await player.save();

    return {
      success: true,
      message: `Migration started from ${oldCityId} to ${targetCityId}`,
      newCityId: targetCityId,
    };
  }

  /**
   * Get migration info for player
   */
  static async getMigrationInfo(userId: string) {
    const player = await Player.findOne({ userId }).lean();
    if (!player) {
      throw new Error('Player not found');
    }

    const availableCities = await this.getAvailableCities(player.cityId);

    // Calculate average population across all cities
    const totalPopulation = availableCities.reduce((sum, city) => sum + city.playerCount, 0);
    const averagePopulation = availableCities.length > 0 ? totalPopulation / availableCities.length : 0;

    // Calculate costs for each city based on its population relative to average
    const citiesWithCosts = availableCities.map((city) => {
      const { somsCost, crystalCost } = this.calculateMigrationCost(
        player.level,
        player.combatStats,
        city.playerCount,
        averagePopulation
      );

      return {
        ...city,
        migrationCost: {
          soms: somsCost,
          crystals: crystalCost,
        },
      };
    });

    return {
      currentCityId: player.cityId,
      availableCities: citiesWithCosts,
      playerBalance: {
        soms: player.soms,
        crystals: player.donationCurrency,
      },
    };
  }
}
