import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { Player } from '../models/Player';

const router = Router();

// Cosmetic items catalog with bonuses
const COSMETIC_ITEMS = [
  { 
    id: '1', 
    type: 'clothing', 
    rarity: 'common', 
    priceSoms: 500, 
    priceCrystals: 10,
    bonus: { type: 'xp', value: 5 }
  },
  { 
    id: '2', 
    type: 'clothing', 
    rarity: 'legendary', 
    priceSoms: 50000, 
    priceCrystals: 500,
    bonus: { type: 'soms', value: 25 }
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
  },
  { 
    id: '5', 
    type: 'clothing', 
    rarity: 'rare', 
    priceSoms: 3000, 
    priceCrystals: 75,
    bonus: { type: 'health', value: 5 }
  },
  { 
    id: '6', 
    type: 'accessory', 
    rarity: 'common', 
    priceSoms: 300, 
    priceCrystals: 5,
    bonus: { type: 'hunger', value: 3 }
  },
  { 
    id: '7', 
    type: 'accessory', 
    rarity: 'common', 
    priceSoms: 400, 
    priceCrystals: 8,
    bonus: { type: 'xp', value: 3 }
  },
  { 
    id: '8', 
    type: 'background', 
    rarity: 'epic', 
    priceSoms: 12000, 
    priceCrystals: 250,
    bonus: { type: 'xp', value: 15 }
  }
];

/**
 * GET /api/cosmetics
 * Get all cosmetic items with ownership status
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const player = await Player.findOne({ userId: req.user!.userId });
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const items = COSMETIC_ITEMS.map(item => ({
      ...item,
      owned: [
        ...(player.cosmetics?.clothing || []),
        ...(player.cosmetics?.backgrounds || []),
        ...(player.cosmetics?.accessories || [])
      ].includes(item.id),
      equipped: 
        player.cosmetics?.activeClothing === item.id ||
        player.cosmetics?.activeBackground === item.id ||
        player.cosmetics?.activeAccessory === item.id
    }));

    res.json({ items });
  } catch (error) {
    console.error('Error fetching cosmetics:', error);
    res.status(500).json({ error: 'Failed to fetch cosmetics' });
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

    const player = await Player.findOne({ userId: req.user!.userId });
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
      player.cosmetics = { clothing: [], backgrounds: [], accessories: [] };
    }

    if (item.type === 'clothing') {
      player.cosmetics.clothing.push(itemId);
    } else if (item.type === 'background') {
      player.cosmetics.backgrounds.push(itemId);
    } else if (item.type === 'accessory') {
      player.cosmetics.accessories.push(itemId);
    }

    await player.save();

    res.json({
      success: true,
      player: {
        soms: player.soms,
        donationCurrency: player.donationCurrency,
        cosmetics: player.cosmetics
      }
    });
  } catch (error) {
    console.error('Error purchasing cosmetic:', error);
    res.status(500).json({ error: 'Failed to purchase item' });
  }
});

/**
 * POST /api/cosmetics/equip
 * Equip a cosmetic item
 */
router.post('/equip', authenticate, async (req: Request, res: Response) => {
  try {
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ error: 'Item ID required' });
    }

    const item = COSMETIC_ITEMS.find(i => i.id === itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const player = await Player.findOne({ userId: req.user!.userId });
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Check if owned
    const allOwned = [
      ...(player.cosmetics?.clothing || []),
      ...(player.cosmetics?.backgrounds || []),
      ...(player.cosmetics?.accessories || [])
    ];
    
    if (!allOwned.includes(itemId)) {
      return res.status(400).json({ error: 'Item not owned' });
    }

    // Equip item (unequips previous item of same type)
    if (!player.cosmetics) {
      player.cosmetics = { clothing: [], backgrounds: [], accessories: [] };
    }

    if (item.type === 'clothing') {
      player.cosmetics.activeClothing = itemId;
    } else if (item.type === 'background') {
      player.cosmetics.activeBackground = itemId;
    } else if (item.type === 'accessory') {
      player.cosmetics.activeAccessory = itemId;
    }

    await player.save();

    res.json({
      success: true,
      cosmetics: player.cosmetics
    });
  } catch (error) {
    console.error('Error equipping cosmetic:', error);
    res.status(500).json({ error: 'Failed to equip item' });
  }
});

/**
 * POST /api/cosmetics/unequip
 * Unequip a cosmetic item
 */
router.post('/unequip', authenticate, async (req: Request, res: Response) => {
  try {
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ error: 'Item ID required' });
    }

    const item = COSMETIC_ITEMS.find(i => i.id === itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const player = await Player.findOne({ userId: req.user!.userId });
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    if (!player.cosmetics) {
      return res.status(400).json({ error: 'No cosmetics equipped' });
    }

    // Unequip item
    if (item.type === 'clothing' && player.cosmetics.activeClothing === itemId) {
      player.cosmetics.activeClothing = undefined;
    } else if (item.type === 'background' && player.cosmetics.activeBackground === itemId) {
      player.cosmetics.activeBackground = undefined;
    } else if (item.type === 'accessory' && player.cosmetics.activeAccessory === itemId) {
      player.cosmetics.activeAccessory = undefined;
    }

    await player.save();

    res.json({
      success: true,
      cosmetics: player.cosmetics
    });
  } catch (error) {
    console.error('Error unequipping cosmetic:', error);
    res.status(500).json({ error: 'Failed to unequip item' });
  }
});

export default router;
