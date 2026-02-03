/**
 * City Service Property-Based Tests
 * 
 * Tests universal properties of city balancing system using fast-check
 * to verify correctness across a wide range of inputs.
 */

import fc from 'fast-check';
import { getCityAvailability } from './CityService';
import { City } from '../models/City';
import { Player } from '../models/Player';

// Mock the models
jest.mock('../models/City');
jest.mock('../models/Player');
jest.mock('../utils/logger');

describe('Property 18: Балансировка городов', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * **Validates: Requirements 18.4, 18.5, 18.6**
   * 
   * Property: City balancing ensures at least one city is always available
   * 
   * For any configuration of cities with varying player counts and capacities,
   * the getCityAvailability function must ensure that:
   * 1. Cities at or above max capacity are closed (Req 18.4)
   * 2. Cities below max capacity are open (Req 18.5)
   * 3. At least one city is always open for selection (Req 18.6)
   */
  it('should always have at least one city open for selection', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate array of 2-6 cities with random player counts and capacities
        fc.array(
          fc.record({
            cityId: fc.constantFrom('samarkand', 'tashkent', 'bukhara'),
            playerCount: fc.integer({ min: 0, max: 2000 }),
            maxPlayers: fc.integer({ min: 100, max: 1500 }),
            isOpen: fc.boolean()
          }),
          { minLength: 2, maxLength: 4 }
        ).chain(cities => {
          // Ensure unique city IDs
          const uniqueCities = Array.from(
            new Map(cities.map(c => [c.cityId, c])).values()
          );
          return fc.constant(uniqueCities);
        }),
        async (cityConfigs) => {
          // Skip if we don't have at least 2 cities
          if (cityConfigs.length < 2) {
            return;
          }

          // Create mock cities with save and toObject methods
          const mockCities = cityConfigs.map(config => {
            const mockCity = {
              cityId: config.cityId,
              name: {
                ru: config.cityId,
                uz: config.cityId,
                uk: config.cityId,
                en: config.cityId
              },
              playerCount: config.playerCount,
              maxPlayers: config.maxPlayers,
              isOpen: config.isOpen,
              theme: {
                primaryColor: '#000000',
                backgroundImage: '/test.jpg',
                description: 'Test city'
              },
              save: jest.fn().mockResolvedValue(true),
              toObject: function() {
                // toObject should return current state of the mock
                return {
                  cityId: this.cityId,
                  name: this.name,
                  playerCount: this.playerCount,
                  maxPlayers: this.maxPlayers,
                  isOpen: this.isOpen,
                  theme: this.theme
                };
              }
            };
            return mockCity;
          });

          // Mock City.find to return our test cities
          (City.find as jest.Mock).mockResolvedValue(mockCities);

          // Mock Player.countDocuments to return the configured player counts
          cityConfigs.forEach((config) => {
            (Player.countDocuments as jest.Mock)
              .mockResolvedValueOnce(config.playerCount);
          });

          // Mock City.findOne for the "open minimum city" logic
          const cityWithMinPlayers = mockCities.reduce((min, city) => 
            city.playerCount < min.playerCount ? city : min
          );
          (City.findOne as jest.Mock).mockResolvedValue({
            ...cityWithMinPlayers,
            save: jest.fn().mockResolvedValue(true)
          });

          // Execute the function
          const result = await getCityAvailability();

          // Property 1: At least one city must be open (Req 18.6)
          const openCities = result.filter(city => city.isOpen);
          expect(openCities.length).toBeGreaterThanOrEqual(1);

          // Property 2: Cities at or above capacity should be closed, 
          // UNLESS they are the only open city (balancing requirement)
          const allAtCapacity = result.every(city => city.playerCount >= city.maxPlayers);
          
          if (!allAtCapacity) {
            // If there are cities below capacity, cities at capacity should be closed
            result.forEach(city => {
              if (city.playerCount >= city.maxPlayers) {
                expect(city.isOpen).toBe(false);
              }
            });
          } else {
            // If all cities are at capacity, exactly one should be open (the minimum)
            expect(openCities.length).toBe(1);
            const openCity = openCities[0];
            const minPlayerCount = Math.min(...result.map(c => c.playerCount));
            expect(openCity.playerCount).toBe(minPlayerCount);
          }

          // Property 3: Cities below capacity should be open (Req 18.5)
          // Note: This may not hold if all cities are full and we force-open one
          const citiesBelowCapacity = result.filter(
            city => city.playerCount < city.maxPlayers
          );
          if (citiesBelowCapacity.length > 0) {
            // At least one city below capacity should be open
            const openBelowCapacity = citiesBelowCapacity.filter(c => c.isOpen);
            expect(openBelowCapacity.length).toBeGreaterThanOrEqual(1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirement 18.4**
   * 
   * Property: Cities reaching max capacity are automatically closed
   * 
   * For any city configuration where playerCount >= maxPlayers,
   * the city must be marked as closed (isOpen = false), UNLESS
   * it's the only city or all cities are at capacity (balancing rule).
   */
  it('should close cities when they reach maximum capacity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          cityId: fc.constantFrom('samarkand', 'tashkent', 'bukhara'),
          maxPlayers: fc.integer({ min: 100, max: 1500 }),
          // Generate player count that is >= maxPlayers
          playerCountOffset: fc.integer({ min: 0, max: 500 })
        }),
        async ({ cityId, maxPlayers, playerCountOffset }) => {
          const playerCount = maxPlayers + playerCountOffset;

          // Create a second city that is NOT at capacity to ensure proper testing
          const secondCity = {
            cityId: 'bukhara',
            name: { ru: 'bukhara', uz: 'bukhara', uk: 'bukhara', en: 'bukhara' },
            playerCount: 0,
            maxPlayers: maxPlayers,
            isOpen: true,
            theme: {
              primaryColor: '#000000',
              backgroundImage: '/test.jpg',
              description: 'Test'
            },
            save: jest.fn().mockResolvedValue(true),
            toObject: jest.fn().mockReturnValue({
              cityId: 'bukhara',
              playerCount: Math.floor(maxPlayers * 0.5), // 50% capacity
              maxPlayers,
              isOpen: true
            })
          };

          const mockCity = {
            cityId,
            name: { ru: cityId, uz: cityId, uk: cityId, en: cityId },
            playerCount: 0, // Initial value
            maxPlayers,
            isOpen: true, // Initially open
            theme: {
              primaryColor: '#000000',
              backgroundImage: '/test.jpg',
              description: 'Test'
            },
            save: jest.fn().mockResolvedValue(true),
            toObject: jest.fn().mockReturnValue({
              cityId,
              playerCount,
              maxPlayers,
              isOpen: false
            })
          };

          (City.find as jest.Mock).mockResolvedValue([mockCity, secondCity]);
          (Player.countDocuments as jest.Mock)
            .mockResolvedValueOnce(playerCount)
            .mockResolvedValueOnce(Math.floor(maxPlayers * 0.5));

          const result = await getCityAvailability();

          // Find the city at capacity
          const cityAtCapacity = result.find(c => c.cityId === cityId);
          
          // Property: City at or above capacity must be closed when other cities are available
          expect(cityAtCapacity!.isOpen).toBe(false);
          expect(cityAtCapacity!.playerCount).toBeGreaterThanOrEqual(cityAtCapacity!.maxPlayers);
          
          // Property: At least one city (the one below capacity) should be open
          const openCities = result.filter(c => c.isOpen);
          expect(openCities.length).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirement 18.5**
   * 
   * Property: Cities with available capacity remain open
   * 
   * For any city configuration where playerCount < maxPlayers,
   * the city must be marked as open (isOpen = true), unless
   * all cities are full and this is not the minimum.
   */
  it('should keep cities open when they have available capacity', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          cityId: fc.constantFrom('samarkand', 'tashkent', 'bukhara'),
          maxPlayers: fc.integer({ min: 200, max: 1500 }),
          // Generate player count that is < maxPlayers
          fillPercentage: fc.integer({ min: 0, max: 99 })
        }),
        async ({ cityId, maxPlayers, fillPercentage }) => {
          const playerCount = Math.floor((maxPlayers * fillPercentage) / 100);

          const mockCity = {
            cityId,
            name: { ru: cityId, uz: cityId, uk: cityId, en: cityId },
            playerCount: 0,
            maxPlayers,
            isOpen: false, // Initially closed
            theme: {
              primaryColor: '#000000',
              backgroundImage: '/test.jpg',
              description: 'Test'
            },
            save: jest.fn().mockResolvedValue(true),
            toObject: jest.fn().mockReturnValue({
              cityId,
              playerCount,
              maxPlayers,
              isOpen: true
            })
          };

          (City.find as jest.Mock).mockResolvedValue([mockCity]);
          (Player.countDocuments as jest.Mock).mockResolvedValue(playerCount);

          const result = await getCityAvailability();

          // Property: City below capacity must be open
          expect(result[0].isOpen).toBe(true);
          expect(result[0].playerCount).toBeLessThan(result[0].maxPlayers);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirement 18.6**
   * 
   * Property: When all cities are full, the city with minimum players is opened
   * 
   * This ensures players can always join the game, even when all cities
   * are technically at capacity. The system balances by opening the least
   * populated city.
   */
  it('should open city with minimum players when all cities are full', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate 2-4 cities all at or above capacity
        fc.array(
          fc.record({
            cityId: fc.constantFrom('samarkand', 'tashkent', 'bukhara'),
            maxPlayers: fc.integer({ min: 500, max: 1000 }),
            excessPlayers: fc.integer({ min: 0, max: 100 })
          }),
          { minLength: 2, maxLength: 4 }
        ).chain(cities => {
          // Ensure unique city IDs
          const uniqueCities = Array.from(
            new Map(cities.map(c => [c.cityId, c])).values()
          );
          return fc.constant(uniqueCities);
        }),
        async (cityConfigs) => {
          if (cityConfigs.length < 2) {
            return;
          }

          // All cities are at or above capacity
          const mockCities = cityConfigs.map(config => {
            const playerCount = config.maxPlayers + config.excessPlayers;
            return {
              cityId: config.cityId,
              name: { ru: config.cityId, uz: config.cityId, uk: config.cityId, en: config.cityId },
              playerCount: 0,
              maxPlayers: config.maxPlayers,
              isOpen: false,
              theme: {
                primaryColor: '#000000',
                backgroundImage: '/test.jpg',
                description: 'Test'
              },
              save: jest.fn().mockResolvedValue(true),
              toObject: jest.fn().mockReturnValue({
                cityId: config.cityId,
                playerCount,
                maxPlayers: config.maxPlayers,
                isOpen: false
              })
            };
          });

          (City.find as jest.Mock).mockResolvedValue(mockCities);

          // Mock player counts for each city (all at or above capacity)
          cityConfigs.forEach(config => {
            const playerCount = config.maxPlayers + config.excessPlayers;
            (Player.countDocuments as jest.Mock).mockResolvedValueOnce(playerCount);
          });

          // Find city with minimum players
          const minPlayerCount = Math.min(
            ...cityConfigs.map(c => c.maxPlayers + c.excessPlayers)
          );
          const minCity = cityConfigs.find(
            c => c.maxPlayers + c.excessPlayers === minPlayerCount
          );

          // Mock City.findOne to return the minimum city
          (City.findOne as jest.Mock).mockResolvedValue({
            cityId: minCity!.cityId,
            isOpen: false,
            save: jest.fn().mockResolvedValue(true)
          });

          const result = await getCityAvailability();

          // Property: At least one city must be open
          const openCities = result.filter(city => city.isOpen);
          expect(openCities.length).toBeGreaterThanOrEqual(1);

          // Property: The opened city should be one with minimum players
          const openCity = openCities[0];
          const allPlayerCounts = result.map(c => c.playerCount);
          const minCount = Math.min(...allPlayerCounts);
          expect(openCity.playerCount).toBe(minCount);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 18.3, 18.4, 18.5**
   * 
   * Property: Player count tracking is accurate and consistent
   * 
   * The system must accurately track and update player counts for each city,
   * and the availability status must be consistent with the player count.
   */
  it('should accurately track player counts and update availability accordingly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            cityId: fc.constantFrom('samarkand', 'tashkent', 'bukhara'),
            actualPlayerCount: fc.integer({ min: 0, max: 1500 }),
            maxPlayers: fc.integer({ min: 500, max: 1500 })
          }),
          { minLength: 2, maxLength: 4 }
        ).chain(cities => {
          const uniqueCities = Array.from(
            new Map(cities.map(c => [c.cityId, c])).values()
          );
          return fc.constant(uniqueCities);
        }),
        async (cityConfigs) => {
          if (cityConfigs.length < 2) {
            return;
          }

          const mockCities = cityConfigs.map(config => ({
            cityId: config.cityId,
            name: { ru: config.cityId, uz: config.cityId, uk: config.cityId, en: config.cityId },
            playerCount: 0, // Will be updated
            maxPlayers: config.maxPlayers,
            isOpen: true,
            theme: {
              primaryColor: '#000000',
              backgroundImage: '/test.jpg',
              description: 'Test'
            },
            save: jest.fn().mockResolvedValue(true),
            toObject: jest.fn().mockReturnValue({
              cityId: config.cityId,
              playerCount: config.actualPlayerCount,
              maxPlayers: config.maxPlayers,
              isOpen: config.actualPlayerCount < config.maxPlayers
            })
          }));

          (City.find as jest.Mock).mockResolvedValue(mockCities);

          cityConfigs.forEach(config => {
            (Player.countDocuments as jest.Mock)
              .mockResolvedValueOnce(config.actualPlayerCount);
          });

          // Mock for potential minimum city opening
          const minCity = cityConfigs.reduce((min, city) => 
            city.actualPlayerCount < min.actualPlayerCount ? city : min
          );
          (City.findOne as jest.Mock).mockResolvedValue({
            cityId: minCity.cityId,
            isOpen: false,
            save: jest.fn().mockResolvedValue(true)
          });

          const result = await getCityAvailability();

          // Property: Player counts must match actual counts from database
          result.forEach((city) => {
            const config = cityConfigs.find(c => c.cityId === city.cityId);
            if (config) {
              expect(city.playerCount).toBe(config.actualPlayerCount);
            }
          });

          // Property: Availability must be consistent with capacity
          result.forEach(city => {
            if (city.playerCount >= city.maxPlayers) {
              // Cities at capacity should be closed unless forced open
              // (we allow one exception for the minimum city)
              const openCities = result.filter(c => c.isOpen);
              if (openCities.length > 1 || city.isOpen) {
                // If this city is open and at capacity, it must be the only open city
                // or the minimum player count city
                if (city.isOpen) {
                  const minPlayerCount = Math.min(...result.map(c => c.playerCount));
                  const isMinimum = city.playerCount === minPlayerCount;
                  const isOnlyOpen = openCities.length === 1;
                  expect(isMinimum || isOnlyOpen).toBe(true);
                }
              }
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
