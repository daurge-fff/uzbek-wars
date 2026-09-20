import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import * as AchievementService from '../services/AchievementService';
import { Player } from '../models/Player';

const router = Router();

/**
 * GET /api/achievements
 * Get all achievements with player progress
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
    try {
        const player = await Player.findOne({ userId: (req as any).user!.id });
        if (!player) return res.status(404).json({ error: 'Player not found' });

        const achievements = await AchievementService.getPlayerAchievements(player._id.toString());

        return res.json({ achievements });
    } catch (error) {
        console.error('Error fetching achievements:', error);
        return res.status(500).json({ error: 'Failed to fetch achievements' });
    }
});

export default router;
