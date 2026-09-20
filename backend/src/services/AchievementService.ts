import { PlayerAchievement, ALL_ACHIEVEMENTS, AchievementDef } from '../models/Achievement';
import { Player } from '../models/Player';
import { logger } from '../utils/logger';

/**
 * Update achievement progress for a player
 */
export async function trackProgress(playerId: string, achievementId: string, value: number, isAbsolute: boolean = false) {
    try {
        const achievement = ALL_ACHIEVEMENTS.find(a => a.id === achievementId);
        if (!achievement) return;

        let progressDoc = await PlayerAchievement.findOne({ playerId, achievementId });

        if (!progressDoc) {
            progressDoc = new PlayerAchievement({
                playerId,
                achievementId,
                progress: 0,
                unlocked: false
            });
        }

        if (progressDoc.unlocked) return;

        if (isAbsolute) {
            progressDoc.progress = value;
        } else {
            progressDoc.progress += value;
        }

        // Check for unlock
        if (progressDoc.progress >= achievement.targetValue) {
            progressDoc.unlocked = true;
            progressDoc.unlockedAt = new Date();

            // Grant rewards
            await grantRewards(playerId, achievement);
            logger.info(`Achievement unlocked: ${achievementId} for player ${playerId}`);
        }

        await progressDoc.save();
        return progressDoc;
    } catch (error) {
        logger.error(`Error tracking achievement progress: ${error}`);
        return null;
    }
}

/**
 * Grant rewards for an achievement
 */
async function grantRewards(playerId: string, achievement: AchievementDef) {
    const player = await Player.findById(playerId);
    if (!player) return;

    if (achievement.reward.soms) player.soms += achievement.reward.soms;
    if (achievement.reward.crystals) player.donationCurrency += achievement.reward.crystals;
    // TODO: Add item reward if needed

    await player.save();
}

/**
 * Get all achievements with player progress
 */
export async function getPlayerAchievements(playerId: string) {
    const progress = await PlayerAchievement.find({ playerId });

    return ALL_ACHIEVEMENTS.map(def => {
        const playerProgress = progress.find(p => p.achievementId === def.id);
        return {
            ...def,
            progress: playerProgress?.progress || 0,
            unlocked: playerProgress?.unlocked || false,
            unlockedAt: playerProgress?.unlockedAt
        };
    });
}
