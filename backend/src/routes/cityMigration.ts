import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { CityMigrationService } from '../services/CityMigrationService';
import { Response } from 'express';

const router = Router();

/**
 * GET /api/city-migration/info
 * Get migration information for current player
 */
router.get('/info', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const info = await CityMigrationService.getMigrationInfo(userId);
    res.json({ success: true, data: info });
  } catch (error) {
    console.error('Failed to get migration info:', error);
    res.status(500).json({ error: 'Failed to get migration info' });
  }
});

/**
 * POST /api/city-migration/migrate
 * Migrate to a new city
 */
router.post('/migrate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { targetCityId, paymentMethod } = req.body;

    if (!targetCityId || !paymentMethod) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    if (paymentMethod !== 'soms' && paymentMethod !== 'crystals') {
      res.status(400).json({ error: 'Invalid payment method' });
      return;
    }

    const result = await CityMigrationService.migrateCity(
      userId,
      targetCityId,
      paymentMethod
    );

    if (!result.success) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.json({ success: true, message: result.message, newCityId: result.newCityId });
  } catch (error) {
    console.error('Failed to migrate city:', error);
    res.status(500).json({ error: 'Failed to migrate city' });
  }
});

export default router;
