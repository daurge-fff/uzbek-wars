import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import mongoose from 'mongoose';
import { User } from '../models/User';
import { Player } from '../models/Player';
import { ActivityLog } from '../models/ActivityLog';
import { logger } from '../utils/logger';

async function clearUsers() {
  try {
    logger.info('Connecting to MongoDB...');
    
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME;
    
    if (!mongoUri || !dbName) {
      throw new Error('MONGODB_URI and DB_NAME must be set in environment');
    }
    
    await mongoose.connect(mongoUri, {
      dbName,
    });
    
    logger.info(`Connected to MongoDB database: ${dbName}`);

    logger.info('Clearing users and players...');
    
    await User.deleteMany({});
    logger.info('✓ Users cleared');
    
    await Player.deleteMany({});
    logger.info('✓ Players cleared');
    
    await ActivityLog.deleteMany({});
    logger.info('✓ Activity logs cleared');

    logger.info('✓ Users and players cleared successfully!');
    logger.info('Cities and cosmetic items were preserved.');
    
    await mongoose.connection.close();
    logger.info('Database connection closed');
    
    process.exit(0);
  } catch (error) {
    logger.error('Error clearing users:', error);
    process.exit(1);
  }
}

clearUsers();
