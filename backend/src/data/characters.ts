/**
 * Character Class System with Progression Tiers
 * 
 * TIER 1 (Level 1+): Starter classes - balanced for beginners
 * TIER 2 (Level 20+): Advanced classes - specialized roles  
 * TIER 3 (Level 50+): Master classes - powerful but demanding
 * 
 * Class change available at levels: 20, 50
 * Cost: 5000 soms + 100 crystals per change
 */

/**
 * TIER 1: Starter Classes (Level 1+)
 * Balanced for new players - moderate bonuses/penalties
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
      ru: 'Начинающий торговец. Хорошо зарабатывает, но быстро устает',
      uz: 'Boshlang\'ich savdogar. Yaxshi daromad topadi, lekin tez charchaydi',
      uk: 'Початківець торговець. Добре заробляє, але швидко втомлюється',
      en: 'Novice trader. Earns well but tires quickly',
    },
    strengths: {
      ru: '💰 +15% заработок\n🛒 -10% цены в магазинах',
      uz: '💰 +15% daromad\n🛒 -10% do\'kon narxlari',
      uk: '💰 +15% заробіток\n🛒 -10% ціни в магазинах',
      en: '💰 +15% income\n🛒 -10% shop prices',
    },
    weaknesses: {
      ru: '⚡ -10% восстановление энергии',
      uz: '⚡ -10% energiya tiklanishi',
      uk: '⚡ -10% відновлення енергії',
      en: '⚡ -10% energy recovery',
    },
    statModifiers: {
      incomeBonus: 15,
      shopDiscount: 10,
      energyRecovery: -10,
    },
    uniqueAbility: 'bazaar_trading',
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
      ru: 'Крепкий работяга. Выносливый и здоровый, но ест много',
      uz: 'Mustahkam ishchi. Chidamli va sog\'lom, lekin ko\'p ovqatlanadi',
      uk: 'Міцний робітник. Витривалий і здоровий, але їсть багато',
      en: 'Strong worker. Resilient and healthy but eats a lot',
    },
    strengths: {
      ru: '❤️ +15% максимальное здоровье\n⚡ +10% восстановление энергии',
      uz: '❤️ +15% maksimal salomatlik\n⚡ +10% energiya tiklanishi',
      uk: '❤️ +15% максимальне здоров\'я\n⚡ +10% відновлення енергії',
      en: '❤️ +15% max health\n⚡ +10% energy recovery',
    },
    weaknesses: {
      ru: '🍖 Голод падает на 15% быстрее',
      uz: '🍖 Ochlik 15% tezroq tushadi',
      uk: '🍖 Голод падає на 15% швидше',
      en: '🍖 Hunger drains 15% faster',
    },
    statModifiers: {
      maxHealthBonus: 15,
      energyRecovery: 10,
      hungerDrain: 15,
    },
    uniqueAbility: 'overtime_work',
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
      ru: 'Любознательный студент. Быстро учится, но слаб физически',
      uz: 'Qiziquvchan talaba. Tez o\'rganadi, lekin jismonan zaif',
      uk: 'Допитливий студент. Швидко вчиться, але слабкий фізично',
      en: 'Curious student. Learns fast but physically weak',
    },
    strengths: {
      ru: '✨ +20% получение опыта\n📖 -15% время обучения',
      uz: '✨ +20% tajriba olish\n📖 -15% o\'rganish vaqti',
      uk: '✨ +20% отримання досвіду\n📖 -15% час навчання',
      en: '✨ +20% experience gain\n📖 -15% learning time',
    },
    weaknesses: {
      ru: '❤️ -10% максимальное здоровье',
      uz: '❤️ -10% maksimal salomatlik',
      uk: '❤️ -10% максимальне здоров\'я',
      en: '❤️ -10% max health',
    },
    statModifiers: {
      experienceBonus: 20,
      learningSpeed: 15,
      maxHealthBonus: -10,
    },
    uniqueAbility: 'fast_learning',
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
      ru: 'Талантливый повар. Еда восстанавливает больше, но зарабатывает меньше',
      uz: 'Iste\'dodli oshpaz. Ovqat ko\'proq tiklaydi, lekin kamroq topadi',
      uk: 'Талановитий кухар. Їжа відновлює більше, але заробляє менше',
      en: 'Talented cook. Food restores more but earns less',
    },
    strengths: {
      ru: '🍽️ +25% восстановление от еды\n🍲 -20% время готовки',
      uz: '🍽️ +25% ovqatdan tiklanish\n🍲 -20% pishirish vaqti',
      uk: '🍽️ +25% відновлення від їжі\n🍲 -20% час готування',
      en: '🍽️ +25% food recovery\n🍲 -20% cooking time',
    },
    weaknesses: {
      ru: '💰 -15% заработок',
      uz: '💰 -15% daromad',
      uk: '💰 -15% заробіток',
      en: '💰 -15% income',
    },
    statModifiers: {
      foodRecovery: 25,
      cookingSpeed: 20,
      incomeBonus: -15,
    },
    uniqueAbility: 'special_cooking',
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
      ru: 'Умелый мастер. Крафт дешевле и быстрее, но работает медленнее',
      uz: 'Mohir usta. Kraft arzonroq va tezroq, lekin sekinroq ishlaydi',
      uk: 'Вмілий майстер. Крафт дешевше і швидше, але працює повільніше',
      en: 'Skilled craftsman. Crafting cheaper and faster but works slower',
    },
    strengths: {
      ru: '🔨 -20% стоимость крафта\n⚙️ -15% время крафта',
      uz: '🔨 -20% kraft narxi\n⚙️ -15% kraft vaqti',
      uk: '🔨 -20% вартість крафту\n⚙️ -15% час крафту',
      en: '🔨 -20% crafting cost\n⚙️ -15% crafting time',
    },
    weaknesses: {
      ru: '⏰ +10% время активностей',
      uz: '⏰ +10% faoliyat vaqti',
      uk: '⏰ +10% час активностей',
      en: '⏰ +10% activity time',
    },
    statModifiers: {
      craftingCost: -20,
      craftingSpeed: 15,
      activityTime: 10,
    },
    uniqueAbility: 'item_repair',
  },
];

/**
 * TIER 2: Advanced Classes (Level 20+)
 * Specialized roles with stronger bonuses but bigger penalties
 */
export const ADVANCED_CLASSES = [
  {
    id: 'char_merchant',
    avatar: '💼',
    tier: 2,
    requiredLevel: 20,
    name: {
      ru: 'Купец',
      uz: 'Savdogar',
      uk: 'Купець',
      en: 'Merchant',
    },
    description: {
      ru: 'Опытный купец. Мастер торговли с огромными доходами',
      uz: 'Tajribali savdogar. Katta daromadli savdo ustasi',
      uk: 'Досвідчений купець. Майстер торгівлі з величезними доходами',
      en: 'Experienced merchant. Master trader with huge income',
    },
    strengths: {
      ru: '💰 +35% заработок\n🛒 -20% цены\n📦 +10 слотов',
      uz: '💰 +35% daromad\n🛒 -20% narxlar\n📦 +10 slotlar',
      uk: '💰 +35% заробіток\n🛒 -20% ціни\n📦 +10 слотів',
      en: '💰 +35% income\n🛒 -20% prices\n📦 +10 slots',
    },
    weaknesses: {
      ru: '⚡ -20% энергия\n😴 Энергия -25% быстрее',
      uz: '⚡ -20% energiya\n😴 Energiya -25% tezroq',
      uk: '⚡ -20% енергія\n😴 Енергія -25% швидше',
      en: '⚡ -20% energy\n😴 Energy -25% faster',
    },
    statModifiers: {
      incomeBonus: 35,
      shopDiscount: 20,
      inventoryBonus: 10,
      energyRecovery: -20,
      energyDrain: 25,
    },
    uniqueAbility: 'market_manipulation',
  },
  {
    id: 'char_warrior',
    avatar: '⚔️',
    tier: 2,
    requiredLevel: 20,
    name: {
      ru: 'Воин',
      uz: 'Jangchi',
      uk: 'Воїн',
      en: 'Warrior',
    },
    description: {
      ru: 'Закаленный боец. Непобедим в бою, но прожорлив',
      uz: 'Qotib qolgan jangchi. Jangda yengilmas, lekin och',
      uk: 'Загартований боєць. Непереможний в бою, але прожерливий',
      en: 'Hardened fighter. Unbeatable in combat but hungry',
    },
    strengths: {
      ru: '❤️ +30% здоровье\n💪 +35% урон\n🛡️ +25% защита',
      uz: '❤️ +30% salomatlik\n💪 +35% zarar\n🛡️ +25% himoya',
      uk: '❤️ +30% здоров\'я\n💪 +35% урон\n🛡️ +25% захист',
      en: '❤️ +30% health\n💪 +35% damage\n🛡️ +25% defense',
    },
    weaknesses: {
      ru: '🍽️ -35% от еды\n🍖 Голод -50% быстрее',
      uz: '🍽️ -35% ovqatdan\n🍖 Ochlik -50% tezroq',
      uk: '🍽️ -35% від їжі\n🍖 Голод -50% швидше',
      en: '🍽️ -35% from food\n🍖 Hunger -50% faster',
    },
    statModifiers: {
      maxHealthBonus: 30,
      damageBonus: 35,
      defenseBonus: 25,
      foodRecovery: -35,
      hungerDrain: 50,
    },
    uniqueAbility: 'battle_rage',
  },
  {
    id: 'char_scholar',
    avatar: '🎓',
    tier: 2,
    requiredLevel: 20,
    name: {
      ru: 'Ученый',
      uz: 'Olim',
      uk: 'Вчений',
      en: 'Scholar',
    },
    description: {
      ru: 'Мудрец. Невероятная скорость обучения, но хрупкий',
      uz: 'Donishmand. Ajoyib o\'rganish tezligi, lekin zaif',
      uk: 'Мудрець. Неймовірна швидкість навчання, але крихкий',
      en: 'Sage. Incredible learning speed but fragile',
    },
    strengths: {
      ru: '✨ +40% опыт\n⚡ +35% энергия\n📖 -35% крафт',
      uz: '✨ +40% tajriba\n⚡ +35% energiya\n📖 -35% kraft',
      uk: '✨ +40% досвід\n⚡ +35% енергія\n📖 -35% крафт',
      en: '✨ +40% XP\n⚡ +35% energy\n📖 -35% craft',
    },
    weaknesses: {
      ru: '❤️ -30% здоровье\n🤕 Здоровье -30% быстрее',
      uz: '❤️ -30% salomatlik\n🤕 Salomatlik -30% tezroq',
      uk: '❤️ -30% здоров\'я\n🤕 Здоров\'я -30% швидше',
      en: '❤️ -30% health\n🤕 Health -30% faster',
    },
    statModifiers: {
      experienceBonus: 40,
      energyRecovery: 35,
      craftingSpeed: 35,
      maxHealthBonus: -30,
      healthDrain: 30,
    },
    uniqueAbility: 'instant_learning',
  },
  {
    id: 'char_master_chef',
    avatar: '👨‍🍳',
    tier: 2,
    requiredLevel: 20,
    name: {
      ru: 'Шеф-повар',
      uz: 'Bosh oshpaz',
      uk: 'Шеф-кухар',
      en: 'Master Chef',
    },
    description: {
      ru: 'Мастер кулинарии. Еда творит чудеса, но доход низкий',
      uz: 'Oshpazlik ustasi. Ovqat mo\'jiza qiladi, lekin daromad past',
      uk: 'Майстер кулінарії. Їжа творить чудеса, але дохід низький',
      en: 'Culinary master. Food works wonders but income is low',
    },
    strengths: {
      ru: '🍽️ +50% от еды\n❤️ +35% здоровье от еды\n🍲 -50% готовка',
      uz: '🍽️ +50% ovqatdan\n❤️ +35% salomatlik ovqatdan\n🍲 -50% pishirish',
      uk: '🍽️ +50% від їжі\n❤️ +35% здоров\'я від їжі\n🍲 -50% готування',
      en: '🍽️ +50% from food\n❤️ +35% health from food\n🍲 -50% cooking',
    },
    weaknesses: {
      ru: '💰 -30% заработок\n💸 +30% ингредиенты',
      uz: '💰 -30% daromad\n💸 +30% ingredientlar',
      uk: '💰 -30% заробіток\n💸 +30% інгредієнти',
      en: '💰 -30% income\n💸 +30% ingredients',
    },
    statModifiers: {
      foodRecovery: 50,
      healthFromFood: 35,
      cookingSpeed: 50,
      incomeBonus: -30,
      ingredientCost: 30,
    },
    uniqueAbility: 'legendary_dishes',
  },
  {
    id: 'char_master_artisan',
    avatar: '⚒️',
    tier: 2,
    requiredLevel: 20,
    name: {
      ru: 'Мастер-ремесленник',
      uz: 'Usta hunarmand',
      uk: 'Майстер-ремісник',
      en: 'Master Artisan',
    },
    description: {
      ru: 'Легендарный мастер. Крафт почти бесплатный, но медленный',
      uz: 'Afsonaviy usta. Kraft deyarli bepul, lekin sekin',
      uk: 'Легендарний майстер. Крафт майже безкоштовний, але повільний',
      en: 'Legendary craftsman. Crafting almost free but slow',
    },
    strengths: {
      ru: '🔨 -40% крафт\n⚙️ -30% время\n😊 +40% настроение',
      uz: '🔨 -40% kraft\n⚙️ -30% vaqt\n😊 +40% kayfiyat',
      uk: '🔨 -40% крафт\n⚙️ -30% час\n😊 +40% настрій',
      en: '🔨 -40% craft\n⚙️ -30% time\n😊 +40% mood',
    },
    weaknesses: {
      ru: '⏰ +20% активности\n🍽️ -25% от еды',
      uz: '⏰ +20% faoliyat\n🍽️ -25% ovqatdan',
      uk: '⏰ +20% активності\n🍽️ -25% від їжі',
      en: '⏰ +20% activities\n🍽️ -25% from food',
    },
    statModifiers: {
      craftingCost: -40,
      craftingSpeed: 30,
      moodFromWork: 40,
      activityTime: 20,
      foodRecovery: -25,
    },
    uniqueAbility: 'masterwork_items',
  },
];

/**
 * TIER 3: Master Classes (Level 50+)
 * Ultimate specializations - extreme bonuses and penalties
 */
export const MASTER_CLASSES = [
  {
    id: 'char_tycoon',
    avatar: '👑',
    tier: 3,
    requiredLevel: 50,
    name: {
      ru: 'Магнат',
      uz: 'Magnate',
      uk: 'Магнат',
      en: 'Tycoon',
    },
    description: {
      ru: 'Король бизнеса. Невероятные доходы, но полностью зависим от денег',
      uz: 'Biznes qiroli. Ajoyib daromad, lekin pul ga to\'liq bog\'liq',
      uk: 'Король бізнесу. Неймовірні доходи, але повністю залежний від грошей',
      en: 'Business king. Incredible income but completely money-dependent',
    },
    strengths: {
      ru: '💰 +60% заработок\n🛒 -35% цены\n📦 +20 слотов\n💎 +25% кристаллы',
      uz: '💰 +60% daromad\n🛒 -35% narxlar\n📦 +20 slotlar\n💎 +25% kristallar',
      uk: '💰 +60% заробіток\n🛒 -35% ціни\n📦 +20 слотів\n💎 +25% кристали',
      en: '💰 +60% income\n🛒 -35% prices\n📦 +20 slots\n💎 +25% crystals',
    },
    weaknesses: {
      ru: '⚡ -35% энергия\n😴 -40% быстрее\n❤️ -20% здоровье',
      uz: '⚡ -35% energiya\n😴 -40% tezroq\n❤️ -20% salomatlik',
      uk: '⚡ -35% енергія\n😴 -40% швидше\n❤️ -20% здоров\'я',
      en: '⚡ -35% energy\n😴 -40% faster\n❤️ -20% health',
    },
    statModifiers: {
      incomeBonus: 60,
      shopDiscount: 35,
      inventoryBonus: 20,
      crystalBonus: 25,
      energyRecovery: -35,
      energyDrain: 40,
      maxHealthBonus: -20,
    },
    uniqueAbility: 'monopoly',
  },
  {
    id: 'char_legend',
    avatar: '🗡️',
    tier: 3,
    requiredLevel: 50,
    name: {
      ru: 'Легенда',
      uz: 'Afsona',
      uk: 'Легенда',
      en: 'Legend',
    },
    description: {
      ru: 'Живая легенда. Непобедим в бою, но требует огромных ресурсов',
      uz: 'Tirik afsona. Jangda yengilmas, lekin katta resurs talab qiladi',
      uk: 'Жива легенда. Непереможний в бою, але потребує величезних ресурсів',
      en: 'Living legend. Invincible in battle but requires huge resources',
    },
    strengths: {
      ru: '❤️ +50% здоровье\n💪 +60% урон\n🛡️ +40% защита\n⚔️ Критический удар +20%',
      uz: '❤️ +50% salomatlik\n💪 +60% zarar\n🛡️ +40% himoya\n⚔️ Kritik zarba +20%',
      uk: '❤️ +50% здоров\'я\n💪 +60% урон\n🛡️ +40% захист\n⚔️ Критичний удар +20%',
      en: '❤️ +50% health\n💪 +60% damage\n🛡️ +40% defense\n⚔️ Critical hit +20%',
    },
    weaknesses: {
      ru: '🍽️ -50% от еды\n🍖 -70% быстрее\n💰 -20% заработок',
      uz: '🍽️ -50% ovqatdan\n🍖 -70% tezroq\n💰 -20% daromad',
      uk: '🍽️ -50% від їжі\n🍖 -70% швидше\n💰 -20% заробіток',
      en: '🍽️ -50% from food\n🍖 -70% faster\n💰 -20% income',
    },
    statModifiers: {
      maxHealthBonus: 50,
      damageBonus: 60,
      defenseBonus: 40,
      criticalChance: 20,
      foodRecovery: -50,
      hungerDrain: 70,
      incomeBonus: -20,
    },
    uniqueAbility: 'unstoppable',
  },
  {
    id: 'char_sage',
    avatar: '🧙',
    tier: 3,
    requiredLevel: 50,
    name: {
      ru: 'Мудрец',
      uz: 'Donishmand',
      uk: 'Мудрець',
      en: 'Sage',
    },
    description: {
      ru: 'Великий мудрец. Мгновенное обучение, но крайне хрупкий',
      uz: 'Buyuk donishmand. Oniy o\'rganish, lekin juda zaif',
      uk: 'Великий мудрець. Миттєве навчання, але вкрай крихкий',
      en: 'Great sage. Instant learning but extremely fragile',
    },
    strengths: {
      ru: '✨ +70% опыт\n⚡ +50% энергия\n📖 -50% крафт\n🎓 Мгновенное обучение',
      uz: '✨ +70% tajriba\n⚡ +50% energiya\n📖 -50% kraft\n🎓 Oniy o\'rganish',
      uk: '✨ +70% досвід\n⚡ +50% енергія\n📖 -50% крафт\n🎓 Миттєве навчання',
      en: '✨ +70% XP\n⚡ +50% energy\n📖 -50% craft\n🎓 Instant learning',
    },
    weaknesses: {
      ru: '❤️ -50% здоровье\n🤕 -50% быстрее\n💰 -25% заработок',
      uz: '❤️ -50% salomatlik\n🤕 -50% tezroq\n💰 -25% daromad',
      uk: '❤️ -50% здоров\'я\n🤕 -50% швидше\n💰 -25% заробіток',
      en: '❤️ -50% health\n🤕 -50% faster\n💰 -25% income',
    },
    statModifiers: {
      experienceBonus: 70,
      energyRecovery: 50,
      craftingSpeed: 50,
      instantLearning: true,
      maxHealthBonus: -50,
      healthDrain: 50,
      incomeBonus: -25,
    },
    uniqueAbility: 'omniscience',
  },
];

// Export all classes combined
export const ALL_CLASSES = [
  ...STARTER_CLASSES,
  ...ADVANCED_CLASSES,
  ...MASTER_CLASSES,
];

// For backward compatibility
export const CHARACTERS = STARTER_CLASSES;
