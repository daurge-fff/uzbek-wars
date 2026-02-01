/**
 * Cities Routes
 * 
 * Handles city-related endpoints:
 * - GET /api/cities - Retrieve all cities with availability
 * - GET /api/cities/:cityId - Get specific city details
 */

import { Router, Request, Response } from 'express';
import { getCityAvailability, getCityById } from '../services/CityService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/cities
 * 
 * Retrieves all cities with current availability and fill status
 * 
 * This endpoint implements city balancing by:
 * - Showing real-time player counts
 * - Indicating which cities are open/closed
 * - Displaying fill percentage for each city
 * 
 * Response:
 *   - cities: Array of city objects with availability info
 *     - cityId: Unique city identifier
 *     - name: Localized city names (ru, uz, uk, en)
 *     - playerCount: Current number of players
 *     - maxPlayers: Maximum capacity
 *     - isOpen: Whether city accepts new players
 *     - fillPercentage: Capacity utilization (0-100)
 *     - theme: Visual theme configuration
 * 
 * Example response:
 * {
 *   "cities": [
 *     {
 *       "cityId": "samarkand",
 *       "name": { "ru": "Самарканд", "uz": "Samarqand", ... },
 *       "playerCount": 450,
 *       "maxPlayers": 1000,
 *       "isOpen": true,
 *       "fillPercentage": 45,
 *       "theme": { ... }
 *     }
 *   ]
 * }
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const cities = await getCityAvailability();
    
    res.status(200).json({
      cities,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Cities endpoint error:', error);
    res.status(500).json({
      error: 'Failed to retrieve cities',
      code: 'CITIES_FETCH_FAILED',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/cities/:cityId
 * 
 * Retrieves details for a specific city
 * 
 * Path parameters:
 *   - cityId: Unique city identifier (samarkand, tashkent, etc.)
 * 
 * Response:
 *   - city: City object with full details
 * 
 * Error responses:
 *   - 404: City not found
 *   - 500: Server error
 */
router.get('/:cityId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { cityId } = req.params;
    
    const city = await getCityById(cityId);
    
    if (!city) {
      res.status(404).json({
        error: 'City not found',
        code: 'CITY_NOT_FOUND',
        cityId
      });
      return;
    }
    
    res.status(200).json({
      city
    });
  } catch (error) {
    logger.error(`City ${req.params.cityId} endpoint error:`, error);
    res.status(500).json({
      error: 'Failed to retrieve city',
      code: 'CITY_FETCH_FAILED',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
