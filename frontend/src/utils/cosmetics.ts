import { cosmeticItems as localCatalog } from '../data/cosmeticItems';

/**
 * Catalog of item images.
 *
 * Files go into frontend/public/assets/cosmetics/<id>.png — they are served as
 * /assets/cosmetics/<id>.png. If the file is missing, the store falls back to the emoji,
 * so a card never stays empty.
 */
export const COSMETIC_IMAGE_DIR = '/assets/cosmetics';

const localById = new Map<string, any>(
    (localCatalog as any[]).map((item) => [item.id, item])
);

export function cosmeticImageSrc(id: string): string {
    return `${COSMETIC_IMAGE_DIR}/${id}.png`;
}

export interface CosmeticDisplayFields {
    name: unknown;
    icon: string;
    imageSrc: string;
    bonus?: unknown;
    stats?: unknown;
}

/**
 * Enriches an API item with store data.
 *
 * `GET /api/cosmetics` returns only the price, rarity and stats — no names
 * and no icons, which is why the shop cards were empty. The name and emoji
 * come from the local catalog by id, while everything "gameplay" (price,
 * ownership, equipment, combat stats) stays from the API.
 */
export function mergeCosmeticItems<T extends { id: string; imageSrc?: string }>(
    apiItems: T[]
): Array<T & { imageSrc: string }> {
    if (!Array.isArray(apiItems)) return [];

    return apiItems.map((item) => {
        const local = localById.get(item.id);
        const api = item as any;
        const merged = {
            ...item,
            name: api.name ?? local?.name ?? item.id,
            icon: api.icon ?? local?.icon ?? '🎁',
            bonus: api.bonus ?? local?.bonus,
            stats: api.stats ?? local?.stats,
            imageSrc: cosmeticImageSrc(item.id),
        };
        return merged as T & { imageSrc: string };
    });
}
