import '../loadEnv';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { Player } from '../models/Player';
import { logger } from '../utils/logger';

async function checkPlayer() {
  try {
    await connectDatabase();
    
    const players = await Player.find({}).limit(5);
    
    logger.info(`Total players: ${players.length}`);
    
    players.forEach(player => {
      logger.info(`Player: ${player._id}`);
      logger.info(`  userId: ${player.userId}`);
      logger.info(`  characterId: ${player.characterId}`);
      logger.info(`  cityId: ${player.cityId}`);
      logger.info(`  level: ${player.level}`);
    });
    
    await disconnectDatabase();
  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  }
}

checkPlayer();
