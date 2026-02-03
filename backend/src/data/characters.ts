/**
 * Character Class System - REAL GAME MECHANICS ONLY
 * 
 * TIER 1 (Level 1+): Starter classes
 * TIER 2 (Level 15+): Advanced classes with unique abilities
 * TIER 3 (Level 35+): Master classes
 * 
 * REAL MODIFIERS THAT WORK:
 * - incomeBonus: % к заработку сомов
 * - experienceBonus: % к получению опыта
 * - shopDiscount: % скидка в магазине
 * - inventoryBonus: дополнительные слоты
 * - crystalBonus: % к получению кристаллов
 * - maxHealthBonus: % к максимальному здоровью
 * - energyRecovery: % к восстановлению энергии
 * - hungerDrain: % БЫСТРЕЕ падает голод
 * - energyDrain: % БЫСТРЕЕ падает энергия
 * - healthDrain: % БЫСТРЕЕ падает здоровье
 * - foodRecovery: % к восстановлению от еды
 * - healthFromFood: % к здоровью от еды
 * - moodFromFood: % к настроению от еды
 * - moodFromWork: % к настроению от работы
 * - activityDuration: % МЕНЬШЕ времени (негатив = быстрее)
 * - cooldownReduction: % МЕНЬШЕ кулдаун
 */

export const STARTER_CLASSES = [
  {
    id: 'char_trader',
    avatar: '🤝',
    tier: 1,
    requiredLevel: 1,
    name: {
      ru: 'Торговец',
      uz: 'Savdogar',
      uk: 'Торговець',
      en: 'Trader',
    },
    description: {
      ru: 'Начинающий торговец на базаре',
      uz: 'Bozorda boshlang\'ich savdogar',
      uk: 'Початківець торговець на базарі',
      en: 'Novice bazaar trader',
    },
    strengths: {
      ru: '💰 +12% заработок\n🛒 -8% цены\n📦 +3 слота',
      uz: '💰 +12% daromad\n🛒 -8% narxlar\n📦 +3 slot',
      uk: '💰 +12% заробіток\n🛒 -8% ціни\n📦 +3 слоти',
      en: '💰 +12% income\n🛒 -8% prices\n📦 +3 slots',
    },
    weaknesses: {
      ru: '⚡ Энергия -8% быстрее\n🍖 Голод -5% быстрее',
      uz: '⚡ Energiya -8% tezroq\n🍖 Ochlik -5% tezroq',
      uk: '⚡ Енергія -8% швидше\n🍖 Голод -5% швидше',
      en: '⚡ Energy -8% faster\n🍖 Hunger -5% faster',
    },
    statModifiers: {
      incomeBonus: 12,
      shopDiscount: 8,
      inventoryBonus: 3,
      energyDrain: 8,
      hungerDrain: 5,
    },
    uniqueAbility: null,
  },
  {
    id: 'char_worker',
    avatar: '💪',
    tier: 1,
    requiredLevel: 1,
    name: {
      ru: 'Работник',
      uz: 'Ishchi',
      uk: 'Робітник',
      en: 'Worker',
    },
    description: {
      ru: 'Крепкий работяга',
      uz: 'Mustahkam ishchi',
      uk: 'Міцний робітник',
      en: 'Strong worker',
    },
    strengths: {
      ru: '❤️ +12% здоровье\n⚡ +10% энергия\n😊 +8% настроение',
      uz: '❤️ +12% salomatlik\n⚡ +10% energiya\n😊 +8% kayfiyat',
      uk: '❤️ +12% здоров\'я\n⚡ +10% енергія\n😊 +8% настрій',
      en: '❤️ +12% health\n⚡ +10% energy\n😊 +8% mood',
    },
    weaknesses: {
      ru: '🍖 Голод -12% быстрее\n💰 -5% заработок',
      uz: '🍖 Ochlik -12% tezroq\n💰 -5% daromad',
      uk: '🍖 Голод -12% швидше\n💰 -5% заробіток',
      en: '🍖 Hunger -12% faster\n💰 -5% income',
    },
    statModifiers: {
      maxHealthBonus: 12,
      energyRecovery: 10,
      moodFromWork: 8,
      hungerDrain: 12,
      incomeBonus: -5,
    },
    uniqueAbility: null,
  },
  {
    id: 'char_student',
    avatar: '📚',
    tier: 1,
    requiredLevel: 1,
    name: {
      ru: 'Студент',
      uz: 'Talaba',
      uk: 'Студент',
      en: 'Student',
    },
    description: {
      ru: 'Любознательный студент',
      uz: 'Qiziquvchan talaba',
      uk: 'Допитливий студент',
      en: 'Curious student',
    },
    strengths: {
      ru: '✨ +18% опыт\n⚡ +8% энергия\n⏱️ -10% время',
      uz: '✨ +18% tajriba\n⚡ +8% energiya\n⏱️ -10% vaqt',
      uk: '✨ +18% досвід\n⚡ +8% енергія\n⏱️ -10% час',
      en: '✨ +18% XP\n⚡ +8% energy\n⏱️ -10% time',
    },
    weaknesses: {
      ru: '❤️ -8% здоровье\n💰 -10% заработок',
      uz: '❤️ -8% salomatlik\n💰 -10% daromad',
      uk: '❤️ -8% здоров\'я\n💰 -10% заробіток',
      en: '❤️ -8% health\n💰 -10% income',
    },
    statModifiers: {
      experienceBonus: 18,
      energyRecovery: 8,
      activityDuration: -10,
      maxHealthBonus: -8,
      incomeBonus: -10,
    },
    uniqueAbility: null,
  },
  {
    id: 'char_cook',
    avatar: '👨‍🍳',
    tier: 1,
    requiredLevel: 1,
    name: {
      ru: 'Повар',
      uz: 'Oshpaz',
      uk: 'Кухар',
      en: 'Cook',
    },
    description: {
      ru: 'Талантливый повар',
      uz: 'Iste\'dodli oshpaz',
      uk: 'Талановитий кухар',
      en: 'Talented cook',
    },
    strengths: {
      ru: '🍽️ +22% от еды\n❤️ +12% здоровье\n😊 +10% настроение',
      uz: '🍽️ +22% ovqatdan\n❤️ +12% salomatlik\n😊 +10% kayfiyat',
      uk: '🍽️ +22% від їжі\n❤️ +12% здоров\'я\n😊 +10% настрій',
      en: '🍽️ +22% from food\n❤️ +12% health\n😊 +10% mood',
    },
    weaknesses: {
      ru: '💰 -12% заработок\n⚡ Энергия -5% быстрее',
      uz: '💰 -12% daromad\n⚡ Energiya -5% tezroq',
      uk: '💰 -12% заробіток\n⚡ Енергія -5% швидше',
      en: '💰 -12% income\n⚡ Energy -5% faster',
    },
    statModifiers: {
      foodRecovery: 22,
      healthFromFood: 12,
      moodFromFood: 10,
      incomeBonus: -12,
      energyDrain: 5,
    },
    uniqueAbility: null,
  },
  {
    id: 'char_craftsman',
    avatar: '🔨',
    tier: 1,
    requiredLevel: 1,
    name: {
      ru: 'Ремесленник',
      uz: 'Hunarmand',
      uk: 'Ремісник',
      en: 'Craftsman',
    },
    description: {
      ru: 'Умелый мастер',
      uz: 'Mohir usta',
      uk: 'Вмілий майстер',
      en: 'Skilled craftsman',
    },
    strengths: {
      ru: '🛒 -15% цены\n😊 +12% настроение\n📦 +2 слота',
      uz: '🛒 -15% narxlar\n😊 +12% kayfiyat\n📦 +2 slot',
      uk: '🛒 -15% ціни\n😊 +12% настрій\n📦 +2 слоти',
      en: '🛒 -15% prices\n😊 +12% mood\n📦 +2 slots',
    },
    weaknesses: {
      ru: '⏱️ +8% время\n🍽️ -8% от еды',
      uz: '⏱️ +8% vaqt\n🍽️ -8% ovqatdan',
      uk: '⏱️ +8% час\n🍽️ -8% від їжі',
      en: '⏱️ +8% time\n🍽️ -8% from food',
    },
    statModifiers: {
      shopDiscount: 15,
      moodFromWork: 12,
      inventoryBonus: 2,
      activityDuration: 8,
      foodRecovery: -8,
    },
    uniqueAbility: null,
  },
];

export const ADVANCED_CLASSES = [
  {
    id: 'char_merchant',
    avatar: '💼',
    tier: 2,
    requiredLevel: 15,
    name: {
      ru: 'Купец',
      uz: 'Savdogar',
      uk: 'Купець',
      en: 'Merchant',
    },
    description: {
      ru: 'Опытный купец',
      uz: 'Tajribali savdogar',
      uk: 'Досвідчений купець',
      en: 'Experienced merchant',
    },
    strengths: {
      ru: '💰 +28% заработок\n🛒 -18% цены\n📦 +8 слотов\n💎 +15% кристаллы',
      uz: '💰 +28% daromad\n🛒 -18% narxlar\n📦 +8 slot\n💎 +15% kristallar',
      uk: '💰 +28% заробіток\n🛒 -18% ціни\n📦 +8 слотів\n💎 +15% кристали',
      en: '💰 +28% income\n🛒 -18% prices\n📦 +8 slots\n💎 +15% crystals',
    },
    weaknesses: {
      ru: '⚡ Энергия -18% быстрее\n🍖 Голод -15% быстрее\n❤️ Здоровье -10% быстрее',
      uz: '⚡ Energiya -18% tezroq\n🍖 Ochlik -15% tezroq\n❤️ Salomatlik -10% tezroq',
      uk: '⚡ Енергія -18% швидше\n🍖 Голод -15% швидше\n❤️ Здоров\'я -10% швидше',
      en: '⚡ Energy -18% faster\n🍖 Hunger -15% faster\n❤️ Health -10% faster',
    },
    statModifiers: {
      incomeBonus: 28,
      shopDiscount: 18,
      inventoryBonus: 8,
      crystalBonus: 15,
      energyDrain: 18,
      hungerDrain: 15,
      healthDrain: 10,
    },
    uniqueAbility: 'market_insight',
    uniqueAbilityDescription: {
      ru: '🔮 Рыночное чутье: Раз в день продай предмет за x2',
      uz: '🔮 Bozor sezgisi: Kuniga bir marta narsani x2 narxda soting',
      uk: '🔮 Ринкове чуття: Раз на день продай предмет за x2',
      en: '🔮 Market Insight: Once per day, sell item for x2',
    },
  },
  {
    id: 'char_warrior',
    avatar: '⚔️',
    tier: 2,
    requiredLevel: 15,
    name: {
      ru: 'Воин',
      uz: 'Jangchi',
      uk: 'Воїн',
      en: 'Warrior',
    },
    description: {
      ru: 'Закаленный боец',
      uz: 'Qotib qolgan jangchi',
      uk: 'Загартований боєць',
      en: 'Hardened fighter',
    },
    strengths: {
      ru: '❤️ +25% здоровье\n⚡ +20% энергия\n😊 +15% настроение',
      uz: '❤️ +25% salomatlik\n⚡ +20% energiya\n😊 +15% kayfiyat',
      uk: '❤️ +25% здоров\'я\n⚡ +20% енергія\n😊 +15% настрій',
      en: '❤️ +25% health\n⚡ +20% energy\n😊 +15% mood',
    },
    weaknesses: {
      ru: '🍽️ -30% от еды\n🍖 Голод -40% быстрее\n💰 -15% заработок',
      uz: '🍽️ -30% ovqatdan\n🍖 Ochlik -40% tezroq\n💰 -15% daromad',
      uk: '🍽️ -30% від їжі\n🍖 Голод -40% швидше\n💰 -15% заробіток',
      en: '🍽️ -30% from food\n🍖 Hunger -40% faster\n💰 -15% income',
    },
    statModifiers: {
      maxHealthBonus: 25,
      energyRecovery: 20,
      moodFromWork: 15,
      foodRecovery: -30,
      hungerDrain: 40,
      incomeBonus: -15,
    },
    uniqueAbility: 'battle_fury',
    uniqueAbilityDescription: {
      ru: '⚡ Боевая ярость: При HP<30% +50% энергия',
      uz: '⚡ Jang g\'azabi: HP<30% bo\'lganda +50% energiya',
      uk: '⚡ Бойова лють: При HP<30% +50% енергія',
      en: '⚡ Battle Fury: Below 30% HP +50% energy',
    },
  },
  {
    id: 'char_scholar',
    avatar: '🎓',
    tier: 2,
    requiredLevel: 15,
    name: {
      ru: 'Ученый',
      uz: 'Olim',
      uk: 'Вчений',
      en: 'Scholar',
    },
    description: {
      ru: 'Мудрец и исследователь',
      uz: 'Donishmand va tadqiqotchi',
      uk: 'Мудрець і дослідник',
      en: 'Sage and researcher',
    },
    strengths: {
      ru: '✨ +35% опыт\n⚡ +28% энергия\n⏱️ -15% время\n🎲 +20% шанс x2 опыта',
      uz: '✨ +35% tajriba\n⚡ +28% energiya\n⏱️ -15% vaqt\n🎲 +20% x2 tajriba imkoniyati',
      uk: '✨ +35% досвід\n⚡ +28% енергія\n⏱️ -15% час\n🎲 +20% шанс x2 досвіду',
      en: '✨ +35% XP\n⚡ +28% energy\n⏱️ -15% time\n🎲 +20% x2 XP chance',
    },
    weaknesses: {
      ru: '❤️ -25% здоровье\n🤕 Здоровье -25% быстрее\n💰 -12% заработок',
      uz: '❤️ -25% salomatlik\n🤕 Salomatlik -25% tezroq\n💰 -12% daromad',
      uk: '❤️ -25% здоров\'я\n🤕 Здоров\'я -25% швидше\n💰 -12% заробіток',
      en: '❤️ -25% health\n🤕 Health -25% faster\n💰 -12% income',
    },
    statModifiers: {
      experienceBonus: 35,
      energyRecovery: 28,
      activityDuration: -15,
      doubleXpChance: 20,
      maxHealthBonus: -25,
      healthDrain: 25,
      incomeBonus: -12,
    },
    uniqueAbility: 'eureka',
    uniqueAbilityDescription: {
      ru: '💡 Эврика!: Каждые 10 активностей +100% опыт',
      uz: '💡 Evrika!: Har 10 faoliyatdan keyin +100% tajriba',
      uk: '💡 Еврика!: Кожні 10 активностей +100% досвід',
      en: '💡 Eureka!: Every 10 activities +100% XP',
    },
  },
  {
    id: 'char_master_chef',
    avatar: '👨‍🍳',
    tier: 2,
    requiredLevel: 15,
    name: {
      ru: 'Шеф-повар',
      uz: 'Bosh oshpaz',
      uk: 'Шеф-кухар',
      en: 'Master Chef',
    },
    description: {
      ru: 'Мастер кулинарии',
      uz: 'Oshpazlik ustasi',
      uk: 'Майстер кулінарії',
      en: 'Culinary master',
    },
    strengths: {
      ru: '🍽️ +45% от еды\n❤️ +30% здоровье\n😊 +25% настроение\n🛒 -20% еда',
      uz: '🍽️ +45% ovqatdan\n❤️ +30% salomatlik\n😊 +25% kayfiyat\n🛒 -20% ovqat',
      uk: '🍽️ +45% від їжі\n❤️ +30% здоров\'я\n😊 +25% настрій\n🛒 -20% їжа',
      en: '🍽️ +45% from food\n❤️ +30% health\n😊 +25% mood\n🛒 -20% food',
    },
    weaknesses: {
      ru: '💰 -25% заработок\n⚡ Энергия -10% быстрее\n🍖 Голод -20% быстрее',
      uz: '💰 -25% daromad\n⚡ Energiya -10% tezroq\n🍖 Ochlik -20% tezroq',
      uk: '💰 -25% заробіток\n⚡ Енергія -10% швидше\n🍖 Голод -20% швидше',
      en: '💰 -25% income\n⚡ Energy -10% faster\n🍖 Hunger -20% faster',
    },
    statModifiers: {
      foodRecovery: 45,
      healthFromFood: 30,
      moodFromFood: 25,
      foodDiscount: 20,
      incomeBonus: -25,
      energyDrain: 10,
      hungerDrain: 20,
    },
    uniqueAbility: 'feast',
    uniqueAbilityDescription: {
      ru: '🍜 Пир: Раз в день съешь еду и восстанови все статы до 100%',
      uz: '🍜 Ziyofat: Kuniga bir marta ovqat yeb barcha statlarni 100% gacha tiklang',
      uk: '🍜 Бенкет: Раз на день з\'їж їжу і віднови всі стати до 100%',
      en: '🍜 Feast: Once per day, eat food and restore all stats to 100%',
    },
  },
  {
    id: 'char_master_artisan',
    avatar: '⚒️',
    tier: 2,
    requiredLevel: 15,
    name: {
      ru: 'Мастер-ремесленник',
      uz: 'Usta hunarmand',
      uk: 'Майстер-ремісник',
      en: 'Master Artisan',
    },
    description: {
      ru: 'Легендарный мастер',
      uz: 'Afsonaviy usta',
      uk: 'Легендарний майстер',
      en: 'Legendary craftsman',
    },
    strengths: {
      ru: '🛒 -25% цены\n😊 +35% настроение\n📦 +6 слотов\n⏱️ -10% кулдаун',
      uz: '🛒 -25% narxlar\n😊 +35% kayfiyat\n📦 +6 slot\n⏱️ -10% kuldaun',
      uk: '🛒 -25% ціни\n😊 +35% настрій\n📦 +6 слотів\n⏱️ -10% кулдаун',
      en: '🛒 -25% prices\n😊 +35% mood\n📦 +6 slots\n⏱️ -10% cooldown',
    },
    weaknesses: {
      ru: '⏱️ +15% время\n🍽️ -20% от еды\n💰 -10% заработок',
      uz: '⏱️ +15% vaqt\n🍽️ -20% ovqatdan\n💰 -10% daromad',
      uk: '⏱️ +15% час\n🍽️ -20% від їжі\n💰 -10% заробіток',
      en: '⏱️ +15% time\n🍽️ -20% from food\n💰 -10% income',
    },
    statModifiers: {
      shopDiscount: 25,
      moodFromWork: 35,
      inventoryBonus: 6,
      cooldownReduction: 10,
      activityDuration: 15,
      foodRecovery: -20,
      incomeBonus: -10,
    },
    uniqueAbility: 'masterwork',
    uniqueAbilityDescription: {
      ru: '⭐ Шедевр: 10% шанс получить x2 награду',
      uz: '⭐ She\'devr: 10% imkoniyat x2 mukofot olish',
      uk: '⭐ Шедевр: 10% шанс отримати x2 нагороду',
      en: '⭐ Masterwork: 10% chance to get x2 reward',
    },
  },
];

export const MASTER_CLASSES = [
  {
    id: 'char_tycoon',
    avatar: '👑',
    tier: 3,
    requiredLevel: 35,
    name: {
      ru: 'Магнат',
      uz: 'Magnate',
      uk: 'Магнат',
      en: 'Tycoon',
    },
    description: {
      ru: 'Король бизнеса',
      uz: 'Biznes qiroli',
      uk: 'Король бізнесу',
      en: 'Business king',
    },
    strengths: {
      ru: '💰 +50% заработок\n🛒 -30% цены\n📦 +15 слотов\n💎 +35% кристаллы\n🏪 -20% все покупки',
      uz: '💰 +50% daromad\n🛒 -30% narxlar\n📦 +15 slot\n💎 +35% kristallar\n🏪 -20% barcha xaridlar',
      uk: '💰 +50% заробіток\n🛒 -30% ціни\n📦 +15 слотів\n💎 +35% кристали\n🏪 -20% всі покупки',
      en: '💰 +50% income\n🛒 -30% prices\n📦 +15 slots\n💎 +35% crystals\n🏪 -20% all purchases',
    },
    weaknesses: {
      ru: '⚡ Энергия -30% быстрее\n❤️ Здоровье -20% быстрее\n🍖 Голод -25% быстрее',
      uz: '⚡ Energiya -30% tezroq\n❤️ Salomatlik -20% tezroq\n🍖 Ochlik -25% tezroq',
      uk: '⚡ Енергія -30% швидше\n❤️ Здоров\'я -20% швидше\n🍖 Голод -25% швидше',
      en: '⚡ Energy -30% faster\n❤️ Health -20% faster\n🍖 Hunger -25% faster',
    },
    statModifiers: {
      incomeBonus: 50,
      shopDiscount: 30,
      inventoryBonus: 15,
      crystalBonus: 35,
      allPurchaseDiscount: 20,
      energyDrain: 30,
      maxHealthBonus: -20,
      hungerDrain: 25,
    },
    uniqueAbility: 'golden_touch',
    uniqueAbilityDescription: {
      ru: '✨ Золотое касание: Каждая 5-я активность приносит x3 дохода',
      uz: '✨ Oltin teginish: Har 5-faoliyat x3 daromad keltiradi',
      uk: '✨ Золотий дотик: Кожна 5-та активність приносить x3 доходу',
      en: '✨ Golden Touch: Every 5th activity brings x3 income',
    },
  },
  {
    id: 'char_legend',
    avatar: '🗡️',
    tier: 3,
    requiredLevel: 35,
    name: {
      ru: 'Легенда',
      uz: 'Afsona',
      uk: 'Легенда',
      en: 'Legend',
    },
    description: {
      ru: 'Живая легенда',
      uz: 'Tirik afsona',
      uk: 'Жива легенда',
      en: 'Living legend',
    },
    strengths: {
      ru: '❤️ +45% здоровье\n⚡ +40% энергия\n😊 +30% настроение\n⏱️ -20% время',
      uz: '❤️ +45% salomatlik\n⚡ +40% energiya\n😊 +30% kayfiyat\n⏱️ -20% vaqt',
      uk: '❤️ +45% здоров\'я\n⚡ +40% енергія\n😊 +30% настрій\n⏱️ -20% час',
      en: '❤️ +45% health\n⚡ +40% energy\n😊 +30% mood\n⏱️ -20% time',
    },
    weaknesses: {
      ru: '🍽️ -45% от еды\n🍖 Голод -60% быстрее\n💰 -20% заработок',
      uz: '🍽️ -45% ovqatdan\n🍖 Ochlik -60% tezroq\n💰 -20% daromad',
      uk: '🍽️ -45% від їжі\n🍖 Голод -60% швидше\n💰 -20% заробіток',
      en: '🍽️ -45% from food\n🍖 Hunger -60% faster\n💰 -20% income',
    },
    statModifiers: {
      maxHealthBonus: 45,
      energyRecovery: 40,
      moodFromWork: 30,
      activityDuration: -20,
      foodRecovery: -45,
      hungerDrain: 60,
      incomeBonus: -20,
    },
    uniqueAbility: 'immortal_will',
    uniqueAbilityDescription: {
      ru: '💀 Бессмертная воля: При смертельном уроне остаешься с 1 HP раз в день',
      uz: '💀 O\'lmas iroda: O\'limga olib keladigan zarardan kuniga bir marta 1 HP bilan qolasiz',
      uk: '💀 Безсмертна воля: При смертельному уроні залишаєшся з 1 HP раз на день',
      en: '💀 Immortal Will: Survive lethal damage with 1 HP once per day',
    },
  },
  {
    id: 'char_sage',
    avatar: '🧙',
    tier: 3,
    requiredLevel: 35,
    name: {
      ru: 'Мудрец',
      uz: 'Donishmand',
      uk: 'Мудрець',
      en: 'Sage',
    },
    description: {
      ru: 'Великий мудрец',
      uz: 'Buyuk donishmand',
      uk: 'Великий мудрець',
      en: 'Great sage',
    },
    strengths: {
      ru: '✨ +60% опыт\n⚡ +45% энергия\n⏱️ -25% время\n🎲 +30% шанс x2 опыта\n⏱️ -15% кулдаун',
      uz: '✨ +60% tajriba\n⚡ +45% energiya\n⏱️ -25% vaqt\n🎲 +30% x2 tajriba\n⏱️ -15% kuldaun',
      uk: '✨ +60% досвід\n⚡ +45% енергія\n⏱️ -25% час\n🎲 +30% шанс x2 досвіду\n⏱️ -15% кулдаун',
      en: '✨ +60% XP\n⚡ +45% energy\n⏱️ -25% time\n🎲 +30% x2 XP\n⏱️ -15% cooldown',
    },
    weaknesses: {
      ru: '❤️ -40% здоровье\n🤕 Здоровье -40% быстрее\n💰 -25% заработок\n🍖 Голод -20% быстрее',
      uz: '❤️ -40% salomatlik\n🤕 Salomatlik -40% tezroq\n💰 -25% daromad\n🍖 Ochlik -20% tezroq',
      uk: '❤️ -40% здоров\'я\n🤕 Здоров\'я -40% швидше\n💰 -25% заробіток\n🍖 Голод -20% швидше',
      en: '❤️ -40% health\n🤕 Health -40% faster\n💰 -25% income\n🍖 Hunger -20% faster',
    },
    statModifiers: {
      experienceBonus: 60,
      energyRecovery: 45,
      activityDuration: -25,
      doubleXpChance: 30,
      cooldownReduction: 15,
      maxHealthBonus: -40,
      healthDrain: 40,
      incomeBonus: -25,
      hungerDrain: 20,
    },
    uniqueAbility: 'time_warp',
    uniqueAbilityDescription: {
      ru: '⏰ Искажение времени: Раз в день мгновенно завершить любую активность',
      uz: '⏰ Vaqt buzilishi: Kuniga bir marta har qanday faoliyatni bir zumda tugatish',
      uk: '⏰ Викривлення часу: Раз на день миттєво завершити будь-яку активність',
      en: '⏰ Time Warp: Once per day, instantly complete any activity',
    },
  },
];

export const ALL_CLASSES = [
  ...STARTER_CLASSES,
  ...ADVANCED_CLASSES,
  ...MASTER_CLASSES,
];

export const CHARACTERS = STARTER_CLASSES;
