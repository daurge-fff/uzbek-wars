import { Schema, model, Document, Types } from 'mongoose';

/**
 * Player statistics representing Tamagotchi-style characteristics
 * All stats range from 0-100
 */
export interface IPlayerStats {
  hunger: number;
  health: number;
  mood: number;
  energy: number;
}

/**
 * Combat statistics for PvP and city battles
 * Used for arena fights and city wars
 */
export interface IPlayerCombatStats {
  strength: number;      // Physical attack power (0-100)
  defense: number;       // Physical damage reduction (0-100)
  agility: number;       // Dodge/crit chance (0-100)
  stamina: number;       // Max health points (0-100)
  intelligence: number;  // Magic power/resistance (0-100)
  luck: number;          // Secret stat, affects all (0-1, default 0)
  statPoints: number;    // Available points to distribute
  combatPower: number;   // Calculated total power
}

/**
 * Cosmetic items owned and equipped by the player
 * Purchased with soms or donation currency (crystals)
 */
export interface IPlayerCosmetics {
  clothing: string[];
  backgrounds: string[];
  accessories: string[];
  backpacks: string[];
  consumables: string[];
  /** Purchased equipment (weapons and other stat gear) */
  equipment?: string[];
  activeClothing?: string;
  activeBackground?: string;
  activeAccessory?: string;
  activeBackpack?: string;
  // Equipment slots for clothing
  equippedHead?: string;
  equippedBody?: string;
  equippedFeet?: string;
  equippedWeapon?: string;
  equippedAccessory?: string;
}

/**
 * Player inventory system
 */
export interface IPlayerInventory {
  items: Array<{
    itemId: string;
    quantity: number;
  }>;
  maxSlots: number;
}

/**
 * Player document interface representing game progress
 * Each user has exactly one player profile
 */
export interface IPlayer extends Document {
  userId: Types.ObjectId;
  characterId: string;
  cityId: string;
  level: number;
  experience: number;
  soms: number;
  donationCurrency: number;
  stats: IPlayerStats;
  combatStats: IPlayerCombatStats;
  cosmetics: IPlayerCosmetics;
  inventory: IPlayerInventory;
  referralCode: string;
  referredBy?: string;
  lastActivityTime: Date;
  currentActivity?: string;
  currentActivityName?: string;
  currentActivityStartTime?: Date;
  currentActivityEndTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  // New features: Streaks and Tasks
  loginStreak: number;
  lastLoginDate?: Date;
  completedDailyTasks: string[]; // Task IDs
  dailyTaskProgress: Map<string, number>; // taskId -> cumulative progress count
  activeQuests: Array<{
    questId: string;
    progress: number;
    completed: boolean;
  }>;
  completedQuests: string[]; // Quest IDs
  linkingBonusClaimed: boolean;
}

/**
 * Player schema for MongoDB
 * Stores all game progression data including stats, cosmetics, and referral info
 */
const PlayerSchema = new Schema<IPlayer>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One player per user
      index: true, // Indexed for fast user lookups
    },
    characterId: {
      type: String,
      required: true,
    },
    cityId: {
      type: String,
      required: true,
      index: true, // Indexed for city-based queries (leaderboards, wars)
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
      index: true, // Indexed for leaderboard queries
    },
    experience: {
      type: Number,
      default: 0,
      min: 0,
    },
    soms: {
      type: Number,
      default: 100,
      min: 0,
      index: true, // Indexed for soms-based leaderboard queries
    },
    donationCurrency: {
      type: Number,
      default: 0,
      min: 0,
    },
    stats: {
      hunger: {
        type: Number,
        default: 100,
        min: 0,
        max: 100,
      },
      health: {
        type: Number,
        default: 100,
        min: 0,
        max: 100,
      },
      mood: {
        type: Number,
        default: 100,
        min: 0,
        max: 100,
      },
      energy: {
        type: Number,
        default: 100,
        min: 0,
        max: 100,
      },
    },
    combatStats: {
      strength: {
        type: Number,
        default: 10,
        min: 0,
        max: 100,
      },
      defense: {
        type: Number,
        default: 10,
        min: 0,
        max: 100,
      },
      agility: {
        type: Number,
        default: 10,
        min: 0,
        max: 100,
      },
      stamina: {
        type: Number,
        default: 10,
        min: 0,
        max: 100,
      },
      intelligence: {
        type: Number,
        default: 10,
        min: 0,
        max: 100,
      },
      luck: {
        type: Number,
        default: 0,
        min: 0,
        max: 1,
      },
      statPoints: {
        type: Number,
        default: 0,
        min: 0,
      },
      combatPower: {
        type: Number,
        default: 0,
        index: true,
      },
    },
    cosmetics: {
      clothing: [{ type: String }],
      backgrounds: [{ type: String }],
      accessories: [{ type: String }],
      backpacks: [{ type: String }],
      consumables: [{ type: String }],
      equipment: [{ type: String }],
      activeClothing: { type: String },
      activeBackground: { type: String },
      activeAccessory: { type: String },
      activeBackpack: { type: String },
      equippedHead: { type: String },
      equippedBody: { type: String },
      equippedFeet: { type: String },
      equippedWeapon: { type: String },
      equippedAccessory: { type: String },
    },
    inventory: {
      items: [
        {
          itemId: { type: String, required: true },
          quantity: { type: Number, required: true, min: 1 },
        },
      ],
      maxSlots: {
        type: Number,
        default: 20,
        min: 1,
      },
    },
    referralCode: {
      type: String,
      required: true,
      unique: true,
      index: true, // Indexed for referral code lookups
    },
    referredBy: {
      type: String,
      index: true, // Indexed for referral tracking queries
    },
    lastActivityTime: {
      type: Date,
      default: Date.now,
      index: true, // Indexed for online status queries
    },
    currentActivity: {
      type: String,
    },
    currentActivityName: {
      type: String,
    },
    currentActivityStartTime: {
      type: Date,
    },
    currentActivityEndTime: {
      type: Date,
    },
    // New features: Streaks and Tasks
    loginStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastLoginDate: {
      type: Date,
    },
    completedDailyTasks: [{
      type: String,
    }],
    dailyTaskProgress: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    activeQuests: [{
      questId: { type: String, required: true },
      progress: { type: Number, default: 0 },
      completed: { type: Boolean, default: false },
    }],
    completedQuests: [{
      type: String,
    }],
    linkingBonusClaimed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Compound indexes for leaderboard optimization
PlayerSchema.index({ level: -1, experience: -1, soms: -1 }); // Global leaderboard
PlayerSchema.index({ cityId: 1, level: -1, experience: -1 }); // City leaderboard
PlayerSchema.index({ soms: -1, level: -1 }); // Soms leaderboard
PlayerSchema.index({ donationCurrency: -1, level: -1 }); // Crystals leaderboard
PlayerSchema.index({ referredBy: 1 }); // Referral leaderboard

// Combat stats indexes for PvP matchmaking
PlayerSchema.index({
  'combatStats.strength': 1,
  'combatStats.defense': 1,
  'combatStats.agility': 1
}); // Combat power index

export const Player = model<IPlayer>('Player', PlayerSchema);
