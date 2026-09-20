import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { Player } from '../models/Player';
import { DailyTask } from '../models/DailyTask';
import { Quest } from '../models/Quest';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/tasks
 * 
 * Returns daily tasks and active quests for the player
 */
router.get(
    '/',
    authenticate,
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id;
            const player = await Player.findOne({ userId });

            if (!player) {
                res.status(404).json({ error: 'Player not found' });
                return;
            }

            const { updateLoginStreak } = await import('../services/TaskService');
            await updateLoginStreak(player);

            let dailyTasks = await DailyTask.find({ isActive: true, requiredLevel: { $lte: player.level } });
            if (dailyTasks.length === 0) {
                // Ensure at least daily_login task exists
                try {
                    await DailyTask.findOneAndUpdate(
                        { id: 'daily_login' },
                        {
                            id: 'daily_login',
                            name: {
                                ru: 'Ежедневный визит',
                                uz: 'Kunlik tashrif',
                                uk: 'Щоденний візит',
                                en: 'Daily Visit'
                            },
                            description: {
                                ru: 'Просто зайди в игру сегодня',
                                uz: "Bugun shunchaki o'yinga kir",
                                uk: 'Просто зайди в гру сьогодні',
                                en: 'Just log in to the game today'
                            },
                            type: 'login',
                            targetValue: 1,
                            rewards: {
                                experience: 100,
                                soms: 500
                            },
                            requiredLevel: 1,
                            isActive: true
                        },
                        { upsert: true, new: true }
                    );
                    dailyTasks = await DailyTask.find({ isActive: true, requiredLevel: { $lte: player.level } });
                } catch (e) {
                    // ignore upsert errors
                }
            }

            const globalQuests = await Quest.find({ isGlobal: true, 'requirements.level': { $lte: player.level } });

            res.status(200).json({
                dailyTasks: dailyTasks.map(task => ({
                    ...task.toObject(),
                    completed: (player.completedDailyTasks || []).includes(task.id)
                })),
                activeQuests: player.activeQuests || [],
                completedQuests: player.completedQuests || [],
                globalAvailableQuests: globalQuests.filter(q => !(player.completedQuests || []).includes(q.id) && !(player.activeQuests || []).find(aq => aq.questId === q.id)),
                streak: player.loginStreak || 1
            });
        } catch (error) {
            logger.error('Error fetching tasks:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

/**
 * POST /api/tasks/claim/:id
 * 
 * Logic to claim manual rewards (if any) or start a quest
 */
router.post(
    '/start-quest/:id',
    authenticate,
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const player = await Player.findOne({ userId });

            if (!player) {
                res.status(404).json({ error: 'Player not found' });
                return;
            }

            if (player.activeQuests.find(q => q.questId === id)) {
                res.status(400).json({ error: 'Quest already active' });
                return;
            }

            const quest = await Quest.findOne({ id });
            if (!quest) {
                res.status(404).json({ error: 'Quest not found' });
                return;
            }

            player.activeQuests.push({
                questId: id,
                progress: 0,
                completed: false
            });

            await player.save();
            res.status(200).json({ message: 'Quest started', activeQuests: player.activeQuests });
        } catch (error) {
            logger.error('Error starting quest:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

export default router;
