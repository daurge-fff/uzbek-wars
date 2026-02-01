# Питомцы, Сезоны и Репутация

## Система питомцев

### Структура питомца

```typescript
interface Pet {
  petId: string;
  name: LocalizedString;
  type: 'dog' | 'cat' | 'bird' | 'exotic';
  rarity: Rarity;
  level: number; // 1-50
  experience: number;
  bonuses: {
    expBonus?: number;
    somsBonus?: number;
    luckBonus?: number;
    attackBonus?: number;
    defenseBonus?: number;
  };
  evolution?: {
    nextForm: string;
    requiredLevel: number;
  };
  visualModel: string;
  findItemChance: number; // 5% базовый
}

interface PlayerPet {
  playerId: string;
  ownedPets: string[]; // ID питомцев
  activePet?: string;
  petLevels: { [petId: string]: number };
  petExperience: { [petId: string]: number };
}
```

### Список питомцев

```typescript
const PETS: Pet[] = [
  // Обычные
  {
    petId: 'dog_common',
    name: { ru: 'Дворняжка', uz: 'Oddiy it', uk: 'Дворняжка', en: 'Stray Dog' },
    type: 'dog',
    rarity: 'common',
    level: 1,
    experience: 0,
    bonuses: { expBonus: 5 },
    evolution: { nextForm: 'dog_guard', requiredLevel: 20 },
    visualModel: 'dog_common.glb',
    findItemChance: 5
  },
  {
    petId: 'cat_common',
    name: { ru: 'Кошка', uz: 'Mushuk', uk: 'Кішка', en: 'Cat' },
    type: 'cat',
    rarity: 'common',
    level: 1,
    experience: 0,
    bonuses: { luckBonus: 10 },
    evolution: { nextForm: 'cat_lucky', requiredLevel: 20 },
    visualModel: 'cat_common.glb',
    findItemChance: 8
  },
  
  // Необычные
  {
    petId: 'dog_guard',
    name: { ru: 'Сторожевой пес', uz: 'Qo\'riqchi it', uk: 'Сторожовий пес', en: 'Guard Dog' },
    type: 'dog',
    rarity: 'uncommon',
    level: 1,
    experience: 0,
    bonuses: { expBonus: 10, defenseBonus: 5 },
    evolution: { nextForm: 'dog_warrior', requiredLevel: 40 },
    visualModel: 'dog_guard.glb',
    findItemChance: 7
  },
  
  // Редкие
  {
    petId: 'falcon',
    name: { ru: 'Сокол', uz: 'Lochin', uk: 'Сокіл', en: 'Falcon' },
    type: 'bird',
    rarity: 'rare',
    level: 1,
    experience: 0,
    bonuses: { expBonus: 15, luckBonus: 15 },
    visualModel: 'falcon.glb',
    findItemChance: 12
  },
  
  // Эпические
  {
    petId: 'snow_leopard',
    name: { ru: 'Снежный барс', uz: 'Qor qoploni', uk: 'Сніжний барс', en: 'Snow Leopard' },
    type: 'exotic',
    rarity: 'epic',
    level: 1,
    experience: 0,
    bonuses: { expBonus: 20, attackBonus: 15, luckBonus: 20 },
    visualModel: 'snow_leopard.glb',
    findItemChance: 15
  },
  
  // Легендарные
  {
    petId: 'dragon',
    name: { ru: 'Дракон', uz: 'Ajdaho', uk: 'Дракон', en: 'Dragon' },
    type: 'exotic',
    rarity: 'legendary',
    level: 1,
    experience: 0,
    bonuses: { expBonus: 50, somsBonus: 30, attackBonus: 25, defenseBonus: 25, luckBonus: 30 },
    visualModel: 'dragon.glb',
    findItemChance: 25
  }
];
```



## Сезонная система и боевой пропуск

### Структура сезона

```typescript
interface Season {
  seasonId: string;
  name: LocalizedString;
  theme: string;
  startDate: Date;
  endDate: Date;
  battlePass: BattlePass;
  seasonalShop: SeasonalShopItem[];
  leaderboard: SeasonalLeaderboard;
}

interface BattlePass {
  levels: BattlePassLevel[];
  premiumPrice: number; // 500 кристаллов
}

interface BattlePassLevel {
  level: number;
  requiredExp: number;
  freeReward: Reward;
  premiumReward: Reward;
}

interface PlayerSeason {
  playerId: string;
  seasonId: string;
  level: number;
  experience: number;
  hasPremium: boolean;
  claimedRewards: number[];
}
```

### Пример сезона

```typescript
const SEASON_1: Season = {
  seasonId: 'season_1_spring_2026',
  name: { 
    ru: 'Весна Самарканда',
    uz: 'Samarqand bahori',
    uk: 'Весна Самарканду',
    en: 'Samarkand Spring'
  },
  theme: 'spring',
  startDate: new Date('2026-03-01'),
  endDate: new Date('2026-05-31'),
  battlePass: {
    levels: generateBattlePassLevels(100),
    premiumPrice: 500
  },
  seasonalShop: [
    {
      itemId: 'spring_outfit',
      price: 1000,
      currency: 'seasonal_tokens'
    }
  ],
  leaderboard: {
    rewards: [
      { rank: 1, reward: { soms: 100000, crystals: 5000, title: 'Чемпион сезона' } },
      { rank: 10, reward: { soms: 50000, crystals: 2000 } },
      { rank: 100, reward: { soms: 10000, crystals: 500 } }
    ]
  }
};

function generateBattlePassLevels(maxLevel: number): BattlePassLevel[] {
  const levels: BattlePassLevel[] = [];
  
  for (let i = 1; i <= maxLevel; i++) {
    levels.push({
      level: i,
      requiredExp: 1000 * i,
      freeReward: {
        soms: 500 * i,
        experience: 100 * i
      },
      premiumReward: {
        soms: 1000 * i,
        experience: 200 * i,
        crystals: i % 5 === 0 ? 50 : 0,
        items: i % 10 === 0 ? [{ itemId: 'lootbox_rare', quantity: 1 }] : []
      }
    });
  }
  
  return levels;
}
```

## Система репутации с фракциями

### Структура фракций

```typescript
interface Faction {
  factionId: string;
  name: LocalizedString;
  description: LocalizedString;
  icon: string;
  conflictsWith?: string[]; // ID конфликтующих фракций
  reputationLevels: ReputationLevel[];
  shop: FactionShopItem[];
  dailyQuests: Quest[];
}

interface ReputationLevel {
  level: 'stranger' | 'acquaintance' | 'friend' | 'ally' | 'legend';
  requiredRep: number;
  benefits: {
    shopDiscount?: number;
    exclusiveItems?: string[];
    bonuses?: any;
  };
  title?: string;
}

interface PlayerReputation {
  playerId: string;
  reputations: {
    [factionId: string]: {
      points: number;
      level: string;
    };
  };
}
```

### Фракции

```typescript
const FACTIONS: Faction[] = [
  {
    factionId: 'traders',
    name: { ru: 'Гильдия торговцев', uz: 'Savdogarlar gildiyasi', uk: 'Гільдія торговців', en: 'Traders Guild' },
    description: { ru: 'Богатые купцы Великого шелкового пути', uz: 'Buyuk ipak yo\'lining boy savdogarlari', uk: 'Багаті купці Великого шовкового шляху', en: 'Wealthy merchants of the Silk Road' },
    icon: 'faction_traders.png',
    reputationLevels: [
      {
        level: 'stranger',
        requiredRep: 0,
        benefits: {}
      },
      {
        level: 'acquaintance',
        requiredRep: 1000,
        benefits: { shopDiscount: 5 }
      },
      {
        level: 'friend',
        requiredRep: 5000,
        benefits: { shopDiscount: 15, exclusiveItems: ['trader_outfit'] }
      },
      {
        level: 'ally',
        requiredRep: 15000,
        benefits: { shopDiscount: 25, bonuses: { trade_profit: 20 } }
      },
      {
        level: 'legend',
        requiredRep: 50000,
        benefits: { shopDiscount: 30, bonuses: { trade_profit: 50 } },
        title: 'Легенда торговли'
      }
    ],
    shop: [],
    dailyQuests: []
  },
  {
    factionId: 'craftsmen',
    name: { ru: 'Цех ремесленников', uz: 'Hunarmandlar tsexi', uk: 'Цех ремісників', en: 'Craftsmen Workshop' },
    description: { ru: 'Мастера своего дела', uz: 'O\'z ishining ustalari', uk: 'Майстри своєї справи', en: 'Masters of their craft' },
    icon: 'faction_craftsmen.png',
    reputationLevels: [
      {
        level: 'stranger',
        requiredRep: 0,
        benefits: {}
      },
      {
        level: 'friend',
        requiredRep: 5000,
        benefits: { exclusiveItems: ['master_tools'], bonuses: { crafting_speed: -20 } }
      },
      {
        level: 'legend',
        requiredRep: 50000,
        benefits: { bonuses: { crafting_speed: -50, quality_chance: 25 } },
        title: 'Великий мастер'
      }
    ],
    shop: [],
    dailyQuests: []
  }
];
```

