import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { Player } from '../models/Player';
import * as CosmeticService from '../services/CosmeticService';

const router = Router();

// Cosmetic items catalog with bonuses and stats
const COSMETIC_ITEMS = [
  {
    id: '1',
    type: 'clothing',
    slot: 'head',
    rarity: 'common',
    priceSoms: 500,
    priceCrystals: 10,
    stats: { defense: 2 }
  },
  {
    id: '2',
    type: 'clothing',
    slot: 'head',
    rarity: 'legendary',
    priceSoms: 50000,
    priceCrystals: 500,
    stats: { defense: 10, luck: 5 }
  },
  {
    id: '10',
    type: 'equipment',
    slot: 'weapon',
    rarity: 'common',
    priceSoms: 1000,
    priceCrystals: 20,
    stats: { strength: 5 }
  },
  {
    id: '11',
    type: 'equipment',
    slot: 'weapon',
    rarity: 'epic',
    priceSoms: 15000,
    priceCrystals: 300,
    stats: { strength: 25, agility: 5 }
  },
  {
    id: '12',
    type: 'clothing',
    slot: 'body',
    rarity: 'rare',
    priceSoms: 5000,
    priceCrystals: 100,
    stats: { defense: 15, stamina: 10 }
  },
  {
    id: '3',
    type: 'background',
    rarity: 'epic',
    priceSoms: 10000,
    priceCrystals: 200,
    bonus: { type: 'mood', value: 10 }
  },
  {
    id: '4',
    type: 'accessory',
    rarity: 'rare',
    priceSoms: 2000,
    priceCrystals: 50,
    bonus: { type: 'soms', value: 10 }
  }
];

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

    const items = COSMETIC_ITEMS.map(item => ({
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

    const item = COSMETIC_ITEMS.find(i => i.id === itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const player = await Player.findOne({ userId: (req as any).user!.id });
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Check if already owned
    const allOwned = [
      ...(player.cosmetics?.clothing || []),
      ...(player.cosmetics?.backgrounds || []),
      ...(player.cosmetics?.accessories || [])
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
        consumables: []
      };
    }

    if (item.type === 'clothing') {
      player.cosmetics.clothing.push(itemId);
    } else if (item.type === 'background') {
      player.cosmetics.backgrounds.push(itemId);
    } else if (item.type === 'accessory') {
      player.cosmetics.accessories.push(itemId);
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
    const { type } = req.body; // type of slot to unequip
    const player = await Player.findOne({ userId: (req as any).user!.id });

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const result = await CosmeticService.unequipCosmetic(player._id.toString(), type);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    const updatedPlayer = await Player.findById(player._id);

    return res.json({
      success: true,
      cosmetics: updatedPlayer?.cosmetics,
      combatStats: updatedPlayer?.combatStats
    });
  } catch (error) {
    console.error('Error unequipping cosmetic:', error);
    return res.status(500).json({ error: 'Failed to unequip item' });
  }
});

export default router;
