/**
 * Authentication Service
 * 
 * Handles user authentication logic including Google OAuth and dev login.
 * Manages JWT token generation and user session creation.
 */

import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Player } from '../models/Player';
import { env } from '../config/environment';
import { logger } from '../utils/logger';
import { updateLoginStreak } from './TaskService';
import { TelegramWebAppUser, getTelegramDisplayName } from './TelegramWebAppService';

// Debug: Log JWT_SECRET status at module load time
logger.info(`[AuthService] Module loaded - JWT_SECRET type: ${typeof env.JWT_SECRET}, exists: ${!!env.JWT_SECRET}, length: ${env.JWT_SECRET ? env.JWT_SECRET.length : 0}`);

interface GoogleProfile {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
}

interface DeviceInfo {
  userAgent: string;
  platform: string;
  deviceId: string;
}

interface AuthResult {
  token: string;
  user: any;
  player: any;
  isNewUser: boolean;
}

/**
 * Generates JWT token for authenticated user
 * 
 * Token includes user ID and expires based on JWT_EXPIRES_IN config.
 * Used for subsequent API requests authentication.
 */
function generateToken(userId: string): string {
  const secret = env.JWT_SECRET;

  logger.debug(`Generating JWT token for user: ${userId}`);
  logger.debug(`JWT_SECRET exists: ${!!secret}`);
  logger.debug(`JWT_SECRET type: ${typeof secret}`);
  logger.debug(`JWT_SECRET length: ${secret ? secret.length : 0}`);
  logger.debug(`JWT_SECRET value: ${secret ? '[REDACTED]' : 'EMPTY/UNDEFINED'}`);
  logger.debug(`process.env.JWT_SECRET type: ${typeof process.env.JWT_SECRET}`);
  logger.debug(`process.env.JWT_SECRET length: ${process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0}`);
  logger.debug(`process.env.JWT_SECRET: ${process.env.JWT_SECRET ? '[REDACTED]' : 'EMPTY/UNDEFINED'}`);
  logger.debug(`JWT_EXPIRES_IN: ${env.JWT_EXPIRES_IN}`);

  if (!secret) {
    logger.error('JWT_SECRET not configured! Check .env file');
    logger.error(`All env keys: ${Object.keys(process.env).filter(k => k.includes('JWT')).join(', ')}`);
    throw new Error('JWT_SECRET not configured');
  }

  const token = jwt.sign(
    { userId },
    secret,
    { expiresIn: env.JWT_EXPIRES_IN as any }
  );

  logger.info(`JWT token generated successfully for user: ${userId}`);

  return token;
}

/**
 * Generates unique referral code
 * 
 * Creates 8-character alphanumeric code for player referrals.
 * Ensures uniqueness by checking against existing codes.
 */
async function generateReferralCode(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code: string;
  let isUnique = false;

  // Keep generating until we find a unique code
  while (!isUnique) {
    code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const existing = await Player.findOne({ referralCode: code });
    if (!existing) {
      isUnique = true;
      return code;
    }
  }

  throw new Error('Failed to generate unique referral code');
}

/**
 * Authenticates user via Google OAuth
 * 
 * Creates new user if first login, otherwise loads existing user.
 * Records IP address and device info for twin detection.
 * Generates JWT token for session management.
 * 
 * @param profile - Google profile data from OAuth
 * @param ipAddress - Client IP address
 * @param deviceInfo - Client device information
 * @param referralCode - Optional referral code from registration link
 */
export async function authenticateWithGoogle(
  profile: GoogleProfile,
  ipAddress: string,
  deviceInfo: DeviceInfo,
  _referralCode?: string
): Promise<AuthResult> {
  try {
    // Check if user already exists
    let user = await User.findOne({ googleId: profile.id });
    let isNewUser = false;

    if (!user) {
      // Create new user
      isNewUser = true;
      user = await User.create({
        googleId: profile.id,
        email: profile.email,
        displayName: profile.displayName,
        googleName: profile.displayName,
        avatar: profile.avatar,
        ipAddress,
        deviceInfo,
        language: 'ru'
      });

      logger.info(`New user registered via Google: ${user.email}`);
    } else {
      // Update existing user's IP and device info
      user.ipAddress = ipAddress;
      user.deviceInfo = deviceInfo;
      await user.save();

      logger.info(`User logged in via Google: ${user.email}`);
    }

    // Check for existing player
    let player = await Player.findOne({ userId: user._id });

    if (player) {
      // Update login streak
      await updateLoginStreak(player);
    }

    // Don't create player automatically - let them complete onboarding first
    if (!player && isNewUser) {
      logger.info(`New user registered, player will be created during onboarding: ${user.email}`);
    }

    // Generate JWT token
    const token = generateToken(user._id.toString());

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        language: user.language,
        ...getLinkingStatus(user),
      },
      player: player ? {
        id: player._id,
        level: player.level,
        experience: player.experience,
        soms: player.soms,
        characterId: player.characterId,
        cityId: player.cityId,
        donationCurrency: player.donationCurrency,
        stats: player.stats
      } : null,
      isNewUser
    };
  } catch (error) {
    logger.error('Google authentication error:', error);
    throw error;
  }
}

/**
 * Authenticates (or registers) a user coming from the Telegram mini app.
 *
 * The caller must pass an already verified Telegram user (see TelegramWebAppService):
 * this function never trusts unvalidated client data. Telegram provides no email, so
 * mini app accounts get a synthetic, clearly marked email and googleId; the rest of the
 * profile (name, username, photo, language) is stored and refreshed on every open.
 *
 * @param telegramUser - Verified user object from initData
 * @param ipAddress - Request IP address
 * @param deviceInfo - Client device info
 * @param language - Language mapped from the Telegram locale
 */
export async function authenticateWithTelegramWebApp(
  telegramUser: TelegramWebAppUser,
  ipAddress: string,
  deviceInfo: DeviceInfo,
  language: 'ru' | 'uz' | 'uk' | 'en'
): Promise<AuthResult> {
  try {
    const telegramId = String(telegramUser.id);
    const displayName = getTelegramDisplayName(telegramUser);

    let user = await User.findOne({ telegramId });
    let isNewUser = false;

    if (!user) {
      // Create new Telegram-native user
      isNewUser = true;
      user = await User.create({
        googleId: `telegram:${telegramId}`,
        email: `tg${telegramId}@telegram.miniapp`,
        displayName,
        username: telegramUser.username,
        avatar: telegramUser.photo_url,
        ipAddress,
        deviceInfo,
        language,
        telegramId,
        telegramUsername: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        languageCode: telegramUser.language_code,
        photoUrl: telegramUser.photo_url,
        telegramLastLoginAt: new Date(),
      });

      logger.info(`New user registered via Telegram mini app: ${telegramId}`);
    } else {
      // Refresh the Telegram profile and device info on every mini app open
      user.displayName = displayName;
      user.username = telegramUser.username;
      user.avatar = telegramUser.photo_url;
      user.ipAddress = ipAddress;
      user.deviceInfo = deviceInfo;
      user.language = language;
      user.telegramUsername = telegramUser.username;
      user.firstName = telegramUser.first_name;
      user.lastName = telegramUser.last_name;
      user.languageCode = telegramUser.language_code;
      user.photoUrl = telegramUser.photo_url;
      user.telegramLastLoginAt = new Date();
      await user.save();

      logger.info(`User logged in via Telegram mini app: ${telegramId}`);
    }

    // A player is created during onboarding, not here
    const player = await Player.findOne({ userId: user._id });
    if (player) {
      await updateLoginStreak(player);
    }

    const token = generateToken(user._id.toString());

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        language: user.language,
        telegramId: user.telegramId,
        telegramUsername: user.telegramUsername,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
        ...getLinkingStatus(user),
      },
      player: player ? {
        id: player._id,
        level: player.level,
        experience: player.experience,
        soms: player.soms,
        characterId: player.characterId,
        cityId: player.cityId,
        donationCurrency: player.donationCurrency,
        stats: player.stats
      } : null,
      isNewUser
    };
  } catch (error) {
    logger.error('Telegram mini app authentication error:', error);
    throw error;
  }
}

/**
 * Authenticates developer in development mode
 * 
 * Provides backdoor login for testing without Google OAuth.
 * Only works when NODE_ENV=development.
 * Uses credentials from environment variables.
 * 
 * @param username - Developer username
 * @param password - Developer password
 */
export async function authenticateDevLogin(
  username: string,
  password: string
): Promise<AuthResult> {
  // Only allow in development mode - check process.env directly to avoid caching
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Dev login only available in development mode');
  }

  // Validate credentials
  if (username !== env.DEV_USERNAME || password !== env.DEV_PASSWORD) {
    throw new Error('Invalid dev credentials');
  }

  // Find or create dev user
  let user = await User.findOne({ email: 'dev@uzbekwars.local' });

  if (!user) {
    user = await User.create({
      googleId: 'dev-user',
      email: 'dev@uzbekwars.local',
      displayName: 'Developer',
      avatar: '',
      ipAddress: '127.0.0.1',
      deviceInfo: {
        userAgent: 'dev',
        platform: 'dev',
        deviceId: 'dev-device'
      },
      language: 'ru'
    });
  }

  // Find or create dev player
  let player = await Player.findOne({ userId: user._id });

  if (!player) {
    const referralCode = await generateReferralCode();

    player = await Player.create({
      userId: user._id,
      characterId: 'char1', // Default character for dev
      cityId: 'tashkent', // Default city for dev
      referralCode,
      level: 10, // Start at level 10 for testing
      soms: 10000, // Start with 10k soms for testing
      donationCurrency: 1000, // Start with 1k crystals for testing
      lastLoginDate: new Date()
    });
    await updateLoginStreak(player);
  } else {
    // Update login streak for dev
    await updateLoginStreak(player);
  }

  const token = generateToken(user._id.toString());

  logger.info('Developer logged in via dev-login');

  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      language: user.language
    },
    player: {
      id: player._id,
      level: player.level,
      experience: player.experience,
      soms: player.soms,
      characterId: player.characterId,
      cityId: player.cityId,
      donationCurrency: player.donationCurrency,
      stats: player.stats
    },
    isNewUser: false
  };
}

/**
 * Verifies JWT token and returns user ID
 * 
 * Used by authentication middleware to validate requests.
 * Throws error if token is invalid or expired.
 */
export function verifyToken(token: string): { userId: string } {
  const secret = env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  try {
    const decoded = jwt.verify(token, secret) as { userId: string };
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Detects potential twin accounts
 * 
 * Checks for multiple accounts from same IP or device.
 * Used for fraud prevention and fair play enforcement.
 * Logs suspicious activity for moderation review.
 */
export async function detectTwinks(userId: string): Promise<boolean> {
  try {
    const user = await User.findById(userId);
    if (!user) return false;

    // Check for same IP address
    const sameIpUsers = await User.find({
      ipAddress: user.ipAddress,
      _id: { $ne: userId }
    });

    // Check for same device ID
    const sameDeviceUsers = await User.find({
      'deviceInfo.deviceId': user.deviceInfo.deviceId,
      _id: { $ne: userId }
    });

    if (sameIpUsers.length > 0 || sameDeviceUsers.length > 0) {
      logger.warn(`Potential twin detected for user ${userId}`, {
        sameIpCount: sameIpUsers.length,
        sameDeviceCount: sameDeviceUsers.length,
        ipAddress: user.ipAddress,
        deviceId: user.deviceInfo.deviceId
      });
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Twin detection error:', error);
    return false;
  }
}

const LINKING_BONUS_XP = 500;
const LINKING_BONUS_CRYSTALS = 100;

/**
 * Links a Telegram account to an existing Google-authenticated user.
 * Called from POST /api/auth/link/verify after the user opens the mini app
 * with a verification code in startapp.
 */
export async function linkTelegramToUser(
  userId: string,
  telegramId: string,
  telegramUser: { username?: string; first_name?: string; last_name?: string; language_code?: string; photo_url?: string }
): Promise<{ bonusAwarded: boolean }> {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  if (user.telegramId) throw new Error('Telegram account already linked');

  user.telegramId = telegramId;
  user.telegramUsername = telegramUser.username;
  user.firstName = telegramUser.first_name;
  user.lastName = telegramUser.last_name;
  user.languageCode = telegramUser.language_code;
  user.photoUrl = telegramUser.photo_url;
  user.telegramLastLoginAt = new Date();
  await user.save();

  logger.info(`Linked Telegram ${telegramId} to user ${userId}`);

  return await awardLinkingBonus(userId);
}

/**
 * Links a Google account to an existing Telegram-authenticated user.
 * Called from POST /api/auth/link/google after Google OAuth completes.
 */
export async function linkGoogleToUser(
  userId: string,
  googleId: string,
  email: string,
  displayName: string,
  avatar?: string
): Promise<{ bonusAwarded: boolean }> {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  if (user.googleId && !user.googleId.startsWith('telegram:')) throw new Error('Google account already linked');

  user.googleId = googleId;
  user.email = email;
  user.googleName = displayName;
  if (avatar) user.avatar = avatar;
  await user.save();

  logger.info(`Linked Google ${googleId} to user ${userId}`);

  return await awardLinkingBonus(userId);
}

/**
 * Awards a one-time bonus when both Google and Telegram are linked.
 * Returns whether the bonus was actually awarded (not already claimed).
 */
async function awardLinkingBonus(userId: string): Promise<{ bonusAwarded: boolean }> {
  const user = await User.findById(userId);
  if (!user) return { bonusAwarded: false };

  const hasGoogle = !!user.googleId && !user.googleId.startsWith('telegram:');
  const hasTelegram = !!user.telegramId;

  if (!hasGoogle || !hasTelegram) return { bonusAwarded: false };

  const player = await Player.findOne({ userId });
  if (!player) return { bonusAwarded: false };

  // Check if bonus already claimed (store flag on player stats)
  if ((player as any).linkingBonusClaimed) return { bonusAwarded: false };

  player.experience += LINKING_BONUS_XP;
  player.donationCurrency += LINKING_BONUS_CRYSTALS;
  (player as any).linkingBonusClaimed = true;
  await player.save();

  logger.info(`Awarded linking bonus to user ${userId}: +${LINKING_BONUS_XP} XP, +${LINKING_BONUS_CRYSTALS} crystals`);

  return { bonusAwarded: true };
}

/**
 * Returns linking status for a user.
 */
export function getLinkingStatus(user: any): { hasGoogle: boolean; hasTelegram: boolean } {
  return {
    hasGoogle: !!user.googleId && !user.googleId.startsWith('telegram:'),
    hasTelegram: !!user.telegramId,
  };
}
