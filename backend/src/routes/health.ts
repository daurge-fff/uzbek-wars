/**
 * Health Check Routes
 *
 * Provides endpoints for monitoring system health.
 *
 * `GET /api/health` is public (no auth) on purpose: it powers the public
 * status page at `/health`.
 *
 * Response (top-level fields kept for backwards compatibility):
 *   - status: 'healthy' | 'degraded' | 'down'
 *   - timestamp: Current server time
 *   - services: { api, database, bot } with status + real measurements
 *   - checks: flat list of the same checks, each with id/label/status/detail/latencyMs
 */

import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { bot } from '../bot/telegramBot';

const router = Router();

type ServiceState = 'healthy' | 'degraded' | 'down';

interface HealthCheck {
  id: string;
  /** Stable English name for API consumers; the UI localises by `id`. */
  label: string;
  status: ServiceState;
  detail: string;
  /** Measured latency in ms, or null when this check is not a timed round-trip. */
  latencyMs: number | null;
}

/** A database answering slower than this is reported as 'degraded'. */
const SLOW_DATABASE_MS = 750;

const round = (value: number): number => Math.round(value * 10) / 10;

/**
 * Round-trip time of a real MongoDB ping.
 * Never throws: an unusable connection is reported as `ok: false`.
 */
async function pingDatabase(): Promise<{ ok: boolean; latencyMs: number | null; detail: string }> {
  if (mongoose.connection.readyState !== 1) {
    return {
      ok: false,
      latencyMs: null,
      detail: `not connected (readyState ${mongoose.connection.readyState})`
    };
  }

  const db = mongoose.connection.db;
  if (!db) {
    return { ok: false, latencyMs: null, detail: 'connection has no db handle' };
  }

  const startedAt = performance.now();
  try {
    await db.admin().command({ ping: 1 });
    return { ok: true, latencyMs: round(performance.now() - startedAt), detail: 'ping ok' };
  } catch (error) {
    logger.error('Database ping failed:', error);
    return { ok: false, latencyMs: null, detail: `ping failed: ${(error as Error).message}` };
  }
}

/**
 * GET /api/health
 *
 * Returns overall system health status with measured latencies.
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const startedAt = performance.now();

    const database = await pingDatabase();

    // Telegram bot: we only know whether the bot instance exists in this
    // process. No fake latency — a real round-trip to Telegram is not measured.
    const botRunning = Boolean(bot);
    const botStatus: ServiceState = botRunning ? 'healthy' : 'down';

    const databaseStatus: ServiceState = !database.ok
      ? 'down'
      : (database.latencyMs ?? 0) > SLOW_DATABASE_MS
        ? 'degraded'
        : 'healthy';

    const apiStatus: ServiceState = 'healthy';
    // Time this endpoint spent outside of the database ping.
    const apiLatencyMs = round(
      Math.max(0, performance.now() - startedAt - (database.latencyMs ?? 0))
    );

    const checks: HealthCheck[] = [
      {
        id: 'api',
        label: 'API',
        status: apiStatus,
        detail: `uptime ${Math.round(process.uptime())}s`,
        latencyMs: apiLatencyMs
      },
      {
        id: 'database',
        label: 'Database',
        status: databaseStatus,
        detail: database.detail,
        latencyMs: database.latencyMs
      },
      {
        id: 'bot',
        label: 'Telegram bot',
        status: botStatus,
        detail: botRunning ? 'running' : 'not running',
        latencyMs: null
      }
    ];

    // 'api' and 'database' are critical; the bot is optional and only degrades.
    const criticalDown = checks.some(check => check.status === 'down' && check.id !== 'bot');
    const degraded = checks.some(check => check.status === 'degraded') || botStatus === 'down';

    const overall: ServiceState = criticalDown ? 'down' : degraded ? 'degraded' : 'healthy';

    const health = {
      status: overall,
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: apiStatus,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          latencyMs: apiLatencyMs
        },
        database: {
          status: databaseStatus,
          connected: database.ok,
          latencyMs: database.latencyMs
        },
        bot: {
          status: botStatus,
          running: botRunning,
          latencyMs: null
        }
      },
      checks
    };

    res.status(overall === 'healthy' ? 200 : 503).json(health);
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
