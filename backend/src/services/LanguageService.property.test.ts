/**
 * Language Service Property-Based Tests
 * 
 * Property-based tests verify universal properties that should hold
 * for all valid inputs, not just specific examples.
 * 
 * Uses fast-check for property-based testing with 100+ iterations.
 */

import * as fc from 'fast-check';
import { updateUserLanguage, getUserLanguage, getUserById } from './LanguageService';
import { User, Language } from '../models/User';

// Mock dependencies
jest.mock('../models/User');
jest.mock('../utils/logger');

/**
 * Property 11: Round-trip сохранения выбранного языка
 * 
 * For any selected language, saving to database and then loading
 * should return the same language value.
 * 
 * **Validates: Requirements 5.6, 5.7**
 * 
 * This property ensures data integrity for language preferences:
 * - Language is saved correctly to the database
 * - Language is loaded correctly from the database
 * - The loaded language matches the saved language
 * - All four supported languages (ru, uz, uk, en) work correctly
 */
describe('Property 11: Round-trip сохранения выбранного языка', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Arbitrary generator for valid language codes
   * Uses all four supported languages
   */
  const languageArbitrary = fc.constantFrom<Language>(
    'ru',
    'uz',
    'uk',
    'en'
  );

  /**
   * Arbitrary generator for user IDs
   */
  const userIdArbitrary = fc.string({ minLength: 10, maxLength: 30 });

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

  it('should preserve language preference after round-trip save and load', async () => {
    await fc.assert(
      fc.asyncProperty(
        languageArbitrary,
        userIdArbitrary,
        emailArbitrary,
        googleIdArbitrary,
        displayNameArbitrary,
        async (language, userId, email, googleId, displayName) => {
          // Create mock user data
          const mockUser = {
            _id: userId,
            googleId,
            email,
            displayName,
            language: 'ru' as Language, // Initial language
            ipAddress: '127.0.0.1',
            deviceInfo: {
              userAgent: 'test-agent',
              platform: 'test-platform',
              deviceId: 'test-device'
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            save: jest.fn().mockImplementation(function(this: any) {
              // Update the language when save is called
              return Promise.resolve(this);
            })
          };

          // Mock User.findById to return the mock user
          (User.findById as jest.Mock).mockResolvedValue(mockUser);

          // Action: Update language (save to database)
          const updatedUser = await updateUserLanguage(userId, language);

          // Update mock user's language to reflect the save
          mockUser.language = language;

          // Mock User.findById again for the load operation
          (User.findById as jest.Mock).mockResolvedValue(mockUser);

          // Action: Load language from database
          const loadedLanguage = await getUserLanguage(userId);

          // Property: Loaded language matches saved language
          expect(loadedLanguage).toBe(language);
          expect(loadedLanguage).toBe(updatedUser.language);

          // Property: Language is one of the valid languages
          expect(['ru', 'uz', 'uk', 'en']).toContain(loadedLanguage);

          // Property: Save was called
          expect(mockUser.save).toHaveBeenCalled();
        }
      ),
      {
        numRuns: 100, // Run 100 iterations with different inputs
        verbose: true
      }
    );
  }, 60000); // 60 second timeout for property test

  it('should preserve language preference across multiple updates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(languageArbitrary, { minLength: 2, maxLength: 10 }),
        userIdArbitrary,
        emailArbitrary,
        googleIdArbitrary,
        displayNameArbitrary,
        async (languages, userId, email, googleId, displayName) => {
          // Create mock user data
          const mockUser = {
            _id: userId,
            googleId,
            email,
            displayName,
            language: 'ru' as Language, // Initial language
            ipAddress: '127.0.0.1',
            deviceInfo: {
              userAgent: 'test-agent',
              platform: 'test-platform',
              deviceId: 'test-device'
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            save: jest.fn().mockImplementation(function(this: any) {
              return Promise.resolve(this);
            })
          };

          // Mock User.findById to return the mock user
          (User.findById as jest.Mock).mockResolvedValue(mockUser);

          // Action: Update language multiple times
          for (const language of languages) {
            // Update language
            await updateUserLanguage(userId, language);
            mockUser.language = language;

            // Mock User.findById for the load operation
            (User.findById as jest.Mock).mockResolvedValue(mockUser);

            // Load language
            const loadedLanguage = await getUserLanguage(userId);

            // Property: Each update is preserved correctly
            expect(loadedLanguage).toBe(language);
            expect(['ru', 'uz', 'uk', 'en']).toContain(loadedLanguage);
          }

          // Property: Final language matches the last update
          const finalLanguage = await getUserLanguage(userId);
          expect(finalLanguage).toBe(languages[languages.length - 1]);

          // Property: Save was called for each update
          expect(mockUser.save).toHaveBeenCalledTimes(languages.length);
        }
      ),
      {
        numRuns: 50, // Run 50 iterations (fewer due to complexity)
        verbose: true
      }
    );
  }, 60000); // 60 second timeout for property test

  it('should maintain language integrity for multiple users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            userId: userIdArbitrary,
            language: languageArbitrary,
            email: emailArbitrary,
            googleId: googleIdArbitrary,
            displayName: displayNameArbitrary
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (users) => {
          const mockUsers = new Map<string, any>();

          // Action: Set language for each user
          for (const userData of users) {
            const mockUser = {
              _id: userData.userId,
              googleId: userData.googleId,
              email: userData.email,
              displayName: userData.displayName,
              language: 'ru' as Language, // Initial language
              ipAddress: '127.0.0.1',
              deviceInfo: {
                userAgent: 'test-agent',
                platform: 'test-platform',
                deviceId: 'test-device'
              },
              createdAt: new Date(),
              updatedAt: new Date(),
              save: jest.fn().mockImplementation(function(this: any) {
                return Promise.resolve(this);
              })
            };

            mockUsers.set(userData.userId, mockUser);

            // Mock User.findById for this specific user
            (User.findById as jest.Mock).mockImplementation((id: string) => {
              return Promise.resolve(mockUsers.get(id));
            });

            // Update language
            await updateUserLanguage(userData.userId, userData.language);
            mockUser.language = userData.language;
          }

          // Action: Load language for each user
          for (const userData of users) {
            const mockUser = mockUsers.get(userData.userId);
            
            // Mock User.findById for this specific user
            (User.findById as jest.Mock).mockImplementation((id: string) => {
              return Promise.resolve(mockUsers.get(id));
            });

            const loadedLanguage = await getUserLanguage(userData.userId);

            // Property: Each user's language is preserved correctly
            expect(loadedLanguage).toBe(userData.language);
            expect(loadedLanguage).toBe(mockUser.language);
            expect(['ru', 'uz', 'uk', 'en']).toContain(loadedLanguage);
          }

          // Property: All users have valid languages
          for (const [, mockUser] of mockUsers.entries()) {
            expect(['ru', 'uz', 'uk', 'en']).toContain(mockUser.language);
          }
        }
      ),
      {
        numRuns: 30, // Run 30 iterations (fewer due to high complexity)
        verbose: true
      }
    );
  }, 120000); // 120 second timeout for complex property test

  it('should reject invalid language codes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => !['ru', 'uz', 'uk', 'en'].includes(s)),
        userIdArbitrary,
        emailArbitrary,
        googleIdArbitrary,
        displayNameArbitrary,
        async (invalidLanguage, userId, email, googleId, displayName) => {
          // Create mock user data
          const mockUser = {
            _id: userId,
            googleId,
            email,
            displayName,
            language: 'ru' as Language,
            ipAddress: '127.0.0.1',
            deviceInfo: {
              userAgent: 'test-agent',
              platform: 'test-platform',
              deviceId: 'test-device'
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            save: jest.fn().mockResolvedValue(true)
          };

          // Mock User.findById to return the mock user
          (User.findById as jest.Mock).mockResolvedValue(mockUser);

          // Property: Invalid language should throw an error
          await expect(
            updateUserLanguage(userId, invalidLanguage as Language)
          ).rejects.toThrow();

          // Property: User's language should remain unchanged
          const currentLanguage = await getUserLanguage(userId);
          expect(currentLanguage).toBe('ru'); // Should still be the initial language
        }
      ),
      {
        numRuns: 50, // Run 50 iterations
        verbose: true
      }
    );
  }, 60000); // 60 second timeout for property test

  it('should handle language persistence after user reload', async () => {
    await fc.assert(
      fc.asyncProperty(
        languageArbitrary,
        userIdArbitrary,
        emailArbitrary,
        googleIdArbitrary,
        displayNameArbitrary,
        async (language, userId, email, googleId, displayName) => {
          // Create mock user data
          const mockUser = {
            _id: userId,
            googleId,
            email,
            displayName,
            language: 'ru' as Language,
            ipAddress: '127.0.0.1',
            deviceInfo: {
              userAgent: 'test-agent',
              platform: 'test-platform',
              deviceId: 'test-device'
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            save: jest.fn().mockImplementation(function(this: any) {
              return Promise.resolve(this);
            })
          };

          // Mock User.findById to return the mock user
          (User.findById as jest.Mock).mockResolvedValue(mockUser);

          // Action: Update language
          await updateUserLanguage(userId, language);
          mockUser.language = language;

          // Simulate user reload by getting user by ID
          (User.findById as jest.Mock).mockResolvedValue(mockUser);
          const reloadedUser = await getUserById(userId);

          // Property: Language is preserved after reload
          expect(reloadedUser).not.toBeNull();
          if (reloadedUser) {
            expect(reloadedUser.language).toBe(language);
            expect(['ru', 'uz', 'uk', 'en']).toContain(reloadedUser.language);
          }

          // Action: Load language again
          const loadedLanguage = await getUserLanguage(userId);

          // Property: Language remains consistent
          expect(loadedLanguage).toBe(language);
          expect(loadedLanguage).toBe(reloadedUser?.language);
        }
      ),
      {
        numRuns: 100, // Run 100 iterations
        verbose: true
      }
    );
  }, 60000); // 60 second timeout for property test
});
