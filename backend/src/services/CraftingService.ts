import { Player } from '../models/Player';
import { MOCK_RECIPES } from '../models/CraftingRecipe';
import { logger } from '../utils/logger';

/**
 * Craft an item from a recipe
 */
export async function craftItem(playerId: string, recipeId: string) {
    try {
        const player = await Player.findById(playerId);
        if (!player) throw new Error('Player not found');

        const recipe = MOCK_RECIPES.find(r => r.recipeId === recipeId);
        if (!recipe) throw new Error('Recipe not found');

        // 1. Check level
        if (player.level < recipe.requirements.level) {
            throw new Error(`Level ${recipe.requirements.level} required`);
        }

        // 2. Check Soms
        if (player.soms < recipe.requirements.soms) {
            throw new Error('Insufficient soms');
        }

        // 3. Check materials (inventory)
        // For now we use the same inventory logic as cosmetics
        const playerItems = [
            ...(player.cosmetics?.clothing || []),
            ...(player.cosmetics?.accessories || []),
            ...(player.cosmetics?.backpacks || []),
            ...(player.cosmetics?.consumables || [])
        ];

        for (const mat of recipe.requirements.materials) {
            const count = playerItems.filter(id => id === mat.itemId).length;
            if (count < mat.quantity) {
                throw new Error(`Insufficient materials: ${mat.itemId} `);
            }
        }

        // 4. Roll for success
        const roll = Math.random();
        if (roll > recipe.successRate) {
            // Failure - deduct materials but don't give result
            // TODO: Deduct materials properly
            player.soms -= Math.floor(recipe.requirements.soms / 2);
            await player.save();
            return { success: false, message: 'Crafting failed! Some materials lost.' };
        }

        // 5. Success - Deduct costs and grant item
        player.soms -= recipe.requirements.soms;

        // Simple deduction (remove materials from strings list)
        // This is a bit naive because player.cosmetics fields are arrays of strings
        for (const mat of recipe.requirements.materials) {
            for (let i = 0; i < mat.quantity; i++) {
                // Find and remove one instance
                const idx = player.cosmetics?.clothing.indexOf(mat.itemId);
                if (idx !== -1) player.cosmetics?.clothing.splice(idx!, 1);
                // Repeat for other categories if needed
            }
        }

        // Grant result item
        // Add to clothing or other based on type (logic belongs to CosmeticService usually)
        // For now we just push to clothing if it's weapon or armor
        player.cosmetics?.clothing.push(recipe.resultItemId);

        await player.save();
        return { success: true, resultItemId: recipe.resultItemId };

    } catch (error: any) {
        logger.error(`Crafting error: ${error.message} `);
        throw error;
    }
}

/**
 * Upgrade an existing item's stats
 */
export async function upgradeItem(playerId: string, itemId: string) {
    // Basic upgrade logic: use soms to increase stats by 10%
    try {
        const player = await Player.findById(playerId);
        if (!player) throw new Error('Player not found');

        // Check if player owns the item
        const owned = player.cosmetics?.clothing.includes(itemId);
        if (!owned) throw new Error('Item not owned');

        const cost = 2000; // Fixed cost for now
        if (player.soms < cost) throw new Error('Insufficient soms');

        player.soms -= cost;
        await player.save();

        // In a real system, we'd have an Item instance with unique stats
        // Since we use static items from catalog, upgrading is tricky 
        // unless we store overrides in the Player document.

        return { success: true, message: 'Item upgraded!' };
    } catch (error: any) {
        throw error;
    }
}
