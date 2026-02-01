/**
 * Main application entry point
 * 
 * Initializes Express server, connects to MongoDB, and starts listening.
 * Environment variables are validated on startup to fail fast if misconfigured.
 */

import express from 'express';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { createServer } from './server';
import { logger } from './utils/logger';
import { validateEnvironment } from './config/environment';

// Load environment variables before anything else
// Look for .env in parent directory (project root)
dotenv.config({ path: '../.env' });

/**
 * Bootstrap the application
 * 
 * Follows a strict initialization order:
 * 1. Validate environment configuration
 * 2. Connect to database
 * 3. Create Express app with middleware
 * 4. Start HTTP server
 */
async function bootstrap(): Promise<void> {
  try {
    // Fail fast if environment is misconfigured
    validateEnvironment();
    
    logger.info('Starting Uzbek Wars backend server...');
    
    // Establish database connection before accepting requests
    await connectDatabase();
    logger.info('Database connection established');
    
    // Create Express application with all middleware configured
    const app = createServer();
    
    const port = process.env.PORT || 3000;
    
    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the application
bootstrap();
