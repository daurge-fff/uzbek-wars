import { cosmeticItems as localCatalog } from '../data/cosmeticItems';

/**
 * Каталог картинок предметов.
 *
 * Кладём файлы в frontend/public/assets/cosmetics/<id>.png — они раздаются как
 * /assets/cosmetics/<id>.png. Если файла нет, витрина откатывается на эмодзи,
 * поэтому карточка никогда не остаётся пустой.
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
 * Дополняет предмет из API данными витрины.
 *
 * `GET /api/cosmetics` отдаёт только цену, редкость и статы — ни названия,
 * ни иконки, из-за этого карточки магазина были пустыми. Название и эмодзи
 * берём из локального каталога по id, а всё «игровое» (цена, владение,
 * экипировка, боевые статы) остаётся из API.
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
