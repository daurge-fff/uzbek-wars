import { Schema, model, Document, Types } from 'mongoose';

/**
 * Interface for a Player's Achievement progress
 */
export interface IPlayerAchievement extends Document {
    playerId: Types.ObjectId;
    achievementId: string;
    progress: number;
    unlocked: boolean;
    unlockedAt?: Date;
}

const PlayerAchievementSchema = new Schema<IPlayerAchievement>(
    {
        playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
        achievementId: { type: String, required: true },
        progress: { type: Number, default: 0 },
        unlocked: { type: Boolean, default: false },
        unlockedAt: { type: Date }
    },
    {
        timestamps: true
    }
);

PlayerAchievementSchema.index({ playerId: 1, achievementId: 1 }, { unique: true });

export const PlayerAchievement = model<IPlayerAchievement>('PlayerAchievement', PlayerAchievementSchema);

/**
 * Achievement Definition (Static data)
 */
export interface AchievementDef {
    id: string;
    name: { ru: string; en: string; uz: string; uk: string };
    description: { ru: string; en: string; uz: string; uk: string };
    icon: string;
    targetValue: number;
    reward: {
        soms?: number;
        crystals?: number;
        itemId?: string;
    };
}

export const ALL_ACHIEVEMENTS: AchievementDef[] = [
    {
        id: 'soms_collector_1',
        name: { ru: 'Начинающий собиратель', en: 'Novice Collector', uz: 'Yangi yig\'uvchi', uk: 'Початківець збирач' },
        description: { ru: 'Заработать 10,000 сомов', en: 'Earn 10,000 soms', uz: '10,000 so\'m ishlab toping', uk: 'Заробити 10,000 сомів' },
        icon: '💰',
        targetValue: 10000,
        reward: { soms: 1000 }
    },
    {
        id: 'activity_master_1',
        name: { ru: 'Трудоголик I', en: 'Workaholic I', uz: 'Ishchan I', uk: 'Працьовитий I' },
        description: { ru: 'Выполнить 50 активностей', en: 'Complete 50 activities', uz: '50 ta faoliyatni yakunlang', uk: 'Виконати 50 активностей' },
        icon: '🏃',
        targetValue: 50,
        reward: { crystals: 50 }
    },
    {
        id: 'arena_warrior_1',
        name: { ru: 'Гладиатор I', en: 'Gladiator I', uz: 'Gladiator I', uk: 'Гладіатор I' },
        description: { ru: 'Победить в 10 боях на Арене', en: 'Win 10 Arena fights', uz: 'Arena jangida 10 ta g\'alaba qozoning', uk: 'Перемогти у 10 боях на Арені' },
        icon: '⚔️',
        targetValue: 10,
        reward: { crystals: 100, soms: 5000 }
    }
];
