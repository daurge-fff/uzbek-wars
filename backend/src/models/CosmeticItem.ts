import { Schema, model, Document } from 'mongoose';

/**
 * Cosmetic item type
 * Determines where the item can be equipped
 */
export type CosmeticType = 'clothing' | 'background';

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
 * CosmeticItem document interface
 * Represents purchasable cosmetic items (no gameplay impact)
 */
export interface ICosmeticItem extends Document {
  itemId: string;
  type: CosmeticType;
  name: ICosmeticName;
  description: ICosmeticDescription;
  price: number;
  imageUrl: string;
  rarity: CosmeticRarity;
}

/**
 * CosmeticItem schema for MongoDB
 * Stores cosmetic items purchasable with donation currency
 * These items provide no gameplay advantage (cosmetic only)
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
    enum: ['clothing', 'background'],
    required: true,
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
    min: 0, // Price in donation currency (crystals)
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
});

export const CosmeticItem = model<ICosmeticItem>(
  'CosmeticItem',
  CosmeticItemSchema
);
