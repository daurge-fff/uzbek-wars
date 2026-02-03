import { Schema, model, Document } from 'mongoose';

/**
 * Cosmetic item type
 * Determines where the item can be equipped or how it can be used
 */
export type CosmeticType = 'clothing' | 'background' | 'backpack' | 'consumable';

/**
 * Equipment slot for clothing items
 */
export type EquipmentSlot = 'head' | 'body' | 'feet' | 'backpack' | 'accessory';

/**
 * Consumable item category
 */
export type ConsumableCategory = 'food' | 'drink' | 'medicine';

/**
 * Price currency type
 */
export type PriceCurrency = 'soms' | 'crystals';

/**
 * Cosmetic item rarity
 * Affects visual presentation and perceived value
 */
export type CosmeticRarity = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * Localized cosmetic item name
 */
export interface ICosmeticName {
  ru: string;
  uz: string;
  uk: string;
  en: string;
}

/**
 * Localized cosmetic item description
 */
export interface ICosmeticDescription {
  ru: string;
  uz: string;
  uk: string;
  en: string;
}

/**
 * Item bonus effects (for backpacks and special items)
 */
export interface IItemBonus {
  inventorySlots?: number;
  incomeBonus?: number;
  sellBonus?: number;
}

/**
 * Consumable item effects (stat restoration)
 */
export interface IConsumableEffects {
  hunger?: number;
  health?: number;
  mood?: number;
  energy?: number;
}

/**
 * CosmeticItem document interface
 * Represents purchasable cosmetic items (no gameplay impact)
 * and consumable items (can be used to restore stats)
 */
export interface ICosmeticItem extends Document {
  itemId: string;
  type: CosmeticType;
  slot?: EquipmentSlot;
  category?: ConsumableCategory;
  name: ICosmeticName;
  description: ICosmeticDescription;
  price: number;
  priceCurrency?: PriceCurrency;
  imageUrl: string;
  rarity: CosmeticRarity;
  bonus?: IItemBonus;
  effects?: IConsumableEffects;
}

/**
 * CosmeticItem schema for MongoDB
 * Stores cosmetic items purchasable with donation currency or soms
 * These items provide no gameplay advantage (cosmetic only) or can be consumed
 */
const CosmeticItemSchema = new Schema<ICosmeticItem>({
  itemId: {
    type: String,
    required: true,
    unique: true,
    index: true, // Indexed for fast item lookups
  },
  type: {
    type: String,
    enum: ['clothing', 'background', 'backpack', 'consumable'],
    required: true,
  },
  slot: {
    type: String,
    enum: ['head', 'body', 'feet', 'backpack', 'accessory'],
  },
  category: {
    type: String,
    enum: ['food', 'drink', 'medicine'],
  },
  name: {
    ru: { type: String, required: true },
    uz: { type: String, required: true },
    uk: { type: String, required: true },
    en: { type: String, required: true },
  },
  description: {
    ru: { type: String },
    uz: { type: String },
    uk: { type: String },
    en: { type: String },
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  priceCurrency: {
    type: String,
    enum: ['soms', 'crystals'],
    default: 'crystals',
  },
  imageUrl: {
    type: String,
    required: true,
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common',
  },
  bonus: {
    inventorySlots: { type: Number },
    incomeBonus: { type: Number },
    sellBonus: { type: Number },
  },
  effects: {
    hunger: { type: Number },
    health: { type: Number },
    mood: { type: Number },
    energy: { type: Number },
  },
});

export const CosmeticItem = model<ICosmeticItem>(
  'CosmeticItem',
  CosmeticItemSchema
);
