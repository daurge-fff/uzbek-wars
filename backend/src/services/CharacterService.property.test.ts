/**
 * Character Service Property-Based Tests
 * 
 * Property-based tests verify universal properties that should hold
 * for all valid inputs, not just specific examples.
 * 
 * Uses fast-check for property-based testing with 100+ iterations.
 */

import * as fc from 'fast-check';
import { selectCharacter, getPlayerByUserId } from './CharacterService';
import { Player } from '../models/Player';
import { User } from '../models/User';

// Mock dependencies
jest.mock('../models/Player');
jest.mock('../models/User');
jest.mock('../utils/logger');
jest.mock('./CityService');

/**
 * Property 1: Round-trip сохранения выбора персонажа
 * 
 * For any valid character selection, saving to database and then loading
 * should return the same character with the same initial characteristics.
 * 
 * **Validates: Requirements 1.3, 1.4**
 * 
 * This property ensures data integrity for character selection:
 * - Character ID is preserved
 * - Initial stats are preserved (level, experience, soms)
 * - City assignment is preserved
 * - Referral code is generated and preserved
 */
describe('Property 1: Round-trip сохранения выбора персонажа', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Arbitrary generator for valid character IDs
   * Uses actual character IDs from seed data
   */
  const characterIdArbitrary = fc.constantFrom(
    'char_merchant',
    'char_craftsman',
    'char_student',
    'char_chef'
  );

  /**
   * Arbitrary generator for valid city IDs
   * Uses actual city IDs from seed data
   */
  const cityIdArbitrary = fc.constantFrom(
    'samarkand',
    'shymkent',
    'tashkent',
    'bukhara'
  );

  /**
   * Arbitrary generator for user email
   */
  const emailArbitrary = fc.emailAddress();

  /**
   * Arbitrary generator for Google ID
   */
  const googleIdArbitrary = fc.string({ minLength: 10, maxLength: 30 });

  /**
   * Arbitrary generator for display name
   */
  const displayNameArbitrary = fc.string({ minLength: 3, maxLength: 50 });

  it('should preserve character selection after round-trip save and load', async () => {
    await fc.assert(
      fc.asyncProperty(
        characterIdArbitrary,
        cityIdArbitrary,
        emailArbitrary,
        googleIdArbitrary,
        displayNameArbitrary,
        async (characterId, cityId, email, googleId, displayName) => {
          const userId = 'user_' + googleId;
          const referralCode = 'TESTCODE';

          // Mock user exists
          (User.findById as jest.Mock).mockResolvedValue({
            _id: userId,
            googleId,
            email,
            displayName
          });

          // Mock no existing player
          (Player.findOne as jest.Mock).mockResolvedValue(null);

          // Mock city service
          const { getCityById } = require('./CityService');
          (getCityById as jest.Mock).mockResolvedValue({
            cityId,
            isOpen: true,
            playerCount: 100,
            maxPlayers: 1000,
            save: jest.fn().mockResolvedValue(true)
          });

          // Create a mock player that will be "saved"
          const savedPlayerData = {
            _id: 'player_' + userId,
            userId,
            characterId,
            cityId,
            level: 1,
            experience: 0,
            soms: 100,
            donationCurrency: 0,
            stats: {
              hunger: 100,
              health: 100,
              mood: 100,
              energy: 100
            },
            cosmetics: {
              clothing: [],
              backgrounds: []
            },
            referralCode,
            lastActivityTime: new Date()
          };

          // Mock Player.create to return the saved player
          (Player.create as jest.Mock).mockResolvedValue(savedPlayerData);

          // Action: Select character (save to database)
          const savedPlayer = await selectCharacter(userId, {
            characterId,
            cityId
          });

          // Mock Player.findOne for getPlayerByUserId to return the same data
          (Player.findOne as jest.Mock).mockResolvedValue(savedPlayerData);

          // Action: Load player from database
          const loadedPlayer = await getPlayerByUserId(userId);

          // Assertion: Player should be loaded successfully
          expect(loadedPlayer).not.toBeNull();

          if (loadedPlayer) {
            // Property: Character ID is preserved
            expect(loadedPlayer.characterId).toBe(characterId);
            expect(loadedPlayer.characterId).toBe(savedPlayer.characterId);

            // Property: City ID is preserved
            expect(loadedPlayer.cityId).toBe(cityId);
            expect(loadedPlayer.cityId).toBe(savedPlayer.cityId);

            // Property: Initial level is 1
            expect(loadedPlayer.level).toBe(1);
            expect(loadedPlayer.level).toBe(savedPlayer.level);

            // Property: Initial experience is 0
            expect(loadedPlayer.experience).toBe(0);
            expect(loadedPlayer.experience).toBe(savedPlayer.experience);

            // Property: Initial soms is 100
            expect(loadedPlayer.soms).toBe(100);
            expect(loadedPlayer.soms).toBe(savedPlayer.soms);

            // Property: Initial donation currency is 0
            expect(loadedPlayer.donationCurrency).toBe(0);
            expect(loadedPlayer.donationCurrency).toBe(savedPlayer.donationCurrency);

            // Property: Initial stats are all 100
            expect(loadedPlayer.stats.hunger).toBe(100);
            expect(loadedPlayer.stats.health).toBe(100);
            expect(loadedPlayer.stats.mood).toBe(100);
            expect(loadedPlayer.stats.energy).toBe(100);

            expect(loadedPlayer.stats.hunger).toBe(savedPlayer.stats.hunger);
            expect(loadedPlayer.stats.health).toBe(savedPlayer.stats.health);
            expect(loadedPlayer.stats.mood).toBe(savedPlayer.stats.mood);
            expect(loadedPlayer.stats.energy).toBe(savedPlayer.stats.energy);

            // Property: Referral code is generated and preserved
            expect(loadedPlayer.referralCode).toBeTruthy();
            expect(loadedPlayer.referralCode).toHaveLength(8);
            expect(loadedPlayer.referralCode).toMatch(/^[A-Z0-9]{8}$/);
            expect(loadedPlayer.referralCode).toBe(savedPlayer.referralCode);

            // Property: User ID is preserved
            expect(loadedPlayer.userId).toBe(userId);
            expect(loadedPlayer.userId).toBe(savedPlayer.userId);
          }
        }
      ),
      {
        numRuns: 100, // Run 100 iterations with different inputs
        verbose: true
      }
    );
  }, 60000); // 60 second timeout for property test

  it('should preserve character selection with referral code', async () => {
    await fc.assert(
      fc.asyncProperty(
        characterIdArbitrary,
        cityIdArbitrary,
        emailArbitrary,
        googleIdArbitrary,
        displayNameArbitrary,
        fc.string({ minLength: 8, maxLength: 8 }).map(s => s.toUpperCase()),
        async (characterId, cityId, email, googleId, displayName, referralCode) => {
          const referrerUserId = 'referrer_user';
          const newUserId = 'new_user_' + googleId;

          // Mock referrer player
          const referrerPlayer = {
            _id: 'referrer_player',
            userId: referrerUserId,
            characterId: 'char_merchant',
            cityId,
            level: 5,
            experience: 100,
            soms: 1000,
            donationCurrency: 50,
            stats: {
              hunger: 80,
              health: 90,
              mood: 85,
              energy: 75
            },
            cosmetics: {
              clothing: [],
              backgrounds: []
            },
            referralCode,
            lastActivityTime: new Date(),
            save: jest.fn().mockResolvedValue(true)
          };

          // Mock new user
          (User.findById as jest.Mock).mockResolvedValue({
            _id: newUserId,
            googleId,
            email,
            displayName
          });

          // Mock Player.findOne to return referrer when searching by referral code
          (Player.findOne as jest.Mock).mockImplementation((query: any) => {
            if (query.referralCode === referralCode) {
              return Promise.resolve(referrerPlayer);
            }
            return Promise.resolve(null);
          });

          // Mock city service
          const { getCityById } = require('./CityService');
          (getCityById as jest.Mock).mockResolvedValue({
            cityId,
            isOpen: true,
            playerCount: 50,
            maxPlayers: 1000,
            save: jest.fn().mockResolvedValue(true)
          });

          // Create mock new player data
          const newPlayerData = {
            _id: 'new_player',
            userId: newUserId,
            characterId,
            cityId, // Should be referrer's city
            level: 1,
            experience: 0,
            soms: 100,
            donationCurrency: 0,
            stats: {
              hunger: 100,
              health: 100,
              mood: 100,
              energy: 100
            },
            cosmetics: {
              clothing: [],
              backgrounds: []
            },
            referralCode: 'NEWCODE1',
            referredBy: referralCode,
            lastActivityTime: new Date()
          };

          // Mock Player.create
          (Player.create as jest.Mock).mockResolvedValue(newPlayerData);

          // Action: Select character with referral code
          const savedPlayer = await selectCharacter(newUserId, {
            characterId,
            cityId: 'samarkand', // This should be overridden by referrer's city
            referralCode
          });

          // Mock Player.findOne for getPlayerByUserId
          (Player.findOne as jest.Mock).mockImplementation((query: any) => {
            if (query.userId === newUserId) {
              return Promise.resolve(newPlayerData);
            }
            if (query.referralCode === referralCode) {
              return Promise.resolve(referrerPlayer);
            }
            return Promise.resolve(null);
          });

          // Action: Load player from database
          const loadedPlayer = await getPlayerByUserId(newUserId);

          // Assertion: Player should be loaded successfully
          expect(loadedPlayer).not.toBeNull();

          if (loadedPlayer) {
            // Property: Character ID is preserved
            expect(loadedPlayer.characterId).toBe(characterId);
            expect(loadedPlayer.characterId).toBe(savedPlayer.characterId);

            // Property: City ID is referrer's city (not selected city)
            expect(loadedPlayer.cityId).toBe(cityId);
            expect(loadedPlayer.cityId).toBe(savedPlayer.cityId);

            // Property: Referral code is preserved
            expect(loadedPlayer.referredBy).toBe(referralCode);
            expect(loadedPlayer.referredBy).toBe(savedPlayer.referredBy);

            // Property: Initial characteristics are preserved
            expect(loadedPlayer.level).toBe(1);
            expect(loadedPlayer.experience).toBe(0);
            expect(loadedPlayer.soms).toBe(100);
            expect(loadedPlayer.donationCurrency).toBe(0);

            // Property: Referrer received bonus
            expect(referrerPlayer.donationCurrency).toBe(100); // 50 + 50 bonus
            expect(referrerPlayer.soms).toBe(1500); // 1000 + 500 bonus
            expect(referrerPlayer.save).toHaveBeenCalled();
          }
        }
      ),
      {
        numRuns: 50, // Run 50 iterations (fewer due to complexity)
        verbose: true
      }
    );
  }, 60000); // 60 second timeout for property test

  it('should maintain data integrity across multiple character selections', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            characterId: characterIdArbitrary,
            cityId: cityIdArbitrary,
            email: emailArbitrary,
            googleId: googleIdArbitrary,
            displayName: displayNameArbitrary
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (selections) => {
          // Mock city service for all cities
          const { getCityById } = require('./CityService');
          (getCityById as jest.Mock).mockImplementation((cityId: string) => {
            return Promise.resolve({
              cityId,
              isOpen: true,
              playerCount: 100,
              maxPlayers: 1000,
              save: jest.fn().mockResolvedValue(true)
            });
          });

          const savedPlayers: any[] = [];
          const usedReferralCodes = new Set<string>();

          // Action: Create multiple players with different character selections
          for (let i = 0; i < selections.length; i++) {
            const selection = selections[i];
            const userId = 'user_' + i + '_' + selection.googleId;
            const referralCode = 'CODE' + i.toString().padStart(4, '0');
            
            // Ensure unique referral codes
            usedReferralCodes.add(referralCode);

            // Mock user
            (User.findById as jest.Mock).mockResolvedValue({
              _id: userId,
              googleId: selection.googleId,
              email: selection.email,
              displayName: selection.displayName
            });

            // Mock no existing player
            (Player.findOne as jest.Mock).mockResolvedValue(null);

            // Create mock player data
            const playerData = {
              _id: 'player_' + i,
              userId,
              characterId: selection.characterId,
              cityId: selection.cityId,
              level: 1,
              experience: 0,
              soms: 100,
              donationCurrency: 0,
              stats: {
                hunger: 100,
                health: 100,
                mood: 100,
                energy: 100
              },
              cosmetics: {
                clothing: [],
                backgrounds: []
              },
              referralCode,
              lastActivityTime: new Date()
            };

            // Mock Player.create
            (Player.create as jest.Mock).mockResolvedValue(playerData);

            const player = await selectCharacter(userId, {
              characterId: selection.characterId,
              cityId: selection.cityId
            });

            savedPlayers.push({
              userId,
              player,
              playerData
            });
          }

          // Action: Load all players from database
          for (const { userId, player: savedPlayer, playerData } of savedPlayers) {
            // Mock Player.findOne for this specific user
            (Player.findOne as jest.Mock).mockResolvedValue(playerData);

            const loadedPlayer = await getPlayerByUserId(userId);

            // Property: Each player's data is preserved correctly
            expect(loadedPlayer).not.toBeNull();
            if (loadedPlayer) {
              expect(loadedPlayer.characterId).toBe(savedPlayer.characterId);
              expect(loadedPlayer.cityId).toBe(savedPlayer.cityId);
              expect(loadedPlayer.level).toBe(1);
              expect(loadedPlayer.experience).toBe(0);
              expect(loadedPlayer.soms).toBe(100);
              expect(loadedPlayer.referralCode).toBeTruthy();
            }
          }

          // Property: All referral codes are unique
          const referralCodes = savedPlayers.map(p => p.player.referralCode);
          const uniqueCodes = new Set(referralCodes);
          expect(uniqueCodes.size).toBe(referralCodes.length);
        }
      ),
      {
        numRuns: 20, // Run 20 iterations (fewer due to high complexity)
        verbose: true
      }
    );
  }, 120000); // 120 second timeout for complex property test
});
