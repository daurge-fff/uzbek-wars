# Расширенные игровые механики: Узбек Варс

## Обзор

Этот документ описывает расширенные игровые механики, которые превращают "Узбек Варс" в полноценную MMO-игру с глубокими системами прогрессии, PvP, крафтинга и социального взаимодействия.

## Система инвентаря и предметов

### Структура инвентаря

```typescript
interface Inventory {
  slots: InventorySlot[];
  maxSlots: number; // Базовое: 20, +10 за гильдию
  weight: number;
  maxWeight: number;
}

interface InventorySlot {
  itemId: string;
  quantity: number;
  equipped: boolean;
}

interface Item {
  itemId: string;
  type: ItemType;
  name: LocalizedString;
  description: LocalizedString;
  rarity: Rarity;
  stackable: boolean;
  maxStack: number;
  weight: number;
  sellPrice: number;
  icon: string;
}

type ItemType = 
  | 'resource'      // Ресурсы для крафтинга
  | 'food'          // Еда для восстановления
  | 'material'      // Материалы для крафтинга
  | 'equipment'     // Экипировка
  | 'consumable'    // Расходники (аптечки, энергетики)
  | 'lootbox'       // Лутбоксы
  | 'quest'         // Квестовые предметы
  | 'cosmetic';     // Косметические предметы

type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
```

### API endpoints для инвентаря

```typescript
// GET /api/inventory
interface GetInventoryResponse {
  inventory: Inventory;
  items: Item[];
}

// POST /api/inventory/use
interface UseItemRequest {
  itemId: string;
  quantity?: number;
}

interface UseItemResponse {
  success: boolean;
  effect: {
    hunger?: number;
    health?: number;
    mood?: number;
    energy?: number;
  };
  remainingQuantity: number;
}

// POST /api/inventory/sell
interface SellItemRequest {
  itemId: string;
  quantity: number;
}

interface SellItemResponse {
  somsGained: number;
  remainingQuantity: number;
}
```

### Предметы в игре

**Ресурсы (Resources):**
```typescript
const RESOURCES = [
  {
    itemId: 'apple',
    name: { ru: 'Яблоко', uz: 'Olma', uk: 'Яблуко', en: 'Apple' },
    rarity: 'common',
    stackable: true,
    maxStack: 99,
    sellPrice: 10
  },
  {
    itemId: 'meat',
    name: { ru: 'Мясо', uz: 'Go\'sht', uk: 'М\'ясо', en: 'Meat' },
    rarity: 'uncommon',
    stackable: true,
    maxStack: 50,
    sellPrice: 30
  },
  {
    itemId: 'spice',
    name: { ru: 'Специи', uz: 'Ziravorlar', uk: 'Спеції', en: 'Spices' },
    rarity: 'uncommon',
    stackable: true,
    maxStack: 50,
    sellPrice: 25
  },
  {
    itemId: 'rice',
    name: { ru: 'Рис', uz: 'Guruch', uk: 'Рис', en: 'Rice' },
    rarity: 'common',
    stackable: true,
    maxStack: 99,
    sellPrice: 15
  }
];
```

**Материалы (Materials):**
```typescript
const MATERIALS = [
  {
    itemId: 'gear',
    name: { ru: 'Шестеренка', uz: 'Tishli g\'ildirak', uk: 'Шестерня', en: 'Gear' },
    rarity: 'uncommon',
    stackable: true,
    maxStack: 50,
    sellPrice: 40
  },
  {
    itemId: 'bolt',
    name: { ru: 'Болт', uz: 'Bolt', uk: 'Болт', en: 'Bolt' },
    rarity: 'common',
    stackable: true,
    maxStack: 99,
    sellPrice: 20
  },
  {
    itemId: 'wire',
    name: { ru: 'Провод', uz: 'Sim', uk: 'Дріт', en: 'Wire' },
    rarity: 'uncommon',
    stackable: true,
    maxStack: 50,
    sellPrice: 35
  }
];
```


## Система собирательства

### Активности собирательства

```typescript
const GATHERING_ACTIVITIES = [
  {
    id: 'gather_apples',
    name: { ru: 'Собирать яблоки', uz: 'Olma yig\'ish', uk: 'Збирати яблука', en: 'Gather Apples' },
    rewards: {
      experience: 30,
      soms: 50,
      items: [
        { itemId: 'apple', minQuantity: 1, maxQuantity: 5, probability: 1.0 }
      ]
    },
    statModifiers: { energy: -10, mood: +5 },
    requiredLevel: 1,
    cooldown: 20
  },
  {
    id: 'hunt_meat',
    name: { ru: 'Искать мясо', uz: 'Go\'sht izlash', uk: 'Шукати м\'ясо', en: 'Hunt Meat' },
    rewards: {
      experience: 60,
      soms: 100,
      items: [
        { itemId: 'meat', minQuantity: 1, maxQuantity: 3, probability: 0.7 },
        { itemId: 'rare_meat', minQuantity: 1, maxQuantity: 1, probability: 0.1 }
      ]
    },
    statModifiers: { energy: -20, hunger: -15, mood: +10 },
    requiredLevel: 3,
    cooldown: 40
  },
  {
    id: 'gather_spices',
    name: { ru: 'Собирать специи', uz: 'Ziravorlar yig\'ish', uk: 'Збирати спеції', en: 'Gather Spices' },
    rewards: {
      experience: 40,
      soms: 70,
      items: [
        { itemId: 'spice', minQuantity: 1, maxQuantity: 4, probability: 0.8 }
      ]
    },
    statModifiers: { energy: -12, mood: +8 },
    requiredLevel: 2,
    cooldown: 25
  },
  {
    id: 'scavenge_parts',
    name: { ru: 'Искать детали', uz: 'Qismlar izlash', uk: 'Шукати деталі', en: 'Scavenge Parts' },
    rewards: {
      experience: 50,
      soms: 80,
      items: [
        { itemId: 'gear', minQuantity: 1, maxQuantity: 3, probability: 0.5 },
        { itemId: 'bolt', minQuantity: 2, maxQuantity: 6, probability: 0.7 },
        { itemId: 'wire', minQuantity: 1, maxQuantity: 4, probability: 0.6 }
      ]
    },
    statModifiers: { energy: -15, mood: -5 },
    requiredLevel: 4,
    cooldown: 35
  }
];
```

### Система редкости предметов

```typescript
interface ItemDrop {
  itemId: string;
  minQuantity: number;
  maxQuantity: number;
  probability: number;
  rarityBonus?: {
    uncommon: number;  // Шанс получить необычный вариант
    rare: number;      // Шанс получить редкий вариант
    epic: number;      // Шанс получить эпический вариант
  };
}

function rollItemDrop(drop: ItemDrop): { itemId: string; quantity: number; rarity: Rarity } | null {
  // Проверяем базовую вероятность дропа
  if (Math.random() > drop.probability) {
    return null;
  }
  
  // Определяем количество
  const quantity = Math.floor(
    Math.random() * (drop.maxQuantity - drop.minQuantity + 1) + drop.minQuantity
  );
  
  // Определяем редкость
  let rarity: Rarity = 'common';
  if (drop.rarityBonus) {
    const roll = Math.random();
    if (roll < drop.rarityBonus.epic) {
      rarity = 'epic';
    } else if (roll < drop.rarityBonus.rare) {
      rarity = 'rare';
    } else if (roll < drop.rarityBonus.uncommon) {
      rarity = 'uncommon';
    }
  }
  
  return { itemId: drop.itemId, quantity, rarity };
}
```

## Система крафтинга

### Рецепты крафтинга

```typescript
interface CraftingRecipe {
  recipeId: string;
  name: LocalizedString;
  description: LocalizedString;
  resultItem: string;
  resultQuantity: number;
  ingredients: Array<{
    itemId: string;
    quantity: number;
  }>;
  requiredLevel: number;
  craftingTime: number; // в секундах
  experienceGained: number;
  category: 'food' | 'consumable' | 'equipment' | 'tool';
}

const CRAFTING_RECIPES: CraftingRecipe[] = [
  {
    recipeId: 'craft_plov',
    name: { ru: 'Плов', uz: 'Osh', uk: 'Плов', en: 'Plov' },
    description: { 
      ru: 'Традиционное узбекское блюдо',
      uz: 'An\'anaviy o\'zbek taomi',
      uk: 'Традиційна узбецька страва',
      en: 'Traditional Uzbek dish'
    },
    resultItem: 'plov',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'meat', quantity: 3 },
      { itemId: 'rice', quantity: 2 },
      { itemId: 'spice', quantity: 2 }
    ],
    requiredLevel: 5,
    craftingTime: 30,
    experienceGained: 100,
    category: 'food'
  },
  {
    recipeId: 'craft_medkit',
    name: { ru: 'Аптечка', uz: 'Tibbiy yordam', uk: 'Аптечка', en: 'Medkit' },
    description: {
      ru: 'Восстанавливает 60 здоровья',
      uz: '60 sog\'liqni tiklaydi',
      uk: 'Відновлює 60 здоров\'я',
      en: 'Restores 60 health'
    },
    resultItem: 'medkit',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'herb', quantity: 5 },
      { itemId: 'bandage', quantity: 2 }
    ],
    requiredLevel: 3,
    craftingTime: 15,
    experienceGained: 50,
    category: 'consumable'
  },
  {
    recipeId: 'craft_energy_drink',
    name: { ru: 'Энергетик', uz: 'Energetik ichimlik', uk: 'Енергетик', en: 'Energy Drink' },
    description: {
      ru: 'Восстанавливает 50 энергии',
      uz: '50 energiyani tiklaydi',
      uk: 'Відновлює 50 енергії',
      en: 'Restores 50 energy'
    },
    resultItem: 'energy_drink',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'coffee', quantity: 3 },
      { itemId: 'sugar', quantity: 2 }
    ],
    requiredLevel: 2,
    craftingTime: 10,
    experienceGained: 30,
    category: 'consumable'
  },
  {
    recipeId: 'craft_tools',
    name: { ru: 'Инструменты', uz: 'Asboblar', uk: 'Інструменти', en: 'Tools' },
    description: {
      ru: 'Увеличивают эффективность работы на 20%',
      uz: 'Ish samaradorligini 20% ga oshiradi',
      uk: 'Збільшують ефективність роботи на 20%',
      en: 'Increase work efficiency by 20%'
    },
    resultItem: 'tools',
    resultQuantity: 1,
    ingredients: [
      { itemId: 'gear', quantity: 5 },
      { itemId: 'bolt', quantity: 3 },
      { itemId: 'wire', quantity: 2 }
    ],
    requiredLevel: 6,
    craftingTime: 45,
    experienceGained: 150,
    category: 'tool'
  },
  {
    recipeId: 'craft_samsa',
    name: { ru: 'Самса', uz: 'Somsa', uk: 'Самса', en: 'Samsa' },
    description: {
      ru: 'Вкусная выпечка с мясом',
      uz: 'Go\'shtli mazali pishiriq',
      uk: 'Смачна випічка з м\'ясом',
      en: 'Delicious meat pastry'
    },
    resultItem: 'samsa',
    resultQuantity: 3,
    ingredients: [
      { itemId: 'meat', quantity: 2 },
      { itemId: 'flour', quantity: 3 },
      { itemId: 'onion', quantity: 1 }
    ],
    requiredLevel: 4,
    craftingTime: 20,
    experienceGained: 70,
    category: 'food'
  }
];
```

### API endpoints для крафтинга

```typescript
// GET /api/crafting/recipes
interface GetRecipesResponse {
  recipes: CraftingRecipe[];
  unlockedRecipes: string[]; // ID разблокированных рецептов
}

// POST /api/crafting/craft
interface CraftItemRequest {
  recipeId: string;
}

interface CraftItemResponse {
  success: boolean;
  resultItem: Item;
  experienceGained: number;
  craftingTime: number;
}

// GET /api/crafting/queue
interface GetCraftingQueueResponse {
  queue: Array<{
    recipeId: string;
    startTime: Date;
    endTime: Date;
    progress: number; // 0-100
  }>;
}
```

### Логика крафтинга

```typescript
async function craftItem(playerId: string, recipeId: string): Promise<CraftItemResponse> {
  const player = await Player.findById(playerId).populate('inventory');
  const recipe = CRAFTING_RECIPES.find(r => r.recipeId === recipeId);
  
  if (!recipe) {
    throw new ValidationError('Recipe not found', 'RECIPE_NOT_FOUND');
  }
  
  // Проверка уровня
  if (player.level < recipe.requiredLevel) {
    throw new ValidationError('Level too low', 'LEVEL_TOO_LOW');
  }
  
  // Проверка ингредиентов
  for (const ingredient of recipe.ingredients) {
    const playerItem = player.inventory.items.find(i => i.itemId === ingredient.itemId);
    if (!playerItem || playerItem.quantity < ingredient.quantity) {
      throw new ValidationError(
        `Insufficient ${ingredient.itemId}`,
        'INSUFFICIENT_INGREDIENTS'
      );
    }
  }
  
  // Списываем ингредиенты
  for (const ingredient of recipe.ingredients) {
    await removeItemFromInventory(player, ingredient.itemId, ingredient.quantity);
  }
  
  // Добавляем результат
  await addItemToInventory(player, recipe.resultItem, recipe.resultQuantity);
  
  // Начисляем опыт
  player.experience += recipe.experienceGained;
  await checkLevelUp(player);
  await player.save();
  
  return {
    success: true,
    resultItem: await getItemById(recipe.resultItem),
    experienceGained: recipe.experienceGained,
    craftingTime: recipe.craftingTime
  };
}
```


## Боевая система

### Боевые характеристики

```typescript
interface CombatStats {
  attack: number;        // Урон
  defense: number;       // Защита (снижает урон)
  maxHealth: number;     // Максимальное здоровье
  currentHealth: number; // Текущее здоровье
  critChance: number;    // Шанс критического удара (%)
  critDamage: number;    // Множитель критического урона
  dodge: number;         // Шанс уклонения (%)
  accuracy: number;      // Точность (%)
}

// Базовые формулы расчета характеристик
function calculateCombatStats(player: Player): CombatStats {
  const baseAttack = 10 + player.level * 2;
  const baseDefense = 5 + player.level * 1.5;
  const baseMaxHealth = 100 + player.level * 10;
  
  // Добавляем бонусы от экипировки
  const equipmentBonuses = calculateEquipmentBonuses(player.equipment);
  
  return {
    attack: baseAttack + equipmentBonuses.attack,
    defense: baseDefense + equipmentBonuses.defense,
    maxHealth: baseMaxHealth + equipmentBonuses.health,
    currentHealth: player.stats.health,
    critChance: 5 + equipmentBonuses.critChance,
    critDamage: 2.0 + equipmentBonuses.critDamage,
    dodge: equipmentBonuses.dodge || 0,
    accuracy: 90 + equipmentBonuses.accuracy
  };
}
```

### Формула расчета урона

```typescript
function calculateDamage(
  attacker: CombatStats,
  defender: CombatStats
): { damage: number; isCrit: boolean; isDodged: boolean; isMissed: boolean } {
  // Проверка промаха
  if (Math.random() * 100 > attacker.accuracy) {
    return { damage: 0, isCrit: false, isDodged: false, isMissed: true };
  }
  
  // Проверка уклонения
  if (Math.random() * 100 < defender.dodge) {
    return { damage: 0, isCrit: false, isDodged: true, isMissed: false };
  }
  
  // Базовый урон с учетом защиты
  const defenseReduction = Math.min(0.75, defender.defense / 100);
  let damage = attacker.attack * (1 - defenseReduction);
  
  // Случайный разброс ±20%
  damage *= 0.8 + Math.random() * 0.4;
  
  // Проверка критического удара
  const isCrit = Math.random() * 100 < attacker.critChance;
  if (isCrit) {
    damage *= attacker.critDamage;
  }
  
  // Минимальный урон = 1
  damage = Math.max(1, Math.floor(damage));
  
  return { damage, isCrit, isDodged: false, isMissed: false };
}
```

### PvP Арена

```typescript
interface ArenaBattle {
  battleId: string;
  player1: {
    playerId: string;
    displayName: string;
    level: number;
    stats: CombatStats;
  };
  player2: {
    playerId: string;
    displayName: string;
    level: number;
    stats: CombatStats;
  };
  turns: BattleTurn[];
  winner?: string;
  rewards?: BattleRewards;
  startTime: Date;
  endTime?: Date;
}

interface BattleTurn {
  turnNumber: number;
  attacker: string;
  defender: string;
  damage: number;
  isCrit: boolean;
  isDodged: boolean;
  isMissed: boolean;
  remainingHealth: {
    player1: number;
    player2: number;
  };
}

interface BattleRewards {
  winner: {
    experience: number;
    soms: number;
    arenaRating: number;
  };
  loser: {
    arenaRating: number;
  };
}
```

### Логика боя

```typescript
async function simulateBattle(player1Id: string, player2Id: string): Promise<ArenaBattle> {
  const player1 = await Player.findById(player1Id);
  const player2 = await Player.findById(player2Id);
  
  const stats1 = calculateCombatStats(player1);
  const stats2 = calculateCombatStats(player2);
  
  const battle: ArenaBattle = {
    battleId: generateBattleId(),
    player1: {
      playerId: player1Id,
      displayName: player1.displayName,
      level: player1.level,
      stats: stats1
    },
    player2: {
      playerId: player2Id,
      displayName: player2.displayName,
      level: player2.level,
      stats: stats2
    },
    turns: [],
    startTime: new Date()
  };
  
  let currentHealth1 = stats1.currentHealth;
  let currentHealth2 = stats2.currentHealth;
  let turnNumber = 1;
  
  // Определяем, кто ходит первым (случайно)
  let currentAttacker = Math.random() < 0.5 ? 'player1' : 'player2';
  
  // Бой продолжается до тех пор, пока у кого-то не закончится здоровье
  while (currentHealth1 > 0 && currentHealth2 > 0 && turnNumber <= 50) {
    const isPlayer1Attacking = currentAttacker === 'player1';
    const attackerStats = isPlayer1Attacking ? stats1 : stats2;
    const defenderStats = isPlayer1Attacking ? stats2 : stats1;
    
    const damageResult = calculateDamage(attackerStats, defenderStats);
    
    if (isPlayer1Attacking) {
      currentHealth2 -= damageResult.damage;
    } else {
      currentHealth1 -= damageResult.damage;
    }
    
    battle.turns.push({
      turnNumber,
      attacker: currentAttacker,
      defender: isPlayer1Attacking ? 'player2' : 'player1',
      damage: damageResult.damage,
      isCrit: damageResult.isCrit,
      isDodged: damageResult.isDodged,
      isMissed: damageResult.isMissed,
      remainingHealth: {
        player1: Math.max(0, currentHealth1),
        player2: Math.max(0, currentHealth2)
      }
    });
    
    // Переключаем атакующего
    currentAttacker = isPlayer1Attacking ? 'player2' : 'player1';
    turnNumber++;
  }
  
  // Определяем победителя
  battle.winner = currentHealth1 > 0 ? player1Id : player2Id;
  battle.endTime = new Date();
  
  // Рассчитываем награды
  const levelDiff = Math.abs(player1.level - player2.level);
  const baseExp = 100 + levelDiff * 10;
  const baseSoms = 200 + levelDiff * 20;
  const ratingChange = 10 + Math.floor(levelDiff / 2);
  
  battle.rewards = {
    winner: {
      experience: baseExp,
      soms: baseSoms,
      arenaRating: ratingChange
    },
    loser: {
      arenaRating: -Math.floor(ratingChange / 2)
    }
  };
  
  // Применяем награды
  await applyBattleRewards(battle);
  
  // Сохраняем бой в базу данных
  await ArenaBattle.create(battle);
  
  return battle;
}
```

### API endpoints для арены

```typescript
// POST /api/arena/find-match
interface FindMatchRequest {
  // Пусто - система сама подберет противника
}

interface FindMatchResponse {
  opponent: {
    playerId: string;
    displayName: string;
    level: number;
    arenaRating: number;
  };
  estimatedWaitTime: number; // в секундах
}

// POST /api/arena/battle
interface StartBattleRequest {
  opponentId: string;
}

interface StartBattleResponse {
  battle: ArenaBattle;
}

// GET /api/arena/history
interface GetBattleHistoryResponse {
  battles: ArenaBattle[];
  stats: {
    wins: number;
    losses: number;
    winRate: number;
    currentRating: number;
  };
}

// GET /api/arena/leaderboard
interface GetArenaLeaderboardResponse {
  leaderboard: Array<{
    rank: number;
    player: {
      displayName: string;
      level: number;
      arenaRating: number;
      wins: number;
      losses: number;
    };
  }>;
  currentPlayerRank?: number;
}
```

## Межгородские войны

### Структура войны

```typescript
interface CityWar {
  warId: string;
  startTime: Date;
  endTime: Date;
  status: 'upcoming' | 'active' | 'ended';
  cities: {
    [cityId: string]: {
      totalPoints: number;
      participants: number;
      topWarriors: Array<{
        playerId: string;
        displayName: string;
        points: number;
      }>;
    };
  };
  winner?: string;
  rewards: {
    winner: {
      soms: number;
      experience: number;
      crystals: number;
    };
    mvp: {
      soms: number;
      experience: number;
      crystals: number;
      title: string;
    };
  };
}

interface WarBattle {
  battleId: string;
  warId: string;
  attacker: {
    playerId: string;
    cityId: string;
  };
  defender: {
    playerId: string;
    cityId: string;
  };
  winner: string;
  pointsAwarded: number;
  timestamp: Date;
}
```

### Логика войны

```typescript
// Создание новой войны (каждую пятницу в 00:00)
async function createCityWar(): Promise<CityWar> {
  const startTime = new Date();
  const endTime = new Date(startTime);
  endTime.setDate(endTime.getDate() + 3); // 3 дня (пятница-воскресенье)
  
  const cities = await City.find();
  const citiesData: CityWar['cities'] = {};
  
  for (const city of cities) {
    citiesData[city.cityId] = {
      totalPoints: 0,
      participants: 0,
      topWarriors: []
    };
  }
  
  const war: CityWar = {
    warId: generateWarId(),
    startTime,
    endTime,
    status: 'active',
    cities: citiesData,
    rewards: {
      winner: {
        soms: 1000,
        experience: 500,
        crystals: 50
      },
      mvp: {
        soms: 5000,
        experience: 2000,
        crystals: 200,
        title: 'Герой войны'
      }
    }
  };
  
  await CityWar.create(war);
  return war;
}

// Атака игрока из другого города
async function attackInWar(
  attackerId: string,
  defenderId: string
): Promise<WarBattle> {
  const currentWar = await CityWar.findOne({ status: 'active' });
  if (!currentWar) {
    throw new ValidationError('No active war', 'NO_ACTIVE_WAR');
  }
  
  const attacker = await Player.findById(attackerId);
  const defender = await Player.findById(defenderId);
  
  // Проверка, что игроки из разных городов
  if (attacker.cityId === defender.cityId) {
    throw new ValidationError('Cannot attack same city', 'SAME_CITY');
  }
  
  // Симулируем бой
  const battle = await simulateBattle(attackerId, defenderId);
  
  // Начисляем очки войны
  const pointsAwarded = 10 + Math.floor(defender.level / 5);
  const winnerCityId = battle.winner === attackerId ? attacker.cityId : defender.cityId;
  
  currentWar.cities[winnerCityId].totalPoints += pointsAwarded;
  
  // Обновляем топ воинов
  await updateTopWarriors(currentWar, battle.winner!, pointsAwarded);
  
  await currentWar.save();
  
  const warBattle: WarBattle = {
    battleId: battle.battleId,
    warId: currentWar.warId,
    attacker: {
      playerId: attackerId,
      cityId: attacker.cityId
    },
    defender: {
      playerId: defenderId,
      cityId: defender.cityId
    },
    winner: battle.winner!,
    pointsAwarded,
    timestamp: new Date()
  };
  
  await WarBattle.create(warBattle);
  
  return warBattle;
}

// Завершение войны и начисление наград
async function endCityWar(warId: string): Promise<void> {
  const war = await CityWar.findOne({ warId });
  if (!war) return;
  
  // Определяем город-победитель
  let winnerCityId = '';
  let maxPoints = 0;
  
  for (const [cityId, data] of Object.entries(war.cities)) {
    if (data.totalPoints > maxPoints) {
      maxPoints = data.totalPoints;
      winnerCityId = cityId;
    }
  }
  
  war.winner = winnerCityId;
  war.status = 'ended';
  await war.save();
  
  // Начисляем награды всем игрокам города-победителя
  const winnerPlayers = await Player.find({ cityId: winnerCityId });
  
  for (const player of winnerPlayers) {
    player.soms += war.rewards.winner.soms;
    player.experience += war.rewards.winner.experience;
    player.donationCurrency += war.rewards.winner.crystals;
    await player.save();
  }
  
  // Начисляем особые награды MVP игрокам
  for (const cityId in war.cities) {
    const topWarrior = war.cities[cityId].topWarriors[0];
    if (topWarrior) {
      const mvpPlayer = await Player.findById(topWarrior.playerId);
      if (mvpPlayer) {
        mvpPlayer.soms += war.rewards.mvp.soms;
        mvpPlayer.experience += war.rewards.mvp.experience;
        mvpPlayer.donationCurrency += war.rewards.mvp.crystals;
        // Добавляем титул
        if (!mvpPlayer.titles) mvpPlayer.titles = [];
        mvpPlayer.titles.push(war.rewards.mvp.title);
        await mvpPlayer.save();
      }
    }
  }
}
```

### API endpoints для войн

```typescript
// GET /api/war/current
interface GetCurrentWarResponse {
  war: CityWar | null;
  playerCity: {
    rank: number;
    points: number;
  };
  playerStats: {
    battles: number;
    wins: number;
    points: number;
  };
}

// POST /api/war/attack
interface AttackInWarRequest {
  defenderId: string;
}

interface AttackInWarResponse {
  battle: ArenaBattle;
  pointsAwarded: number;
  cityRanking: Array<{
    cityId: string;
    points: number;
    rank: number;
  }>;
}

// GET /api/war/history
interface GetWarHistoryResponse {
  wars: CityWar[];
}
```


## Система экипировки

### Типы экипировки

```typescript
interface Equipment {
  weapon?: EquipmentItem;
  helmet?: EquipmentItem;
  armor?: EquipmentItem;
  boots?: EquipmentItem;
  accessory?: EquipmentItem;
}

interface EquipmentItem {
  itemId: string;
  name: LocalizedString;
  type: EquipmentType;
  level: number;
  rarity: Rarity;
  stats: EquipmentStats;
  upgradeLevel: number; // 0-10
  requirements: {
    level: number;
    class?: string;
  };
}

type EquipmentType = 'weapon' | 'helmet' | 'armor' | 'boots' | 'accessory';

interface EquipmentStats {
  attack?: number;
  defense?: number;
  health?: number;
  critChance?: number;
  critDamage?: number;
  dodge?: number;
  accuracy?: number;
}
```

### Генерация экипировки

```typescript
function generateEquipment(
  type: EquipmentType,
  level: number,
  rarity: Rarity
): EquipmentItem {
  const rarityMultipliers = {
    common: 1.0,
    uncommon: 1.3,
    rare: 1.6,
    epic: 2.0,
    legendary: 2.5
  };
  
  const multiplier = rarityMultipliers[rarity];
  const baseStats = calculateBaseStats(type, level);
  
  const stats: EquipmentStats = {};
  
  // Оружие дает атаку и крит
  if (type === 'weapon') {
    stats.attack = Math.floor(baseStats.attack * multiplier);
    stats.critChance = Math.floor(baseStats.critChance * multiplier);
    if (rarity === 'epic' || rarity === 'legendary') {
      stats.critDamage = 0.2 + (rarity === 'legendary' ? 0.3 : 0);
    }
  }
  
  // Шлем дает защиту и здоровье
  if (type === 'helmet') {
    stats.defense = Math.floor(baseStats.defense * multiplier);
    stats.health = Math.floor(baseStats.health * multiplier);
  }
  
  // Броня дает защиту и здоровье
  if (type === 'armor') {
    stats.defense = Math.floor(baseStats.defense * multiplier * 1.5);
    stats.health = Math.floor(baseStats.health * multiplier * 1.2);
  }
  
  // Ботинки дают уклонение и здоровье
  if (type === 'boots') {
    stats.dodge = Math.floor(baseStats.dodge * multiplier);
    stats.health = Math.floor(baseStats.health * multiplier * 0.8);
  }
  
  // Аксессуар дает различные бонусы
  if (type === 'accessory') {
    stats.attack = Math.floor(baseStats.attack * multiplier * 0.5);
    stats.defense = Math.floor(baseStats.defense * multiplier * 0.5);
    stats.accuracy = Math.floor(baseStats.accuracy * multiplier);
  }
  
  return {
    itemId: generateItemId(),
    name: generateEquipmentName(type, rarity),
    type,
    level,
    rarity,
    stats,
    upgradeLevel: 0,
    requirements: {
      level: level
    }
  };
}

function calculateBaseStats(type: EquipmentType, level: number) {
  return {
    attack: 5 + level * 2,
    defense: 3 + level * 1.5,
    health: 20 + level * 5,
    critChance: 2 + Math.floor(level / 10),
    dodge: 2 + Math.floor(level / 15),
    accuracy: 5 + Math.floor(level / 10)
  };
}
```

### Улучшение экипировки

```typescript
interface UpgradeResult {
  success: boolean;
  newUpgradeLevel: number;
  newStats: EquipmentStats;
  cost: {
    soms: number;
    materials: Array<{ itemId: string; quantity: number }>;
  };
}

async function upgradeEquipment(
  playerId: string,
  itemId: string
): Promise<UpgradeResult> {
  const player = await Player.findById(playerId);
  const equipment = player.equipment.find(e => e.itemId === itemId);
  
  if (!equipment) {
    throw new ValidationError('Equipment not found', 'EQUIPMENT_NOT_FOUND');
  }
  
  if (equipment.upgradeLevel >= 10) {
    throw new ValidationError('Max upgrade level reached', 'MAX_UPGRADE');
  }
  
  // Рассчитываем стоимость улучшения
  const upgradeCost = calculateUpgradeCost(equipment);
  
  // Проверяем наличие ресурсов
  if (player.soms < upgradeCost.soms) {
    throw new ValidationError('Insufficient soms', 'INSUFFICIENT_SOMS');
  }
  
  for (const material of upgradeCost.materials) {
    const playerItem = player.inventory.items.find(i => i.itemId === material.itemId);
    if (!playerItem || playerItem.quantity < material.quantity) {
      throw new ValidationError(
        `Insufficient ${material.itemId}`,
        'INSUFFICIENT_MATERIALS'
      );
    }
  }
  
  // Списываем ресурсы
  player.soms -= upgradeCost.soms;
  for (const material of upgradeCost.materials) {
    await removeItemFromInventory(player, material.itemId, material.quantity);
  }
  
  // Улучшаем экипировку
  equipment.upgradeLevel++;
  
  // Увеличиваем характеристики на 10%
  for (const stat in equipment.stats) {
    equipment.stats[stat] = Math.floor(equipment.stats[stat] * 1.1);
  }
  
  await player.save();
  
  return {
    success: true,
    newUpgradeLevel: equipment.upgradeLevel,
    newStats: equipment.stats,
    cost: upgradeCost
  };
}

function calculateUpgradeCost(equipment: EquipmentItem) {
  const baseСost = 100 * Math.pow(2, equipment.upgradeLevel);
  const rarityMultiplier = {
    common: 1,
    uncommon: 1.5,
    rare: 2,
    epic: 3,
    legendary: 5
  }[equipment.rarity];
  
  return {
    soms: Math.floor(baseСost * rarityMultiplier),
    materials: [
      { itemId: 'gear', quantity: 2 + equipment.upgradeLevel },
      { itemId: 'bolt', quantity: 3 + equipment.upgradeLevel },
      { itemId: 'wire', quantity: 1 + equipment.upgradeLevel }
    ]
  };
}
```

### API endpoints для экипировки

```typescript
// GET /api/equipment
interface GetEquipmentResponse {
  equipped: Equipment;
  inventory: EquipmentItem[];
}

// POST /api/equipment/equip
interface EquipItemRequest {
  itemId: string;
}

interface EquipItemResponse {
  success: boolean;
  equipped: Equipment;
  statsChange: {
    attack: number;
    defense: number;
    health: number;
  };
}

// POST /api/equipment/upgrade
interface UpgradeEquipmentRequest {
  itemId: string;
}

interface UpgradeEquipmentResponse {
  result: UpgradeResult;
}
```

## Система гильдий

### Структура гильдии

```typescript
interface Guild {
  guildId: string;
  name: string;
  description: string;
  emblem: string;
  leaderId: string;
  officers: string[]; // ID офицеров
  members: string[];  // ID участников
  level: number;
  experience: number;
  maxMembers: number; // Базовое: 50
  createdAt: Date;
  stats: {
    totalMembers: number;
    averageLevel: number;
    totalSoms: number;
  };
  perks: GuildPerk[];
  treasury: {
    soms: number;
    materials: { [itemId: string]: number };
  };
}

interface GuildPerk {
  perkId: string;
  name: LocalizedString;
  description: LocalizedString;
  level: number;
  effect: {
    type: 'experience_bonus' | 'soms_bonus' | 'inventory_slots' | 'crafting_speed';
    value: number;
  };
}

interface GuildMember {
  playerId: string;
  displayName: string;
  level: number;
  role: 'leader' | 'officer' | 'member';
  contributedExperience: number;
  contributedSoms: number;
  joinedAt: Date;
  lastActive: Date;
}
```

### Перки гильдии

```typescript
const GUILD_PERKS: GuildPerk[] = [
  {
    perkId: 'exp_boost_1',
    name: { ru: 'Опыт I', uz: 'Tajriba I', uk: 'Досвід I', en: 'Experience I' },
    description: { 
      ru: '+5% к получаемому опыту',
      uz: 'Olingan tajribaga +5%',
      uk: '+5% до отриманого досвіду',
      en: '+5% experience gained'
    },
    level: 1,
    effect: { type: 'experience_bonus', value: 5 }
  },
  {
    perkId: 'exp_boost_2',
    name: { ru: 'Опыт II', uz: 'Tajriba II', uk: 'Досвід II', en: 'Experience II' },
    description: { 
      ru: '+10% к получаемому опыту',
      uz: 'Olingan tajribaga +10%',
      uk: '+10% до отриманого досвіду',
      en: '+10% experience gained'
    },
    level: 5,
    effect: { type: 'experience_bonus', value: 10 }
  },
  {
    perkId: 'soms_boost_1',
    name: { ru: 'Богатство I', uz: 'Boylik I', uk: 'Багатство I', en: 'Wealth I' },
    description: { 
      ru: '+5% к получаемым сомам',
      uz: 'Olingan somlarga +5%',
      uk: '+5% до отриманих сомів',
      en: '+5% soms gained'
    },
    level: 3,
    effect: { type: 'soms_bonus', value: 5 }
  },
  {
    perkId: 'inventory_1',
    name: { ru: 'Хранилище I', uz: 'Ombor I', uk: 'Сховище I', en: 'Storage I' },
    description: { 
      ru: '+10 слотов инвентаря',
      uz: 'Inventarga +10 joy',
      uk: '+10 слотів інвентаря',
      en: '+10 inventory slots'
    },
    level: 2,
    effect: { type: 'inventory_slots', value: 10 }
  },
  {
    perkId: 'crafting_speed_1',
    name: { ru: 'Мастерство I', uz: 'Mahorat I', uk: 'Майстерність I', en: 'Craftsmanship I' },
    description: { 
      ru: '-20% времени крафтинга',
      uz: 'Ishlab chiqarish vaqti -20%',
      uk: '-20% часу крафтингу',
      en: '-20% crafting time'
    },
    level: 4,
    effect: { type: 'crafting_speed', value: 20 }
  }
];
```

### Гильдейские рейды

```typescript
interface GuildRaid {
  raidId: string;
  name: LocalizedString;
  description: LocalizedString;
  difficulty: 'normal' | 'hard' | 'nightmare';
  requiredMembers: number;
  boss: {
    name: LocalizedString;
    level: number;
    health: number;
    attack: number;
    defense: number;
    abilities: BossAbility[];
  };
  rewards: {
    experience: number;
    soms: number;
    items: Array<{
      itemId: string;
      quantity: number;
      probability: number;
    }>;
  };
  cooldown: number; // в часах
}

interface BossAbility {
  abilityId: string;
  name: LocalizedString;
  description: LocalizedString;
  damage: number;
  effect?: {
    type: 'stun' | 'poison' | 'burn' | 'heal';
    duration: number;
    value: number;
  };
}

const GUILD_RAIDS: GuildRaid[] = [
  {
    raidId: 'raid_bandit_camp',
    name: { 
      ru: 'Лагерь бандитов',
      uz: 'Banditlar lageri',
      uk: 'Табір бандитів',
      en: 'Bandit Camp'
    },
    description: {
      ru: 'Разгромите лагерь бандитов и победите их главаря',
      uz: 'Banditlar lagerini vayron qiling va ularning boshlig\'ini mag\'lub eting',
      uk: 'Розгромте табір бандитів та переможте їх ватажка',
      en: 'Destroy the bandit camp and defeat their leader'
    },
    difficulty: 'normal',
    requiredMembers: 5,
    boss: {
      name: { ru: 'Главарь бандитов', uz: 'Banditlar boshlig\'i', uk: 'Ватажок бандитів', en: 'Bandit Leader' },
      level: 20,
      health: 5000,
      attack: 100,
      defense: 50,
      abilities: [
        {
          abilityId: 'heavy_strike',
          name: { ru: 'Мощный удар', uz: 'Kuchli zarba', uk: 'Потужний удар', en: 'Heavy Strike' },
          description: { ru: 'Наносит 150% урона', uz: '150% zarar beradi', uk: 'Завдає 150% шкоди', en: 'Deals 150% damage' },
          damage: 150
        }
      ]
    },
    rewards: {
      experience: 1000,
      soms: 2000,
      items: [
        { itemId: 'rare_weapon', quantity: 1, probability: 0.3 },
        { itemId: 'epic_armor', quantity: 1, probability: 0.1 }
      ]
    },
    cooldown: 24
  }
];
```

### API endpoints для гильдий

```typescript
// POST /api/guild/create
interface CreateGuildRequest {
  name: string;
  description: string;
  emblem: string;
}

interface CreateGuildResponse {
  guild: Guild;
}

// POST /api/guild/join
interface JoinGuildRequest {
  guildId: string;
}

// POST /api/guild/invite
interface InviteToGuildRequest {
  playerId: string;
}

// POST /api/guild/kick
interface KickFromGuildRequest {
  playerId: string;
}

// POST /api/guild/promote
interface PromoteMemberRequest {
  playerId: string;
  role: 'officer' | 'member';
}

// GET /api/guild/members
interface GetGuildMembersResponse {
  members: GuildMember[];
}

// POST /api/guild/contribute
interface ContributeToGuildRequest {
  soms?: number;
  items?: Array<{ itemId: string; quantity: number }>;
}

// POST /api/guild/raid/start
interface StartGuildRaidRequest {
  raidId: string;
  participants: string[]; // ID участников
}

interface StartGuildRaidResponse {
  raid: GuildRaidInstance;
}

// GET /api/guild/leaderboard
interface GetGuildLeaderboardResponse {
  leaderboard: Array<{
    rank: number;
    guild: {
      name: string;
      level: number;
      members: number;
      emblem: string;
    };
  }>;
}
```


## Система квестов

### Типы квестов

```typescript
interface Quest {
  questId: string;
  type: 'daily' | 'weekly' | 'story' | 'event';
  name: LocalizedString;
  description: LocalizedString;
  objectives: QuestObjective[];
  rewards: QuestRewards;
  requiredLevel: number;
  expiresAt?: Date;
  chain?: {
    nextQuestId?: string;
    previousQuestId?: string;
  };
}

interface QuestObjective {
  objectiveId: string;
  type: 'activity' | 'collect' | 'craft' | 'battle' | 'level' | 'earn_soms';
  description: LocalizedString;
  target: string | number;
  current: number;
  required: number;
  completed: boolean;
}

interface QuestRewards {
  experience: number;
  soms: number;
  crystals?: number;
  items?: Array<{
    itemId: string;
    quantity: number;
  }>;
  title?: string;
}

interface PlayerQuest {
  questId: string;
  playerId: string;
  status: 'active' | 'completed' | 'failed';
  progress: {
    [objectiveId: string]: number;
  };
  startedAt: Date;
  completedAt?: Date;
}
```

### Примеры квестов

```typescript
const DAILY_QUESTS: Quest[] = [
  {
    questId: 'daily_activities',
    type: 'daily',
    name: { 
      ru: 'Трудовой день',
      uz: 'Ish kuni',
      uk: 'Трудовий день',
      en: 'Work Day'
    },
    description: {
      ru: 'Выполните 5 любых активностей',
      uz: '5 ta istalgan faoliyatni bajaring',
      uk: 'Виконайте 5 будь-яких активностей',
      en: 'Complete 5 any activities'
    },
    objectives: [
      {
        objectiveId: 'complete_activities',
        type: 'activity',
        description: { ru: 'Активности', uz: 'Faoliyatlar', uk: 'Активності', en: 'Activities' },
        target: 'any',
        current: 0,
        required: 5,
        completed: false
      }
    ],
    rewards: {
      experience: 200,
      soms: 500,
      crystals: 10
    },
    requiredLevel: 1
  },
  {
    questId: 'daily_gathering',
    type: 'daily',
    name: {
      ru: 'Собиратель',
      uz: 'Yig\'uvchi',
      uk: 'Збирач',
      en: 'Gatherer'
    },
    description: {
      ru: 'Соберите 10 яблок',
      uz: '10 ta olma yig\'ing',
      uk: 'Зберіть 10 яблук',
      en: 'Gather 10 apples'
    },
    objectives: [
      {
        objectiveId: 'collect_apples',
        type: 'collect',
        description: { ru: 'Яблоки', uz: 'Olmalar', uk: 'Яблука', en: 'Apples' },
        target: 'apple',
        current: 0,
        required: 10,
        completed: false
      }
    ],
    rewards: {
      experience: 150,
      soms: 300
    },
    requiredLevel: 1
  },
  {
    questId: 'daily_arena',
    type: 'daily',
    name: {
      ru: 'Воин арены',
      uz: 'Arena jangchisi',
      uk: 'Воїн арени',
      en: 'Arena Warrior'
    },
    description: {
      ru: 'Победите 3 игроков на арене',
      uz: 'Arenada 3 ta o\'yinchini mag\'lub eting',
      uk: 'Переможте 3 гравців на арені',
      en: 'Defeat 3 players in arena'
    },
    objectives: [
      {
        objectiveId: 'win_battles',
        type: 'battle',
        description: { ru: 'Победы', uz: 'G\'alabalar', uk: 'Перемоги', en: 'Wins' },
        target: 'arena',
        current: 0,
        required: 3,
        completed: false
      }
    ],
    rewards: {
      experience: 300,
      soms: 600,
      crystals: 20
    },
    requiredLevel: 5
  }
];

const WEEKLY_QUESTS: Quest[] = [
  {
    questId: 'weekly_level_up',
    type: 'weekly',
    name: {
      ru: 'Путь к вершине',
      uz: 'Cho\'qqiga yo\'l',
      uk: 'Шлях до вершини',
      en: 'Path to the Top'
    },
    description: {
      ru: 'Достигните следующего уровня',
      uz: 'Keyingi darajaga yeting',
      uk: 'Досягніть наступного рівня',
      en: 'Reach next level'
    },
    objectives: [
      {
        objectiveId: 'level_up',
        type: 'level',
        description: { ru: 'Уровень', uz: 'Daraja', uk: 'Рівень', en: 'Level' },
        target: 1,
        current: 0,
        required: 1,
        completed: false
      }
    ],
    rewards: {
      experience: 500,
      soms: 1000,
      crystals: 50,
      items: [
        { itemId: 'lootbox_rare', quantity: 1 }
      ]
    },
    requiredLevel: 1
  },
  {
    questId: 'weekly_wealth',
    type: 'weekly',
    name: {
      ru: 'Богатство',
      uz: 'Boylik',
      uk: 'Багатство',
      en: 'Wealth'
    },
    description: {
      ru: 'Заработайте 5000 сомов',
      uz: '5000 som ishlang',
      uk: 'Заробіть 5000 сомів',
      en: 'Earn 5000 soms'
    },
    objectives: [
      {
        objectiveId: 'earn_soms',
        type: 'earn_soms',
        description: { ru: 'Сомы', uz: 'Somlar', uk: 'Соми', en: 'Soms' },
        target: 5000,
        current: 0,
        required: 5000,
        completed: false
      }
    ],
    rewards: {
      experience: 400,
      soms: 2000,
      crystals: 30
    },
    requiredLevel: 3
  },
  {
    questId: 'weekly_crafting',
    type: 'weekly',
    name: {
      ru: 'Мастер-ремесленник',
      uz: 'Usta hunarmand',
      uk: 'Майстер-ремісник',
      en: 'Master Craftsman'
    },
    description: {
      ru: 'Скрафтите 10 предметов',
      uz: '10 ta buyum yasang',
      uk: 'Скрафтіть 10 предметів',
      en: 'Craft 10 items'
    },
    objectives: [
      {
        objectiveId: 'craft_items',
        type: 'craft',
        description: { ru: 'Предметы', uz: 'Buyumlar', uk: 'Предмети', en: 'Items' },
        target: 'any',
        current: 0,
        required: 10,
        completed: false
      }
    ],
    rewards: {
      experience: 600,
      soms: 1500,
      crystals: 40,
      items: [
        { itemId: 'rare_recipe', quantity: 1 }
      ]
    },
    requiredLevel: 5
  }
];
```

### Логика квестов

```typescript
async function updateQuestProgress(
  playerId: string,
  objectiveType: string,
  target: string | number,
  amount: number = 1
): Promise<void> {
  const playerQuests = await PlayerQuest.find({
    playerId,
    status: 'active'
  });
  
  for (const playerQuest of playerQuests) {
    const quest = await getQuestById(playerQuest.questId);
    
    for (const objective of quest.objectives) {
      if (objective.type === objectiveType && 
          (objective.target === target || objective.target === 'any')) {
        
        playerQuest.progress[objective.objectiveId] = 
          (playerQuest.progress[objective.objectiveId] || 0) + amount;
        
        objective.current = playerQuest.progress[objective.objectiveId];
        
        if (objective.current >= objective.required) {
          objective.completed = true;
        }
      }
    }
    
    // Проверяем, все ли цели выполнены
    const allCompleted = quest.objectives.every(obj => obj.completed);
    if (allCompleted) {
      await completeQuest(playerId, playerQuest.questId);
    } else {
      await playerQuest.save();
    }
  }
}

async function completeQuest(playerId: string, questId: string): Promise<void> {
  const playerQuest = await PlayerQuest.findOne({ playerId, questId });
  const quest = await getQuestById(questId);
  const player = await Player.findById(playerId);
  
  // Начисляем награды
  player.experience += quest.rewards.experience;
  player.soms += quest.rewards.soms;
  if (quest.rewards.crystals) {
    player.donationCurrency += quest.rewards.crystals;
  }
  
  // Добавляем предметы
  if (quest.rewards.items) {
    for (const item of quest.rewards.items) {
      await addItemToInventory(player, item.itemId, item.quantity);
    }
  }
  
  // Добавляем титул
  if (quest.rewards.title) {
    if (!player.titles) player.titles = [];
    player.titles.push(quest.rewards.title);
  }
  
  await player.save();
  
  // Обновляем статус квеста
  playerQuest.status = 'completed';
  playerQuest.completedAt = new Date();
  await playerQuest.save();
  
  // Если есть следующий квест в цепочке, активируем его
  if (quest.chain?.nextQuestId) {
    await activateQuest(playerId, quest.chain.nextQuestId);
  }
}
```

### API endpoints для квестов

```typescript
// GET /api/quests/available
interface GetAvailableQuestsResponse {
  daily: Quest[];
  weekly: Quest[];
  story: Quest[];
}

// GET /api/quests/active
interface GetActiveQuestsResponse {
  quests: Array<{
    quest: Quest;
    progress: PlayerQuest;
  }>;
}

// POST /api/quests/accept
interface AcceptQuestRequest {
  questId: string;
}

// POST /api/quests/complete
interface CompleteQuestRequest {
  questId: string;
}

interface CompleteQuestResponse {
  rewards: QuestRewards;
  nextQuest?: Quest;
}
```

## Система достижений

### Структура достижений

```typescript
interface Achievement {
  achievementId: string;
  name: LocalizedString;
  description: LocalizedString;
  category: 'progression' | 'combat' | 'gathering' | 'crafting' | 'social' | 'secret';
  icon: string;
  rarity: Rarity;
  requirements: AchievementRequirement[];
  rewards: {
    crystals: number;
    title?: string;
    cosmetic?: string;
  };
  secret: boolean; // Скрытое достижение
  completionRate?: number; // Процент игроков, получивших достижение
}

interface AchievementRequirement {
  type: 'level' | 'battles_won' | 'items_collected' | 'items_crafted' | 'soms_earned' | 'quests_completed';
  target: number;
}

interface PlayerAchievement {
  achievementId: string;
  playerId: string;
  progress: number;
  completed: boolean;
  completedAt?: Date;
}
```

### Примеры достижений

```typescript
const ACHIEVEMENTS: Achievement[] = [
  // Прогрессия
  {
    achievementId: 'reach_level_10',
    name: { ru: 'Новичок', uz: 'Yangi boshlovchi', uk: 'Новачок', en: 'Novice' },
    description: { ru: 'Достигните 10 уровня', uz: '10-darajaga yeting', uk: 'Досягніть 10 рівня', en: 'Reach level 10' },
    category: 'progression',
    icon: 'level_10.png',
    rarity: 'common',
    requirements: [{ type: 'level', target: 10 }],
    rewards: { crystals: 50 },
    secret: false
  },
  {
    achievementId: 'reach_level_50',
    name: { ru: 'Ветеран', uz: 'Veteran', uk: 'Ветеран', en: 'Veteran' },
    description: { ru: 'Достигните 50 уровня', uz: '50-darajaga yeting', uk: 'Досягніть 50 рівня', en: 'Reach level 50' },
    category: 'progression',
    icon: 'level_50.png',
    rarity: 'epic',
    requirements: [{ type: 'level', target: 50 }],
    rewards: { crystals: 200, title: 'Ветеран' },
    secret: false
  },
  {
    achievementId: 'reach_level_100',
    name: { ru: 'Легенда', uz: 'Afsona', uk: 'Легенда', en: 'Legend' },
    description: { ru: 'Достигните 100 уровня', uz: '100-darajaga yeting', uk: 'Досягніть 100 рівня', en: 'Reach level 100' },
    category: 'progression',
    icon: 'level_100.png',
    rarity: 'legendary',
    requirements: [{ type: 'level', target: 100 }],
    rewards: { crystals: 500, title: 'Легенда', cosmetic: 'legendary_aura' },
    secret: false
  },
  
  // Боевые
  {
    achievementId: 'win_100_battles',
    name: { ru: 'Воин', uz: 'Jangchi', uk: 'Воїн', en: 'Warrior' },
    description: { ru: 'Победите в 100 боях', uz: '100 ta jangda g\'alaba qozonish', uk: 'Переможте у 100 боях', en: 'Win 100 battles' },
    category: 'combat',
    icon: 'warrior.png',
    rarity: 'uncommon',
    requirements: [{ type: 'battles_won', target: 100 }],
    rewards: { crystals: 100, title: 'Воин' },
    secret: false
  },
  {
    achievementId: 'win_1000_battles',
    name: { ru: 'Непобедимый', uz: 'Mag\'lubmas', uk: 'Непереможний', en: 'Invincible' },
    description: { ru: 'Победите в 1000 боях', uz: '1000 ta jangda g\'alaba qozonish', uk: 'Переможте у 1000 боях', en: 'Win 1000 battles' },
    category: 'combat',
    icon: 'invincible.png',
    rarity: 'legendary',
    requirements: [{ type: 'battles_won', target: 1000 }],
    rewards: { crystals: 500, title: 'Непобедимый', cosmetic: 'champion_crown' },
    secret: false
  },
  
  // Собирательство
  {
    achievementId: 'collect_1000_apples',
    name: { ru: 'Садовник', uz: 'Bog\'bon', uk: 'Садівник', en: 'Gardener' },
    description: { ru: 'Соберите 1000 яблок', uz: '1000 ta olma yig\'ing', uk: 'Зберіть 1000 яблук', en: 'Collect 1000 apples' },
    category: 'gathering',
    icon: 'gardener.png',
    rarity: 'rare',
    requirements: [{ type: 'items_collected', target: 1000 }],
    rewards: { crystals: 150 },
    secret: false
  },
  
  // Крафтинг
  {
    achievementId: 'craft_50_plovs',
    name: { ru: 'Мастер плова', uz: 'Osh ustasi', uk: 'Майстер плову', en: 'Plov Master' },
    description: { ru: 'Приготовьте 50 пловов', uz: '50 ta osh pishiring', uk: 'Приготуйте 50 пловів', en: 'Cook 50 plovs' },
    category: 'crafting',
    icon: 'plov_master.png',
    rarity: 'epic',
    requirements: [{ type: 'items_crafted', target: 50 }],
    rewards: { crystals: 200, title: 'Мастер плова' },
    secret: false
  },
  
  // Социальные
  {
    achievementId: 'create_guild',
    name: { ru: 'Основатель', uz: 'Asoschisi', uk: 'Засновник', en: 'Founder' },
    description: { ru: 'Создайте гильдию', uz: 'Gildiya yarating', uk: 'Створіть гільдію', en: 'Create a guild' },
    category: 'social',
    icon: 'founder.png',
    rarity: 'rare',
    requirements: [],
    rewards: { crystals: 100, title: 'Основатель' },
    secret: false
  },
  
  // Секретные
  {
    achievementId: 'secret_millionaire',
    name: { ru: '???', uz: '???', uk: '???', en: '???' },
    description: { ru: 'Секретное достижение', uz: 'Yashirin yutuq', uk: 'Секретне досягнення', en: 'Secret achievement' },
    category: 'secret',
    icon: 'secret.png',
    rarity: 'legendary',
    requirements: [{ type: 'soms_earned', target: 1000000 }],
    rewards: { crystals: 1000, title: 'Миллионер', cosmetic: 'golden_aura' },
    secret: true
  }
];
```

### API endpoints для достижений

```typescript
// GET /api/achievements
interface GetAchievementsResponse {
  achievements: Array<{
    achievement: Achievement;
    progress: PlayerAchievement;
  }>;
  completedCount: number;
  totalCount: number;
}

// GET /api/achievements/recent
interface GetRecentAchievementsResponse {
  achievements: Array<{
    achievement: Achievement;
    completedAt: Date;
  }>;
}
```


## Система лутбоксов

### Типы лутбоксов

```typescript
interface Lootbox {
  lootboxId: string;
  type: 'common' | 'uncommon' | 'rare' | 'epic';
  name: LocalizedString;
  description: LocalizedString;
  icon: string;
  price?: number; // Цена в кристаллах (если можно купить)
  dropTable: LootboxDrop[];
  guaranteedRare: boolean; // Pity system
}

interface LootboxDrop {
  itemId: string;
  minQuantity: number;
  maxQuantity: number;
  weight: number; // Вес для расчета вероятности
  rarity: Rarity;
}

const LOOTBOXES: Lootbox[] = [
  {
    lootboxId: 'lootbox_common',
    type: 'common',
    name: { ru: 'Обычный сундук', uz: 'Oddiy sandiq', uk: 'Звичайна скриня', en: 'Common Chest' },
    description: { ru: '1-3 обычных предмета', uz: '1-3 ta oddiy buyum', uk: '1-3 звичайних предмети', en: '1-3 common items' },
    icon: 'chest_common.png',
    price: 50,
    dropTable: [
      { itemId: 'apple', minQuantity: 5, maxQuantity: 15, weight: 30, rarity: 'common' },
      { itemId: 'meat', minQuantity: 2, maxQuantity: 8, weight: 20, rarity: 'common' },
      { itemId: 'bolt', minQuantity: 3, maxQuantity: 10, weight: 25, rarity: 'common' },
      { itemId: 'soms_pack_small', minQuantity: 1, maxQuantity: 1, weight: 25, rarity: 'common' }
    ],
    guaranteedRare: false
  },
  {
    lootboxId: 'lootbox_uncommon',
    type: 'uncommon',
    name: { ru: 'Необычный сундук', uz: 'G\'ayrioddiy sandiq', uk: 'Незвичайна скриня', en: 'Uncommon Chest' },
    description: { ru: '2-4 предмета (70% обычные, 30% необычные)', uz: '2-4 ta buyum', uk: '2-4 предмети', en: '2-4 items' },
    icon: 'chest_uncommon.png',
    price: 100,
    dropTable: [
      { itemId: 'meat', minQuantity: 3, maxQuantity: 10, weight: 25, rarity: 'common' },
      { itemId: 'spice', minQuantity: 2, maxQuantity: 8, weight: 20, rarity: 'uncommon' },
      { itemId: 'gear', minQuantity: 2, maxQuantity: 6, weight: 20, rarity: 'uncommon' },
      { itemId: 'equipment_uncommon', minQuantity: 1, maxQuantity: 1, weight: 15, rarity: 'uncommon' },
      { itemId: 'soms_pack_medium', minQuantity: 1, maxQuantity: 1, weight: 20, rarity: 'uncommon' }
    ],
    guaranteedRare: false
  },
  {
    lootboxId: 'lootbox_rare',
    type: 'rare',
    name: { ru: 'Редкий сундук', uz: 'Noyob sandiq', uk: 'Рідкісна скриня', en: 'Rare Chest' },
    description: { ru: '3-5 предметов (40% обычные, 40% необычные, 20% редкие)', uz: '3-5 ta buyum', uk: '3-5 предметів', en: '3-5 items' },
    icon: 'chest_rare.png',
    price: 200,
    dropTable: [
      { itemId: 'rare_meat', minQuantity: 2, maxQuantity: 5, weight: 15, rarity: 'uncommon' },
      { itemId: 'rare_spice', minQuantity: 2, maxQuantity: 5, weight: 15, rarity: 'rare' },
      { itemId: 'equipment_rare', minQuantity: 1, maxQuantity: 1, weight: 20, rarity: 'rare' },
      { itemId: 'recipe_rare', minQuantity: 1, maxQuantity: 1, weight: 10, rarity: 'rare' },
      { itemId: 'soms_pack_large', minQuantity: 1, maxQuantity: 1, weight: 20, rarity: 'rare' },
      { itemId: 'cosmetic_rare', minQuantity: 1, maxQuantity: 1, weight: 10, rarity: 'rare' }
    ],
    guaranteedRare: false
  },
  {
    lootboxId: 'lootbox_epic',
    type: 'epic',
    name: { ru: 'Эпический сундук', uz: 'Epik sandiq', uk: 'Епічна скриня', en: 'Epic Chest' },
    description: { ru: '4-6 предметов (20% обычные, 30% необычные, 40% редкие, 10% эпические)', uz: '4-6 ta buyum', uk: '4-6 предметів', en: '4-6 items' },
    icon: 'chest_epic.png',
    price: 500,
    dropTable: [
      { itemId: 'epic_material', minQuantity: 1, maxQuantity: 3, weight: 15, rarity: 'rare' },
      { itemId: 'equipment_epic', minQuantity: 1, maxQuantity: 1, weight: 25, rarity: 'epic' },
      { itemId: 'recipe_epic', minQuantity: 1, maxQuantity: 1, weight: 10, rarity: 'epic' },
      { itemId: 'soms_pack_huge', minQuantity: 1, maxQuantity: 1, weight: 20, rarity: 'epic' },
      { itemId: 'cosmetic_epic', minQuantity: 1, maxQuantity: 1, weight: 15, rarity: 'epic' },
      { itemId: 'legendary_fragment', minQuantity: 1, maxQuantity: 1, weight: 5, rarity: 'epic' }
    ],
    guaranteedRare: true
  }
];
```

### Логика открытия лутбокса

```typescript
interface LootboxResult {
  items: Array<{
    item: Item;
    quantity: number;
    rarity: Rarity;
    isNew: boolean;
  }>;
  totalValue: number;
}

async function openLootbox(
  playerId: string,
  lootboxId: string
): Promise<LootboxResult> {
  const player = await Player.findById(playerId);
  const lootbox = LOOTBOXES.find(lb => lb.lootboxId === lootboxId);
  
  if (!lootbox) {
    throw new ValidationError('Lootbox not found', 'LOOTBOX_NOT_FOUND');
  }
  
  // Проверяем наличие лутбокса в инвентаре
  const hasLootbox = await hasItemInInventory(player, lootboxId);
  if (!hasLootbox) {
    throw new ValidationError('No lootbox in inventory', 'NO_LOOTBOX');
  }
  
  // Удаляем лутбокс из инвентаря
  await removeItemFromInventory(player, lootboxId, 1);
  
  // Проверяем pity system
  if (!player.lootboxStats) {
    player.lootboxStats = { openedSinceRare: 0 };
  }
  
  player.lootboxStats.openedSinceRare++;
  const guaranteedRare = player.lootboxStats.openedSinceRare >= 10;
  
  // Определяем количество предметов
  const itemCount = lootbox.type === 'common' ? randomInt(1, 3) :
                    lootbox.type === 'uncommon' ? randomInt(2, 4) :
                    lootbox.type === 'rare' ? randomInt(3, 5) :
                    randomInt(4, 6);
  
  const result: LootboxResult = {
    items: [],
    totalValue: 0
  };
  
  // Генерируем предметы
  for (let i = 0; i < itemCount; i++) {
    const drop = selectWeightedRandom(lootbox.dropTable);
    const quantity = randomInt(drop.minQuantity, drop.maxQuantity);
    
    // Применяем pity system
    let rarity = drop.rarity;
    if (guaranteedRare && i === 0) {
      rarity = 'rare';
      player.lootboxStats.openedSinceRare = 0;
    }
    
    const item = await getItemById(drop.itemId);
    const isNew = !await hasItemInInventory(player, drop.itemId);
    
    await addItemToInventory(player, drop.itemId, quantity);
    
    result.items.push({
      item,
      quantity,
      rarity,
      isNew
    });
    
    result.totalValue += item.sellPrice * quantity;
  }
  
  await player.save();
  
  return result;
}

function selectWeightedRandom(dropTable: LootboxDrop[]): LootboxDrop {
  const totalWeight = dropTable.reduce((sum, drop) => sum + drop.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const drop of dropTable) {
    random -= drop.weight;
    if (random <= 0) {
      return drop;
    }
  }
  
  return dropTable[dropTable.length - 1];
}
```

### API endpoints для лутбоксов

```typescript
// POST /api/lootbox/open
interface OpenLootboxRequest {
  lootboxId: string;
}

interface OpenLootboxResponse {
  result: LootboxResult;
  animation: {
    duration: number;
    effects: string[];
  };
}

// POST /api/lootbox/buy
interface BuyLootboxRequest {
  lootboxId: string;
  quantity: number;
}

interface BuyLootboxResponse {
  success: boolean;
  remainingCrystals: number;
}
```

## Рынок игроков

### Структура рынка

```typescript
interface MarketListing {
  listingId: string;
  sellerId: string;
  sellerName: string;
  itemId: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  createdAt: Date;
  expiresAt: Date;
  status: 'active' | 'sold' | 'cancelled' | 'expired';
}

interface MarketTransaction {
  transactionId: string;
  listingId: string;
  sellerId: string;
  buyerId: string;
  itemId: string;
  quantity: number;
  price: number;
  commission: number;
  timestamp: Date;
}
```

### Логика рынка

```typescript
const MARKET_COMMISSION = 0.05; // 5% комиссия
const MAX_LISTINGS_PER_PLAYER = 10;
const LISTING_DURATION_DAYS = 7;

async function createListing(
  playerId: string,
  itemId: string,
  quantity: number,
  pricePerUnit: number
): Promise<MarketListing> {
  const player = await Player.findById(playerId);
  
  // Проверяем лимит активных лотов
  const activeListings = await MarketListing.countDocuments({
    sellerId: playerId,
    status: 'active'
  });
  
  if (activeListings >= MAX_LISTINGS_PER_PLAYER) {
    throw new ValidationError(
      'Max listings reached',
      'MAX_LISTINGS_REACHED'
    );
  }
  
  // Проверяем наличие предмета
  const hasItem = await hasItemInInventory(player, itemId, quantity);
  if (!hasItem) {
    throw new ValidationError('Insufficient items', 'INSUFFICIENT_ITEMS');
  }
  
  // Удаляем предмет из инвентаря (резервируем)
  await removeItemFromInventory(player, itemId, quantity);
  
  // Создаем лот
  const listing: MarketListing = {
    listingId: generateListingId(),
    sellerId: playerId,
    sellerName: player.displayName,
    itemId,
    quantity,
    pricePerUnit,
    totalPrice: pricePerUnit * quantity,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + LISTING_DURATION_DAYS * 24 * 60 * 60 * 1000),
    status: 'active'
  };
  
  await MarketListing.create(listing);
  
  return listing;
}

async function buyListing(
  buyerId: string,
  listingId: string
): Promise<MarketTransaction> {
  const buyer = await Player.findById(buyerId);
  const listing = await MarketListing.findOne({ listingId, status: 'active' });
  
  if (!listing) {
    throw new ValidationError('Listing not found', 'LISTING_NOT_FOUND');
  }
  
  // Нельзя купить свой лот
  if (listing.sellerId === buyerId) {
    throw new ValidationError('Cannot buy own listing', 'OWN_LISTING');
  }
  
  // Проверяем наличие сомов
  if (buyer.soms < listing.totalPrice) {
    throw new ValidationError('Insufficient soms', 'INSUFFICIENT_SOMS');
  }
  
  // Списываем сомы у покупателя
  buyer.soms -= listing.totalPrice;
  
  // Добавляем предмет покупателю
  await addItemToInventory(buyer, listing.itemId, listing.quantity);
  await buyer.save();
  
  // Начисляем сомы продавцу (минус комиссия)
  const seller = await Player.findById(listing.sellerId);
  const commission = Math.floor(listing.totalPrice * MARKET_COMMISSION);
  const sellerProfit = listing.totalPrice - commission;
  
  seller.soms += sellerProfit;
  await seller.save();
  
  // Обновляем статус лота
  listing.status = 'sold';
  await listing.save();
  
  // Создаем транзакцию
  const transaction: MarketTransaction = {
    transactionId: generateTransactionId(),
    listingId,
    sellerId: listing.sellerId,
    buyerId,
    itemId: listing.itemId,
    quantity: listing.quantity,
    price: listing.totalPrice,
    commission,
    timestamp: new Date()
  };
  
  await MarketTransaction.create(transaction);
  
  return transaction;
}

async function cancelListing(
  playerId: string,
  listingId: string
): Promise<void> {
  const listing = await MarketListing.findOne({ listingId, sellerId: playerId, status: 'active' });
  
  if (!listing) {
    throw new ValidationError('Listing not found', 'LISTING_NOT_FOUND');
  }
  
  // Возвращаем предмет продавцу
  const player = await Player.findById(playerId);
  await addItemToInventory(player, listing.itemId, listing.quantity);
  await player.save();
  
  // Обновляем статус лота
  listing.status = 'cancelled';
  await listing.save();
}

async function getRecommendedPrice(itemId: string): Promise<number> {
  // Рассчитываем среднюю цену за последние 7 дней
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const transactions = await MarketTransaction.find({
    itemId,
    timestamp: { $gte: sevenDaysAgo }
  });
  
  if (transactions.length === 0) {
    // Если нет транзакций, используем базовую цену предмета
    const item = await getItemById(itemId);
    return item.sellPrice * 2; // Рекомендуем в 2 раза больше цены продажи NPC
  }
  
  const averagePrice = transactions.reduce((sum, t) => sum + t.price / t.quantity, 0) / transactions.length;
  return Math.floor(averagePrice);
}
```

### API endpoints для рынка

```typescript
// GET /api/market/listings
interface GetMarketListingsRequest {
  itemType?: ItemType;
  rarity?: Rarity;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'ending_soon';
  page?: number;
  limit?: number;
}

interface GetMarketListingsResponse {
  listings: MarketListing[];
  total: number;
  page: number;
  pages: number;
}

// POST /api/market/create
interface CreateListingRequest {
  itemId: string;
  quantity: number;
  pricePerUnit: number;
}

interface CreateListingResponse {
  listing: MarketListing;
}

// POST /api/market/buy
interface BuyListingRequest {
  listingId: string;
}

interface BuyListingResponse {
  transaction: MarketTransaction;
  item: Item;
}

// POST /api/market/cancel
interface CancelListingRequest {
  listingId: string;
}

// GET /api/market/my-listings
interface GetMyListingsResponse {
  active: MarketListing[];
  sold: MarketListing[];
  expired: MarketListing[];
}

// GET /api/market/price/:itemId
interface GetRecommendedPriceResponse {
  itemId: string;
  recommendedPrice: number;
  averagePrice: number;
  recentSales: number;
}

// GET /api/market/history
interface GetMarketHistoryResponse {
  purchases: MarketTransaction[];
  sales: MarketTransaction[];
}
```


## Расширенная система активностей

### Категории активностей

```typescript
type ActivityCategory = 'work' | 'crime' | 'gathering' | 'crafting' | 'social' | 'special';

interface ExtendedActivity {
  id: string;
  category: ActivityCategory;
  name: LocalizedString;
  description: LocalizedString;
  icon: string;
  rewards: {
    experience: number;
    soms: number;
    items?: ItemDrop[];
  };
  risks?: {
    probability: number;
    penalty: number;
    description: LocalizedString;
  };
  statModifiers: StatModifiers;
  requirements: {
    level: number;
    equipment?: string[];
    guild?: boolean;
    items?: Array<{ itemId: string; quantity: number }>;
  };
  cooldown: number;
  duration?: number; // Время выполнения в секундах
  groupActivity?: {
    minPlayers: number;
    maxPlayers: number;
    bonusPerPlayer: number;
  };
}
```

### Все активности игры

```typescript
const ALL_ACTIVITIES: ExtendedActivity[] = [
  // РАБОТА
  {
    id: 'work_svyaznoy',
    category: 'work',
    name: { ru: 'Работать в Связном', uz: 'Svyaznoyda ishlash', uk: 'Працювати в Связному', en: 'Work at Svyaznoy' },
    description: { ru: 'Продавать телефоны и получать зарплату', uz: 'Telefonlar sotish va ish haqi olish', uk: 'Продавати телефони та отримувати зарплату', en: 'Sell phones and earn salary' },
    icon: 'work_svyaznoy.png',
    rewards: { experience: 50, soms: 200 },
    statModifiers: { energy: -15, mood: -5, hunger: -10 },
    requirements: { level: 1 },
    cooldown: 30
  },
  {
    id: 'drive_taxi',
    category: 'work',
    name: { ru: 'Водить такси', uz: 'Taksi haydash', uk: 'Водити таксі', en: 'Drive Taxi' },
    description: { ru: 'Возить пассажиров по городу', uz: 'Yo\'lovchilarni shahar bo\'ylab tashish', uk: 'Возити пасажирів містом', en: 'Drive passengers around the city' },
    icon: 'taxi.png',
    rewards: { experience: 70, soms: 300 },
    statModifiers: { energy: -20, mood: -10, hunger: -15 },
    requirements: { level: 5 },
    cooldown: 40
  },
  {
    id: 'sell_samsa',
    category: 'work',
    name: { ru: 'Продавать самсу', uz: 'Somsa sotish', uk: 'Продавати самсу', en: 'Sell Samsa' },
    description: { ru: 'Торговать самсой на базаре', uz: 'Bozorda somsa savdo qilish', uk: 'Торгувати самсою на базарі', en: 'Trade samsa at the bazaar' },
    icon: 'samsa.png',
    rewards: { experience: 60, soms: 250 },
    statModifiers: { energy: -12, mood: +5, hunger: -8 },
    requirements: { level: 3, items: [{ itemId: 'samsa', quantity: 5 }] },
    cooldown: 35
  },
  {
    id: 'repair_tech',
    category: 'work',
    name: { ru: 'Чинить технику', uz: 'Texnikani ta\'mirlash', uk: 'Ремонтувати техніку', en: 'Repair Tech' },
    description: { ru: 'Ремонтировать телефоны и компьютеры', uz: 'Telefonlar va kompyuterlarni ta\'mirlash', uk: 'Ремонтувати телефони та комп\'ютери', en: 'Repair phones and computers' },
    icon: 'repair.png',
    rewards: { experience: 90, soms: 400 },
    statModifiers: { energy: -18, mood: -8, hunger: -12 },
    requirements: { level: 8, equipment: ['tools'] },
    cooldown: 45
  },
  {
    id: 'teach_tourists',
    category: 'work',
    name: { ru: 'Учить туристов', uz: 'Sayyohlarga o\'rgatish', uk: 'Вчити туристів', en: 'Teach Tourists' },
    description: { ru: 'Проводить экскурсии для туристов', uz: 'Sayyohlar uchun ekskursiyalar o\'tkazish', uk: 'Проводити екскурсії для туристів', en: 'Conduct tours for tourists' },
    icon: 'guide.png',
    rewards: { experience: 80, soms: 350 },
    statModifiers: { energy: -15, mood: +10, hunger: -10 },
    requirements: { level: 10 },
    cooldown: 50
  },
  
  // КРИМИНАЛ
  {
    id: 'rob',
    category: 'crime',
    name: { ru: 'Грабить', uz: 'Talon-taroj qilish', uk: 'Грабувати', en: 'Rob' },
    description: { ru: 'Ограбить случайного прохожего', uz: 'Tasodifiy o\'tkinchini talon-taroj qilish', uk: 'Пограбувати випадкового перехожого', en: 'Rob a random passerby' },
    icon: 'rob.png',
    rewards: { experience: 150, soms: 500 },
    risks: { probability: 0.3, penalty: 300, description: { ru: 'Поймала полиция', uz: 'Politsiya ushladi', uk: 'Спіймала поліція', en: 'Caught by police' } },
    statModifiers: { energy: -25, mood: -15, hunger: -15, health: -10 },
    requirements: { level: 3 },
    cooldown: 60
  },
  {
    id: 'steal_car',
    category: 'crime',
    name: { ru: 'Угнать машину', uz: 'Mashinani o\'g\'irlash', uk: 'Вкрасти машину', en: 'Steal Car' },
    description: { ru: 'Угнать припаркованную машину', uz: 'To\'xtatilgan mashinani o\'g\'irlash', uk: 'Вкрасти припарковану машину', en: 'Steal a parked car' },
    icon: 'steal_car.png',
    rewards: { experience: 200, soms: 800 },
    risks: { probability: 0.4, penalty: 500, description: { ru: 'Сработала сигнализация', uz: 'Signalizatsiya ishladi', uk: 'Спрацювала сигналізація', en: 'Alarm triggered' } },
    statModifiers: { energy: -30, mood: -20, hunger: -20, health: -15 },
    requirements: { level: 7 },
    cooldown: 90
  },
  {
    id: 'hack_atm',
    category: 'crime',
    name: { ru: 'Взломать банкомат', uz: 'Bankomatni buzish', uk: 'Зламати банкомат', en: 'Hack ATM' },
    description: { ru: 'Взломать банкомат и забрать деньги', uz: 'Bankomatni buzib, pulni olish', uk: 'Зламати банкомат і забрати гроші', en: 'Hack ATM and take money' },
    icon: 'hack.png',
    rewards: { experience: 250, soms: 1200 },
    risks: { probability: 0.5, penalty: 800, description: { ru: 'Камеры засняли', uz: 'Kameralar suratga oldi', uk: 'Камери зняли', en: 'Caught on camera' } },
    statModifiers: { energy: -35, mood: -25, hunger: -18, health: -20 },
    requirements: { level: 12, equipment: ['hacking_device'] },
    cooldown: 120
  },
  
  // СОБИРАТЕЛЬСТВО (уже добавлено выше)
  
  // СОЦИАЛЬНЫЕ
  {
    id: 'play_nard',
    category: 'social',
    name: { ru: 'Играть в нарды', uz: 'Narda o\'ynash', uk: 'Грати в нарди', en: 'Play Backgammon' },
    description: { ru: 'Сыграть партию в нарды с друзьями', uz: 'Do\'stlar bilan narda o\'ynash', uk: 'Зіграти партію в нарди з друзями', en: 'Play backgammon with friends' },
    icon: 'nard.png',
    rewards: { experience: 40, soms: 100 },
    statModifiers: { energy: -8, mood: +20, hunger: -5 },
    requirements: { level: 2 },
    cooldown: 25
  },
  {
    id: 'drink_tea',
    category: 'social',
    name: { ru: 'Пить чай в чайхане', uz: 'Choyxonada choy ichish', uk: 'Пити чай в чайхані', en: 'Drink Tea at Teahouse' },
    description: { ru: 'Отдохнуть в чайхане с друзьями', uz: 'Choyxonada do\'stlar bilan dam olish', uk: 'Відпочити в чайхані з друзями', en: 'Relax at teahouse with friends' },
    icon: 'tea.png',
    rewards: { experience: 30, soms: -50 },
    statModifiers: { energy: +15, mood: +25, hunger: +10 },
    requirements: { level: 1 },
    cooldown: 20
  },
  {
    id: 'guild_raid',
    category: 'social',
    name: { ru: 'Гильдейский рейд', uz: 'Gildiya reyd', uk: 'Гільдійський рейд', en: 'Guild Raid' },
    description: { ru: 'Участвовать в рейде с гильдией', uz: 'Gildiya bilan reydda qatnashish', uk: 'Брати участь у рейді з гільдією', en: 'Participate in guild raid' },
    icon: 'raid.png',
    rewards: { experience: 500, soms: 1000, items: [{ itemId: 'raid_loot', minQuantity: 1, maxQuantity: 3, probability: 1.0 }] },
    statModifiers: { energy: -40, mood: +15, hunger: -25, health: -30 },
    requirements: { level: 15, guild: true },
    cooldown: 180,
    groupActivity: { minPlayers: 5, maxPlayers: 10, bonusPerPlayer: 0.1 }
  },
  
  // СПЕЦИАЛЬНЫЕ
  {
    id: 'cook_plov',
    category: 'special',
    name: { ru: 'Готовить плов', uz: 'Osh pishirish', uk: 'Готувати плов', en: 'Cook Plov' },
    description: { ru: 'Приготовить традиционный узбекский плов', uz: 'An\'anaviy o\'zbek oshini pishirish', uk: 'Приготувати традиційний узбецький плов', en: 'Cook traditional Uzbek plov' },
    icon: 'plov.png',
    rewards: { experience: 80, soms: 300 },
    risks: { probability: 0.1, penalty: 100, description: { ru: 'Плов сгорел', uz: 'Osh kuydi', uk: 'Плов згорів', en: 'Plov burned' } },
    statModifiers: { hunger: +30, mood: +20, energy: -10 },
    requirements: { level: 2 },
    cooldown: 45
  },
  {
    id: 'trade_bazaar',
    category: 'special',
    name: { ru: 'Торговать на базаре', uz: 'Bozorda savdo qilish', uk: 'Торгувати на базарі', en: 'Trade at Bazaar' },
    description: { ru: 'Продавать товары на базаре', uz: 'Bozorda tovarlar sotish', uk: 'Продавати товари на базарі', en: 'Sell goods at bazaar' },
    icon: 'bazaar.png',
    rewards: { experience: 100, soms: 400 },
    risks: { probability: 0.2, penalty: 200, description: { ru: 'Обманули покупатели', uz: 'Xaridorlar aldashdi', uk: 'Обдурили покупці', en: 'Cheated by buyers' } },
    statModifiers: { energy: -18, mood: -5, hunger: -12 },
    requirements: { level: 4 },
    cooldown: 50
  },
  {
    id: 'meditate',
    category: 'special',
    name: { ru: 'Медитировать', uz: 'Meditatsiya qilish', uk: 'Медитувати', en: 'Meditate' },
    description: { ru: 'Медитировать для восстановления сил', uz: 'Kuchni tiklash uchun meditatsiya qilish', uk: 'Медитувати для відновлення сил', en: 'Meditate to restore energy' },
    icon: 'meditate.png',
    rewards: { experience: 20, soms: 0 },
    statModifiers: { energy: +40, mood: +30, health: +10 },
    requirements: { level: 1 },
    cooldown: 30
  },
  {
    id: 'workout',
    category: 'special',
    name: { ru: 'Тренироваться', uz: 'Mashq qilish', uk: 'Тренуватися', en: 'Workout' },
    description: { ru: 'Физические упражнения для улучшения здоровья', uz: 'Sog\'liqni yaxshilash uchun jismoniy mashqlar', uk: 'Фізичні вправи для покращення здоров\'я', en: 'Physical exercises to improve health' },
    icon: 'workout.png',
    rewards: { experience: 50, soms: 0 },
    statModifiers: { energy: -30, mood: +10, health: +20, hunger: -20 },
    requirements: { level: 3 },
    cooldown: 40
  }
];
```

### Групповые активности

```typescript
interface GroupActivity {
  activityId: string;
  leaderId: string;
  participants: string[];
  status: 'forming' | 'in_progress' | 'completed';
  startTime?: Date;
  endTime?: Date;
  rewards?: {
    [playerId: string]: {
      experience: number;
      soms: number;
      items: Item[];
    };
  };
}

async function startGroupActivity(
  leaderId: string,
  activityId: string,
  participantIds: string[]
): Promise<GroupActivity> {
  const activity = ALL_ACTIVITIES.find(a => a.id === activityId);
  
  if (!activity || !activity.groupActivity) {
    throw new ValidationError('Not a group activity', 'NOT_GROUP_ACTIVITY');
  }
  
  const totalParticipants = participantIds.length + 1; // +1 для лидера
  
  if (totalParticipants < activity.groupActivity.minPlayers) {
    throw new ValidationError('Not enough players', 'NOT_ENOUGH_PLAYERS');
  }
  
  if (totalParticipants > activity.groupActivity.maxPlayers) {
    throw new ValidationError('Too many players', 'TOO_MANY_PLAYERS');
  }
  
  // Проверяем, что все участники в одной гильдии (если требуется)
  if (activity.requirements.guild) {
    const leader = await Player.findById(leaderId);
    for (const participantId of participantIds) {
      const participant = await Player.findById(participantId);
      if (participant.guildId !== leader.guildId) {
        throw new ValidationError('All players must be in same guild', 'DIFFERENT_GUILDS');
      }
    }
  }
  
  const groupActivity: GroupActivity = {
    activityId,
    leaderId,
    participants: [leaderId, ...participantIds],
    status: 'in_progress',
    startTime: new Date()
  };
  
  // Симулируем выполнение активности
  await simulateGroupActivity(groupActivity, activity);
  
  return groupActivity;
}

async function simulateGroupActivity(
  groupActivity: GroupActivity,
  activity: ExtendedActivity
): Promise<void> {
  const bonusMultiplier = 1 + (groupActivity.participants.length - 1) * activity.groupActivity!.bonusPerPlayer;
  
  groupActivity.rewards = {};
  
  for (const participantId of groupActivity.participants) {
    const player = await Player.findById(participantId);
    
    const experience = Math.floor(activity.rewards.experience * bonusMultiplier);
    const soms = Math.floor(activity.rewards.soms * bonusMultiplier);
    
    player.experience += experience;
    player.soms += soms;
    
    // Применяем модификаторы характеристик
    updatePlayerStats(player, activity.statModifiers);
    
    await player.save();
    
    groupActivity.rewards[participantId] = {
      experience,
      soms,
      items: []
    };
  }
  
  groupActivity.status = 'completed';
  groupActivity.endTime = new Date();
}
```

## Система событий

### Структура события

```typescript
interface GameEvent {
  eventId: string;
  name: LocalizedString;
  description: LocalizedString;
  type: 'festival' | 'tournament' | 'hunt' | 'special';
  startTime: Date;
  endTime: Date;
  status: 'upcoming' | 'active' | 'ended';
  activities: ExtendedActivity[];
  quests: Quest[];
  shop: {
    items: Array<{
      itemId: string;
      price: number; // В событийной валюте
      stock: number;
    }>;
  };
  currency: {
    name: LocalizedString;
    icon: string;
  };
  leaderboard: {
    type: 'points' | 'completions';
    rewards: Array<{
      rank: number;
      rewards: QuestRewards;
    }>;
  };
}
```

### Примеры событий

```typescript
const GAME_EVENTS: GameEvent[] = [
  {
    eventId: 'plov_festival',
    name: { 
      ru: 'Фестиваль плова',
      uz: 'Osh festivali',
      uk: 'Фестиваль плову',
      en: 'Plov Festival'
    },
    description: {
      ru: 'Ежегодный фестиваль плова! Готовьте плов, участвуйте в конкурсах и получайте уникальные награды!',
      uz: 'Yillik osh festivali! Osh pishiring, tanlovlarda qatnashing va noyob mukofotlar oling!',
      uk: 'Щорічний фестиваль плову! Готуйте плов, беріть участь у конкурсах та отримуйте унікальні нагороди!',
      en: 'Annual plov festival! Cook plov, participate in contests and get unique rewards!'
    },
    type: 'festival',
    startTime: new Date('2026-03-01'),
    endTime: new Date('2026-03-14'),
    status: 'upcoming',
    activities: [
      {
        id: 'festival_cook_plov',
        category: 'special',
        name: { ru: 'Готовить фестивальный плов', uz: 'Festival oshini pishirish', uk: 'Готувати фестивальний плов', en: 'Cook Festival Plov' },
        description: { ru: 'Приготовить особый плов для фестиваля', uz: 'Festival uchun maxsus osh pishirish', uk: 'Приготувати особливий плов для фестивалю', en: 'Cook special plov for festival' },
        icon: 'festival_plov.png',
        rewards: { 
          experience: 150, 
          soms: 500,
          items: [{ itemId: 'festival_token', minQuantity: 5, maxQuantity: 10, probability: 1.0 }]
        },
        statModifiers: { hunger: +40, mood: +30, energy: -15 },
        requirements: { level: 5 },
        cooldown: 30
      }
    ],
    quests: [
      {
        questId: 'festival_master_chef',
        type: 'event',
        name: { ru: 'Мастер-повар', uz: 'Usta oshpaz', uk: 'Майстер-кухар', en: 'Master Chef' },
        description: { ru: 'Приготовьте 20 фестивальных пловов', uz: '20 ta festival oshini pishiring', uk: 'Приготуйте 20 фестивальних пловів', en: 'Cook 20 festival plovs' },
        objectives: [
          {
            objectiveId: 'cook_festival_plovs',
            type: 'craft',
            description: { ru: 'Фестивальные пловы', uz: 'Festival oshlari', uk: 'Фестивальні плови', en: 'Festival plovs' },
            target: 'festival_plov',
            current: 0,
            required: 20,
            completed: false
          }
        ],
        rewards: {
          experience: 1000,
          soms: 3000,
          crystals: 100,
          items: [{ itemId: 'golden_ladle', quantity: 1 }],
          title: 'Мастер плова'
        },
        requiredLevel: 5
      }
    ],
    shop: {
      items: [
        { itemId: 'festival_outfit', price: 100, stock: -1 },
        { itemId: 'golden_ladle', price: 200, stock: -1 },
        { itemId: 'plov_recipe_legendary', price: 500, stock: 100 }
      ]
    },
    currency: {
      name: { ru: 'Фестивальные жетоны', uz: 'Festival tokenlari', uk: 'Фестивальні жетони', en: 'Festival Tokens' },
      icon: 'festival_token.png'
    },
    leaderboard: {
      type: 'completions',
      rewards: [
        { rank: 1, rewards: { experience: 5000, soms: 10000, crystals: 500, title: 'Король плова' } },
        { rank: 2, rewards: { experience: 3000, soms: 7000, crystals: 300 } },
        { rank: 3, rewards: { experience: 2000, soms: 5000, crystals: 200 } },
        { rank: 10, rewards: { experience: 1000, soms: 3000, crystals: 100 } }
      ]
    }
  },
  {
    eventId: 'treasure_hunt',
    name: {
      ru: 'Охота на сокровища',
      uz: 'Xazina ovi',
      uk: 'Полювання на скарби',
      en: 'Treasure Hunt'
    },
    description: {
      ru: 'Ищите спрятанные сокровища по всему городу!',
      uz: 'Butun shahar bo\'ylab yashirilgan xazinalarni qidiring!',
      uk: 'Шукайте заховані скарби по всьому місту!',
      en: 'Search for hidden treasures throughout the city!'
    },
    type: 'hunt',
    startTime: new Date('2026-04-01'),
    endTime: new Date('2026-04-07'),
    status: 'upcoming',
    activities: [
      {
        id: 'search_treasure',
        category: 'gathering',
        name: { ru: 'Искать сокровища', uz: 'Xazina qidirish', uk: 'Шукати скарби', en: 'Search Treasures' },
        description: { ru: 'Искать спрятанные сокровища', uz: 'Yashirilgan xazinalarni qidirish', uk: 'Шукати заховані скарби', en: 'Search for hidden treasures' },
        icon: 'treasure.png',
        rewards: {
          experience: 100,
          soms: 300,
          items: [
            { itemId: 'treasure_map_piece', minQuantity: 1, maxQuantity: 1, probability: 0.3 },
            { itemId: 'gold_coin', minQuantity: 1, maxQuantity: 5, probability: 0.7 }
          ]
        },
        statModifiers: { energy: -20, mood: +15, hunger: -15 },
        requirements: { level: 1 },
        cooldown: 20
      }
    ],
    quests: [],
    shop: {
      items: [
        { itemId: 'treasure_detector', price: 50, stock: -1 },
        { itemId: 'pirate_outfit', price: 150, stock: -1 }
      ]
    },
    currency: {
      name: { ru: 'Золотые монеты', uz: 'Oltin tangalar', uk: 'Золоті монети', en: 'Gold Coins' },
      icon: 'gold_coin.png'
    },
    leaderboard: {
      type: 'points',
      rewards: [
        { rank: 1, rewards: { experience: 3000, soms: 8000, crystals: 300, title: 'Охотник за сокровищами' } },
        { rank: 10, rewards: { experience: 1000, soms: 3000, crystals: 100 } }
      ]
    }
  }
];
```

### API endpoints для событий

```typescript
// GET /api/events/current
interface GetCurrentEventResponse {
  event: GameEvent | null;
  playerProgress: {
    currency: number;
    completedQuests: string[];
    leaderboardRank?: number;
    leaderboardPoints?: number;
  };
}

// GET /api/events/upcoming
interface GetUpcomingEventsResponse {
  events: GameEvent[];
}

// POST /api/events/shop/buy
interface BuyEventItemRequest {
  itemId: string;
}

interface BuyEventItemResponse {
  success: boolean;
  item: Item;
  remainingCurrency: number;
}

// GET /api/events/leaderboard
interface GetEventLeaderboardResponse {
  leaderboard: Array<{
    rank: number;
    player: {
      displayName: string;
      level: number;
      points: number;
    };
  }>;
  currentPlayerRank?: number;
}
```

## Расширенная система предметов (100+ предметов)

### Категории предметов

```typescript
type ExtendedItemCategory = 
  | 'food'           // Еда
  | 'drink'          // Напитки
  | 'material'       // Материалы
  | 'component'      // Компоненты
  | 'tool'           // Инструменты
  | 'consumable'     // Расходники
  | 'collectible'    // Коллекционные
  | 'quest'          // Квестовые
  | 'bag';           // Рюкзаки и сумки

interface ExtendedItem extends Item {
  expiresIn?: number; // Срок годности в часах (для еды)
  sources: ItemSource[]; // Где можно получить
  usedIn: string[]; // В каких рецептах используется
  collection?: string; // Название коллекции
}

interface ItemSource {
  type: 'activity' | 'crafting' | 'shop' | 'lootbox' | 'quest' | 'achievement';
  source: string;
  probability?: number;
}
```

### Полный список предметов (100+)

**ЕДА (20 предметов):**
```typescript
const FOOD_ITEMS = [
  // Фрукты
  { id: 'apple', name: 'Яблоко', effect: { hunger: +10 }, expires: 48, rarity: 'common' },
  { id: 'melon', name: 'Дыня', effect: { hunger: +20, mood: +5 }, expires: 24, rarity: 'uncommon' },
  { id: 'grape', name: 'Виноград', effect: { hunger: +15, energy: +5 }, expires: 36, rarity: 'common' },
  { id: 'pomegranate', name: 'Гранат', effect: { hunger: +15, health: +10 }, expires: 48, rarity: 'uncommon' },
  { id: 'apricot', name: 'Абрикос', effect: { hunger: +12, mood: +3 }, expires: 24, rarity: 'common' },
  
  // Мясо
  { id: 'meat', name: 'Мясо', effect: { hunger: +25 }, expires: 12, rarity: 'uncommon' },
  { id: 'rare_meat', name: 'Редкое мясо', effect: { hunger: +35, health: +15 }, expires: 12, rarity: 'rare' },
  { id: 'lamb', name: 'Баранина', effect: { hunger: +30, energy: +10 }, expires: 12, rarity: 'uncommon' },
  { id: 'chicken', name: 'Курица', effect: { hunger: +20 }, expires: 12, rarity: 'common' },
  
  // Готовые блюда
  { id: 'plov', name: 'Плов', effect: { hunger: +50, health: +20, mood: +30 }, expires: 6, rarity: 'rare' },
  { id: 'samsa', name: 'Самса', effect: { hunger: +30, mood: +10 }, expires: 12, rarity: 'uncommon' },
  { id: 'lagman', name: 'Лагман', effect: { hunger: +40, energy: +15 }, expires: 6, rarity: 'uncommon' },
  { id: 'manti', name: 'Манты', effect: { hunger: +35, mood: +15 }, expires: 6, rarity: 'uncommon' },
  { id: 'shashlik', name: 'Шашлык', effect: { hunger: +45, mood: +20 }, expires: 3, rarity: 'rare' },
  { id: 'bread', name: 'Лепешка', effect: { hunger: +15 }, expires: 24, rarity: 'common' },
  
  // Сладости
  { id: 'halva', name: 'Халва', effect: { hunger: +10, mood: +20 }, expires: 168, rarity: 'uncommon' },
  { id: 'chak_chak', name: 'Чак-чак', effect: { hunger: +12, mood: +15, energy: +10 }, expires: 168, rarity: 'uncommon' },
  { id: 'baklava', name: 'Пахлава', effect: { hunger: +15, mood: +25 }, expires: 72, rarity: 'rare' },
  
  // Овощи
  { id: 'onion', name: 'Лук', effect: { hunger: +5 }, expires: 72, rarity: 'common' },
  { id: 'carrot', name: 'Морковь', effect: { hunger: +8, health: +5 }, expires: 72, rarity: 'common' }
];
```

**НАПИТКИ (15 предметов):**
```typescript
const DRINK_ITEMS = [
  { id: 'water', name: 'Вода', effect: { energy: +10 }, expires: null, rarity: 'common' },
  { id: 'tea', name: 'Чай', effect: { energy: +15, mood: +10 }, expires: 3, rarity: 'common' },
  { id: 'green_tea', name: 'Зеленый чай', effect: { energy: +20, health: +5 }, expires: 3, rarity: 'uncommon' },
  { id: 'coffee', name: 'Кофе', effect: { energy: +30, mood: +5 }, expires: 3, rarity: 'uncommon' },
  { id: 'energy_drink', name: 'Энергетик', effect: { energy: +50 }, expires: 168, rarity: 'rare' },
  { id: 'juice', name: 'Сок', effect: { energy: +15, hunger: +10 }, expires: 24, rarity: 'common' },
  { id: 'milk', name: 'Молоко', effect: { hunger: +15, health: +10 }, expires: 48, rarity: 'common' },
  { id: 'ayran', name: 'Айран', effect: { hunger: +10, energy: +10 }, expires: 24, rarity: 'uncommon' },
  { id: 'kompot', name: 'Компот', effect: { energy: +20, mood: +15 }, expires: 48, rarity: 'uncommon' },
  { id: 'sherbet', name: 'Шербет', effect: { energy: +25, mood: +20 }, expires: 24, rarity: 'rare' },
  { id: 'kvass', name: 'Квас', effect: { energy: +15, mood: +10 }, expires: 48, rarity: 'uncommon' },
  { id: 'mineral_water', name: 'Минералка', effect: { energy: +12, health: +8 }, expires: null, rarity: 'common' },
  { id: 'herbal_tea', name: 'Травяной чай', effect: { health: +20, mood: +15 }, expires: 3, rarity: 'rare' },
  { id: 'smoothie', name: 'Смузи', effect: { hunger: +20, energy: +20, health: +10 }, expires: 6, rarity: 'rare' },
  { id: 'protein_shake', name: 'Протеиновый коктейль', effect: { hunger: +25, energy: +15 }, expires: 12, rarity: 'epic' }
];
```

**МАТЕРИАЛЫ И КОМПОНЕНТЫ (30 предметов):**
```typescript
const MATERIALS = [
  // Базовые материалы
  { id: 'wood', name: 'Дерево', rarity: 'common' },
  { id: 'stone', name: 'Камень', rarity: 'common' },
  { id: 'iron_ore', name: 'Железная руда', rarity: 'uncommon' },
  { id: 'copper_ore', name: 'Медная руда', rarity: 'uncommon' },
  { id: 'gold_ore', name: 'Золотая руда', rarity: 'rare' },
  { id: 'silver_ore', name: 'Серебряная руда', rarity: 'rare' },
  { id: 'crystal', name: 'Кристалл', rarity: 'epic' },
  { id: 'diamond', name: 'Алмаз', rarity: 'legendary' },
  
  // Ткани
  { id: 'cloth', name: 'Ткань', rarity: 'common' },
  { id: 'silk', name: 'Шелк', rarity: 'rare' },
  { id: 'leather', name: 'Кожа', rarity: 'uncommon' },
  { id: 'fur', name: 'Мех', rarity: 'rare' },
  
  // Специи и травы
  { id: 'spice', name: 'Специи', rarity: 'uncommon' },
  { id: 'rare_spice', name: 'Редкие специи', rarity: 'rare' },
  { id: 'saffron', name: 'Шафран', rarity: 'epic' },
  { id: 'herb', name: 'Трава', rarity: 'common' },
  { id: 'rare_herb', name: 'Редкая трава', rarity: 'rare' },
  { id: 'medicinal_herb', name: 'Лечебная трава', rarity: 'epic' },
  
  // Компоненты
  { id: 'gear', name: 'Шестеренка', rarity: 'uncommon' },
  { id: 'bolt', name: 'Болт', rarity: 'common' },
  { id: 'wire', name: 'Провод', rarity: 'uncommon' },
  { id: 'circuit', name: 'Микросхема', rarity: 'rare' },
  { id: 'battery', name: 'Батарейка', rarity: 'uncommon' },
  { id: 'spring', name: 'Пружина', rarity: 'common' },
  { id: 'screw', name: 'Винт', rarity: 'common' },
  { id: 'nail', name: 'Гвоздь', rarity: 'common' },
  { id: 'glue', name: 'Клей', rarity: 'common' },
  { id: 'paint', name: 'Краска', rarity: 'uncommon' },
  { id: 'oil', name: 'Масло', rarity: 'uncommon' },
  { id: 'rope', name: 'Веревка', rarity: 'common' }
];
```

**ИНСТРУМЕНТЫ (10 предметов):**
```typescript
const TOOLS = [
  { id: 'hammer', name: 'Молоток', bonus: { crafting_speed: +10 }, rarity: 'common' },
  { id: 'saw', name: 'Пила', bonus: { crafting_speed: +15 }, rarity: 'uncommon' },
  { id: 'wrench', name: 'Гаечный ключ', bonus: { repair_efficiency: +20 }, rarity: 'uncommon' },
  { id: 'screwdriver', name: 'Отвертка', bonus: { repair_efficiency: +10 }, rarity: 'common' },
  { id: 'pickaxe', name: 'Кирка', bonus: { mining_speed: +25 }, rarity: 'uncommon' },
  { id: 'axe', name: 'Топор', bonus: { woodcutting_speed: +25 }, rarity: 'uncommon' },
  { id: 'fishing_rod', name: 'Удочка', bonus: { fishing_luck: +30 }, rarity: 'uncommon' },
  { id: 'magnifying_glass', name: 'Лупа', bonus: { find_rare: +15 }, rarity: 'rare' },
  { id: 'metal_detector', name: 'Металлоискатель', bonus: { find_treasure: +50 }, rarity: 'epic' },
  { id: 'master_toolkit', name: 'Мастерской набор', bonus: { all_skills: +20 }, rarity: 'legendary' }
];
```

**РАСХОДНИКИ (15 предметов):**
```typescript
const CONSUMABLES = [
  { id: 'medkit', name: 'Аптечка', effect: { health: +60 }, rarity: 'uncommon' },
  { id: 'bandage', name: 'Бинт', effect: { health: +20 }, rarity: 'common' },
  { id: 'painkiller', name: 'Обезболивающее', effect: { health: +30, energy: -10 }, rarity: 'uncommon' },
  { id: 'vitamin', name: 'Витамины', effect: { health: +15, mood: +10 }, rarity: 'uncommon' },
  { id: 'antidote', name: 'Противоядие', effect: { health: +40 }, rarity: 'rare' },
  { id: 'buff_strength', name: 'Зелье силы', effect: { attack: +20, duration: 3600 }, rarity: 'rare' },
  { id: 'buff_defense', name: 'Зелье защиты', effect: { defense: +20, duration: 3600 }, rarity: 'rare' },
  { id: 'buff_luck', name: 'Зелье удачи', effect: { luck: +30, duration: 3600 }, rarity: 'epic' },
  { id: 'buff_exp', name: 'Зелье опыта', effect: { exp_bonus: +50, duration: 7200 }, rarity: 'epic' },
  { id: 'teleport_scroll', name: 'Свиток телепорта', effect: { teleport: 'city' }, rarity: 'rare' },
  { id: 'repair_kit', name: 'Ремонтный набор', effect: { repair_equipment: 100 }, rarity: 'uncommon' },
  { id: 'lockpick', name: 'Отмычка', effect: { unlock_chest: true }, rarity: 'uncommon' },
  { id: 'smoke_bomb', name: 'Дымовая шашка', effect: { escape_battle: true }, rarity: 'rare' },
  { id: 'lucky_charm', name: 'Талисман удачи', effect: { luck: +10, duration: 86400 }, rarity: 'epic' },
  { id: 'resurrection_stone', name: 'Камень воскрешения', effect: { revive: true }, rarity: 'legendary' }
];
```

**КОЛЛЕКЦИОННЫЕ ПРЕДМЕТЫ (10 предметов):**
```typescript
const COLLECTIBLES = [
  { id: 'ancient_coin', name: 'Древняя монета', collection: 'Нумизматика', rarity: 'rare' },
  { id: 'old_stamp', name: 'Старая марка', collection: 'Филателия', rarity: 'uncommon' },
  { id: 'rare_book', name: 'Редкая книга', collection: 'Библиофилия', rarity: 'epic' },
  { id: 'antique_vase', name: 'Антикварная ваза', collection: 'Антиквариат', rarity: 'rare' },
  { id: 'fossil', name: 'Окаменелость', collection: 'Палеонтология', rarity: 'rare' },
  { id: 'gemstone', name: 'Драгоценный камень', collection: 'Геммология', rarity: 'epic' },
  { id: 'ancient_artifact', name: 'Древний артефакт', collection: 'Археология', rarity: 'legendary' },
  { id: 'rare_painting', name: 'Редкая картина', collection: 'Искусство', rarity: 'epic' },
  { id: 'vintage_toy', name: 'Винтажная игрушка', collection: 'Игрушки', rarity: 'uncommon' },
  { id: 'meteorite', name: 'Метеорит', collection: 'Космос', rarity: 'legendary' }
];
```

## Система рюкзаков и визуальной кастомизации

### Типы рюкзаков

```typescript
interface Backpack {
  id: string;
  name: LocalizedString;
  type: 'backpack' | 'bag' | 'belt' | 'pocket';
  slots: number;
  weightReduction: number; // Процент снижения веса
  rarity: Rarity;
  price: number;
  visualModel: string; // 3D модель для отображения на персонаже
  upgradeLevel: number; // 0-5
  bonuses?: {
    findRare?: number;
    durability?: number;
    autoSort?: boolean;
  };
}

const BACKPACKS: Backpack[] = [
  {
    id: 'small_backpack',
    name: { ru: 'Маленький рюкзак', uz: 'Kichik ryukzak', uk: 'Маленький рюкзак', en: 'Small Backpack' },
    type: 'backpack',
    slots: 10,
    weightReduction: 0,
    rarity: 'common',
    price: 1000,
    visualModel: 'backpack_small.glb',
    upgradeLevel: 0
  },
  {
    id: 'medium_backpack',
    name: { ru: 'Средний рюкзак', uz: 'O\'rta ryukzak', uk: 'Середній рюкзак', en: 'Medium Backpack' },
    type: 'backpack',
    slots: 20,
    weightReduction: 5,
    rarity: 'uncommon',
    price: 5000,
    visualModel: 'backpack_medium.glb',
    upgradeLevel: 0
  },
  {
    id: 'large_backpack',
    name: { ru: 'Большой рюкзак', uz: 'Katta ryukzak', uk: 'Великий рюкзак', en: 'Large Backpack' },
    type: 'backpack',
    slots: 30,
    weightReduction: 10,
    rarity: 'rare',
    price: 15000,
    visualModel: 'backpack_large.glb',
    upgradeLevel: 0,
    bonuses: { findRare: 5 }
  },
  {
    id: 'huge_backpack',
    name: { ru: 'Огромный рюкзак', uz: 'Ulkan ryukzak', uk: 'Величезний рюкзак', en: 'Huge Backpack' },
    type: 'backpack',
    slots: 50,
    weightReduction: 15,
    rarity: 'epic',
    price: 50000,
    visualModel: 'backpack_huge.glb',
    upgradeLevel: 0,
    bonuses: { findRare: 10, durability: 20 }
  },
  {
    id: 'legendary_backpack',
    name: { ru: 'Легендарный рюкзак', uz: 'Afsonaviy ryukzak', uk: 'Легендарний рюкзак', en: 'Legendary Backpack' },
    type: 'backpack',
    slots: 100,
    weightReduction: 25,
    rarity: 'legendary',
    price: 200000,
    visualModel: 'backpack_legendary.glb',
    upgradeLevel: 0,
    bonuses: { findRare: 20, durability: 50, autoSort: true }
  },
  // Дополнительные сумки
  {
    id: 'belt_pouch',
    name: { ru: 'Поясная сумка', uz: 'Belbog\'', uk: 'Поясна сумка', en: 'Belt Pouch' },
    type: 'belt',
    slots: 5,
    weightReduction: 0,
    rarity: 'common',
    price: 500,
    visualModel: 'belt_pouch.glb',
    upgradeLevel: 0
  },
  {
    id: 'shoulder_bag',
    name: { ru: 'Наплечная сумка', uz: 'Yelka sumkasi', uk: 'Наплічна сумка', en: 'Shoulder Bag' },
    type: 'bag',
    slots: 15,
    weightReduction: 5,
    rarity: 'uncommon',
    price: 3000,
    visualModel: 'shoulder_bag.glb',
    upgradeLevel: 0
  },
  {
    id: 'cargo_pants',
    name: { ru: 'Штаны с карманами', uz: 'Cho\'ntak shim', uk: 'Штани з кишенями', en: 'Cargo Pants' },
    type: 'pocket',
    slots: 8,
    weightReduction: 0,
    rarity: 'uncommon',
    price: 2000,
    visualModel: 'cargo_pants.glb',
    upgradeLevel: 0
  }
];
```

### Улучшение рюкзаков

```typescript
function upgradeBackpack(backpack: Backpack): { cost: number; newSlots: number } {
  const upgradeCost = 5000 * Math.pow(2, backpack.upgradeLevel);
  const additionalSlots = Math.floor(backpack.slots * 0.2); // +20% слотов за улучшение
  
  return {
    cost: upgradeCost,
    newSlots: backpack.slots + additionalSlots
  };
}
```

## Банковская система

### Структура банка

```typescript
interface Bank {
  playerId: string;
  deposit: number; // Депозит
  loans: Loan[]; // Кредиты
  vault: BankVault; // Банковская ячейка
  creditHistory: CreditHistory[];
  interestRate: number; // Процентная ставка (зависит от истории)
}

interface Loan {
  loanId: string;
  amount: number;
  interestRate: number; // 5-15%
  dailyInterest: number;
  remainingAmount: number;
  takenAt: Date;
  dueDate: Date;
  daysOverdue: number;
  status: 'active' | 'paid' | 'defaulted';
}

interface BankVault {
  slots: number; // Платные слоты для хранения предметов
  items: Item[];
  monthlyCost: number;
}

interface CreditHistory {
  loanId: string;
  amount: number;
  paidOnTime: boolean;
  timestamp: Date;
}
```

### Логика кредитов

```typescript
function calculateLoanInterest(playerLevel: number, amount: number, creditScore: number): number {
  let baseRate = 10; // 10% базовая ставка
  
  // Снижение ставки за высокий уровень
  baseRate -= Math.floor(playerLevel / 20);
  
  // Снижение ставки за хорошую кредитную историю
  baseRate -= Math.floor(creditScore / 100);
  
  // Увеличение ставки за большую сумму
  if (amount > 50000) baseRate += 3;
  if (amount > 100000) baseRate += 5;
  
  return Math.max(5, Math.min(15, baseRate));
}

async function takeLoan(playerId: string, amount: number): Promise<Loan> {
  const player = await Player.findById(playerId);
  const bank = await Bank.findOne({ playerId });
  
  // Максимальная сумма кредита = уровень * 1000
  const maxLoan = player.level * 1000;
  if (amount > maxLoan) {
    throw new ValidationError('Loan amount too high', 'LOAN_TOO_HIGH');
  }
  
  // Проверка активных кредитов
  const activeLoans = bank.loans.filter(l => l.status === 'active');
  if (activeLoans.length >= 3) {
    throw new ValidationError('Too many active loans', 'TOO_MANY_LOANS');
  }
  
  const creditScore = calculateCreditScore(bank.creditHistory);
  const interestRate = calculateLoanInterest(player.level, amount, creditScore);
  
  const loan: Loan = {
    loanId: generateLoanId(),
    amount,
    interestRate,
    dailyInterest: amount * (interestRate / 100) / 30,
    remainingAmount: amount,
    takenAt: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
    daysOverdue: 0,
    status: 'active'
  };
  
  bank.loans.push(loan);
  player.soms += amount;
  
  await bank.save();
  await player.save();
  
  return loan;
}

// Ежедневное начисление процентов
async function applyDailyInterest(): Promise<void> {
  const banks = await Bank.find({ 'loans.status': 'active' });
  
  for (const bank of banks) {
    for (const loan of bank.loans) {
      if (loan.status !== 'active') continue;
      
      loan.remainingAmount += loan.dailyInterest;
      
      // Проверка просрочки
      if (new Date() > loan.dueDate) {
        loan.daysOverdue++;
        loan.interestRate += 1; // +1% за каждый день просрочки
        loan.dailyInterest = loan.remainingAmount * (loan.interestRate / 100) / 30;
      }
    }
    
    // Начисление процентов на депозит (1% в день)
    bank.deposit *= 1.01;
    
    await bank.save();
  }
}
```

### API endpoints для банка

```typescript
// POST /api/bank/loan/take
interface TakeLoanRequest {
  amount: number;
}

// POST /api/bank/loan/repay
interface RepayLoanRequest {
  loanId: string;
  amount: number;
}

// POST /api/bank/deposit
interface DepositRequest {
  amount: number;
}

// POST /api/bank/withdraw
interface WithdrawRequest {
  amount: number;
}

// POST /api/bank/vault/rent
interface RentVaultRequest {
  slots: number; // 10, 20, 50
}

// GET /api/bank/info
interface GetBankInfoResponse {
  deposit: number;
  depositInterest: number;
  loans: Loan[];
  vault: BankVault;
  creditScore: number;
}
```

## Заключение

Эти расширенные механики превращают "Узбек Варс" в полноценную MMO-игру с глубокими системами прогрессии, социального взаимодействия и контента. Все механики интегрированы друг с другом и создают богатый игровой опыт для игроков.


## Система друзей и подарков

### Структура

```typescript
interface Friendship {
  player1Id: string;
  player2Id: string;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
  lastInteraction: Date;
}

interface Gift {
  giftId: string;
  senderId: string;
  receiverId: string;
  type: 'soms' | 'item' | 'energy' | 'food';
  content: {
    soms?: number;
    itemId?: string;
    quantity?: number;
  };
  message?: string;
  sentAt: Date;
  claimed: boolean;
}

interface FriendActivity {
  playerId: string;
  displayName: string;
  level: number;
  isOnline: boolean;
  lastSeen: Date;
  currentActivity?: string;
}
```

### Логика подарков

```typescript
const DAILY_GIFT_LIMIT = 10;
const MAX_GIFT_SOMS = 500;

async function sendGift(
  senderId: string,
  receiverId: string,
  giftType: string,
  content: any
): Promise<Gift> {
  // Проверка дружбы
  const friendship = await Friendship.findOne({
    $or: [
      { player1Id: senderId, player2Id: receiverId },
      { player1Id: receiverId, player2Id: senderId }
    ],
    status: 'accepted'
  });
  
  if (!friendship) {
    throw new ValidationError('Not friends', 'NOT_FRIENDS');
  }
  
  // Проверка лимита
  const todayGifts = await Gift.countDocuments({
    senderId,
    sentAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });
  
  if (todayGifts >= DAILY_GIFT_LIMIT) {
    throw new ValidationError('Daily gift limit reached', 'GIFT_LIMIT');
  }
  
  const sender = await Player.findById(senderId);
  
  // Списываем ресурсы у отправителя
  if (giftType === 'soms') {
    if (content.soms > MAX_GIFT_SOMS) {
      throw new ValidationError('Gift amount too high', 'GIFT_TOO_HIGH');
    }
    if (sender.soms < content.soms) {
      throw new ValidationError('Insufficient soms', 'INSUFFICIENT_SOMS');
    }
    sender.soms -= content.soms;
  } else if (giftType === 'item') {
    await removeItemFromInventory(sender, content.itemId, content.quantity);
  }
  
  // Бонус за отправку подарка
  sender.experience += 5;
  await sender.save();
  
  const gift: Gift = {
    giftId: generateGiftId(),
    senderId,
    receiverId,
    type: giftType,
    content,
    sentAt: new Date(),
    claimed: false
  };
  
  await Gift.create(gift);
  
  return gift;
}

async function claimGift(playerId: string, giftId: string): Promise<void> {
  const gift = await Gift.findOne({ giftId, receiverId: playerId, claimed: false });
  
  if (!gift) {
    throw new ValidationError('Gift not found', 'GIFT_NOT_FOUND');
  }
  
  const player = await Player.findById(playerId);
  
  // Начисляем подарок
  if (gift.type === 'soms') {
    player.soms += gift.content.soms;
  } else if (gift.type === 'item') {
    await addItemToInventory(player, gift.content.itemId, gift.content.quantity);
  } else if (gift.type === 'energy') {
    player.stats.energy = Math.min(100, player.stats.energy + 20);
  }
  
  gift.claimed = true;
  await gift.save();
  await player.save();
}

// Бонус за игру с друзьями
function applyFriendBonus(playerId: string, friendIds: string[]): number {
  const onlineFriends = friendIds.filter(id => isPlayerOnline(id));
  return onlineFriends.length * 10; // +10% опыт за каждого онлайн друга (макс 100%)
}
```

### API endpoints

```typescript
// POST /api/friends/add
interface AddFriendRequest {
  friendId: string;
}

// POST /api/friends/accept
interface AcceptFriendRequest {
  friendshipId: string;
}

// POST /api/friends/remove
interface RemoveFriendRequest {
  friendId: string;
}

// GET /api/friends/list
interface GetFriendsResponse {
  friends: FriendActivity[];
  pendingRequests: Friendship[];
}

// POST /api/friends/gift/send
interface SendGiftRequest {
  receiverId: string;
  type: 'soms' | 'item' | 'energy';
  content: any;
  message?: string;
}

// GET /api/friends/gifts
interface GetGiftsResponse {
  received: Gift[];
  sent: Gift[];
}

// POST /api/friends/gift/claim
interface ClaimGiftRequest {
  giftId: string;
}
```

## Ежедневные бонусы и стрики

### Структура

```typescript
interface DailyStreak {
  playerId: string;
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: Date;
  calendar: {
    [date: string]: boolean; // "2026-02-01": true
  };
  streakProtections: number; // Количество защит стрика
  milestones: {
    day7: boolean;
    day30: boolean;
    day100: boolean;
    day365: boolean;
  };
}

interface DailyReward {
  day: number;
  soms: number;
  crystals?: number;
  items?: Array<{ itemId: string; quantity: number }>;
  lootbox?: string;
}
```

### Таблица наград

```typescript
const DAILY_REWARDS: DailyReward[] = [
  { day: 1, soms: 100 },
  { day: 2, soms: 150 },
  { day: 3, soms: 200, crystals: 5 },
  { day: 4, soms: 250 },
  { day: 5, soms: 300, crystals: 10 },
  { day: 6, soms: 400 },
  { day: 7, soms: 1000, crystals: 50, lootbox: 'lootbox_rare' },
  // Цикл повторяется, но с увеличением наград
];

const MILESTONE_REWARDS = {
  day7: { soms: 2000, crystals: 100, items: [{ itemId: 'legendary_backpack', quantity: 1 }] },
  day30: { soms: 10000, crystals: 500, items: [{ itemId: 'epic_pet', quantity: 1 }], title: 'Преданный игрок' },
  day100: { soms: 50000, crystals: 2000, items: [{ itemId: 'legendary_weapon', quantity: 1 }], title: 'Ветеран' },
  day365: { soms: 200000, crystals: 10000, items: [{ itemId: 'ultimate_backpack', quantity: 1 }], title: 'Легенда года' }
};
```

### Логика стриков

```typescript
async function checkDailyLogin(playerId: string): Promise<DailyReward> {
  const streak = await DailyStreak.findOne({ playerId });
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  if (!streak) {
    // Первый вход
    const newStreak = await DailyStreak.create({
      playerId,
      currentStreak: 1,
      longestStreak: 1,
      lastLoginDate: new Date(),
      calendar: { [today]: true },
      streakProtections: 0,
      milestones: { day7: false, day30: false, day100: false, day365: false }
    });
    
    return DAILY_REWARDS[0];
  }
  
  // Проверка, заходил ли сегодня
  if (streak.calendar[today]) {
    throw new ValidationError('Already claimed today', 'ALREADY_CLAIMED');
  }
  
  // Проверка стрика
  if (streak.calendar[yesterday]) {
    // Продолжение стрика
    streak.currentStreak++;
  } else {
    // Проверка защиты стрика
    if (streak.streakProtections > 0) {
      streak.streakProtections--;
      // Стрик сохранен
    } else {
      // Стрик сброшен
      streak.currentStreak = 1;
    }
  }
  
  streak.calendar[today] = true;
  streak.lastLoginDate = new Date();
  
  if (streak.currentStreak > streak.longestStreak) {
    streak.longestStreak = streak.currentStreak;
  }
  
  // Проверка вех
  const milestoneRewards = [];
  if (streak.currentStreak === 7 && !streak.milestones.day7) {
    streak.milestones.day7 = true;
    milestoneRewards.push(MILESTONE_REWARDS.day7);
  }
  if (streak.currentStreak === 30 && !streak.milestones.day30) {
    streak.milestones.day30 = true;
    milestoneRewards.push(MILESTONE_REWARDS.day30);
  }
  if (streak.currentStreak === 100 && !streak.milestones.day100) {
    streak.milestones.day100 = true;
    milestoneRewards.push(MILESTONE_REWARDS.day100);
  }
  if (streak.currentStreak === 365 && !streak.milestones.day365) {
    streak.milestones.day365 = true;
    milestoneRewards.push(MILESTONE_REWARDS.day365);
  }
  
  await streak.save();
  
  // Награда за день
  const dayInCycle = ((streak.currentStreak - 1) % 7) + 1;
  const weekMultiplier = Math.floor((streak.currentStreak - 1) / 7) + 1;
  const reward = { ...DAILY_REWARDS[dayInCycle - 1] };
  reward.soms *= weekMultiplier;
  if (reward.crystals) reward.crystals *= weekMultiplier;
  
  // Начисляем награды
  const player = await Player.findById(playerId);
  player.soms += reward.soms;
  if (reward.crystals) player.donationCurrency += reward.crystals;
  
  for (const milestone of milestoneRewards) {
    player.soms += milestone.soms;
    player.donationCurrency += milestone.crystals;
    if (milestone.title) {
      if (!player.titles) player.titles = [];
      player.titles.push(milestone.title);
    }
  }
  
  await player.save();
  
  return reward;
}

async function buyStreakProtection(playerId: string): Promise<void> {
  const player = await Player.findById(playerId);
  const streak = await DailyStreak.findOne({ playerId });
  
  const cost = 100; // 100 кристаллов
  
  if (player.donationCurrency < cost) {
    throw new ValidationError('Insufficient crystals', 'INSUFFICIENT_CRYSTALS');
  }
  
  player.donationCurrency -= cost;
  streak.streakProtections++;
  
  await player.save();
  await streak.save();
}
```

## Система профессий

### Структура

```typescript
interface Profession {
  professionId: string;
  name: LocalizedString;
  description: LocalizedString;
  icon: string;
  bonuses: ProfessionBonus[];
  skills: ProfessionSkill[];
}

interface PlayerProfession {
  playerId: string;
  professionId: string;
  level: number; // 1-50
  experience: number;
  unlockedSkills: string[];
}

interface ProfessionBonus {
  type: string;
  value: number;
  description: LocalizedString;
}

interface ProfessionSkill {
  skillId: string;
  name: LocalizedString;
  description: LocalizedString;
  requiredLevel: number;
  effect: any;
}
```

### Профессии

```typescript
const PROFESSIONS: Profession[] = [
  {
    professionId: 'trader',
    name: { ru: 'Торговец', uz: 'Savdogar', uk: 'Торговець', en: 'Trader' },
    description: { ru: 'Мастер торговли и переговоров', uz: 'Savdo va muzokaralar ustasi', uk: 'Майстер торгівлі', en: 'Master of trade' },
    icon: 'trader.png',
    bonuses: [
      { type: 'market_commission', value: -10, description: { ru: '-10% комиссия на рынке' } },
      { type: 'trade_profit', value: 20, description: { ru: '+20% прибыль от торговли' } },
      { type: 'bargain', value: 15, description: { ru: '+15% шанс выгодной сделки' } }
    ],
    skills: [
      {
        skillId: 'bulk_discount',
        name: { ru: 'Оптовая скидка' },
        description: { ru: 'Покупка 10+ предметов дает скидку 20%' },
        requiredLevel: 10,
        effect: { bulk_discount: 20 }
      },
      {
        skillId: 'market_insight',
        name: { ru: 'Чутье рынка' },
        description: { ru: 'Видите рекомендуемые цены всех предметов' },
        requiredLevel: 20,
        effect: { show_prices: true }
      },
      {
        skillId: 'trade_master',
        name: { ru: 'Мастер торговли' },
        description: { ru: 'Можете выставлять 20 лотов вместо 10' },
        requiredLevel: 30,
        effect: { max_listings: 20 }
      }
    ]
  },
  {
    professionId: 'craftsman',
    name: { ru: 'Ремесленник', uz: 'Hunarmand', uk: 'Ремісник', en: 'Craftsman' },
    description: { ru: 'Мастер создания предметов', uz: 'Buyumlar yaratish ustasi', uk: 'Майстер створення предметів', en: 'Master of crafting' },
    icon: 'craftsman.png',
    bonuses: [
      { type: 'crafting_speed', value: -30, description: { ru: '-30% время крафтинга' } },
      { type: 'quality_chance', value: 10, description: { ru: '+10% шанс создать улучшенный предмет' } },
      { type: 'material_save', value: 15, description: { ru: '15% шанс не потратить материалы' } }
    ],
    skills: [
      {
        skillId: 'mass_production',
        name: { ru: 'Массовое производство' },
        description: { ru: 'Можете крафтить до 10 предметов за раз' },
        requiredLevel: 15,
        effect: { batch_crafting: 10 }
      },
      {
        skillId: 'master_craftsman',
        name: { ru: 'Мастер-ремесленник' },
        description: { ru: 'Доступ к эксклюзивным рецептам' },
        requiredLevel: 25,
        effect: { exclusive_recipes: true }
      }
    ]
  },
  {
    professionId: 'warrior',
    name: { ru: 'Воин', uz: 'Jangchi', uk: 'Воїн', en: 'Warrior' },
    description: { ru: 'Мастер боя', uz: 'Jang ustasi', uk: 'Майстер бою', en: 'Master of combat' },
    icon: 'warrior.png',
    bonuses: [
      { type: 'pvp_damage', value: 15, description: { ru: '+15% урон в PvP' } },
      { type: 'max_health', value: 10, description: { ru: '+10% здоровье' } },
      { type: 'crit_chance', value: 5, description: { ru: '+5% шанс крита' } }
    ],
    skills: [
      {
        skillId: 'battle_rage',
        name: { ru: 'Боевая ярость' },
        description: { ru: '+30% урон на 10 секунд после убийства' },
        requiredLevel: 12,
        effect: { rage_bonus: 30, duration: 10 }
      },
      {
        skillId: 'last_stand',
        name: { ru: 'Последний рубеж' },
        description: { ru: 'При здоровье <20% получаете +50% защиты' },
        requiredLevel: 25,
        effect: { last_stand_defense: 50 }
      }
    ]
  },
  {
    professionId: 'gatherer',
    name: { ru: 'Собиратель', uz: 'Yig\'uvchi', uk: 'Збирач', en: 'Gatherer' },
    description: { ru: 'Мастер поиска ресурсов', uz: 'Resurslar topish ustasi', uk: 'Майстер пошуку ресурсів', en: 'Master of gathering' },
    icon: 'gatherer.png',
    bonuses: [
      { type: 'rare_find', value: 50, description: { ru: '+50% шанс найти редкие ресурсы' } },
      { type: 'gather_amount', value: 20, description: { ru: '+20% количество ресурсов' } },
      { type: 'gather_speed', value: -25, description: { ru: '-25% время собирательства' } }
    ],
    skills: [
      {
        skillId: 'treasure_hunter',
        name: { ru: 'Охотник за сокровищами' },
        description: { ru: '10% шанс найти сундук с сокровищами' },
        requiredLevel: 18,
        effect: { treasure_chance: 10 }
      },
      {
        skillId: 'sixth_sense',
        name: { ru: 'Шестое чувство' },
        description: { ru: 'Видите редкие ресурсы на карте' },
        requiredLevel: 30,
        effect: { show_rare_resources: true }
      }
    ]
  },
  {
    professionId: 'cook',
    name: { ru: 'Повар', uz: 'Oshpaz', uk: 'Кухар', en: 'Cook' },
    description: { ru: 'Мастер кулинарии', uz: 'Oshpazlik ustasi', uk: 'Майстер кулінарії', en: 'Master of cooking' },
    icon: 'cook.png',
    bonuses: [
      { type: 'food_effect', value: 50, description: { ru: '+50% эффект от еды' } },
      { type: 'cooking_speed', value: -40, description: { ru: '-40% время готовки' } },
      { type: 'food_duration', value: 100, description: { ru: '+100% длительность эффектов еды' } }
    ],
    skills: [
      {
        skillId: 'master_chef',
        name: { ru: 'Шеф-повар' },
        description: { ru: 'Доступ к эксклюзивным рецептам блюд' },
        requiredLevel: 15,
        effect: { exclusive_recipes: true }
      },
      {
        skillId: 'gourmet',
        name: { ru: 'Гурман' },
        description: { ru: 'Еда дает дополнительно +25% опыт на 1 час' },
        requiredLevel: 35,
        effect: { food_exp_bonus: 25, duration: 3600 }
      }
    ]
  }
];
```

### Прокачка профессии

```typescript
async function gainProfessionExperience(playerId: string, amount: number): Promise<void> {
  const playerProf = await PlayerProfession.findOne({ playerId });
  
  if (!playerProf) return;
  
  playerProf.experience += amount;
  
  // Формула опыта для профессии
  const requiredExp = 1000 * Math.pow(1.3, playerProf.level - 1);
  
  if (playerProf.experience >= requiredExp) {
    playerProf.level++;
    playerProf.experience -= requiredExp;
    
    // Разблокировка навыков
    const profession = PROFESSIONS.find(p => p.professionId === playerProf.professionId);
    const newSkills = profession.skills.filter(s => 
      s.requiredLevel === playerProf.level && 
      !playerProf.unlockedSkills.includes(s.skillId)
    );
    
    for (const skill of newSkills) {
      playerProf.unlockedSkills.push(skill.skillId);
    }
  }
  
  await playerProf.save();
}
```

