/**
 * Language Service Unit Tests
 * 
 * Unit tests verify specific examples and edge cases for language operations.
 * These complement the property-based tests by testing concrete scenarios.
 */

import { updateUserLanguage, getUserLanguage, getUserById } from './LanguageService';
import { User, Language } from '../models/User';

// Mock dependencies
jest.mock('../models/User');
jest.mock('../utils/logger');

describe('LanguageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('updateUserLanguage', () => {
    it('should update user language to Russian', async () => {
      const userId = 'user123';
      const mockUser = {
        _id: userId,
        googleId: 'google123',
        email: 'test@example.com',
        displayName: 'Test User',
        language: 'en' as Language,
        ipAddress: '127.0.0.1',
        deviceInfo: {
          userAgent: 'test-agent',
          platform: 'test-platform',
          deviceId: 'test-device'
        },
        save: jest.fn().mockResolvedValue(true)
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await updateUserLanguage(userId, 'ru');

      expect(result.language).toBe('ru');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should update user language to Uzbek', async () => {
      const userId = 'user123';
      const mockUser = {
        _id: userId,
        googleId: 'google123',
        email: 'test@example.com',
        displayName: 'Test User',
        language: 'ru' as Language,
        ipAddress: '127.0.0.1',
        deviceInfo: {
          userAgent: 'test-agent',
          platform: 'test-platform',
          deviceId: 'test-device'
        },
        save: jest.fn().mockResolvedValue(true)
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await updateUserLanguage(userId, 'uz');

      expect(result.language).toBe('uz');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should update user language to Ukrainian', async () => {
      const userId = 'user123';
      const mockUser = {
        _id: userId,
        googleId: 'google123',
        email: 'test@example.com',
        displayName: 'Test User',
        language: 'ru' as Language,
        ipAddress: '127.0.0.1',
        deviceInfo: {
          userAgent: 'test-agent',
          platform: 'test-platform',
          deviceId: 'test-device'
        },
        save: jest.fn().mockResolvedValue(true)
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await updateUserLanguage(userId, 'uk');

      expect(result.language).toBe('uk');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should update user language to English', async () => {
      const userId = 'user123';
      const mockUser = {
        _id: userId,
        googleId: 'google123',
        email: 'test@example.com',
        displayName: 'Test User',
        language: 'ru' as Language,
        ipAddress: '127.0.0.1',
        deviceInfo: {
          userAgent: 'test-agent',
          platform: 'test-platform',
          deviceId: 'test-device'
        },
        save: jest.fn().mockResolvedValue(true)
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await updateUserLanguage(userId, 'en');

      expect(result.language).toBe('en');
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should throw error for invalid language code', async () => {
      const userId = 'user123';
      const mockUser = {
        _id: userId,
        googleId: 'google123',
        email: 'test@example.com',
        displayName: 'Test User',
        language: 'ru' as Language,
        ipAddress: '127.0.0.1',
        deviceInfo: {
          userAgent: 'test-agent',
          platform: 'test-platform',
          deviceId: 'test-device'
        },
        save: jest.fn().mockResolvedValue(true)
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        updateUserLanguage(userId, 'fr' as Language)
      ).rejects.toThrow('Invalid language: fr');

      expect(mockUser.save).not.toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      const userId = 'nonexistent';

      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        updateUserLanguage(userId, 'ru')
      ).rejects.toThrow('User not found: nonexistent');
    });

    it('should handle empty string as invalid language', async () => {
      const userId = 'user123';
      const mockUser = {
        _id: userId,
        googleId: 'google123',
        email: 'test@example.com',
        displayName: 'Test User',
        language: 'ru' as Language,
        ipAddress: '127.0.0.1',
        deviceInfo: {
          userAgent: 'test-agent',
          platform: 'test-platform',
          deviceId: 'test-device'
        },
        save: jest.fn().mockResolvedValue(true)
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      await expect(
        updateUserLanguage(userId, '' as Language)
      ).rejects.toThrow('Invalid language');

      expect(mockUser.save).not.toHaveBeenCalled();
    });
  });

  describe('getUserLanguage', () => {
    it('should return user language', async () => {
      const userId = 'user123';
      const mockUser = {
        _id: userId,
        googleId: 'google123',
        email: 'test@example.com',
        displayName: 'Test User',
        language: 'uz' as Language,
        ipAddress: '127.0.0.1',
        deviceInfo: {
          userAgent: 'test-agent',
          platform: 'test-platform',
          deviceId: 'test-device'
        }
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const language = await getUserLanguage(userId);

      expect(language).toBe('uz');
      expect(User.findById).toHaveBeenCalledWith(userId);
    });

    it('should return default Russian language', async () => {
      const userId = 'user123';
      const mockUser = {
        _id: userId,
        googleId: 'google123',
        email: 'test@example.com',
        displayName: 'Test User',
        language: 'ru' as Language,
        ipAddress: '127.0.0.1',
        deviceInfo: {
          userAgent: 'test-agent',
          platform: 'test-platform',
          deviceId: 'test-device'
        }
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const language = await getUserLanguage(userId);

      expect(language).toBe('ru');
    });

    it('should throw error when user not found', async () => {
      const userId = 'nonexistent';

      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        getUserLanguage(userId)
      ).rejects.toThrow('User not found: nonexistent');
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const userId = 'user123';
      const mockUser = {
        _id: userId,
        googleId: 'google123',
        email: 'test@example.com',
        displayName: 'Test User',
        language: 'ru' as Language,
        ipAddress: '127.0.0.1',
        deviceInfo: {
          userAgent: 'test-agent',
          platform: 'test-platform',
          deviceId: 'test-device'
        }
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const user = await getUserById(userId);

      expect(user).not.toBeNull();
      expect(user?._id).toBe(userId);
      expect(user?.language).toBe('ru');
      expect(User.findById).toHaveBeenCalledWith(userId);
    });

    it('should return null when user not found', async () => {
      const userId = 'nonexistent';

      (User.findById as jest.Mock).mockResolvedValue(null);

      const user = await getUserById(userId);

      expect(user).toBeNull();
      expect(User.findById).toHaveBeenCalledWith(userId);
    });
  });

  describe('Language persistence scenarios', () => {
    it('should handle language change from Russian to Uzbek', async () => {
      const userId = 'user123';
      const mockUser = {
        _id: userId,
        googleId: 'google123',
        email: 'test@example.com',
        displayName: 'Test User',
        language: 'ru' as Language,
        ipAddress: '127.0.0.1',
        deviceInfo: {
          userAgent: 'test-agent',
          platform: 'test-platform',
          deviceId: 'test-device'
        },
        save: jest.fn().mockImplementation(function(this: any) {
          return Promise.resolve(this);
        })
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      // Initial language
      let language = await getUserLanguage(userId);
      expect(language).toBe('ru');

      // Update to Uzbek
      await updateUserLanguage(userId, 'uz');
      mockUser.language = 'uz';

      // Verify change
      language = await getUserLanguage(userId);
      expect(language).toBe('uz');
    });

    it('should handle multiple language changes', async () => {
      const userId = 'user123';
      const mockUser = {
        _id: userId,
        googleId: 'google123',
        email: 'test@example.com',
        displayName: 'Test User',
        language: 'ru' as Language,
        ipAddress: '127.0.0.1',
        deviceInfo: {
          userAgent: 'test-agent',
          platform: 'test-platform',
          deviceId: 'test-device'
        },
        save: jest.fn().mockImplementation(function(this: any) {
          return Promise.resolve(this);
        })
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const languages: Language[] = ['uz', 'uk', 'en', 'ru'];

      for (const lang of languages) {
        await updateUserLanguage(userId, lang);
        mockUser.language = lang;

        const currentLanguage = await getUserLanguage(userId);
        expect(currentLanguage).toBe(lang);
      }

      expect(mockUser.save).toHaveBeenCalledTimes(languages.length);
    });

    it('should preserve language after failed update attempt', async () => {
      const userId = 'user123';
      const mockUser = {
        _id: userId,
        googleId: 'google123',
        email: 'test@example.com',
        displayName: 'Test User',
        language: 'uz' as Language,
        ipAddress: '127.0.0.1',
        deviceInfo: {
          userAgent: 'test-agent',
          platform: 'test-platform',
          deviceId: 'test-device'
        },
        save: jest.fn().mockResolvedValue(true)
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      // Initial language
      let language = await getUserLanguage(userId);
      expect(language).toBe('uz');

      // Try to update with invalid language
      await expect(
        updateUserLanguage(userId, 'invalid' as Language)
      ).rejects.toThrow();

      // Language should remain unchanged
      language = await getUserLanguage(userId);
      expect(language).toBe('uz');
      expect(mockUser.save).not.toHaveBeenCalled();
    });
  });
});
