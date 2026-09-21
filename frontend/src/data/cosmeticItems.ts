export const cosmeticItems = [
  // === CLOTHING (existing) ===
  { 
    id: '1', 
    name: { ru: 'Тюбетейка', en: 'Tubeteyka', uz: 'Do\'ppi', uk: 'Тюбетейка' },
    type: 'clothing' as const, 
    rarity: 'common' as const, 
    priceSoms: 500, 
    priceCrystals: 10, 
    icon: '🎩', 
    owned: false, 
    equipped: false,
    bonus: {
      type: 'xp' as const,
      value: 5,
      description: { ru: '+5% опыта', en: '+5% XP', uz: '+5% tajriba', uk: '+5% досвіду' }
    }
  },
  { 
    id: '2', 
    name: { ru: 'Золотая корона', en: 'Golden Crown', uz: 'Oltin toj', uk: 'Золота корона' },
    type: 'clothing' as const, 
    rarity: 'legendary' as const, 
    priceSoms: 50000, 
    priceCrystals: 500, 
    icon: '👑', 
    owned: false, 
    equipped: false,
    bonus: {
      type: 'soms' as const,
      value: 25,
      description: { ru: '+25% сомов', en: '+25% soms', uz: '+25% so\'m', uk: '+25% сомів' }
    }
  },
  { 
    id: '3', 
    name: { ru: 'Регистан', en: 'Registan', uz: 'Registon', uk: 'Регістан' },
    type: 'background' as const, 
    rarity: 'epic' as const, 
    priceSoms: 10000, 
    priceCrystals: 200, 
    icon: '🕌', 
    owned: false, 
    equipped: false,
    bonus: {
      type: 'stats' as const,
      value: 10,
      description: { ru: '+10% настроение', en: '+10% mood', uz: '+10% kayfiyat', uk: '+10% настрій' }
    }
  },
  { 
    id: '4', 
    name: { ru: 'Золотые серьги', en: 'Golden Earrings', uz: 'Oltin sirg\'a', uk: 'Золоті сережки' },
    type: 'accessory' as const, 
    rarity: 'rare' as const, 
    priceSoms: 2000, 
    priceCrystals: 50, 
    icon: '💍', 
    owned: false, 
    equipped: false,
    bonus: {
      type: 'soms' as const,
      value: 10,
      description: { ru: '+10% сомов', en: '+10% soms', uz: '+10% so\'m', uk: '+10% сомів' }
    }
  },
  { 
    id: '5', 
    name: { ru: 'Чапан', en: 'Chapan', uz: 'Chopon', uk: 'Чапан' },
    type: 'clothing' as const, 
    rarity: 'rare' as const, 
    priceSoms: 3000, 
    priceCrystals: 75, 
    icon: '🧥', 
    owned: false, 
    equipped: false,
    bonus: {
      type: 'stats' as const,
      value: 5,
      description: { ru: '+5% здоровье', en: '+5% health', uz: '+5% salomatlik', uk: '+5% здоров\'я' }
    }
  },
  { 
    id: '6', 
    name: { ru: 'Самса', en: 'Samsa', uz: 'Somsa', uk: 'Самса' },
    type: 'accessory' as const, 
    rarity: 'common' as const, 
    priceSoms: 300, 
    priceCrystals: 5, 
    icon: '🥟', 
    owned: false, 
    equipped: false,
    bonus: {
      type: 'stats' as const,
      value: 3,
      description: { ru: '+3% голод', en: '+3% hunger', uz: '+3% ochlik', uk: '+3% голод' }
    }
  },
  { 
    id: '7', 
    name: { ru: 'Плов', en: 'Plov', uz: 'Osh', uk: 'Плов' },
    type: 'accessory' as const, 
    rarity: 'common' as const, 
    priceSoms: 400, 
    priceCrystals: 8, 
    icon: '🍛', 
    owned: false, 
    equipped: false,
    bonus: {
      type: 'xp' as const,
      value: 3,
      description: { ru: '+3% опыта', en: '+3% XP', uz: '+3% tajriba', uk: '+3% досвіду' }
    }
  },
  { 
    id: '8', 
    name: { ru: 'Бухара', en: 'Bukhara', uz: 'Buxoro', uk: 'Бухара' },
    type: 'background' as const, 
    rarity: 'epic' as const, 
    priceSoms: 12000, 
    priceCrystals: 250, 
    icon: '🏛️', 
    owned: false, 
    equipped: false,
    bonus: {
      type: 'xp' as const,
      value: 15,
      description: { ru: '+15% опыта', en: '+15% XP', uz: '+15% tajriba', uk: '+15% досвіду' }
    }
  },

  // === COMBAT WEAPONS ===
  {
    id: 'w1',
    name: { ru: 'Кинжал Самарканда', en: 'Samarkand Dagger', uz: 'Samarqand pichog\'i', uk: 'Кинжал Самарканду' },
    type: 'clothing' as const,
    slot: 'accessory' as const,
    rarity: 'common' as const,
    priceSoms: 1500,
    priceCrystals: 0,
    icon: '🗡️',
    owned: false,
    equipped: false,
    stats: { strength: 5 },
    bonus: {
      type: 'combat' as const,
      value: 5,
      description: { ru: '+5 Сила', en: '+5 Strength', uz: '+5 Kuch', uk: '+5 Сила' }
    }
  },
  {
    id: 'w2',
    name: { ru: 'Стальной меч', en: 'Steel Sword', uz: 'Polad qilich', uk: 'Сталевий меч' },
    type: 'clothing' as const,
    slot: 'accessory' as const,
    rarity: 'rare' as const,
    priceSoms: 8000,
    priceCrystals: 50,
    icon: '⚔️',
    owned: false,
    equipped: false,
    stats: { strength: 12 },
    bonus: {
      type: 'combat' as const,
      value: 12,
      description: { ru: '+12 Сила', en: '+12 Strength', uz: '+12 Kuch', uk: '+12 Сила' }
    }
  },
  {
    id: 'w3',
    name: { ru: 'Легендарный клинок', en: 'Legendary Blade', uz: 'Afsonaviy pichoq', uk: 'Легендарний клинок' },
    type: 'clothing' as const,
    slot: 'accessory' as const,
    rarity: 'legendary' as const,
    priceSoms: 45000,
    priceCrystals: 400,
    icon: '🔱',
    owned: false,
    equipped: false,
    stats: { strength: 25, intelligence: 5 },
    bonus: {
      type: 'combat' as const,
      value: 25,
      description: { ru: '+25 Сила, +5 Интеллект', en: '+25 Str, +5 Int', uz: '+25 Kuch, +5 Aql', uk: '+25 Сила, +5 Інтелект' }
    }
  },

  // === SHIELDS / ARMOR ===
  {
    id: 'a1',
    name: { ru: 'Кожаный доспех', en: 'Leather Armor', uz: 'Teri zirh', uk: 'Шкіряна броня' },
    type: 'clothing' as const,
    slot: 'body' as const,
    rarity: 'common' as const,
    priceSoms: 1200,
    priceCrystals: 0,
    icon: '🦺',
    owned: false,
    equipped: false,
    stats: { defense: 5, stamina: 3 },
    bonus: {
      type: 'combat' as const,
      value: 5,
      description: { ru: '+5 Защита, +3 Выносливость', en: '+5 Def, +3 Stam', uz: '+5 Himoya, +3 Chidamlilik', uk: '+5 Захист, +3 Витривалість' }
    }
  },
  {
    id: 'a2',
    name: { ru: 'Кольчуга', en: 'Chainmail', uz: 'Zanjirli zirh', uk: 'Кольчуга' },
    type: 'clothing' as const,
    slot: 'body' as const,
    rarity: 'rare' as const,
    priceSoms: 10000,
    priceCrystals: 80,
    icon: '🛡️',
    owned: false,
    equipped: false,
    stats: { defense: 12, stamina: 8 },
    bonus: {
      type: 'combat' as const,
      value: 12,
      description: { ru: '+12 Защита, +8 Выносливость', en: '+12 Def, +8 Stam', uz: '+12 Himoya, +8 Chidamlilik', uk: '+12 Захист, +8 Витривалість' }
    }
  },
  {
    id: 'a3',
    name: { ru: 'Броня Шёлкового стража', en: 'Silk Guard Armor', uz: 'Ipak qo\'riqchi zirhi', uk: 'Броня Шовкового стража' },
    type: 'clothing' as const,
    slot: 'body' as const,
    rarity: 'legendary' as const,
    priceSoms: 50000,
    priceCrystals: 450,
    icon: '🏰',
    owned: false,
    equipped: false,
    stats: { defense: 22, stamina: 15, intelligence: 5 },
    bonus: {
      type: 'combat' as const,
      value: 22,
      description: { ru: '+22 Защита, +15 Выносливость, +5 Интеллект', en: '+22 Def, +15 Stam, +5 Int', uz: '+22 Himoya, +15 Chidamlilik, +5 Aql', uk: '+22 Захист, +15 Витривалість, +5 Інтелект' }
    }
  },

  // === BOOTS (AGILITY) ===
  {
    id: 'b1',
    name: { ru: 'Лёгкие сапоги', en: 'Light Boots', uz: 'Yengil etik', uk: 'Легкі чоботи' },
    type: 'clothing' as const,
    slot: 'feet' as const,
    rarity: 'common' as const,
    priceSoms: 800,
    priceCrystals: 0,
    icon: '👢',
    owned: false,
    equipped: false,
    stats: { agility: 5 },
    bonus: {
      type: 'combat' as const,
      value: 5,
      description: { ru: '+5 Ловкость', en: '+5 Agility', uz: '+5 Chaqqonlik', uk: '+5 Спритність' }
    }
  },
  {
    id: 'b2',
    name: { ru: 'Сапоги скитальца', en: 'Wanderer Boots', uz: 'Sayyoh etik', uk: 'Чоботи мандрівника' },
    type: 'clothing' as const,
    slot: 'feet' as const,
    rarity: 'rare' as const,
    priceSoms: 6000,
    priceCrystals: 40,
    icon: '🥾',
    owned: false,
    equipped: false,
    stats: { agility: 10, luck: 0.3 },
    bonus: {
      type: 'combat' as const,
      value: 10,
      description: { ru: '+10 Ловкость, +0.3 Удача', en: '+10 Agi, +0.3 Luck', uz: '+10 Chaqqonlik, +0.3 Omad', uk: '+10 Спритність, +0.3 Удача' }
    }
  },

  // === HELMETS (STAMACHA / INTELLIGENCE) ===
  {
    id: 'h1',
    name: { ru: 'Шлем воина', en: 'Warrior Helm', uz: 'Jangchi dubulg\'asi', uk: 'Шолом воїна' },
    type: 'clothing' as const,
    slot: 'head' as const,
    rarity: 'common' as const,
    priceSoms: 1000,
    priceCrystals: 0,
    icon: '⛑️',
    owned: false,
    equipped: false,
    stats: { stamina: 5, defense: 3 },
    bonus: {
      type: 'combat' as const,
      value: 5,
      description: { ru: '+5 Выносливость, +3 Защита', en: '+5 Stam, +3 Def', uz: '+5 Chidamlilik, +3 Himoya', uk: '+5 Витривалість, +3 Захист' }
    }
  },
  {
    id: 'h2',
    name: { ru: 'Корона мудреца', en: 'Sage Crown', uz: 'Donishmand toji', uk: 'Корона мудреця' },
    type: 'clothing' as const,
    slot: 'head' as const,
    rarity: 'epic' as const,
    priceSoms: 15000,
    priceCrystals: 150,
    icon: '🎓',
    owned: false,
    equipped: false,
    stats: { intelligence: 15, luck: 0.2 },
    bonus: {
      type: 'combat' as const,
      value: 15,
      description: { ru: '+15 Интеллект, +0.2 Удача', en: '+15 Int, +0.2 Luck', uz: '+15 Aql, +0.2 Omad', uk: '+15 Інтелект, +0.2 Удача' }
    }
  },

  // === AMULETS (LUCK) ===
  {
    id: 'am1',
    name: { ru: 'Амулет удачи', en: 'Luck Amulet', uz: 'Omad ilgak', uk: 'Амулет удачі' },
    type: 'accessory' as const,
    rarity: 'rare' as const,
    priceSoms: 5000,
    priceCrystals: 35,
    icon: '🔮',
    owned: false,
    equipped: false,
    stats: { luck: 0.4, agility: 3 },
    bonus: {
      type: 'combat' as const,
      value: 4,
      description: { ru: '+0.4 Удача, +3 Ловкость', en: '+0.4 Luck, +3 Agi', uz: '+0.4 Omad, +3 Chaqqonlik', uk: '+0.4 Удача, +3 Спритність' }
    }
  },
  {
    id: 'am2',
    name: { ru: 'Око судьбы', en: 'Eye of Fate', uz: 'Taqdir ko\'zi', uk: 'Око долі' },
    type: 'accessory' as const,
    rarity: 'legendary' as const,
    priceSoms: 40000,
    priceCrystals: 350,
    icon: '👁️',
    owned: false,
    equipped: false,
    stats: { luck: 0.8, agility: 8, intelligence: 8 },
    bonus: {
      type: 'combat' as const,
      value: 8,
      description: { ru: '+0.8 Удача, +8 Ловкость, +8 Интеллект', en: '+0.8 Luck, +8 Agi, +8 Int', uz: '+0.8 Omad, +8 Chaqqonlik, +8 Aql', uk: '+0.8 Удача, +8 Спритність, +8 Інтелект' }
    }
  },

  // === CONSUMABLES (RESTORE HEALTH/ENERGY) ===
  {
    id: 'c1',
    name: { ru: 'Хурма', en: 'Persimmon', uz: 'Xurma', uk: 'Хурма' },
    type: 'clothing' as const,
    rarity: 'common' as const,
    priceSoms: 200,
    priceCrystals: 0,
    icon: '🍊',
    owned: false,
    equipped: false,
    bonus: {
      type: 'stats' as const,
      value: 10,
      description: { ru: '+10% здоровье', en: '+10% health', uz: '+10% salomatlik', uk: '+10% здоров\'я' }
    }
  },
  {
    id: 'c2',
    name: { ru: 'Чай с мёдом', en: 'Honey Tea', uz: 'Asal choy', uk: 'Чай з медом' },
    type: 'clothing' as const,
    rarity: 'common' as const,
    priceSoms: 350,
    priceCrystals: 0,
    icon: '🍵',
    owned: false,
    equipped: false,
    bonus: {
      type: 'stats' as const,
      value: 15,
      description: { ru: '+15% энергия', en: '+15% energy', uz: '+15% energiya', uk: '+15% енергія' }
    }
  },
  {
    id: 'c3',
    name: { ru: 'Эликсир воина', en: 'Warrior Elixir', uz: 'Jangchi eliksiri', uk: 'Еліксир воїна' },
    type: 'clothing' as const,
    rarity: 'epic' as const,
    priceSoms: 8000,
    priceCrystals: 60,
    icon: '⚗️',
    owned: false,
    equipped: false,
    bonus: {
      type: 'combat' as const,
      value: 8,
      description: { ru: '+8 ко всем боевым статам', en: '+8 all combat stats', uz: '+8 barcha jangovar statlar', uk: '+8 до всіх бойових статів' }
    }
  },
  // === Equipment from the API catalog (ids match backend/src/routes/cosmetics.ts) ===
  {
    id: '10',
    name: { ru: 'Кинжал базара', en: 'Bazaar Dagger', uz: 'Bozor xanjari', uk: 'Кинджал базару' },
    type: 'equipment' as const,
    rarity: 'common' as const,
    priceSoms: 1000,
    priceCrystals: 20,
    icon: '🗡️',
    owned: false,
    equipped: false,
    stats: { strength: 5 },
    bonus: {
      type: 'combat' as const,
      value: 5,
      description: { ru: '+5 Сила', en: '+5 Strength', uz: '+5 Kuch', uk: '+5 Сила' }
    }
  },
  {
    id: '11',
    name: { ru: 'Клинок Шёлкового пути', en: 'Silk Road Blade', uz: 'Buyuk ipak yo\'li qilichi', uk: 'Клинок Шовкового шляху' },
    type: 'equipment' as const,
    rarity: 'epic' as const,
    priceSoms: 15000,
    priceCrystals: 300,
    icon: '⚔️',
    owned: false,
    equipped: false,
    stats: { strength: 25, agility: 5 },
    bonus: {
      type: 'combat' as const,
      value: 25,
      description: { ru: '+25 Сила, +5 Ловкость', en: '+25 Strength, +5 Agility', uz: '+25 Kuch, +5 Chaqqonlik', uk: '+25 Сила, +5 Спритність' }
    }
  },
  {
    id: '12',
    name: { ru: 'Стёганый чапан', en: 'Quilted Chapan', uz: 'Paxtali chopon', uk: 'Стьобаний чапан' },
    type: 'clothing' as const,
    rarity: 'rare' as const,
    priceSoms: 5000,
    priceCrystals: 100,
    icon: '🧥',
    owned: false,
    equipped: false,
    stats: { defense: 15, stamina: 10 },
    bonus: {
      type: 'combat' as const,
      value: 15,
      description: { ru: '+15 Защита, +10 Выносливость', en: '+15 Defense, +10 Stamina', uz: '+15 Himoya, +10 Chidamlilik', uk: '+15 Захист, +10 Витривалість' }
    }
  }
];
