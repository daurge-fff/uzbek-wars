import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import mongoose from 'mongoose';
import { City } from '../models/City';
import { CosmeticItem } from '../models/CosmeticItem';
import { User } from '../models/User';
import { Player } from '../models/Player';
import { ActivityLog } from '../models/ActivityLog';
import { Donation } from '../models/Donation';
import { logger } from '../utils/logger';

async function clearDatabase() {
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

    logger.info('Clearing all collections...');
    
    await City.deleteMany({});
    logger.info('✓ Cities cleared');
    
    await CosmeticItem.deleteMany({});
    logger.info('✓ Cosmetic items cleared');
    
    await User.deleteMany({});
    logger.info('✓ Users cleared');
    
    await Player.deleteMany({});
    logger.info('✓ Players cleared');
    
    await ActivityLog.deleteMany({});
    logger.info('✓ Activity logs cleared');
    
    await Donation.deleteMany({});
    logger.info('✓ Donations cleared');

    logger.info('✓ Database cleared successfully!');
    
    await mongoose.connection.close();
    logger.info('Database connection closed');
    
    process.exit(0);
  } catch (error) {
    logger.error('Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase();
