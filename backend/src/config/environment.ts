/**
 * Environment configuration validation
 * 
 * Validates required environment variables on startup.
 * Prevents runtime errors from missing configuration.
 */

import { logger } from '../utils/logger';

interface EnvironmentConfig {
  mongodbUri: string;
  dbName: string;
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  googleClientId: string;
  googleClientSecret: string;
  frontendUrl: string;
  devUsername?: string;
  devPassword?: string;
}

/**
 * Required environment variables
 * 
 * These must be present in .env file or deployment environment.
 * Application will not start if any are missing.
 */
const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'DB_NAME',
  'JWT_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET'
] as const;

/**
 * Validates environment configuration
 * 
 * Checks for required variables and logs warnings for optional ones.
 * Throws error if any required variable is missing.
 * 
 * @throws {Error} If required environment variables are missing
 */
export function validateEnvironment(): void {
  const missing: string[] = [];
  
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}`;
    logger.error(errorMessage);
    logger.error('Please check your .env file against .env.example');
    throw new Error(errorMessage);
  }
  
  // Warn about optional but recommended variables
  if (!process.env.PAYMENT_API_KEY) {
    logger.warn('PAYMENT_API_KEY not set - donation system will not work');
  }
  
  logger.info('Environment configuration validated successfully');
}

/**
 * Gets typed environment configuration
 * 
 * Provides type-safe access to environment variables.
 * Should only be called after validateEnvironment().
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  return {
    mongodbUri: process.env.MONGODB_URI!,
    dbName: process.env.DB_NAME!,
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    googleClientId: process.env.GOOGLE_CLIENT_ID!,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    devUsername: process.env.DEV_USERNAME,
    devPassword: process.env.DEV_PASSWORD
  };
}

/**
 * Simplified environment access object
 * Provides direct access to environment variables
 */
export const env = {
  MONGODB_URI: process.env.MONGODB_URI,
  DB_NAME: process.env.DB_NAME,
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  DEV_USERNAME: process.env.DEV_USERNAME,
  DEV_PASSWORD: process.env.DEV_PASSWORD,
};
