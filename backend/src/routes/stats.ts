import { Router, Request, Response } from 'express';
import { StatsOnlineService } from '../services/StatsOnlineService';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * GET /api/stats/app
 * Get application statistics (online players, uptime, etc.)
 */
router.get('/app', authenticate, async (req: Request, res: Response) => {
  try {
    // The middleware puts an `id` field into req.user (the user id), not userId — because of
    // this the endpoint always returned 401 and the settings showed zeros.
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get player to determine their city
    const { Player } = await import('../models');
    const player = await Player.findOne({ userId });

    const stats = await StatsOnlineService.getAppStats(player?.cityId);

    return res.json(stats);
  } catch (error) {
    console.error('Error fetching app stats:', error);
    return res.status(500).json({ error: 'Failed to fetch app stats' });
  }
});

/**
 * GET /api/stats/online
 * Get online players statistics
 */
router.get('/online', async (_req: Request, res: Response) => {
  try {
    const stats = await StatsOnlineService.getOnlineStats();
    return res.json(stats);
  } catch (error) {
    console.error('Error fetching online stats:', error);
    return res.status(500).json({ error: 'Failed to fetch online stats' });
  }
});

export default router;
