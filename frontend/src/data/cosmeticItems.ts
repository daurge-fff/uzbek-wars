export const cosmeticItems = [
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
  }
];
