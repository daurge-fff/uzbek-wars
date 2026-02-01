/**
 * Tests for MongoDB database connection
 * 
 * Validates connection lifecycle, error handling, and fail-fast behavior.
 */

import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from './database';
import { logger } from '../utils/logger';

// Mock logger to prevent console output during tests
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('Database Connection', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Ensure connection is closed after each test
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('connectDatabase', () => {
    it('should throw error when MONGODB_URI is missing', async () => {
      delete process.env.MONGODB_URI;
      process.env.DB_NAME = 'test_db';

      await expect(connectDatabase()).rejects.toThrow('MongoDB configuration missing');
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should throw error when DB_NAME is missing', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017';
      delete process.env.DB_NAME;

      await expect(connectDatabase()).rejects.toThrow('MongoDB configuration missing');
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should fail fast with clear error message on connection failure', async () => {
      process.env.MONGODB_URI = 'mongodb://invalid-host:27017';
      process.env.DB_NAME = 'test_db';

      const error = new Error('Connection failed');
      const connectSpy = jest.spyOn(mongoose, 'connect').mockRejectedValue(error);

      await expect(connectDatabase()).rejects.toThrow('Connection failed');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to connect to MongoDB:',
        error
      );

      connectSpy.mockRestore();
    });

    it('should use correct connection options', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017';
      process.env.DB_NAME = 'test_db';

      const connectSpy = jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
      const setSpy = jest.spyOn(mongoose, 'set');

      await connectDatabase();

      expect(connectSpy).toHaveBeenCalledWith(
        'mongodb://localhost:27017',
        expect.objectContaining({
          dbName: 'test_db',
          maxPoolSize: 10,
          minPoolSize: 2,
          socketTimeoutMS: 45000,
          serverSelectionTimeoutMS: 5000
        })
      );

      expect(setSpy).toHaveBeenCalledWith('strict', true);
      expect(setSpy).toHaveBeenCalledWith('strictQuery', true);

      connectSpy.mockRestore();
      setSpy.mockRestore();
    });

    it('should log successful connection', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017';
      process.env.DB_NAME = 'test_db';

      const connectSpy = jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);

      await connectDatabase();

      expect(logger.info).toHaveBeenCalledWith('Connected to MongoDB database: test_db');

      connectSpy.mockRestore();
    });

    it('should set up connection event handlers', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017';
      process.env.DB_NAME = 'test_db';

      const connectSpy = jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
      const onSpy = jest.spyOn(mongoose.connection, 'on');

      await connectDatabase();

      expect(onSpy).toHaveBeenCalledWith('error', expect.any(Function));
      expect(onSpy).toHaveBeenCalledWith('disconnected', expect.any(Function));
      expect(onSpy).toHaveBeenCalledWith('reconnected', expect.any(Function));

      connectSpy.mockRestore();
      onSpy.mockRestore();
    });
  });

  describe('disconnectDatabase', () => {
    it('should close connection gracefully', async () => {
      const closeSpy = jest.spyOn(mongoose.connection, 'close').mockResolvedValue();

      await disconnectDatabase();

      expect(closeSpy).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('MongoDB connection closed');

      closeSpy.mockRestore();
    });

    it('should handle errors during disconnection', async () => {
      const error = new Error('Close failed');
      const closeSpy = jest.spyOn(mongoose.connection, 'close').mockRejectedValue(error);

      await expect(disconnectDatabase()).rejects.toThrow('Close failed');
      expect(logger.error).toHaveBeenCalledWith('Error closing MongoDB connection:', error);

      closeSpy.mockRestore();
    });
  });

  describe('Connection Event Handlers', () => {
    it('should log error events', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017';
      process.env.DB_NAME = 'test_db';

      const connectSpy = jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);

      await connectDatabase();

      // Simulate error event
      const error = new Error('Connection error');
      mongoose.connection.emit('error', error);

      expect(logger.error).toHaveBeenCalledWith('MongoDB connection error:', error);

      connectSpy.mockRestore();
    });

    it('should log disconnection events', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017';
      process.env.DB_NAME = 'test_db';

      const connectSpy = jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);

      await connectDatabase();

      // Simulate disconnected event
      mongoose.connection.emit('disconnected');

      expect(logger.warn).toHaveBeenCalledWith('MongoDB disconnected. Attempting to reconnect...');

      connectSpy.mockRestore();
    });

    it('should log reconnection events', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017';
      process.env.DB_NAME = 'test_db';

      const connectSpy = jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);

      await connectDatabase();

      // Simulate reconnected event
      mongoose.connection.emit('reconnected');

      expect(logger.info).toHaveBeenCalledWith('MongoDB reconnected successfully');

      connectSpy.mockRestore();
    });
  });
});
