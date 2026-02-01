/**
 * Express server configuration
 * 
 * Configures middleware stack and routes.
 * Middleware order matters - security headers first, then parsing, then routes.
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import authRoutes from './routes/auth';
import citiesRoutes from './routes/cities';
import characterRoutes from './routes/characters';
import activitiesRoutes from './routes/activities';
import referralRoutes from './routes/referral';

/**
 * Creates and configures Express application
 * 
 * Middleware stack:
 * 1. Security headers (helmet)
 * 2. CORS configuration
 * 3. Request parsing (JSON, URL-encoded)
 * 4. Response compression
 * 5. Request logging
 * 6. API routes
 * 7. Error handling
 */
export function createServer(): Application {
  const app = express();
  
  // Security headers - must be first
  app.use(helmet());
  
  // CORS configuration for frontend
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }));
  
  // Request parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Response compression for better performance
  app.use(compression());
  
  // Request logging in development
  if (process.env.NODE_ENV === 'development') {
    app.use((req, _res, next) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });
  }
  
  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/cities', citiesRoutes);
  app.use('/api', characterRoutes);
  app.use('/api', activitiesRoutes);
  app.use('/api/referral', referralRoutes);
  
  // Error handling must be last
  app.use(errorHandler);
  
  return app;
}
