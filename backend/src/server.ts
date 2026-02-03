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
import donationsRoutes from './routes/donations';
import cosmeticsRoutes from './routes/cosmetics';
import leaderboardRoutes from './routes/leaderboard';
import playerRoutes from './routes/player';
import healthRoutes from './routes/health';
import testsRoutes from './routes/tests';
import statsRoutes from './routes/stats';
import combatStatsRoutes from './routes/combatStats';

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
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));
  
  // CORS configuration for frontend
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma']
  }));
  
  // Request parsing with size limits to prevent DoS
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  
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
  
  // API routes - order matters! More specific routes first
  app.use('/api/health', healthRoutes);
  app.use('/api/tests', testsRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/cities', citiesRoutes);
  app.use('/api/characters', characterRoutes); // Only /characters endpoint
  app.use('/api', activitiesRoutes);
  app.use('/api/referral', referralRoutes);
  app.use('/api/donations', donationsRoutes);
  app.use('/api/cosmetics', cosmeticsRoutes);
  app.use('/api/combat-stats', combatStatsRoutes);
  app.use('/api/leaderboard', leaderboardRoutes);
  app.use('/api/player', playerRoutes); // All /player/* endpoints
  
  // Error handling must be last
  app.use(errorHandler);
  
  return app;
}
