import { Schema, model, Document, Types } from 'mongoose';

export interface IArenaMatch extends Document {
    challengerId: Types.ObjectId;
    opponentId: Types.ObjectId;
    winnerId: Types.ObjectId;
    difficulty: 'easy' | 'medium' | 'hard';
    challengerStats: {
        level: number;
        combatPower: number;
    };
    opponentStats: {
        level: number;
        combatPower: number;
    };
    rewards: {
        soms: number;
        experience: number;
        ratingPoints: number;
        energyCost: number;
        healthCost: number;
        somsCost: number;
    };
    matchLog: Array<{
        type: string;
        turn: number;
        attackerId: Types.ObjectId;
        attackerName: string;
        defenderName: string;
        damage: number;
        attackerHealth: number;
        defenderHealth: number;
        attackerMaxHealth: number;
        defenderMaxHealth: number;
    }>;
    stats: {
        totalTurns: number;
        totalDamageDealt: number;
        totalDamageReceived: number;
        crits: number;
        dodges: number;
        combos: number;
    };
    createdAt: Date;
}

const ArenaMatchSchema = new Schema<IArenaMatch>(
    {
        challengerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
        opponentId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
        winnerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
        difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
        challengerStats: {
            level: { type: Number, required: true },
            combatPower: { type: Number, required: true }
        },
        opponentStats: {
            level: { type: Number, required: true },
            combatPower: { type: Number, required: true }
        },
        rewards: {
            soms: { type: Number, default: 0 },
            experience: { type: Number, default: 0 },
            ratingPoints: { type: Number, default: 0 },
            energyCost: { type: Number, default: 0 },
            healthCost: { type: Number, default: 0 },
            somsCost: { type: Number, default: 0 },
        },
        matchLog: [
            {
                type: { type: String },
                turn: { type: Number },
                attackerId: { type: Schema.Types.ObjectId, ref: 'Player' },
                attackerName: { type: String },
                defenderName: { type: String },
                damage: { type: Number },
                attackerHealth: { type: Number },
                defenderHealth: { type: Number },
                attackerMaxHealth: { type: Number },
                defenderMaxHealth: { type: Number },
            }
        ],
        stats: {
            totalTurns: { type: Number, default: 0 },
            totalDamageDealt: { type: Number, default: 0 },
            totalDamageReceived: { type: Number, default: 0 },
            crits: { type: Number, default: 0 },
            dodges: { type: Number, default: 0 },
            combos: { type: Number, default: 0 },
        }
    },
    {
        timestamps: { createdAt: true, updatedAt: false }
    }
);

ArenaMatchSchema.index({ challengerId: 1, createdAt: -1 });
ArenaMatchSchema.index({ opponentId: 1, createdAt: -1 });
ArenaMatchSchema.index({ winnerId: 1, createdAt: -1 });

export const ArenaMatch = model<IArenaMatch>('ArenaMatch', ArenaMatchSchema);
