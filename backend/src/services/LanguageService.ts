/**
 * Language Service
 * 
 * Handles language preference operations for users.
 * Supports four languages: Russian (ru), Uzbek (uz), Ukrainian (uk), English (en)
 */

import { User, Language, IUser } from '../models/User';
import { logger } from '../utils/logger';

/**
 * Updates user's language preference
 * 
 * @param userId - User's MongoDB ID
 * @param language - New language preference (ru, uz, uk, en)
 * @returns Updated user document
 * @throws Error if user not found or language invalid
 */
export async function updateUserLanguage(
  userId: string,
  language: Language
): Promise<IUser> {
  const validLanguages: Language[] = ['ru', 'uz', 'uk', 'en'];
  
  if (!validLanguages.includes(language)) {
    throw new Error(`Invalid language: ${language}. Must be one of: ${validLanguages.join(', ')}`);
  }

  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  user.language = language;
  await user.save();

  logger.info(`User ${userId} language updated to ${language}`);

  return user;
}

/**
 * Gets user's current language preference
 * 
 * @param userId - User's MongoDB ID
 * @returns User's current language
 * @throws Error if user not found
 */
export async function getUserLanguage(userId: string): Promise<Language> {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  return user.language;
}

/**
 * Gets user by ID
 * 
 * @param userId - User's MongoDB ID
 * @returns User document or null if not found
 */
export async function getUserById(userId: string): Promise<IUser | null> {
  return User.findById(userId);
}
