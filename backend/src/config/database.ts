/**
 * MongoDB database connection configuration
 * 
 * Handles connection lifecycle and error recovery.
 * Uses Mongoose for ODM with strict schema validation.
 */

import mongoose from 'mongoose';
import { logger } from '../utils/logger';

/**
 * Establishes connection to MongoDB Atlas
 * 
 * Connection options are optimized for production use:
 * - Connection pooling for performance
 * - Automatic reconnection on failure
 * - Strict query mode to catch errors early
 * 
 * @throws {Error} If connection fails after retries
 */
export async function connectDatabase(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME;
  
  if (!mongoUri || !dbName) {
    throw new Error('MongoDB configuration missing');
  }
  
  try {
    // Mongoose connection options optimized for production
    await mongoose.connect(mongoUri, {
      dbName,
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000
    });
    
    // Enable strict mode for schema validation
    mongoose.set('strict', true);
    mongoose.set('strictQuery', true);
    
    logger.info(`Connected to MongoDB database: ${dbName}`);
    
    // Log connection events for monitoring
    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully');
    });
    
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

/**
 * Gracefully closes database connection
 * 
 * Should be called during application shutdown.
 * Ensures all pending operations complete before closing.
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error('Error closing MongoDB connection:', error);
    throw error;
  }
}
