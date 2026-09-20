import { IPlayer } from '../models/Player';
import { DailyTask } from '../models/DailyTask';
import { Quest } from '../models/Quest';
import { logger } from '../utils/logger';

/**
 * Task Service
 * 
 * Handles logic for daily tasks, quests, and login streaks.
 */

/**
 * Update player's login streak
 */
export async function updateLoginStreak(player: IPlayer): Promise<void> {
    const now = new Date();
    const lastLogin = player.lastLoginDate;

    if (!player.completedDailyTasks) {
        player.completedDailyTasks = [];
    }

    if (!lastLogin) {
        // First login ever
        player.loginStreak = 1;
        player.lastLoginDate = now;
        await player.save();
        await updateTaskProgress(player, 'login', 1);
        return;
    }

    const isSameDay = 
        now.getFullYear() === lastLogin.getFullYear() &&
        now.getMonth() === lastLogin.getMonth() &&
        now.getDate() === lastLogin.getDate();

    if (!isSameDay) {
        // Reset completed daily tasks and progress for the new calendar day
        player.completedDailyTasks = [];
        player.dailyTaskProgress = new Map();

        const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const dLast = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate()).getTime();
        const dayDiff = Math.round((dNow - dLast) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1) {
            player.loginStreak = (player.loginStreak || 0) + 1;
        } else {
            player.loginStreak = 1;
        }
        player.lastLoginDate = now;
        await player.save();
        await updateTaskProgress(player, 'login', 1);
    } else {
        // Same day login: ensure daily login task is completed if it hasn't been yet
        if (!player.completedDailyTasks.includes('daily_login')) {
            await updateTaskProgress(player, 'login', 1);
        }
    }

    await player.save();
}

/**
 * Update task progress for a player
 */
export async function updateTaskProgress(
    player: IPlayer,
    type: string,
    value: number
): Promise<void> {
    try {
        logger.info(`Updating task progress for player ${player._id}: type=${type}, value=${value}`);

        if (!player.completedDailyTasks) {
            player.completedDailyTasks = [];
        }
        if (!player.dailyTaskProgress) {
            player.dailyTaskProgress = new Map();
        }

        // Find active daily tasks of this type
        const activeTasks = await DailyTask.find({ type, isActive: true });

        // Fallback if DB is not seeded with daily_login
        if (type === 'login' && activeTasks.length === 0) {
            if (!player.completedDailyTasks.includes('daily_login')) {
                await completeDailyTask(player, 'daily_login');
            }
            return;
        }

        for (const task of activeTasks) {
            if (player.completedDailyTasks.includes(task.id)) continue;

            // Increment cumulative progress
            const currentProgress = player.dailyTaskProgress.get(task.id) || 0;
            const newProgress = currentProgress + value;
            player.dailyTaskProgress.set(task.id, newProgress);

            if (newProgress >= task.targetValue) {
                await completeDailyTask(player, task.id);
            }
        }

        await player.save();
    } catch (error) {
        logger.error('Error updating task progress:', error);
    }
}

/**
 * Update progress for active quests matching a step type
 * Completes the quest and grants rewards when the target is reached.
 */
export async function updateQuestProgress(
    player: IPlayer,
    stepType: string,
    value: number
): Promise<void> {
    try {
        if (!player.activeQuests || player.activeQuests.length === 0) return;

        for (const activeQuest of player.activeQuests) {
            if (activeQuest.completed) continue;

            const quest = await Quest.findOne({ id: activeQuest.questId });
            if (!quest) continue;

            const step = quest.steps.find(s => s.type === stepType);
            if (!step) continue;

            activeQuest.progress += value;

            if (activeQuest.progress >= step.targetValue) {
                activeQuest.completed = true;

                if (!player.completedQuests) player.completedQuests = [];
                if (!player.completedQuests.includes(quest.id)) {
                    player.completedQuests.push(quest.id);
                    player.experience += quest.rewards.experience || 0;
                    player.soms += quest.rewards.soms || 0;
                    if (quest.rewards.crystals) {
                        player.donationCurrency = (player.donationCurrency || 0) + quest.rewards.crystals;
                    }

                    const { processLevelUp } = await import('./ProgressionService');
                    processLevelUp(player);
                    logger.info(`Player ${player._id} completed quest ${quest.id}`);
                }
            }
        }

        await player.save();
    } catch (error) {
        logger.error('Error updating quest progress:', error);
    }
}

/**
 * Complete a daily task and award rewards
 */
export async function completeDailyTask(player: IPlayer, taskId: string): Promise<void> {
    if (!player.completedDailyTasks) {
        player.completedDailyTasks = [];
    }
    if (player.completedDailyTasks.includes(taskId)) return;

    let task = await DailyTask.findOne({ id: taskId });
    
    player.completedDailyTasks.push(taskId);

    if (task) {
        if (task.rewards?.experience) {
            player.experience += task.rewards.experience;
        }
        if (task.rewards?.soms) {
            player.soms += task.rewards.soms;
        }
    } else if (taskId === 'daily_login') {
        // Default fallback rewards for daily login
        player.experience += 100;
        player.soms += 500;
    }

    // Process level up if XP threshold reached
    const { processLevelUp } = await import('./ProgressionService');
    processLevelUp(player);

    await player.save();
    logger.info(`Player ${player._id} completed daily task ${taskId}`);
}
