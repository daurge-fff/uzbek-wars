import '../loadEnv';
import mongoose from 'mongoose';
import { Player } from '../models/Player';
import { logger } from '../utils/logger';

async function clearActivities() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME;
    
    if (!mongoUri || !dbName) {
      throw new Error('MONGODB_URI and DB_NAME must be set');
    }
    
    await mongoose.connect(mongoUri, { dbName });
    logger.info('Connected to MongoDB');
    
    const result = await Player.updateMany(
      {},
      {
        $unset: {
          currentActivity: "",
          currentActivityName: "",
          currentActivityStartTime: "",
          currentActivityEndTime: ""
        }
      }
    );
    
    logger.info(`✅ Cleared activities from ${result.modifiedCount} players`);
  } catch (error) {
    logger.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

clearActivities();
