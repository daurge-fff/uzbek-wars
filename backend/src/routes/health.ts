/**
 * Health Check Routes
 * 
 * Provides endpoints for monitoring system health
 */

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { bot } from '../bot/telegramBot';

const router = Router();

/**
 * GET /api/health
 * 
 * Returns overall system health status
 * 
 * Response:
 *   - status: 'healthy' | 'degraded' | 'down'
 *   - services: Status of each service
 *   - timestamp: Current server time
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const health = {
      status: 'healthy' as 'healthy' | 'degraded' | 'down',
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: 'healthy' as const,
          uptime: process.uptime(),
          memory: process.memoryUsage()
        },
        database: {
          status: 'unknown' as 'healthy' | 'degraded' | 'down',
          connected: false
        },
        bot: {
          status: 'unknown' as 'healthy' | 'degraded' | 'down',
          running: false
        }
      }
    };

    // Check MongoDB
    try {
      if (mongoose.connection.readyState === 1) {
        health.services.database.status = 'healthy';
        health.services.database.connected = true;
      } else {
        health.services.database.status = 'down';
        health.status = 'degraded';
      }
    } catch (error) {
      health.services.database.status = 'down';
      health.status = 'degraded';
      logger.error('Database health check failed:', error);
    }

    // Check Telegram Bot
    try {
      if (bot) {
        health.services.bot.status = 'healthy';
        health.services.bot.running = true;
      } else {
        health.services.bot.status = 'down';
        // Bot is optional, don't degrade overall status
      }
    } catch (error) {
      health.services.bot.status = 'down';
      logger.error('Bot health check failed:', error);
    }

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check endpoint error:', error);
    res.status(500).json({
      status: 'down',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/ready
 * 
 * Readiness probe for Kubernetes/Docker
 * Returns 200 if service is ready to accept traffic
 */
router.get('/ready', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        ready: false,
        reason: 'Database not connected'
      });
      return;
    }

    res.status(200).json({
      ready: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      ready: false,
      error: 'Readiness check failed'
    });
  }
});

/**
 * GET /api/health/live
 * 
 * Liveness probe for Kubernetes/Docker
 * Returns 200 if service is alive
 */
router.get('/live', (_req: Request, res: Response): void => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString()
  });
});

export default router;
