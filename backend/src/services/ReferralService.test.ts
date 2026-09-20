/**
 * Referral Service Unit Tests
 * 
 * Tests the referral system functionality including:
 * - Referral code generation and uniqueness
 * - Referral registration and bonus distribution
 * - Referral statistics and tracking
 * 
 * Requirements: 19.1, 19.4
 */

// Load environment variables FIRST
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Mock environment variables BEFORE importing modules
process.env.DB_NAME = 'uzbek_wars_test';
process.env.NODE_ENV = 'test';

// Explicitly set MONGODB_URI if not loaded
// Test database URI comes from the environment (loaded above from .env).
// Credentials must never be hard-coded in test files.
if (!process.env.MONGODB_URI) {
  throw new Error(
    'MONGODB_URI is not set. Provide it via .env (see .env.example) before running tests.',
  );
}

// NOW import modules
import {
  generateReferralCode,
  handleReferralRegistration,
  getReferralCount,
  getReferredPlayers,
  isValidReferralCodeFormat,
  getPlayerReferralInfo,
  REFERRAL_BONUS
} from './ReferralService';
import { Player } from '../models/Player';
import { User } from '../models/User';
import { connectDatabase, disconnectDatabase } from '../config/database';

describe('ReferralService', () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  beforeEach(async () => {
    await Player.deleteMany({});
    await User.deleteMany({});
  });

  /**
   * Helper function to create test user and player
   */
  async function createTestPlayer(overrides: {
    googleId?: string;
    email?: string;
    referralCode: string;
    cityId?: string;
    level?: number;
    soms?: number;
    donationCurrency?: number;
    referredBy?: string;
  }) {
    const user = await User.create({
      googleId: overrides.googleId || `google-${Date.now()}-${Math.random()}`,
      email: overrides.email || `test-${Date.now()}@example.com`,
      displayName: 'Test User',
      ipAddress: '127.0.0.1',
      deviceInfo: {
        userAgent: 'Test Agent',
        platform: 'Test',
        deviceId: `device-${Date.now()}`
      }
    });

    const player = await Player.create({
      userId: user._id,
      characterId: 'char1',
      cityId: overrides.cityId || 'tashkent',
      referralCode: overrides.referralCode,
      referredBy: overrides.referredBy,
      level: overrides.level || 1,
      experience: 0,
      soms: overrides.soms || 100,
      donationCurrency: overrides.donationCurrency || 0,
      stats: {
        hunger: 100,
        health: 100,
        mood: 100,
        energy: 100
      }
    });

    return { user, player };
  }

  describe('generateReferralCode', () => {
    it('should generate a valid 8-character referral code', async () => {
      const code = await generateReferralCode();
      
      expect(code).toBeDefined();
      expect(code.length).toBe(8);
      expect(/^[A-Z0-9]{8}$/.test(code)).toBe(true);
    });

    it('should generate unique codes', async () => {
      const codes = new Set<string>();
      
      // Generate 10 codes
      for (let i = 0; i < 10; i++) {
        const code = await generateReferralCode();
        codes.add(code);
      }
      
      // All codes should be unique
      expect(codes.size).toBe(10);
    });

    it('should not generate code that already exists in database', async () => {
      // Create player with specific referral code
      const existingCode = 'EXISTING1';
      await createTestPlayer({
        referralCode: existingCode
      });
      
      // Generate new code - should be different
      const newCode = await generateReferralCode();
      expect(newCode).not.toBe(existingCode);
    });
  });

  describe('handleReferralRegistration', () => {
    it('should award bonuses to referrer when valid code used', async () => {
      // Create referrer
      const { player: referrer } = await createTestPlayer({
        referralCode: 'REFER123',
        cityId: 'samarkand',
        level: 5,
        soms: 1000,
        donationCurrency: 50
      });
      
      const originalSoms = referrer.soms;
      const originalCrystals = referrer.donationCurrency;
      
      // Handle referral registration
      const cityId = await handleReferralRegistration('REFER123');
      
      // Verify city returned
      expect(cityId).toBe('samarkand');
      
      // Verify bonuses awarded
      const updatedReferrer = await Player.findById(referrer._id);
      expect(updatedReferrer!.soms).toBe(originalSoms + REFERRAL_BONUS.SOMS);
      expect(updatedReferrer!.donationCurrency).toBe(originalCrystals + REFERRAL_BONUS.CRYSTALS);
    });

    it('should return null for invalid referral code', async () => {
      const cityId = await handleReferralRegistration('INVALID1');
      expect(cityId).toBeNull();
    });

    it('should return referrer city for automatic assignment', async () => {
      // Create referrer in specific city
      await createTestPlayer({
        referralCode: 'CITY1234',
        cityId: 'bukhara',
        level: 3,
        soms: 500
      });
      
      const cityId = await handleReferralRegistration('CITY1234');
      expect(cityId).toBe('bukhara');
    });

    it('should award exactly 50 crystals and 500 soms', async () => {
      const { player: referrer } = await createTestPlayer({
        referralCode: 'BONUS123',
        level: 1,
        soms: 100, // Starting soms
        donationCurrency: 0
      });
      
      await handleReferralRegistration('BONUS123');
      
      const updated = await Player.findById(referrer._id);
      expect(updated!.donationCurrency).toBe(50);
      expect(updated!.soms).toBe(600); // 100 starting + 500 bonus
    });
  });

  describe('getReferralCount', () => {
    it('should return 0 when no referrals', async () => {
      const count = await getReferralCount('NOREF123');
      expect(count).toBe(0);
    });

    it('should count players referred by code', async () => {
      // Create referrer
      await createTestPlayer({
        referralCode: 'COUNT123',
        level: 5,
        soms: 1000
      });
      
      // Create 3 referred players
      for (let i = 0; i < 3; i++) {
        await createTestPlayer({
          referralCode: `REF${i}`,
          referredBy: 'COUNT123'
        });
      }
      
      const count = await getReferralCount('COUNT123');
      expect(count).toBe(3);
    });
  });

  describe('getReferredPlayers', () => {
    it('should return empty array when no referrals', async () => {
      const players = await getReferredPlayers('NOREF123');
      expect(players).toEqual([]);
    });

    it('should return referred player information', async () => {
      // Create referrer
      await createTestPlayer({
        referralCode: 'LIST1234',
        cityId: 'samarkand',
        level: 10,
        soms: 5000,
        donationCurrency: 100
      });
      
      // Create referred player
      await createTestPlayer({
        referralCode: 'REF1',
        referredBy: 'LIST1234',
        cityId: 'samarkand',
        level: 3,
        soms: 300
      });
      
      const players = await getReferredPlayers('LIST1234');
      
      expect(players.length).toBe(1);
      expect(players[0]).toMatchObject({
        level: 3,
        cityId: 'samarkand'
      });
      expect(players[0].joinedAt).toBeInstanceOf(Date);
    });

    it('should sort referred players by join date (newest first)', async () => {
      await createTestPlayer({
        referralCode: 'SORT1234',
        level: 5,
        soms: 1000
      });
      
      // Create players with different timestamps
      await createTestPlayer({
        referralCode: 'R1',
        referredBy: 'SORT1234',
        level: 1
      });
      
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await createTestPlayer({
        referralCode: 'R2',
        referredBy: 'SORT1234',
        level: 2
      });
      
      const players = await getReferredPlayers('SORT1234');
      
      // Newest should be first
      expect(players[0].level).toBe(2);
      expect(players[1].level).toBe(1);
    });
  });

  describe('isValidReferralCodeFormat', () => {
    it('should validate correct format', () => {
      expect(isValidReferralCodeFormat('ABCD1234')).toBe(true);
      expect(isValidReferralCodeFormat('12345678')).toBe(true);
      expect(isValidReferralCodeFormat('AAAAAAAA')).toBe(true);
    });

    it('should reject invalid length', () => {
      expect(isValidReferralCodeFormat('ABC123')).toBe(false);
      expect(isValidReferralCodeFormat('ABCD12345')).toBe(false);
      expect(isValidReferralCodeFormat('')).toBe(false);
    });

    it('should reject lowercase letters', () => {
      expect(isValidReferralCodeFormat('abcd1234')).toBe(false);
      expect(isValidReferralCodeFormat('ABCd1234')).toBe(false);
    });

    it('should reject special characters', () => {
      expect(isValidReferralCodeFormat('ABCD-234')).toBe(false);
      expect(isValidReferralCodeFormat('ABCD_234')).toBe(false);
      expect(isValidReferralCodeFormat('ABCD 234')).toBe(false);
    });
  });

  describe('getPlayerReferralInfo', () => {
    it('should return complete referral information', async () => {
      // Create referrer
      const { player: referrer } = await createTestPlayer({
        referralCode: 'INFO1234',
        cityId: 'samarkand',
        level: 8,
        soms: 3000,
        donationCurrency: 150
      });
      
      // Create 2 referred players
      await createTestPlayer({
        referralCode: 'R1',
        referredBy: 'INFO1234',
        cityId: 'samarkand',
        level: 2,
        soms: 200
      });
      
      await createTestPlayer({
        referralCode: 'R2',
        referredBy: 'INFO1234',
        cityId: 'samarkand',
        level: 3,
        soms: 300
      });
      
      const info = await getPlayerReferralInfo(referrer._id.toString());
      
      expect(info).toBeDefined();
      expect(info!.referralCode).toBe('INFO1234');
      expect(info!.referralCount).toBe(2);
      expect(info!.referredPlayers.length).toBe(2);
      expect(info!.totalBonusesEarned).toEqual({
        crystals: 100, // 2 * 50
        soms: 1000     // 2 * 500
      });
    });

    it('should return null for non-existent player', async () => {
      const info = await getPlayerReferralInfo('000000000000000000000000');
      expect(info).toBeNull();
    });

    it('should calculate total bonuses correctly', async () => {
      const { player: referrer } = await createTestPlayer({
        referralCode: 'BONUS999',
        level: 5,
        soms: 1000
      });
      
      // Create 5 referred players
      for (let i = 0; i < 5; i++) {
        await createTestPlayer({
          referralCode: `R${i}`,
          referredBy: 'BONUS999'
        });
      }
      
      const info = await getPlayerReferralInfo(referrer._id.toString());
      
      expect(info!.totalBonusesEarned).toEqual({
        crystals: 250, // 5 * 50
        soms: 2500     // 5 * 500
      });
    });
  });
});
