/**
 * Donation Service
 * 
 * Manages donation system including:
 * - Donation currency (crystals) packages
 * - Donation processing and validation
 * - Transaction logging
 * - Webhook handling for payment providers
 * 
 * Requirements: 16.1, 16.2, 16.6
 */

import { Player } from '../models/Player';
import { Donation } from '../models/Donation';
import { logger } from '../utils/logger';

/**
 * Donation package configuration
 * 
 * Each package includes:
 * - amount: Price in rubles
 * - crystals: Base crystals awarded
 * - bonus: Additional bonus percentage for larger packages
 * 
 * Design philosophy:
 * - Encourage larger donations with bonus crystals
 * - No pay-to-win: crystals only buy cosmetics
 * - Transparent pricing with clear value
 */
export const DONATION_PACKAGES = [
  {
    id: 'small',
    amount: 100, // 100 rubles
    crystals: 100,
    bonus: 0,
    name: {
      ru: 'Маленький пакет',
      uz: 'Kichik paket',
      uk: 'Малий пакет',
      en: 'Small Package'
    }
  },
  {
    id: 'medium',
    amount: 500, // 500 rubles
    crystals: 550, // +10% bonus
    bonus: 10,
    name: {
      ru: 'Средний пакет',
      uz: 'O\'rta paket',
      uk: 'Середній пакет',
      en: 'Medium Package'
    }
  },
  {
    id: 'large',
    amount: 1000, // 1000 rubles
    crystals: 1200, // +20% bonus
    bonus: 20,
    name: {
      ru: 'Большой пакет',
      uz: 'Katta paket',
      uk: 'Великий пакет',
      en: 'Large Package'
    }
  },
  {
    id: 'mega',
    amount: 5000, // 5000 rubles
    crystals: 6500, // +30% bonus
    bonus: 30,
    name: {
      ru: 'Мега пакет',
      uz: 'Mega paket',
      uk: 'Мега пакет',
      en: 'Mega Package'
    }
  }
] as const;

/**
 * Donation result interface
 */
export interface DonationResult {
  success: boolean;
  donationId: string;
  crystalsAwarded: number;
  message?: string;
}

/**
 * Gets all available donation packages
 * 
 * Returns packages sorted by price (ascending)
 * Used for displaying donation options in UI
 * 
 * @returns Array of donation packages
 */
export function getDonationPackages() {
  return DONATION_PACKAGES;
}

/**
 * Gets donation package by ID
 * 
 * @param packageId - Package identifier
 * @returns Package configuration or undefined
 */
export function getDonationPackageById(packageId: string) {
  return DONATION_PACKAGES.find(pkg => pkg.id === packageId);
}

/**
 * Creates a donation record
 * 
 * Creates pending donation in database for tracking.
 * Does NOT award crystals yet - that happens in processDonation
 * after payment confirmation.
 * 
 * Flow:
 * 1. Create pending donation record
 * 2. Return payment URL to client
 * 3. Client redirects to payment provider
 * 4. Payment provider calls webhook
 * 5. Webhook calls processDonation
 * 
 * Requirements: 10.2
 * 
 * @param userId - User's database ID
 * @param packageId - Donation package ID
 * @param paymentId - Payment provider transaction ID
 * @returns Donation record
 */
export async function createDonation(
  userId: string,
  packageId: string,
  paymentId: string
): Promise<DonationResult> {
  try {
    const pkg = getDonationPackageById(packageId);
    if (!pkg) {
      throw new Error(`Invalid package ID: ${packageId}`);
    }

    // Create donation record
    const donation = await Donation.create({
      userId,
      amount: pkg.amount,
      donationCurrencyAwarded: pkg.crystals,
      status: 'pending',
      paymentId,
      bonusApplied: false
    });

    logger.info(`Donation created for user ${userId}`, {
      donationId: donation._id,
      packageId,
      amount: pkg.amount,
      crystals: pkg.crystals
    });

    return {
      success: true,
      donationId: donation._id.toString(),
      crystalsAwarded: 0 // Not awarded yet, pending payment
    };
  } catch (error) {
    logger.error('Error creating donation:', error);
    throw error;
  }
}

/**
 * Processes a successful donation
 * 
 * Awards crystals to player after payment confirmation.
 * This function is idempotent - calling it multiple times
 * with same donationId will not award crystals twice.
 * 
 * IMPORTANT: Does NOT award experience or soms
 * Only awards donation currency (crystals)
 * 
 * Requirements: 16.1, 16.2, 16.6
 * 
 * @param donationId - Donation record ID
 * @returns Donation result with crystals awarded
 */
export async function processDonation(donationId: string): Promise<DonationResult> {
  try {
    // Find donation
    const donation = await Donation.findById(donationId);
    if (!donation) {
      throw new Error(`Donation not found: ${donationId}`);
    }

    // Check if already processed
    if (donation.bonusApplied) {
      logger.warn(`Donation ${donationId} already processed, skipping`);
      return {
        success: true,
        donationId: donation._id.toString(),
        crystalsAwarded: donation.donationCurrencyAwarded,
        message: 'Donation already processed'
      };
    }

    // Find player
    const player = await Player.findOne({ userId: donation.userId });
    if (!player) {
      throw new Error(`Player not found for user ${donation.userId}`);
    }

    // Award crystals (donation currency)
    player.donationCurrency += donation.donationCurrencyAwarded;
    await player.save();

    // Mark donation as processed
    donation.status = 'success';
    donation.bonusApplied = true;
    await donation.save();

    logger.info(`Donation processed successfully`, {
      donationId: donation._id,
      userId: donation.userId,
      crystalsAwarded: donation.donationCurrencyAwarded,
      newBalance: player.donationCurrency
    });

    return {
      success: true,
      donationId: donation._id.toString(),
      crystalsAwarded: donation.donationCurrencyAwarded,
      message: 'Crystals awarded successfully'
    };
  } catch (error) {
    logger.error('Error processing donation:', error);
    throw error;
  }
}

/**
 * Handles donation failure
 * 
 * Marks donation as failed in database.
 * No crystals are awarded.
 * 
 * @param donationId - Donation record ID
 * @param reason - Failure reason
 */
export async function failDonation(
  donationId: string,
  reason: string
): Promise<void> {
  try {
    const donation = await Donation.findById(donationId);
    if (!donation) {
      logger.warn(`Donation not found for failure: ${donationId}`);
      return;
    }

    donation.status = 'failed';
    await donation.save();

    logger.info(`Donation marked as failed`, {
      donationId,
      reason
    });
  } catch (error) {
    logger.error('Error failing donation:', error);
    throw error;
  }
}

/**
 * Gets donation history for a user
 * 
 * Returns all donations sorted by date (newest first)
 * Used for displaying transaction history
 * 
 * @param userId - User's database ID
 * @param limit - Maximum number of records to return
 * @returns Array of donation records
 */
export async function getDonationHistory(
  userId: string,
  limit: number = 50
): Promise<Array<{
  id: string;
  amount: number;
  crystals: number;
  status: string;
  createdAt: Date;
}>> {
  try {
    const donations = await Donation.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return donations.map(donation => ({
      id: donation._id.toString(),
      amount: donation.amount,
      crystals: donation.donationCurrencyAwarded,
      status: donation.status,
      createdAt: donation.createdAt
    }));
  } catch (error) {
    logger.error('Error getting donation history:', error);
    return [];
  }
}

/**
 * Gets total donations for a user
 * 
 * Calculates total amount spent and crystals received
 * Used for statistics and achievements
 * 
 * @param userId - User's database ID
 * @returns Total statistics
 */
export async function getUserDonationStats(userId: string): Promise<{
  totalAmount: number;
  totalCrystals: number;
  donationCount: number;
}> {
  try {
    const donations = await Donation.find({
      userId,
      status: 'success'
    });

    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
    const totalCrystals = donations.reduce((sum, d) => sum + d.donationCurrencyAwarded, 0);

    return {
      totalAmount,
      totalCrystals,
      donationCount: donations.length
    };
  } catch (error) {
    logger.error('Error getting donation stats:', error);
    return {
      totalAmount: 0,
      totalCrystals: 0,
      donationCount: 0
    };
  }
}
