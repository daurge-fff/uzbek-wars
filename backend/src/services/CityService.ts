/**
 * City Service
 * 
 * Handles city-related business logic including:
 * - City availability and balancing
 * - Player distribution across cities
 * - City capacity management
 */

import { City, ICity, ICityName, ICityTheme } from '../models/City';
import { Player } from '../models/Player';
import { logger } from '../utils/logger';

/**
 * City availability response with player count information
 */
export interface ICityAvailability {
  cityId: string;
  name: ICityName;
  playerCount: number;
  maxPlayers: number;
  isOpen: boolean;
  theme: ICityTheme;
  fillPercentage: number;
}

/**
 * Retrieves all cities with current availability status
 * 
 * Implements city balancing algorithm:
 * 1. Updates player count for each city from database
 * 2. Closes cities that reached max capacity
 * 3. Opens cities with available slots
 * 4. If all cities are full, opens the city with minimum players
 * 
 * This ensures players are distributed evenly across cities
 * and prevents any city from becoming overcrowded.
 * 
 * @returns Array of cities with availability information
 * @throws Error if database operation fails
 */
export async function getCityAvailability(): Promise<ICityAvailability[]> {
  try {
    // Fetch all cities from database
    const cities = await City.find();
    
    if (cities.length === 0) {
      logger.warn('No cities found in database');
      return [];
    }

    // Update player counts and availability status for each city
    const citiesWithAvailability: ICityAvailability[] = [];
    
    for (const city of cities) {
      // Count actual players in this city
      const playerCount = await Player.countDocuments({ cityId: city.cityId });
      
      // Update city player count if changed
      if (city.playerCount !== playerCount) {
        city.playerCount = playerCount;
      }
      
      // Calculate fill percentage for UI display
      const fillPercentage = Math.round((playerCount / city.maxPlayers) * 100);
      
      // Update city availability based on capacity
      if (playerCount >= city.maxPlayers) {
        city.isOpen = false;
        logger.info(`City ${city.cityId} reached capacity (${playerCount}/${city.maxPlayers})`);
      } else {
        city.isOpen = true;
      }
      
      // Save updated city data
      await city.save();
      
      // Add to response with fill percentage
      citiesWithAvailability.push({
        ...city.toObject(),
        fillPercentage
      });
    }
    
    // Safety check: ensure at least one city is open
    // If all cities are full, open the one with minimum players
    const openCities = citiesWithAvailability.filter(c => c.isOpen);
    
    if (openCities.length === 0) {
      logger.warn('All cities at capacity, opening city with minimum players');
      
      // Find city with minimum player count
      const cityWithMinPlayers = citiesWithAvailability.reduce((min, city) => 
        city.playerCount < min.playerCount ? city : min
      );
      
      // Open this city
      const cityToOpen = await City.findOne({ cityId: cityWithMinPlayers.cityId });
      if (cityToOpen) {
        cityToOpen.isOpen = true;
        await cityToOpen.save();
        
        // Update in response array
        const index = citiesWithAvailability.findIndex(c => c.cityId === cityWithMinPlayers.cityId);
        if (index !== -1) {
          citiesWithAvailability[index].isOpen = true;
        }
        
        logger.info(`Opened city ${cityToOpen.cityId} to prevent lockout`);
      }
    }
    
    return citiesWithAvailability;
  } catch (error) {
    logger.error('Failed to get city availability:', error);
    throw new Error('Failed to retrieve city availability');
  }
}

/**
 * Gets a specific city by ID
 * 
 * @param cityId - Unique city identifier
 * @returns City document or null if not found
 */
export async function getCityById(cityId: string): Promise<ICity | null> {
  try {
    return await City.findOne({ cityId });
  } catch (error) {
    logger.error(`Failed to get city ${cityId}:`, error);
    throw new Error('Failed to retrieve city');
  }
}

/**
 * Increments player count for a city
 * Used when a player selects a city during registration
 * 
 * @param cityId - City to increment count for
 * @throws Error if city not found or update fails
 */
export async function incrementCityPlayerCount(cityId: string): Promise<void> {
  try {
    const city = await City.findOne({ cityId });
    
    if (!city) {
      throw new Error(`City ${cityId} not found`);
    }
    
    city.playerCount += 1;
    
    // Close city if it reached capacity
    if (city.playerCount >= city.maxPlayers) {
      city.isOpen = false;
      logger.info(`City ${cityId} closed after reaching capacity`);
    }
    
    await city.save();
  } catch (error) {
    logger.error(`Failed to increment player count for city ${cityId}:`, error);
    throw error;
  }
}

/**
 * Decrements player count for a city
 * Used when a player changes cities or is deleted
 * 
 * @param cityId - City to decrement count for
 * @throws Error if city not found or update fails
 */
export async function decrementCityPlayerCount(cityId: string): Promise<void> {
  try {
    const city = await City.findOne({ cityId });
    
    if (!city) {
      throw new Error(`City ${cityId} not found`);
    }
    
    city.playerCount = Math.max(0, city.playerCount - 1);
    
    // Open city if it has available slots
    if (city.playerCount < city.maxPlayers) {
      city.isOpen = true;
      logger.info(`City ${cityId} opened after player left`);
    }
    
    await city.save();
  } catch (error) {
    logger.error(`Failed to decrement player count for city ${cityId}:`, error);
    throw error;
  }
}
