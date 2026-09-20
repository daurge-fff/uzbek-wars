import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import * as ArenaService from '../services/ArenaService';
import { Player } from '../models/Player';
import { ArenaMatch } from '../models/ArenaMatch';

const router = Router();

/**
 * GET /api/arena/opponents
 * Get potential opponents for matchmaking
 */
router.get('/opponents', authenticate, async (req: Request, res: Response) => {
    try {
        const player = await Player.findOne({ userId: (req as any).user!.id });
        if (!player) return res.status(404).json({ error: 'Player not found' });

        const opponents = await ArenaService.findOpponents(player._id.toString());

        return res.json({ opponents });
    } catch (error) {
        console.error('Error fetching arena opponents:', error);
        return res.status(500).json({ error: 'Failed to fetch opponents' });
    }
});

/**
 * POST /api/arena/fight
 * Start a fight with an opponent
 * Body: { opponentId: string, difficulty?: 'easy' | 'medium' | 'hard' }
 */
router.post('/fight', authenticate, async (req: Request, res: Response) => {
    try {
        const { opponentId, difficulty } = req.body;
        const player = await Player.findOne({ userId: (req as any).user!.id });

        if (!player) return res.status(404).json({ error: 'Player not found' });

        const validDifficulty = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium';

        const result = await ArenaService.startFight(
            player._id.toString(),
            opponentId,
            validDifficulty as ArenaService.Difficulty
        );

        return res.json(result);
    } catch (error: any) {
        console.error('Error starting arena fight:', error);
        if (error.message === 'NOT_ENOUGH_ENERGY') {
            return res.status(400).json({ error: 'NOT_ENOUGH_ENERGY' });
        }
        if (error.message === 'NOT_ENOUGH_SOMS') {
            return res.status(400).json({ error: 'NOT_ENOUGH_SOMS' });
        }
        return res.status(500).json({ error: 'Failed to start fight' });
    }
});

/**
 * GET /api/arena/history
 * Get match history
 */
router.get('/history', authenticate, async (req: Request, res: Response) => {
    try {
        const player = await Player.findOne({ userId: (req as any).user!.id });
        if (!player) return res.status(404).json({ error: 'Player not found' });

        const history = await ArenaMatch.find({
            $or: [{ challengerId: player._id }, { opponentId: player._id }]
        })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('challengerId', 'characterId level combatStats.combatPower')
            .populate('opponentId', 'characterId level combatStats.combatPower')
            .populate('winnerId', 'characterId');

        return res.json({ history });
    } catch (error) {
        console.error('Error fetching arena history:', error);
        return res.status(500).json({ error: 'Failed to fetch history' });
    }
});

export default router;
