import { Schema, model, Document } from 'mongoose';

/**
 * Localized city name in all supported languages
 */
export interface ICityName {
  ru: string;
  uz: string;
  uk: string;
  en: string;
}

/**
 * Visual theme configuration for the city
 * Each city has unique aesthetics
 */
export interface ICityTheme {
  primaryColor: string;
  backgroundImage: string;
  description: string;
}

/**
 * City document interface representing game locations
 * Cities are balanced to distribute players evenly
 */
export interface ICity extends Document {
  cityId: string;
  name: ICityName;
  playerCount: number;
  maxPlayers: number;
  isOpen: boolean;
  theme: ICityTheme;
}

/**
 * City schema for MongoDB
 * Stores city data and player distribution for balancing
 */
const CitySchema = new Schema<ICity>({
  cityId: {
    type: String,
    required: true,
    unique: true,
    index: true, // Indexed for fast city lookups
  },
  name: {
    ru: { type: String, required: true },
    uz: { type: String, required: true },
    uk: { type: String, required: true },
    en: { type: String, required: true },
  },
  playerCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  maxPlayers: {
    type: Number,
    required: true,
  },
  isOpen: {
    type: Boolean,
    default: true,
  },
  theme: {
    primaryColor: { type: String },
    backgroundImage: { type: String },
    description: { type: String },
  },
});

export const City = model<ICity>('City', CitySchema);
