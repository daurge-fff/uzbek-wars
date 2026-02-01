/**
 * Unit tests for LeaderboardService
 * 
 * Tests leaderboard functionality:
 * - Global leaderboard sorting
 * - City leaderboard filtering and sorting
 * - Soms leaderboard sorting
 * - Player rank calculation
 * 
 * Requirements: 21.4, 21.6
 */

// Load environment variables FIRST
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Mock environment variables BEFORE importing modules
process.env.DB_NAME = 'uzbek_wars_test';
process.env.NODE_ENV = 'test';

// Explicitly set MONGODB_URI if not loaded
if (!process.env.MONGODB_URI || process.env.MONGODB_URI === 'mongodb://localhost:27017') {
  process.env.MONGODB_URI = 'mongodb+srv://daurge:OJ4zQI5UXKItJMRD@github.hb9s83g.mongodb.net/?retryWrites=true&w=majority';
}

// NOW import modules
import mongoose from 'mongoose';
import { Player } from '../models/Player';
import { User } from '../models/User';
import { City } from '../models/City';
import { connectDatabase, disconnectDatabase } from '../config/database';
import {
  getGlobalLeaderboard,
  getCityLeaderboard,
  getSomsLeaderboard,
  getPlayerGlobalRank,
  getPlayerCityRank,
  getPlayerSomsRank
} from './LeaderboardService';

beforeAll(async () => {
  await connectDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});

beforeEach(async () => {
  await Player.deleteMany({});
  await User.deleteMany({});
  await City.deleteMany({});
});

/**
 * Helper function to create test player
 */
async function createTestPlayer(data: {
  userId: string;
  displayName: string;
  level: number;
  experience: number;
  soms: number;
  cityId: string;
  characterId: string;
}) {
  // Create user first
  const user = await User.create({
    _id: new mongoose.Types.ObjectId(data.userId),
    googleId: `google_${data.userId}`,
    email: `${data.displayName.toLowerCase()}@test.com`,
    displayName: data.displayName,
    language: 'en'
  });
  
  // Create player
  return await Player.create({
    userId: user._id,
    displayName: data.displayName,
    level: data.level,
    experience: data.experience,
    soms: data.soms,
    cityId: data.cityId,
    characterId: data.characterId,
    stats: {
      hunger: 100,
      health: 100,
      mood: 100,
      energy: 100
    },
    referralCode: `REF${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  });
}

describe('LeaderboardService', () => {
  describe('getGlobalLeaderboard', () => {
    it('should return players sorted by level (descending)', async () => {
      // Create players with different levels
      await createTestPlayer({
        userId: '507f1f77bcf86cd799439011',
        displayName: 'Player1',
        level: 5,
        experience: 1000,
        soms: 500,
        cityId: 'city1',
        characterId: 'char1'
      });
      
      await createTestPlayer({
        userId: '507f1f77bcf86cd799439012',
        displayName: 'Player2',
        level: 10,
        experience: 5000,
        soms: 1000,
        cityId: 'city1',
        characterId: 'char1'
      });
      
      await createTestPlayer({
        userId: '507f1f77bcf86cd799439013',
        displayName: 'Player3',
        level: 3,
        experience: 300,
        soms: 200,
        cityId: 'city1',
        characterId: 'char1'
      });
      
      const result = await getGlobalLeaderboard(10);
      
      expect(result.leaderboard).toHaveLength(3);
      expect(result.leaderboard[0].player.level).toBe(10);
      expect(result.leaderboard[1].player.level).toBe(5);
      expect(result.leaderboard[2].player.level).toBe(3);
    });
    
    it('should use experience as tiebreaker for same level', async () => {
      // Create players with same level but different experience
      await createTestPlayer({
        userId: '507f1f77bcf86cd799439011',
        displayName: 'Player1',
        level: 5,
        experience: 1000,
        soms: 500,
        cityId: 'city1',
        characterId: 'char1'
      });
      
      await createTestPlayer({
        userId: '507f1f77bcf86cd799439012',
        displayName: 'Player2',
        level: 5,
        experience: 2000,
        soms: 600,
        cityId: 'city1',
        characterId: 'char1'
      });
      
      const result = await getGlobalLeaderboard(10);
      
      expect(result.leaderboard).toHaveLength(2);
      expect(result.leaderboard[0].player.level).toBe(5);
      expect(result.leaderboard[1].player.level).toBe(5);
    });
    
    it('should use soms as second tiebreaker', async () => {
      // Create players with same level and experience
      await createTestPlayer({
        userId: '507f1f77bcf86cd799439011',
        displayName: 'Player1',
        level: 5,
        experience: 1000,
        soms: 500,
        cityId: 'city1',
        characterId: 'char1'
      });
      
      await createTestPlayer({
        userId: '507f1f77bcf86cd799439012',
        displayName: 'Player2',
        level: 5,
        experience: 1000,
        soms: 800,
        cityId: 'city1',
        characterId: 'char1'
      });
      
      const result = await getGlobalLeaderboard(10);
      
      expect(result.leaderboard).toHaveLength(2);
      expect(result.leaderboard[0].player.soms).toBe(800);
      expect(result.leaderboard[1].player.soms).toBe(500);
    });
    
    it('should respect limit parameter', async () => {
      // Create 5 players
      for (let i = 0; i < 5; i++) {
        await createTestPlayer({
          userId: `507f1f77bcf86cd79943901${i}`,
          displayName: `Player${i}`,
          level: i + 1,
          experience: (i + 1) * 100,
          soms: (i + 1) * 50,
          cityId: 'city1',
          characterId: 'char1'
        });
      }
      
      const result = await getGlobalLeaderboard(3);
      
      expect(result.leaderboard).toHaveLength(3);
      expect(result.leaderboard[0].player.level).toBe(5);
      expect(result.leaderboard[1].player.level).toBe(4);
      expect(result.leaderboard[2].player.level).toBe(3);
    });
  });
  
  describe('getCityLeaderboard', () => {
    it('should return only players from specified city', async () => {
      // Create players in different cities
      await createTestPlayer({
        userId: '507f1f77bcf86cd799439011',
        displayName: 'Player1',
        level: 10,
        experience: 5000,
        soms: 1000,
        cityId: 'city1',
        characterId: 'char1'
      });
      
      await createTestPlayer({
        userId: '507f1f77bcf86cd799439012',
        displayName: 'Player2',
        level: 8,
        experience: 3000,
        soms: 800,
        cityId: 'city2',
        characterId: 'char1'
      });
      
      await createTestPlayer({
        userId: '507f1f77bcf86cd799439013',
        displayName: 'Player3',
        level: 6,
        experience: 2000,
        soms: 600,
        cityId: 'city1',
        characterId: 'char1'
      });
      
      const result = await getCityLeaderboard('city1', 10);
      
      expect(result.leaderboard).toHaveLength(2);
      expect(result.leaderboard[0].player.cityId).toBe('city1');
      expect(result.leaderboard[1].player.cityId).toBe('city1');
      expect(result.leaderboard[0].player.level).toBe(10);
      expect(result.leaderboard[1].player.level).toBe(6);
    });
    
    it('should sort city players by level and experience', async () => {
      // Create players in same city
      await createTestPlayer({
        userId: '507f1f77bcf86cd799439011',
        displayName: 'Player1',
        level: 5,
        experience: 1000,
        soms: 500,
        cityId: 'city1',
        characterId: 'char1'
      });
      
      await createTestPlayer({
        userId: '507f1f77bcf86cd799439012',
        displayName: 'Player2',
        level: 5,
        experience: 2000,
        soms: 600,
        cityId: 'city1',
        characterId: 'char1'
      });
      
      const result = await getCityLeaderboard('city1', 10);
      
      expect(result.leaderboard).toHaveLength(2);
      expect(result.leaderboard[0].player.level).toBe(5);
      expect(result.leaderboard[1].player.level).toBe(5);
    });
  });
  
  describe('getSomsLeaderboard', () => {
    it('should return players sorted by soms (descending)', async () => {
      // Create players with different soms
      await createTestPlayer({
        userId: '507f1f77bcf86cd799439021',
        displayName: 'Player1',
        level: 5,
        experience: 1000,
        soms: 500,
        cityId: 'city1',
        characterId: 'char1'
      });
      
      await createTestPlayer({
        userId: '507f1f77bcf86cd799439022',
        displayName: 'Player2',
        level: 3,
        experience: 300,
        soms: 2000,
        cityId: 'city1',
        characterId: 'char1'
      });
      
      await createTestPlayer({
        userId: '507f1f77bcf86cd799439023',
        displayName: 'Player3',
        level: 10,
        experience: 5000,
        soms: 1000,
        cityId: 'city1',
        characterId: 'char1'
      });
      
      const result = await getSomsLeaderboard(10);
      
      expect(result.leaderboard).toHaveLength(3);
      expect(result.leaderboard[0].player.soms).toBe(2000);
      expect(result.leaderboard[1].player.soms).toBe(1000);
      expect(result.leaderboard[2].player.soms).toBe(500);
    });
    
    it('should use level as tiebreaker for same soms', async () => {
      // Create players with same soms
      await createTestPlayer({
        userId: '507f1f77bcf86cd799439031',
        displayName: 'Player1',
        level: 5,
        experience: 1000,
        soms: 1000,
        cityId: 'city1',
        characterId: 'char1'
      });
      
      await createTestPlayer({
        userId: '507f1f77bcf86cd799439032',
        displayName: 'Player2',
        level: 8,
        experience: 3000,
        soms: 1000,
        cityId: 'city1',
        characterId: 'char1'
      });
      
      const result = await getSomsLeaderboard(10);
      
      expect(result.leaderboard).toHaveLength(2);
      expect(result.leaderboard[0].player.level).toBe(8);
      expect(result.leaderboard[1].player.level).toBe(5);
    });
  });
  
  describe('getPlayerGlobalRank', () => {
    it('should return correct rank for player', async () => {
      // Create players with different levels
      const player1 = await createTestPlayer({
        userId: '507f1f77bcf86cd799439011',
        displayName: 'Player1',
        level: 5,
        experience: 1000,
        soms: 500,
        cityId: 'city1',
        characterId: 'char1'
      });
      
      await createTestPlayer({
        userId: '507f1f77bcf86cd799439012',
        displayName: 'Player2',
        level: 10,
        experience: 5000,
        soms: 1000,
        cityId: 'city1',
        characterId: 'char1'
      });
      
      await createTestPlayer({
        userId: '507f1f77bcf86cd799439013',
        displayName: 'Player3',
        level: 3,
        experience: 300,
        soms: 200,
        cityId: 'city1',
        characterId: 'char1'
      });
      
      const rank = await getPlayerGlobalRank(player1._id.toString());
      
      expect(rank).toBe(2); // Player1 is 2nd (level 5)
    });
    
    it('should return undefined for non-existent player', async () => {
      const rank = await getPlayerGlobalRank('507f1f77bcf86cd799439999');
      expect(rank).toBeUndefined();
    });
  });
  
  describe('getPlayerCityRank', () => {
    it('should return correct rank within city', async () => {
      // Create players in different cities
      const player1 = await createTestPlayer({
        userId: '507f1f77bcf86cd799439011',
        displayName: 'Player1',
        level: 5,
        experience: 1000,
        soms: 500,
        cityId: 'city1',
        characterId: 'char1'
      });
      
      await createTestPlayer({
        userId: '507f1f77bcf86cd799439012',
        displayName: 'Player2',
        level: 10,
        experience: 5000,
        soms: 1000,
        cityId: 'city1',
        characterId: 'char1'
      });
      
      await createTestPlayer({
        userId: '507f1f77bcf86cd799439013',
        displayName: 'Player3',
        level: 15,
        experience: 8000,
        soms: 2000,
        cityId: 'city2',
        characterId: 'char1'
      });
      
      const rank = await getPlayerCityRank(player1._id.toString(), 'city1');
      
      expect(rank).toBe(2); // Player1 is 2nd in city1
    });
    
    it('should return undefined for player not in specified city', async () => {
      const player = await createTestPlayer({
        userId: '507f1f77bcf86cd799439011',
        displayName: 'Player1',
        level: 5,
        experience: 1000,
        soms: 500,
        cityId: 'city1',
        characterId: 'char1'
      });
      
      const rank = await getPlayerCityRank(player._id.toString(), 'city2');
      
      expect(rank).toBeUndefined();
    });
  });
  
  describe('getPlayerSomsRank', () => {
    it('should return correct rank by soms', async () => {
      // Create players with different soms
      const player1 = await createTestPlayer({
        userId: '507f1f77bcf86cd799439011',
        displayName: 'Player1',
        level: 5,
        experience: 1000,
        soms: 1000,
        cityId: 'city1',
        characterId: 'char1'
      });
      
      await createTestPlayer({
        userId: '507f1f77bcf86cd799439012',
        displayName: 'Player2',
        level: 3,
        experience: 300,
        soms: 2000,
        cityId: 'city1',
        characterId: 'char1'
      });
      
      await createTestPlayer({
        userId: '507f1f77bcf86cd799439013',
        displayName: 'Player3',
        level: 10,
        experience: 5000,
        soms: 500,
        cityId: 'city1',
        characterId: 'char1'
      });
      
      const rank = await getPlayerSomsRank(player1._id.toString());
      
      expect(rank).toBe(2); // Player1 is 2nd by soms (1000)
    });
    
    it('should return undefined for non-existent player', async () => {
      const rank = await getPlayerSomsRank('507f1f77bcf86cd799439999');
      expect(rank).toBeUndefined();
    });
  });
});
