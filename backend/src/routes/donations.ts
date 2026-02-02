/**
 * Donation API Routes
 * 
 * Endpoints for donation system:
 * - GET /api/donations/packages - Get available donation packages
 * - POST /api/donations/create - Create donation and get payment URL
 * - POST /api/donations/webhook - Handle payment provider webhook
 * - GET /api/donations/history - Get user's donation history
 * 
 * Requirements: 10.2, 10.3, 10.7
 */

import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  getDonationPackages,
  createDonation,
  processDonation,
  failDonation,
  getDonationHistory,
  getUserDonationStats
} from '../services/DonationService';
import { sendPaymentConfirmationToAdmin } from '../bot/telegramBot';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/donations/packages
 * 
 * Get all available donation packages
 * 
 * Returns array of packages with:
 * - id: Package identifier
 * - amount: Price in rubles
 * - crystals: Crystals awarded
 * - bonus: Bonus percentage
 * - name: Localized package name
 * 
 * Requirements: 10.1, 16.1
 */
router.get('/packages', (_req: Request, res: Response): void => {
  try {
    const packages = getDonationPackages();
    
    res.json({
      success: true,
      data: packages
    });
  } catch (error) {
    logger.error('Error getting donation packages:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/donations/create
 * 
 * Create a donation and get payment URL
 * 
 * Request body:
 * - packageId: Donation package ID
 * 
 * Returns:
 * - paymentUrl: URL to redirect user for payment
 * - donationId: Donation record ID for tracking
 * 
 * Requirements: 10.2
 */
router.post('/create', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { packageId } = req.body;

    if (!packageId) {
      res.status(400).json({
        success: false,
        error: 'Package ID is required'
      });
      return;
    }

    // Generate payment ID (in production, this would come from payment provider)
    const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create donation record
    const result = await createDonation(userId, packageId, paymentId);

    // In production, integrate with actual payment provider
    // For now, return mock payment URL
    const paymentUrl = process.env.PAYMENT_URL || 
      `http://localhost:3000/payment/${result.donationId}`;

    res.json({
      success: true,
      data: {
        donationId: result.donationId,
        paymentUrl,
        paymentId
      }
    });

    logger.info(`Donation created for user ${userId}`, {
      donationId: result.donationId,
      packageId
    });
  } catch (error) {
    logger.error('Error creating donation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create donation'
    });
  }
});

/**
 * POST /api/donations/webhook
 * 
 * Handle payment provider webhook
 * 
 * This endpoint receives notifications from payment provider
 * when payment status changes (success/failure).
 * 
 * Request body:
 * - donationId: Donation record ID
 * - status: Payment status ('success' or 'failed')
 * - signature: Webhook signature for verification (optional)
 * 
 * Security:
 * - Verify webhook signature in production
 * - Log all webhook calls for audit
 * - Handle idempotency (duplicate webhooks)
 * 
 * Requirements: 10.3, 10.7
 */
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const { donationId, status, signature } = req.body;

    // Log webhook for audit
    logger.info('Donation webhook received', {
      donationId,
      status,
      hasSignature: !!signature,
      ip: req.ip
    });

    // Verify webhook signature in production
    if (process.env.NODE_ENV === 'production') {
      const expectedSignature = process.env.PAYMENT_WEBHOOK_SECRET;
      if (!signature || signature !== expectedSignature) {
        logger.warn('Invalid webhook signature', { donationId });
        res.status(401).json({
          success: false,
          error: 'Invalid signature'
        });
        return;
      }
    }

    // Validate required fields
    if (!donationId || !status) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
      return;
    }

    // Process donation based on status
    if (status === 'success') {
      const result = await processDonation(donationId);
      
      res.json({
        success: true,
        data: {
          donationId: result.donationId,
          crystalsAwarded: result.crystalsAwarded
        }
      });
    } else if (status === 'failed') {
      await failDonation(donationId, 'Payment failed');
      
      res.json({
        success: true,
        message: 'Donation marked as failed'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/donations/history
 * 
 * Get user's donation history
 * 
 * Query parameters:
 * - limit: Maximum number of records (default: 50)
 * 
 * Returns array of donations with:
 * - id: Donation ID
 * - amount: Amount paid
 * - crystals: Crystals received
 * - status: Donation status
 * - createdAt: Donation date
 * 
 * Requirements: 10.7
 */
router.get('/history', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;

    const history = await getDonationHistory(userId, limit);
    const stats = await getUserDonationStats(userId);

    res.json({
      success: true,
      data: {
        donations: history,
        stats
      }
    });
  } catch (error) {
    logger.error('Error getting donation history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/donations/notify-admin
 * 
 * Send payment notification to admin for manual confirmation
 * 
 * Request body:
 * - orderId: Order ID
 * - userId: User ID
 * - amount: Payment amount with currency
 * - crystals: Crystals to be awarded
 * - paymentMethod: Payment method (PayPal, Manual, etc.)
 * 
 * Returns:
 * - success: Whether notification was sent
 */
router.post('/notify-admin', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, userId, amount, crystals, paymentMethod } = req.body;

    if (!orderId || !userId || !amount || !crystals || !paymentMethod) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
      return;
    }

    const sent = await sendPaymentConfirmationToAdmin(
      orderId,
      userId,
      amount,
      crystals,
      paymentMethod
    );

    if (sent) {
      res.json({
        success: true,
        message: 'Notification sent to admin'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send notification'
      });
    }
  } catch (error) {
    logger.error('Error sending admin notification:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
