import { Schema, model, Document, Types } from 'mongoose';

/**
 * Donation status tracking
 * Used to prevent duplicate processing of payments
 */
export type DonationStatus = 'pending' | 'success' | 'failed';

/**
 * Donation document interface
 * Tracks all donation transactions for audit and bonus application
 */
export interface IDonation extends Document {
  userId: Types.ObjectId;
  amount: number;
  donationCurrencyAwarded: number;
  status: DonationStatus;
  paymentId: string;
  bonusApplied: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Donation schema for MongoDB
 * Stores donation transactions and tracks bonus application
 * All transactions are logged for audit purposes
 */
const DonationSchema = new Schema<IDonation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // Indexed for user donation history queries
    },
    amount: {
      type: Number,
      required: true,
      min: 0, // Amount in real currency (rubles)
    },
    donationCurrencyAwarded: {
      type: Number,
      required: true,
      min: 0, // Amount of crystals awarded
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    paymentId: {
      type: String,
      required: true,
      index: true, // Indexed for payment system webhook lookups
    },
    bonusApplied: {
      type: Boolean,
      default: false, // Prevents duplicate bonus application
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

export const Donation = model<IDonation>('Donation', DonationSchema);
