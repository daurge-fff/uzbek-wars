import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import * as CraftingService from '../services/CraftingService';
import { MOCK_RECIPES } from '../models/CraftingRecipe';

const router = Router();

/**
 * GET /api/crafting/recipes
 * Get all available crafting recipes
 */
router.get('/recipes', authenticate, async (_req: Request, res: Response) => {
    return res.json({ recipes: MOCK_RECIPES });
});

/**
 * POST /api/crafting/craft
 * Craft an item
 */
router.post('/craft', authenticate, async (req: Request, res: Response) => {
    try {
        const { recipeId } = req.body;
        const userId = (req as any).user!.id;

        // Find player first to get their _id
        const { Player } = require('../models/Player');
        const player = await Player.findOne({ userId });

        if (!player) return res.status(404).json({ error: 'Player not found' });

        const result = await CraftingService.craftItem(player._id.toString(), recipeId);

        return res.json(result);
    } catch (error: any) {
        console.error('Crafting error:', error);
        return res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/crafting/upgrade
 * Upgrade an item
 */
router.post('/upgrade', authenticate, async (req: Request, res: Response) => {
    try {
        const { itemId } = req.body;
        const userId = (req as any).user!.id;

        const { Player } = require('../models/Player');
        const player = await Player.findOne({ userId });

        if (!player) return res.status(404).json({ error: 'Player not found' });

        const result = await CraftingService.upgradeItem(player._id.toString(), itemId);

        return res.json(result);
    } catch (error: any) {
        console.error('Upgrade error:', error);
        return res.status(400).json({ error: error.message });
    }
});

export default router;
