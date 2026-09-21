import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { Player } from '../models/Player';
import * as CosmeticService from '../services/CosmeticService';
import { CosmeticBonusService } from '../services/CosmeticBonusService';
import { SHOP_CATALOG } from '../data/shopCatalog';

const router = Router();

// Shop catalog is the single source of truth for the shop and for equipping

/**
 * GET /api/cosmetics
 * Get all cosmetic items with ownership status
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const player = await Player.findOne({ userId: (req as any).user!.id });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const items = SHOP_CATALOG.map(item => ({
      ...item,
      owned: [
        ...(player.cosmetics?.clothing || []),
        ...(player.cosmetics?.backgrounds || []),
        ...(player.cosmetics?.accessories || []),
        ...(player.cosmetics?.backpacks || [])
      ].includes(item.id),
      equipped:
        player.cosmetics?.activeClothing === item.id ||
        player.cosmetics?.activeBackground === item.id ||
        player.cosmetics?.activeAccessory === item.id ||
        player.cosmetics?.equippedHead === item.id ||
        player.cosmetics?.equippedBody === item.id ||
        player.cosmetics?.equippedFeet === item.id ||
        player.cosmetics?.equippedWeapon === item.id ||
        player.cosmetics?.equippedAccessory === item.id ||
        player.cosmetics?.activeBackpack === item.id
    }));

    return res.json({ items });
  } catch (error) {
    console.error('Error fetching cosmetics:', error);
    return res.status(500).json({ error: 'Failed to fetch cosmetics' });
  }
});

/**
 * POST /api/cosmetics/purchase
 * Purchase a cosmetic item
 */
router.post('/purchase', authenticate, async (req: Request, res: Response) => {
  try {
    const { itemId, currency } = req.body;

    if (!itemId || !currency || !['soms', 'crystals'].includes(currency)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    const item = SHOP_CATALOG.find(i => i.id === itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const player = await Player.findOne({ userId: (req as any).user!.id });
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Check if already owned (every inventory list counts)
    const allOwned = [
      ...(player.cosmetics?.clothing || []),
      ...(player.cosmetics?.backgrounds || []),
      ...(player.cosmetics?.accessories || []),
      ...(player.cosmetics?.backpacks || []),
      ...(player.cosmetics?.equipment || [])
    ];

    if (allOwned.includes(itemId)) {
      return res.status(400).json({ error: 'Item already owned' });
    }

    // Check price and balance
    const price = currency === 'soms' ? item.priceSoms : item.priceCrystals;
    const balance = currency === 'soms' ? player.soms : player.donationCurrency;

    if (balance < price) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // Deduct currency
    if (currency === 'soms') {
      player.soms -= price;
    } else {
      player.donationCurrency -= price;
    }

    // Add item to inventory
    if (!player.cosmetics) {
      player.cosmetics = {
        clothing: [],
        backgrounds: [],
        accessories: [],
        backpacks: [],
        consumables: [],
        equipment: []
      };
    }

    if (item.type === 'clothing') {
      player.cosmetics.clothing.push(itemId);
    } else if (item.type === 'background') {
      player.cosmetics.backgrounds.push(itemId);
    } else if (item.type === 'accessory') {
      player.cosmetics.accessories.push(itemId);
    } else if (item.type === 'equipment') {
      if (!player.cosmetics.equipment) player.cosmetics.equipment = [];
      player.cosmetics.equipment.push(itemId);
    } else if (item.type === 'backpack') {
      player.cosmetics.backpacks.push(itemId);
    }

    await player.save();

    return res.json({
      success: true,
      player: {
        soms: player.soms,
        donationCurrency: player.donationCurrency,
        cosmetics: player.cosmetics
      }
    });
  } catch (error) {
    console.error('Error purchasing cosmetic:', error);
    return res.status(500).json({ error: 'Failed to purchase item' });
  }
});

/**
 * POST /api/cosmetics/equip
 * Equip a cosmetic item
 */
router.post('/equip', authenticate, async (req: Request, res: Response) => {
  try {
    const { itemId } = req.body;
    const player = await Player.findOne({ userId: (req as any).user!.id });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const result = await CosmeticService.equipCosmetic(player._id.toString(), itemId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Refresh player to get updated cosmetics and combat power
    const updatedPlayer = await Player.findById(player._id);

    return res.json({
      success: true,
      cosmetics: updatedPlayer?.cosmetics,
      combatStats: updatedPlayer?.combatStats
    });
  } catch (error) {
    console.error('Error equipping cosmetic:', error);
    return res.status(500).json({ error: 'Failed to equip item' });
  }
});

/**
 * POST /api/cosmetics/unequip
 * Unequip a cosmetic item
 */
router.post('/unequip', authenticate, async (req: Request, res: Response) => {
  try {
    // The frontend sends the item it wants to take off; `type` is kept for older clients
    const { itemId, type } = req.body;
    const player = await Player.findOne({ userId: (req as any).user!.id });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    if (!itemId && !type) {
      return res.status(400).json({ error: 'itemId is required' });
    }

    const result = await CosmeticService.unequipCosmetic(player._id.toString(), itemId || type);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    const updatedPlayer = await Player.findById(player._id);
    const equipmentBonus = updatedPlayer
      ? await CosmeticBonusService.getTotalEquipmentStats(updatedPlayer)
      : null;

    return res.json({
      success: true,
      cosmetics: updatedPlayer?.cosmetics,
      combatStats: updatedPlayer?.combatStats,
      equipmentBonus
    });
  } catch (error) {
    console.error('Error unequipping cosmetic:', error);
    return res.status(500).json({ error: 'Failed to unequip item' });
  }
});

/**
 * POST /api/cosmetics/sell
 * Sell an owned item back for part of its price
 */
router.post('/sell', authenticate, async (req: Request, res: Response) => {
  try {
    const { itemId } = req.body;
    const player = await Player.findOne({ userId: (req as any).user!.id });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    if (!itemId) {
      return res.status(400).json({ error: 'itemId is required' });
    }

    const result = await CosmeticService.sellCosmetic(player._id.toString(), itemId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    const updatedPlayer = await Player.findById(player._id);
    const equipmentBonus = updatedPlayer
      ? await CosmeticBonusService.getTotalEquipmentStats(updatedPlayer)
      : null;

    return res.json({
      success: true,
      refund: result.refund,
      player: {
        soms: updatedPlayer?.soms,
        donationCurrency: updatedPlayer?.donationCurrency,
        cosmetics: updatedPlayer?.cosmetics,
        combatStats: updatedPlayer?.combatStats
      },
      equipmentBonus
    });
  } catch (error) {
    console.error('Error selling cosmetic:', error);
    return res.status(500).json({ error: 'Failed to sell item' });
  }
});

export default router;
