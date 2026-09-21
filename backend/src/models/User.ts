import { Schema, model, Document } from 'mongoose';

/**
 * Supported languages for the application interface
 */
export type Language = 'ru' | 'uz' | 'uk' | 'en';

/**
 * Device information captured during authentication
 * Used for twin account detection
 */
export interface IDeviceInfo {
  userAgent: string;
  platform: string;
  deviceId: string;
}

/**
 * User document interface representing authenticated users
 * Users authenticate via Google OAuth 2.0
 */
export interface IUser extends Document {
  googleId: string;
  email: string;
  displayName: string;
  googleName?: string; // Оригинальное имя из Google
  avatar?: string;
  language: Language;
  ipAddress: string;
  deviceInfo: IDeviceInfo;
  telegramId?: string;
  telegramUsername?: string;
  /** Profile fields coming from the Telegram mini app */
  firstName?: string;
  lastName?: string;
  languageCode?: string;
  photoUrl?: string;
  telegramLastLoginAt?: Date;
  isVerified: boolean;
  username?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User schema for MongoDB
 * Stores Google OAuth user data and device information for twin detection
 */
const UserSchema = new Schema<IUser>(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true, // Indexed for fast OAuth lookups
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    googleName: {
      type: String,
    },
    avatar: {
      type: String,
    },
    language: {
      type: String,
      enum: ['ru', 'uz', 'uk', 'en'],
      default: 'ru',
    },
    ipAddress: {
      type: String,
      index: true, // Indexed for twin detection queries
    },
    deviceInfo: {
      userAgent: { type: String },
      platform: { type: String },
      deviceId: {
        type: String,
        index: true, // Indexed for twin detection queries
      },
    },
    telegramId: {
      type: String,
      index: true,
    },
    telegramUsername: {
      type: String,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    languageCode: {
      type: String,
    },
    photoUrl: {
      type: String,
    },
    telegramLastLoginAt: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    username: {
      type: String,
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

export const User = model<IUser>('User', UserSchema);
