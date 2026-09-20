import { Schema, model, Document } from 'mongoose';

/**
 * Crafting Recipe Definition
 */
export interface ICraftingRecipe extends Document {
    recipeId: string;
    resultItemId: string;
    requirements: {
        level: number;
        soms: number;
        materials: Array<{
            itemId: string;
            quantity: number;
        }>;
    };
    successRate: number; // 0-1
}

const CraftingRecipeSchema = new Schema<ICraftingRecipe>(
    {
        recipeId: { type: String, required: true, unique: true },
        resultItemId: { type: String, required: true },
        requirements: {
            level: { type: Number, default: 1 },
            soms: { type: Number, default: 0 },
            materials: [
                {
                    itemId: { type: String, required: true },
                    quantity: { type: Number, default: 1 }
                }
            ]
        },
        successRate: { type: Number, default: 1 }
    },
    { timestamps: true }
);

export const CraftingRecipe = model<ICraftingRecipe>('CraftingRecipe', CraftingRecipeSchema);

/**
 * Static Data for Recipes (Mock data for now)
 */
export const MOCK_RECIPES = [
    {
        recipeId: 'craft_hero_sword',
        resultItemId: '11', // Epic Weapon
        requirements: {
            level: 10,
            soms: 5000,
            materials: [
                { itemId: '10', quantity: 1 }, // Common Weapon
                { itemId: 'scrap_metal', quantity: 5 }
            ]
        },
        successRate: 0.8
    }
];
