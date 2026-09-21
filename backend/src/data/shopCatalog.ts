/**
 * Shop catalog — the single source of truth for items sold in the cosmetic shop.
 *
 * The same ids are used by:
 *  - GET /api/cosmetics (shop list + ownership)
 *  - POST /api/cosmetics/purchase
 *  - CosmeticService.getCosmeticById (equip/unequip/sell)
 *  - CosmeticBonusService (equipment stat bonuses)
 *
 * Previously the shop list lived inline in the route while equipping looked items up
 * in the `CosmeticItem` DB collection under a different id namespace, so bought items
 * could never be equipped and never gave any bonus.
 */

export interface LocalizedText {
    ru: string;
    uz: string;
    uk: string;
    en: string;
}

export interface ShopItemStats {
    strength?: number;
    defense?: number;
    agility?: number;
    stamina?: number;
    intelligence?: number;
    luck?: number;
}

export interface ShopBonus {
    type: 'xp' | 'soms' | 'mood' | 'stats' | 'combat' | 'health' | 'hunger' | 'energy';
    value: number;
    description?: LocalizedText;
}

export interface ShopCatalogItem {
    id: string;
    type: 'clothing' | 'background' | 'accessory' | 'equipment' | 'backpack';
    slot?: 'head' | 'body' | 'feet' | 'weapon' | 'accessory' | 'backpack';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    priceSoms: number;
    priceCrystals: number;
    name: LocalizedText;
    description: LocalizedText;
    icon: string;
    stats?: ShopItemStats;
    bonus?: ShopBonus;
}

/** Part of the money the player gets back when selling an item */
export const SELL_REFUND_RATE = 0.5;

export const SHOP_CATALOG: ShopCatalogItem[] = [
    {
        id: '1',
        type: 'clothing',
        slot: 'head',
        rarity: 'common',
        priceSoms: 500,
        priceCrystals: 10,
        icon: '🎩',
        name: {
            ru: 'Тюбетейка',
            uz: "Do'ppi",
            uk: 'Тюбетейка',
            en: 'Tubeteyka'
        },
        description: {
            ru: 'Классика: скромно, зато своя. Немного защищает от солнца и от критики соседей.',
            uz: "Klassika: kamtar, lekin o'ziniki. Quyoshdan ham, qo'shnilar tanqididan ham biroz himoya qiladi.",
            uk: 'Класика: скромно, зате своє. Трохи захищає від сонця і від критики сусідів.',
            en: "A classic: modest, but yours. Shields you a bit from the sun and from what the neighbours say."
        },
        stats: { defense: 2 }
    },
    {
        id: '2',
        type: 'clothing',
        slot: 'head',
        rarity: 'legendary',
        priceSoms: 50000,
        priceCrystals: 500,
        icon: '👑',
        name: {
            ru: 'Золотая корона',
            uz: 'Oltin toj',
            uk: 'Золота корона',
            en: 'Golden Crown'
        },
        description: {
            ru: 'Для тех, кто уже почти хан. Соседи здороваются первыми и не спрашивают про долг.',
            uz: "Deyarli xon bo'lganlar uchun. Qo'shnilar birinchi bo'lib salom berishadi.",
            uk: 'Для тих, хто вже майже хан. Сусіди вітаються першими і не згадують про борг.',
            en: 'For those who are almost a khan already. The neighbours greet you first and forget your debts.'
        },
        stats: { defense: 10, luck: 5 }
    },
    {
        id: '10',
        type: 'equipment',
        slot: 'weapon',
        rarity: 'common',
        priceSoms: 1000,
        priceCrystals: 20,
        icon: '🗡️',
        name: {
            ru: 'Кинжал базара',
            uz: 'Bozor xanjari',
            uk: 'Кинджал базару',
            en: 'Bazaar Dagger'
        },
        description: {
            ru: 'Острый, как торг с продавцом дыни. Больше для вида, но вид убедительный.',
            uz: "Qovun sotuvchi bilan savdolashishdek o'tkir. Ko'rinish uchun, lekin ishonarli.",
            uk: 'Гострий, як торг із продавцем дині. Більше для вигляду, але вигляд переконливий.',
            en: 'As sharp as haggling over a melon. Mostly for looks — but the looks work.'
        },
        stats: { strength: 5 }
    },
    {
        id: '11',
        type: 'equipment',
        slot: 'weapon',
        rarity: 'epic',
        priceSoms: 15000,
        priceCrystals: 300,
        icon: '⚔️',
        name: {
            ru: 'Клинок Шёлкового пути',
            uz: "Buyuk ipak yo'li qilichi",
            uk: 'Клинок Шовкового шляху',
            en: 'Silk Road Blade'
        },
        description: {
            ru: 'Помнит караваны, перевалы и цены на шёлк. Рубит быстро, торгуется ещё быстрее.',
            uz: "Karvonlar, dovonlar va ipak narxini yodda saqlaydi. Tez uradi, undan tez savdolashadi.",
            uk: 'Пам’ятає каравани, перевали та ціни на шовк. Рубає швидко, торгується ще швидше.',
            en: 'Remembers caravans, mountain passes and silk prices. Cuts fast, haggles faster.'
        },
        stats: { strength: 25, agility: 5 }
    },
    {
        id: '12',
        type: 'clothing',
        slot: 'body',
        rarity: 'rare',
        priceSoms: 5000,
        priceCrystals: 100,
        icon: '🧥',
        name: {
            ru: 'Стёганый чапан',
            uz: 'Paxtali chopon',
            uk: 'Стьобаний чапан',
            en: 'Quilted Chapan'
        },
        description: {
            ru: 'Тёплый, уважаемый и слегка важный. В нём не стыдно и на свадьбу, и в бой.',
            uz: "Issiq, hurmatli va biroz salobatli. To'yga ham, jangga ham uyalmasdan kiyiladi.",
            uk: 'Теплий, поважний і трохи величний. У ньому не соромно і на весілля, і в бій.',
            en: 'Warm, respected and slightly self-important. Fine for a wedding and for a fight.'
        },
        stats: { defense: 15, stamina: 10 }
    },
    {
        id: '3',
        type: 'background',
        rarity: 'epic',
        priceSoms: 10000,
        priceCrystals: 200,
        icon: '🕌',
        name: {
            ru: 'Регистан',
            uz: 'Registon',
            uk: 'Регістан',
            en: 'Registan'
        },
        description: {
            ru: 'Панорама Регистана в профиле. Настроение растёт просто от осознания величия.',
            uz: "Profilingizda Registon manzarasi. Ulug'vorlikni anglashning o'zi kayfiyatni ko'taradi.",
            uk: 'Панорама Регістану в профілі. Настрій зростає від самого усвідомлення величі.',
            en: 'The Registan panorama on your profile. Your mood rises just from feeling majestic.'
        },
        bonus: {
            type: 'mood',
            value: 10,
            description: {
                ru: '+10 настроение',
                uz: '+10 kayfiyat',
                uk: '+10 настрій',
                en: '+10 mood'
            }
        }
    },
    {
        id: '4',
        type: 'accessory',
        rarity: 'rare',
        priceSoms: 2000,
        priceCrystals: 50,
        icon: '💍',
        name: {
            ru: 'Золотые серьги',
            uz: "Oltin sirg'a",
            uk: 'Золоті сережки',
            en: 'Golden Earrings'
        },
        description: {
            ru: 'Блестят так, что скидки на базаре сами вас находят.',
            uz: "Shunday yaltiraydi-ki, bozordagi chegirmalar o'zi sizni topadi.",
            uk: 'Блищать так, що знижки на базарі самі вас знаходять.',
            en: 'They sparkle so much that bazaar discounts find you on their own.'
        },
        bonus: {
            type: 'soms',
            value: 10,
            description: {
                ru: '+10% сомов',
                uz: "+10% so'm",
                uk: '+10% сомів',
                en: '+10% soms'
            }
        }
    }
];

const SHOP_BY_ID = new Map(SHOP_CATALOG.map((item) => [item.id, item]));

export function getShopItem(id: string): ShopCatalogItem | undefined {
    return SHOP_BY_ID.get(id);
}

/**
 * Stat bonus of a shop item, always a full object so callers can sum freely.
 * Base player stats are never mutated by equipment — bonuses live here and are
 * added on top whenever effective stats are needed.
 */
export function getShopItemStats(id: string): Required<ShopItemStats> {
    const stats = getShopItem(id)?.stats ?? {};
    return {
        strength: stats.strength ?? 0,
        defense: stats.defense ?? 0,
        agility: stats.agility ?? 0,
        stamina: stats.stamina ?? 0,
        intelligence: stats.intelligence ?? 0,
        luck: stats.luck ?? 0
    };
}

/** Refund for selling an item back */
export function getSellRefund(id: string): { currency: 'soms' | 'crystals'; amount: number } | null {
    const item = getShopItem(id);
    if (!item) return null;

    if (item.priceSoms > 0) {
        return { currency: 'soms', amount: Math.floor(item.priceSoms * SELL_REFUND_RATE) };
    }
    if (item.priceCrystals > 0) {
        return { currency: 'crystals', amount: Math.floor(item.priceCrystals * SELL_REFUND_RATE) };
    }
    return null;
}
