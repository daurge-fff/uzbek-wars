import { Schema, model, Document, Types } from 'mongoose';

/**
 * ActivityLog document interface
 * Tracks all player activities for analytics and auditing
 */
export interface IActivityLog extends Document {
  userId: Types.ObjectId;
  activityId: string;
  experienceGained: number;
  somsGained: number;
  penaltyApplied: boolean;
  timestamp: Date;
}

/**
 * ActivityLog schema for MongoDB
 * Stores a log of all executed activities for analytics
 * Useful for tracking player behavior and game balance
 */
const ActivityLogSchema = new Schema<IActivityLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Indexed for user activity history queries
  },
  activityId: {
    type: String,
    required: true,
  },
  experienceGained: {
    type: Number,
    default: 0,
  },
  somsGained: {
    type: Number,
    default: 0, // Can be negative if penalty applied
  },
  penaltyApplied: {
    type: Boolean,
    default: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true, // Indexed for time-based queries (analytics)
  },
});

export const ActivityLog = model<IActivityLog>(
  'ActivityLog',
  ActivityLogSchema
);
