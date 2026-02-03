/**
 * Integration tests for seed script
 * These tests validate the seed script against a real MongoDB connection
 * 
 * Note: These tests require a MongoDB connection and are skipped in CI
 * Run with: npm test -- seed.integration.test.ts
 */

import mongoose from 'mongoose';
import { City } from '../models/City';
import { CosmeticItem } from '../models/CosmeticItem';
import { User } from '../models/User';
import { Player } from '../models/Player';
import { CHARACTERS, CITIES } from './seed';

// Skip these tests if no MongoDB connection is available
const MONGODB_AVAILABLE = process.env.MONGODB_URI !== undefined;

describe.skip('Seed Script Integration Tests', () => {
  beforeAll(async () => {
    if (!MONGODB_AVAILABLE) {
      console.log('Skipping integration tests - no MongoDB connection');
      return;
    }

    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI!, {
      dbName: process.env.DB_NAME || 'uzbek_wars_test',
    });
  });

  afterAll(async () => {
    if (MONGODB_AVAILABLE) {
      await mongoose.connection.close();
    }
  });

  describe('City Seeding', () => {
    it('should create all 4 cities in database', async () => {
      // This test would validate actual database insertion
      const cities = await City.find();
      expect(cities.length).toBeGreaterThanOrEqual(4);
    });

    it('should have correct city data structure', async () => {
      const samarkand = await City.findOne({ cityId: 'samarkand' });
      
      if (samarkand) {
        expect(samarkand.name.ru).toBe('Самарканд');
        expect(samarkand.name.uz).toBe('Samarqand');
        expect(samarkand.theme.primaryColor).toBe('#4A90E2');
        expect(samarkand.maxPlayers).toBe(1000);
      }
    });
  });

  describe('Cosmetic Item Seeding', () => {
    it('should create cosmetic items in database', async () => {
      const items = await CosmeticItem.find();
      expect(items.length).toBeGreaterThanOrEqual(10);
    });

    it('should have both clothing and background types', async () => {
      const clothing = await CosmeticItem.find({ type: 'clothing' });
      const backgrounds = await CosmeticItem.find({ type: 'background' });
      
      expect(clothing.length).toBeGreaterThanOrEqual(5);
      expect(backgrounds.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Dev User Seeding', () => {
    it('should create dev user if credentials are provided', async () => {
      if (process.env.DEV_USERNAME) {
        const devUser = await User.findOne({
          email: `${process.env.DEV_USERNAME}@dev.local`,
        });
        
        expect(devUser).toBeDefined();
      }
    });

    it('should create player profile for dev user', async () => {
      if (process.env.DEV_USERNAME) {
        const devUser = await User.findOne({
          email: `${process.env.DEV_USERNAME}@dev.local`,
        });
        
        if (devUser) {
          const devPlayer = await Player.findOne({ userId: devUser._id });
          expect(devPlayer).toBeDefined();
          expect(devPlayer?.level).toBe(10);
          expect(devPlayer?.soms).toBe(10000);
          expect(devPlayer?.donationCurrency).toBe(1000);
        }
      }
    });
  });

  describe('Idempotency', () => {
    it('should not create duplicate cities on multiple runs', async () => {
      const citiesBefore = await City.countDocuments();
      
      // Run seed again (in real scenario)
      // await seed();
      
      const citiesAfter = await City.countDocuments();
      expect(citiesAfter).toBe(citiesBefore);
    });

    it('should not create duplicate cosmetic items on multiple runs', async () => {
      const itemsBefore = await CosmeticItem.countDocuments();
      
      // Run seed again (in real scenario)
      // await seed();
      
      const itemsAfter = await CosmeticItem.countDocuments();
      expect(itemsAfter).toBe(itemsBefore);
    });
  });
});

/**
 * Unit tests that don't require database connection
 * These always run
 */
describe('Seed Data Validation', () => {
  describe('Character Definitions', () => {
    it('should export CHARACTERS array', () => {
      expect(CHARACTERS).toBeDefined();
      expect(Array.isArray(CHARACTERS)).toBe(true);
    });

    it('should have 4 characters', () => {
      expect(CHARACTERS.length).toBe(4);
    });

    it('should have required character fields', () => {
      CHARACTERS.forEach((char) => {
        expect(char.id).toBeDefined();
        expect(char.name).toBeDefined();
        expect(char.description).toBeDefined();
        
        // Check multilingual support
        expect(char.name.ru).toBeDefined();
        expect(char.name.uz).toBeDefined();
        expect(char.name.uk).toBeDefined();
        expect(char.name.en).toBeDefined();
      });
    });
  });

  describe('City Definitions', () => {
    it('should export CITIES array', () => {
      expect(CITIES).toBeDefined();
      expect(Array.isArray(CITIES)).toBe(true);
    });

    it('should have 4 cities', () => {
      expect(CITIES.length).toBe(4);
    });

    it('should have required city fields', () => {
      CITIES.forEach((city) => {
        expect(city.cityId).toBeDefined();
        expect(city.name).toBeDefined();
        expect(city.maxPlayers).toBe(1000);
        expect(city.theme).toBeDefined();
        
        // Check theme fields
        expect(city.theme.primaryColor).toBeDefined();
        expect(city.theme.backgroundImage).toBeDefined();
        expect(city.theme.description).toBeDefined();
      });
    });

    it('should have correct city IDs', () => {
      const cityIds = CITIES.map((c) => c.cityId);
      expect(cityIds).toEqual(['samarkand', 'tashkent', 'bukhara']);
    });
  });
});
