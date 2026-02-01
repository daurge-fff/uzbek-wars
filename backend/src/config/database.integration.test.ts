/**
 * Integration tests for MongoDB connection
 * 
 * These tests verify the actual connection behavior with environment variables.
 * They use mocks to avoid requiring a real MongoDB instance.
 */

import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from './database';

// Mock mongoose.connect to avoid actual connection
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue(actualMongoose),
    set: jest.fn(),
    connection: {
      ...actualMongoose.connection,
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
      readyState: 0
    }
  };
});

describe('Database Connection Integration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should successfully connect with valid environment variables', async () => {
    process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/';
    process.env.DB_NAME = 'uzbek_wars';

    await expect(connectDatabase()).resolves.not.toThrow();

    expect(mongoose.connect).toHaveBeenCalledWith(
      'mongodb+srv://user:pass@cluster.mongodb.net/',
      expect.objectContaining({
        dbName: 'uzbek_wars'
      })
    );
  });

  it('should fail fast when MONGODB_URI is missing', async () => {
    delete process.env.MONGODB_URI;
    process.env.DB_NAME = 'uzbek_wars';

    await expect(connectDatabase()).rejects.toThrow('MongoDB configuration missing');
    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  it('should fail fast when DB_NAME is missing', async () => {
    process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/';
    delete process.env.DB_NAME;

    await expect(connectDatabase()).rejects.toThrow('MongoDB configuration missing');
    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  it('should enable strict mode after connection', async () => {
    process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/';
    process.env.DB_NAME = 'uzbek_wars';

    await connectDatabase();

    expect(mongoose.set).toHaveBeenCalledWith('strict', true);
    expect(mongoose.set).toHaveBeenCalledWith('strictQuery', true);
  });

  it('should register connection event handlers', async () => {
    process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.mongodb.net/';
    process.env.DB_NAME = 'uzbek_wars';

    await connectDatabase();

    expect(mongoose.connection.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mongoose.connection.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
    expect(mongoose.connection.on).toHaveBeenCalledWith('reconnected', expect.any(Function));
  });

  it('should gracefully disconnect', async () => {
    await disconnectDatabase();

    expect(mongoose.connection.close).toHaveBeenCalled();
  });
});
