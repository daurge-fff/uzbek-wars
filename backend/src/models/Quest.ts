import { Schema, model, Document } from 'mongoose';

export interface IQuest extends Document {
    id: string; // Machine-readable ID
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
    requirements: {
        level?: number;
        previousQuestId?: string;
        cityId?: string;
    };
    steps: Array<{
        id: string;
        description: {
            ru: string;
            uz: string;
            uk: string;
            en: string;
        };
        targetValue: number;
        type: string; // e.g., 'activity_id', 'travel_to_city'
    }>;
    rewards: {
        experience: number;
        soms: number;
        crystals?: number;
        items?: string[];
    };
    isGlobal: boolean; // Accessible to everyone vs specific triggers
}

const QuestSchema = new Schema<IQuest>(
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
        requirements: {
            level: { type: Number, default: 1 },
            previousQuestId: { type: String },
            cityId: { type: String },
        },
        steps: [{
            id: { type: String, required: true },
            description: {
                ru: { type: String, required: true },
                uz: { type: String, required: true },
                uk: { type: String, required: true },
                en: { type: String, required: true },
            },
            targetValue: { type: Number, default: 1 },
            type: { type: String, required: true },
        }],
        rewards: {
            experience: { type: Number, default: 0 },
            soms: { type: Number, default: 0 },
            crystals: { type: Number, default: 0 },
            items: [{ type: String }],
        },
        isGlobal: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export const Quest = model<IQuest>('Quest', QuestSchema);
