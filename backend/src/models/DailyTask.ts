import { Schema, model, Document } from 'mongoose';

export type TaskType = 'login' | 'activity_count' | 'soms_earned' | 'pvp_battle' | 'pvp_win';

export interface IDailyTask extends Document {
    id: string; // Machine-readable ID (e.g., 'daily_login')
    name: {
        ru: string;
        uz: string;
        uk: string;
        en: string;
    };
    description: {
        ru: string;
        uz: string;
        uk: string;
        en: string;
    };
    type: TaskType;
    targetValue: number; // e.g., 5 for 'do 5 activities'
    rewards: {
        experience: number;
        soms: number;
        crystals?: number;
    };
    requiredLevel: number;
    isActive: boolean;
}

const DailyTaskSchema = new Schema<IDailyTask>(
    {
        id: { type: String, required: true, unique: true },
        name: {
            ru: { type: String, required: true },
            uz: { type: String, required: true },
            uk: { type: String, required: true },
            en: { type: String, required: true },
        },
        description: {
            ru: { type: String, required: true },
            uz: { type: String, required: true },
            uk: { type: String, required: true },
            en: { type: String, required: true },
        },
        type: {
            type: String,
            enum: ['login', 'activity_count', 'soms_earned', 'pvp_battle', 'pvp_win'],
            required: true,
        },
        targetValue: { type: Number, default: 1 },
        rewards: {
            experience: { type: Number, default: 0 },
            soms: { type: Number, default: 0 },
            crystals: { type: Number, default: 0 },
        },
        requiredLevel: { type: Number, default: 1 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export const DailyTask = model<IDailyTask>('DailyTask', DailyTaskSchema);
