import '../loadEnv';

import mongoose from 'mongoose';
import { City } from '../models/City';
import { CosmeticItem } from '../models/CosmeticItem';
import { User } from '../models/User';
import { Player } from '../models/Player';
import { logger } from '../utils/logger';
import { CHARACTERS } from '../data/characters';
import { Quest } from '../models/Quest';
import { GLOBAL_QUESTS } from '../data/quests';
import { DailyTask } from '../models/DailyTask';

/**
 * City definitions with exact data from design document
 * Each city has unique theme and multilingual names
 */
const CITIES = [
  {
    cityId: 'samarkand',
    name: {
      ru: 'Самарканд',
      uz: 'Samarqand',
      uk: 'Самарканд',
      en: 'Samarkand',
    },
    maxPlayers: 1000,
    theme: {
      primaryColor: '#4A90E2',
      backgroundImage: '/assets/cities/samarkand.svg',
      description: {
        ru: 'Жемчужина Востока. Древний город на Великом шелковом пути с величественным Регистаном',
        uz: 'Sharqning gavhari. Buyuk Ipak yo\'lidagi qadimiy shahar, ulug\'vor Registon bilan',
        uk: 'Перлина Сходу. Стародавнє місто на Великому шовковому шляху з величним Регістаном',
        en: 'Pearl of the East. Ancient city on the Great Silk Road with majestic Registan',
      },
    },
  },
  {
    cityId: 'tashkent',
    name: {
      ru: 'Ташкент',
      uz: 'Toshkent',
      uk: 'Ташкент',
      en: 'Tashkent',
    },
    maxPlayers: 1000,
    theme: {
      primaryColor: '#50C878',
      backgroundImage: '/assets/cities/tashkent.svg',
      description: {
        ru: 'Каменный город. Современная столица с древней историей и знаменитым базаром Чорсу',
        uz: 'Tosh shahar. Qadimiy tarixga ega zamonaviy poytaxt va mashhur Chorsu bozori',
        uk: 'Кам\'яне місто. Сучасна столиця з давньою історією та знаменитим базаром Чорсу',
        en: 'Stone City. Modern capital with ancient history and famous Chorsu Bazaar',
      },
    },
  },
  {
    cityId: 'bukhara',
    name: {
      ru: 'Бухара',
      uz: 'Buxoro',
      uk: 'Бухара',
      en: 'Bukhara',
    },
    maxPlayers: 1000,
    theme: {
      primaryColor: '#DAA520',
      backgroundImage: '/assets/cities/bukhara.svg',
      description: {
        ru: 'Благородная Бухара. Священный город с 140 архитектурными памятниками и древней крепостью Арк',
        uz: 'Sharif Buxoro. 140 ta me\'moriy yodgorlik va qadimiy Ark qal\'asi bilan muqaddas shahar',
        uk: 'Благородна Бухара. Священне місто зі 140 архітектурними пам\'ятками та стародавньою фортецею Арк',
        en: 'Noble Bukhara. Sacred city with 140 architectural monuments and ancient Ark fortress',
      },
    },
  },
  {
    cityId: 'khiva',
    name: {
      ru: 'Хива',
      uz: 'Xiva',
      uk: 'Хіва',
      en: 'Khiva',
    },
    maxPlayers: 1000,
    theme: {
      primaryColor: '#E67E22',
      backgroundImage: '/assets/cities/khiva.svg',
      description: {
        ru: 'Город-музей. Ичан-Кала - живая средневековая крепость под открытым небом',
        uz: 'Muzey shahar. Ichan-Qal\'a - ochiq osmondagi tirik o\'rta asr qal\'asi',
        uk: 'Місто-музей. Іча-Кала - жива середньовічна фортеця під відкритим небом',
        en: 'Museum City. Ichan-Kala - living medieval fortress under open sky',
      },
    },
  },
  {
    cityId: 'andijan',
    name: {
      ru: 'Андижан',
      uz: 'Andijon',
      uk: 'Андіжан',
      en: 'Andijan',
    },
    maxPlayers: 1000,
    theme: {
      primaryColor: '#9B59B6',
      backgroundImage: '/assets/cities/andijan.svg',
      description: {
        ru: 'Сердце Ферганы. Родина Бабура - основателя империи Великих Моголов',
        uz: 'Farg\'ona qalbi. Bobur - Buyuk Mug\'allar imperiyasi asoschisining vatani',
        uk: 'Серце Фергани. Батьківщина Бабура - засновника імперії Великих Моголів',
        en: 'Heart of Fergana. Birthplace of Babur - founder of the Mughal Empire',
      },
    },
  },
];

/**
 * Cosmetic clothing items with Uzbek cultural aesthetics
 * Purchasable with donation currency (crystals)
 */
const COSMETIC_CLOTHING = [
  // Головные уборы
  {
    itemId: 'clothing_doppi_traditional',
    type: 'clothing' as const,
    slot: 'head' as const,
    name: {
      ru: 'Традиционная тюбетейка',
      uz: 'An\'anaviy do\'ppi',
      uk: 'Традиційна тюбетейка',
      en: 'Traditional Doppi',
    },
    description: {
      ru: 'Классическая узбекская тюбетейка с черно-белым орнаментом',
      uz: 'Oq-qora naqshli klassik o\'zbek do\'ppisi',
      uk: 'Класична узбецька тюбетейка з чорно-білим орнаментом',
      en: 'Classic Uzbek skullcap with black and white ornament',
    },
    price: 50,
    imageUrl: '/assets/cosmetics/doppi_traditional.png',
    rarity: 'common' as const,
  },
  {
    itemId: 'clothing_doppi_gold',
    type: 'clothing' as const,
    slot: 'head' as const,
    name: {
      ru: 'Золотая тюбетейка',
      uz: 'Oltin do\'ppi',
      uk: 'Золота тюбетейка',
      en: 'Golden Doppi',
    },
    description: {
      ru: 'Роскошная тюбетейка с золотой вышивкой для особых случаев',
      uz: 'Maxsus holatlar uchun oltin kashta bilan hashamatli do\'ppi',
      uk: 'Розкішна тюбетейка із золотою вишивкою для особливих випадків',
      en: 'Luxurious skullcap with golden embroidery for special occasions',
    },
    price: 300,
    imageUrl: '/assets/cosmetics/doppi_gold.png',
    rarity: 'epic' as const,
  },

  // Верхняя одежда
  {
    itemId: 'clothing_chapan_blue',
    type: 'clothing' as const,
    slot: 'body' as const,
    name: {
      ru: 'Синий чапан',
      uz: 'Moviy chopon',
      uk: 'Синій чапан',
      en: 'Blue Chapan',
    },
    description: {
      ru: 'Традиционный узбекский халат синего цвета с простым орнаментом',
      uz: 'Oddiy naqshli an\'anaviy moviy o\'zbek xalati',
      uk: 'Традиційний узбецький халат синього кольору з простим орнаментом',
      en: 'Traditional Uzbek robe in blue color with simple ornament',
    },
    price: 100,
    imageUrl: '/assets/cosmetics/chapan_blue.png',
    rarity: 'common' as const,
  },
  {
    itemId: 'clothing_chapan_gold',
    type: 'clothing' as const,
    slot: 'body' as const,
    name: {
      ru: 'Золотой чапан',
      uz: 'Oltin chopon',
      uk: 'Золотий чапан',
      en: 'Golden Chapan',
    },
    description: {
      ru: 'Роскошный чапан с золотой вышивкой, достойный хана',
      uz: 'Xonga munosib oltin kashta bilan hashamatli chopon',
      uk: 'Розкішний чапан із золотою вишивкою, гідний хана',
      en: 'Luxurious chapan with golden embroidery, worthy of a khan',
    },
    price: 500,
    imageUrl: '/assets/cosmetics/chapan_gold.png',
    rarity: 'epic' as const,
  },
  {
    itemId: 'clothing_atlas_dress',
    type: 'clothing' as const,
    slot: 'body' as const,
    name: {
      ru: 'Платье из атласа',
      uz: 'Atlas ko\'ylak',
      uk: 'Сукня з атласу',
      en: 'Atlas Dress',
    },
    description: {
      ru: 'Яркое платье из узбекского шелка-атласа с переливающимся узором',
      uz: 'O\'zbek atlas ipagidan to\'lqinli naqshli yorqin ko\'ylak',
      uk: 'Яскрава сукня з узбецького шовку-атласу з переливчастим візерунком',
      en: 'Bright dress made from Uzbek atlas silk with shimmering pattern',
    },
    price: 300,
    imageUrl: '/assets/cosmetics/atlas_dress.png',
    rarity: 'rare' as const,
  },
  {
    itemId: 'clothing_modern_suit',
    type: 'clothing' as const,
    slot: 'body' as const,
    name: {
      ru: 'Современный костюм',
      uz: 'Zamonaviy kostyum',
      uk: 'Сучасний костюм',
      en: 'Modern Suit',
    },
    description: {
      ru: 'Стильный деловой костюм для успешного бизнесмена',
      uz: 'Muvaffaqiyatli tadbirkor uchun zamonaviy biznes kostyumi',
      uk: 'Стильний діловий костюм для успішного бізнесмена',
      en: 'Stylish business suit for successful entrepreneur',
    },
    price: 200,
    imageUrl: '/assets/cosmetics/modern_suit.png',
    rarity: 'rare' as const,
  },

  // Обувь
  {
    itemId: 'clothing_ichigi',
    type: 'clothing' as const,
    slot: 'feet' as const,
    name: {
      ru: 'Ичиги',
      uz: 'Ichigi',
      uk: 'Ічіги',
      en: 'Ichigi',
    },
    description: {
      ru: 'Традиционные узбекские сапоги из мягкой кожи',
      uz: 'Yumshoq teridan tikilgan an\'anaviy o\'zbek etiklari',
      uk: 'Традиційні узбецькі чоботи з м\'якої шкіри',
      en: 'Traditional Uzbek boots made of soft leather',
    },
    price: 150,
    imageUrl: '/assets/cosmetics/ichigi.png',
    rarity: 'rare' as const,
  },
  {
    itemId: 'clothing_sneakers',
    type: 'clothing' as const,
    slot: 'feet' as const,
    name: {
      ru: 'Кроссовки',
      uz: 'Krossovka',
      uk: 'Кросівки',
      en: 'Sneakers',
    },
    description: {
      ru: 'Удобные современные кроссовки для активной жизни',
      uz: 'Faol hayot uchun qulay zamonaviy krossovkalar',
      uk: 'Зручні сучасні кросівки для активного життя',
      en: 'Comfortable modern sneakers for active lifestyle',
    },
    price: 100,
    imageUrl: '/assets/cosmetics/sneakers.png',
    rarity: 'common' as const,
  },
];

/**
 * Cosmetic background items representing Uzbek locations
 * Provide visual customization without gameplay impact
 */
const COSMETIC_BACKGROUNDS = [
  {
    itemId: 'bg_registan',
    type: 'background' as const,
    name: {
      ru: 'Площадь Регистан',
      uz: 'Registon maydoni',
      uk: 'Площа Регістан',
      en: 'Registan Square',
    },
    description: {
      ru: 'Знаменитая площадь в центре Самарканда с тремя медресе',
      uz: 'Samarqand markazidagi uchta madrasa bilan mashhur maydon',
      uk: 'Знаменита площа в центрі Самарканду з трьома медресе',
      en: 'Famous square in the center of Samarkand with three madrasahs',
    },
    price: 150,
    imageUrl: '/assets/backgrounds/registan.jpg',
    rarity: 'rare' as const,
  },
  {
    itemId: 'bg_chorsu_bazaar',
    type: 'background' as const,
    name: {
      ru: 'Базар Чорсу',
      uz: 'Chorsu bozori',
      uk: 'Базар Чорсу',
      en: 'Chorsu Bazaar',
    },
    description: {
      ru: 'Оживленный восточный базар в Ташкенте с куполом',
      uz: 'Toshkentdagi gumbazli gavjum sharq bozori',
      uk: 'Жвавий східний базар у Ташкенті з куполом',
      en: 'Bustling oriental bazaar in Tashkent with dome',
    },
    price: 100,
    imageUrl: '/assets/backgrounds/chorsu_bazaar.jpg',
    rarity: 'common' as const,
  },
  {
    itemId: 'bg_bukhara_ark',
    type: 'background' as const,
    name: {
      ru: 'Бухарская крепость',
      uz: 'Buxoro Ark',
      uk: 'Бухарська фортеця',
      en: 'Bukhara Ark',
    },
    description: {
      ru: 'Древняя крепость правителей Бухары, построенная в V веке',
      uz: 'V asrda qurilgan Buxoro hukmdorlarining qadimiy qal\'asi',
      uk: 'Стародавня фортеця правителів Бухари, побудована в V столітті',
      en: 'Ancient fortress of Bukhara rulers, built in 5th century',
    },
    price: 200,
    imageUrl: '/assets/backgrounds/bukhara_ark.jpg',
    rarity: 'rare' as const,
  },
  {
    itemId: 'bg_tashkent_metro',
    type: 'background' as const,
    name: {
      ru: 'Ташкентское метро',
      uz: 'Toshkent metrosi',
      uk: 'Ташкентське метро',
      en: 'Tashkent Metro',
    },
    description: {
      ru: 'Красивая станция метро с узбекским орнаментом и люстрами',
      uz: 'O\'zbek naqshlari va qandillari bilan chiroyli metro stansiyasi',
      uk: 'Красива станція метро з узбецьким орнаментом та люстрами',
      en: 'Beautiful metro station with Uzbek ornament and chandeliers',
    },
    price: 150,
    imageUrl: '/assets/backgrounds/tashkent_metro.jpg',
    rarity: 'rare' as const,
  },
  {
    itemId: 'bg_mountains',
    type: 'background' as const,
    name: {
      ru: 'Горы Тянь-Шань',
      uz: 'Tyan-Shan tog\'lari',
      uk: 'Гори Тянь-Шань',
      en: 'Tian Shan Mountains',
    },
    description: {
      ru: 'Величественные горы Средней Азии с заснеженными вершинами',
      uz: 'Qorli cho\'qqilari bilan O\'rta Osiyoning ulug\'vor tog\'lari',
      uk: 'Величні гори Середньої Азії із засніженими вершинами',
      en: 'Majestic mountains of Central Asia with snow-capped peaks',
    },
    price: 250,
    imageUrl: '/assets/backgrounds/mountains.jpg',
    rarity: 'epic' as const,
  },
  {
    itemId: 'bg_khiva_ichan_kala',
    type: 'background' as const,
    name: {
      ru: 'Ичан-Кала',
      uz: 'Ichan-Qal\'a',
      uk: 'Іча-Кала',
      en: 'Ichan-Kala',
    },
    description: {
      ru: 'Внутренний город Хивы - живой музей под открытым небом',
      uz: 'Xivaning ichki shahri - ochiq osmondagi tirik muzey',
      uk: 'Внутрішнє місто Хіви - живий музей під відкритим небом',
      en: 'Inner city of Khiva - living open-air museum',
    },
    price: 300,
    imageUrl: '/assets/backgrounds/khiva_ichan_kala.jpg',
    rarity: 'epic' as const,
  },
];

/**
 * Backpacks and bags - functional items that increase inventory space
 * Purchasable with soms or crystals
 */
const COSMETIC_BACKPACKS = [
  {
    itemId: 'backpack_small',
    type: 'backpack' as const,
    slot: 'backpack' as const,
    name: {
      ru: 'Маленький рюкзак',
      uz: 'Kichik ryukzak',
      uk: 'Маленький рюкзак',
      en: 'Small Backpack',
    },
    description: {
      ru: 'Простой рюкзак для повседневных нужд. +5 слотов инвентаря',
      uz: 'Kundalik ehtiyojlar uchun oddiy ryukzak. +5 inventar slotlari',
      uk: 'Простий рюкзак для повсякденних потреб. +5 слотів інвентаря',
      en: 'Simple backpack for everyday needs. +5 inventory slots',
    },
    price: 500,
    priceCurrency: 'soms' as const,
    imageUrl: '/assets/cosmetics/backpack_small.png',
    rarity: 'common' as const,
    bonus: { inventorySlots: 5 },
  },
  {
    itemId: 'backpack_medium',
    type: 'backpack' as const,
    slot: 'backpack' as const,
    name: {
      ru: 'Средний рюкзак',
      uz: 'O\'rta ryukzak',
      uk: 'Середній рюкзак',
      en: 'Medium Backpack',
    },
    description: {
      ru: 'Вместительный рюкзак для торговцев. +10 слотов инвентаря',
      uz: 'Savdogarlar uchun sig\'imli ryukzak. +10 inventar slotlari',
      uk: 'Місткий рюкзак для торговців. +10 слотів інвентаря',
      en: 'Spacious backpack for traders. +10 inventory slots',
    },
    price: 1500,
    priceCurrency: 'soms' as const,
    imageUrl: '/assets/cosmetics/backpack_medium.png',
    rarity: 'rare' as const,
    bonus: { inventorySlots: 10 },
  },
  {
    itemId: 'backpack_large',
    type: 'backpack' as const,
    slot: 'backpack' as const,
    name: {
      ru: 'Большой рюкзак',
      uz: 'Katta ryukzak',
      uk: 'Великий рюкзак',
      en: 'Large Backpack',
    },
    description: {
      ru: 'Огромный рюкзак для серьезных путешественников. +15 слотов инвентаря',
      uz: 'Jiddiy sayohatchilar uchun ulkan ryukzak. +15 inventar slotlari',
      uk: 'Величезний рюкзак для серйозних мандрівників. +15 слотів інвентаря',
      en: 'Huge backpack for serious travelers. +15 inventory slots',
    },
    price: 200,
    priceCurrency: 'crystals' as const,
    imageUrl: '/assets/cosmetics/backpack_large.png',
    rarity: 'epic' as const,
    bonus: { inventorySlots: 15 },
  },
  {
    itemId: 'bag_silk_road',
    type: 'backpack' as const,
    slot: 'accessory' as const,
    name: {
      ru: 'Сумка Шелкового пути',
      uz: 'Ipak yo\'li sumkasi',
      uk: 'Сумка Шовкового шляху',
      en: 'Silk Road Bag',
    },
    description: {
      ru: 'Элегантная сумка из атласа. +7 слотов инвентаря, +5% к заработку',
      uz: 'Atlasdan nafis sumka. +7 inventar slotlari, daromadga +5%',
      uk: 'Елегантна сумка з атласу. +7 слотів інвентаря, +5% до заробітку',
      en: 'Elegant atlas silk bag. +7 inventory slots, +5% income',
    },
    price: 150,
    priceCurrency: 'crystals' as const,
    imageUrl: '/assets/cosmetics/bag_silk_road.png',
    rarity: 'rare' as const,
    bonus: { inventorySlots: 7, incomeBonus: 5 },
  },
  {
    itemId: 'wallet_merchant',
    type: 'backpack' as const,
    slot: 'accessory' as const,
    name: {
      ru: 'Кошелек торговца',
      uz: 'Savdogar hamyoni',
      uk: 'Гаманець торговця',
      en: 'Merchant\'s Wallet',
    },
    description: {
      ru: 'Кожаный кошелек с защитой от воров. +10% к сомам при продаже',
      uz: 'O\'g\'rilardan himoyalangan teri hamyon. Sotishda somlarga +10%',
      uk: 'Шкіряний гаманець із захистом від злодіїв. +10% до сомів при продажу',
      en: 'Leather wallet with theft protection. +10% soms when selling',
    },
    price: 100,
    priceCurrency: 'crystals' as const,
    imageUrl: '/assets/cosmetics/wallet_merchant.png',
    rarity: 'rare' as const,
    bonus: { sellBonus: 10 },
  },
];

/**
 * Generates a unique referral code
 * Format: 8 uppercase alphanumeric characters
 */
function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Seeds cities into the database
 * Idempotent: updates existing cities or creates new ones
 */
async function seedCities(): Promise<void> {
  logger.info('Seeding cities...');

  for (const cityData of CITIES) {
    await City.findOneAndUpdate(
      { cityId: cityData.cityId },
      {
        ...cityData,
        playerCount: 0, // Reset player count on seed
        isOpen: true, // Ensure all cities are open initially
      },
      { upsert: true, new: true }
    );
    logger.info(`✓ City seeded: ${cityData.name.en}`);
  }

  logger.info(`Successfully seeded ${CITIES.length} cities`);
}

/**
 * Consumable items - food, medicine, and other usable items
 * Can be purchased with soms and used to restore stats
 */
const CONSUMABLE_ITEMS = [
  // Еда
  {
    itemId: 'food_plov',
    type: 'consumable' as const,
    category: 'food' as const,
    name: {
      ru: 'Плов',
      uz: 'Osh',
      uk: 'Плов',
      en: 'Plov',
    },
    description: {
      ru: 'Традиционный узбекский плов. Восстанавливает голод, здоровье и настроение',
      uz: 'An\'anaviy o\'zbek oshi. Ochlik, salomatlik va kayfiyatni tiklaydi',
      uk: 'Традиційний узбецький плов. Відновлює голод, здоров\'я та настрій',
      en: 'Traditional Uzbek plov. Restores hunger, health and mood',
    },
    price: 150,
    priceCurrency: 'soms' as const,
    imageUrl: '/assets/consumables/plov.png',
    rarity: 'common' as const,
    effects: {
      hunger: 50,
      health: 20,
      mood: 30,
    },
  },
  {
    itemId: 'food_samsa',
    type: 'consumable' as const,
    category: 'food' as const,
    name: {
      ru: 'Самса',
      uz: 'Somsa',
      uk: 'Самса',
      en: 'Samsa',
    },
    description: {
      ru: 'Горячая самса с мясом. Быстро утоляет голод',
      uz: 'Go\'shtli issiq somsa. Ochlikni tez qondiradi',
      uk: 'Гаряча самса з м\'ясом. Швидко втамовує голод',
      en: 'Hot meat samsa. Quickly satisfies hunger',
    },
    price: 80,
    priceCurrency: 'soms' as const,
    imageUrl: '/assets/consumables/samsa.png',
    rarity: 'common' as const,
    effects: {
      hunger: 35,
      mood: 10,
    },
  },
  {
    itemId: 'food_lagman',
    type: 'consumable' as const,
    category: 'food' as const,
    name: {
      ru: 'Лагман',
      uz: 'Lag\'mon',
      uk: 'Лагман',
      en: 'Lagman',
    },
    description: {
      ru: 'Сытный лагман с овощами и мясом. Отлично восстанавливает силы',
      uz: 'Sabzavot va go\'shtli to\'yimli lag\'mon. Kuchni ajoyib tiklaydi',
      uk: 'Ситний лагман з овочами та м\'ясом. Чудово відновлює сили',
      en: 'Hearty lagman with vegetables and meat. Excellently restores strength',
    },
    price: 120,
    priceCurrency: 'soms' as const,
    imageUrl: '/assets/consumables/lagman.png',
    rarity: 'common' as const,
    effects: {
      hunger: 45,
      health: 15,
      energy: 10,
    },
  },
  {
    itemId: 'food_shashlik',
    type: 'consumable' as const,
    category: 'food' as const,
    name: {
      ru: 'Шашлык',
      uz: 'Kabob',
      uk: 'Шашлик',
      en: 'Shashlik',
    },
    description: {
      ru: 'Ароматный шашлык из баранины. Дает много энергии',
      uz: 'Qo\'y go\'shtidan xushbo\'y kabob. Ko\'p energiya beradi',
      uk: 'Ароматний шашлик з баранини. Дає багато енергії',
      en: 'Aromatic lamb shashlik. Gives lots of energy',
    },
    price: 100,
    priceCurrency: 'soms' as const,
    imageUrl: '/assets/consumables/shashlik.png',
    rarity: 'common' as const,
    effects: {
      hunger: 40,
      energy: 20,
      mood: 15,
    },
  },
  {
    itemId: 'food_non',
    type: 'consumable' as const,
    category: 'food' as const,
    name: {
      ru: 'Лепешка нон',
      uz: 'Non',
      uk: 'Коржик нон',
      en: 'Non Bread',
    },
    description: {
      ru: 'Свежая узбекская лепешка из тандыра. Простая, но сытная',
      uz: 'Tandirdan yangi o\'zbek noni. Oddiy, lekin to\'yimli',
      uk: 'Свіжий узбецький коржик з тандиру. Простий, але ситний',
      en: 'Fresh Uzbek bread from tandoor. Simple but filling',
    },
    price: 30,
    priceCurrency: 'soms' as const,
    imageUrl: '/assets/consumables/non.png',
    rarity: 'common' as const,
    effects: {
      hunger: 25,
    },
  },

  // Напитки
  {
    itemId: 'drink_green_tea',
    type: 'consumable' as const,
    category: 'drink' as const,
    name: {
      ru: 'Зеленый чай',
      uz: 'Ko\'k choy',
      uk: 'Зелений чай',
      en: 'Green Tea',
    },
    description: {
      ru: 'Ароматный зеленый чай. Восстанавливает энергию и настроение',
      uz: 'Xushbo\'y ko\'k choy. Energiya va kayfiyatni tiklaydi',
      uk: 'Ароматний зелений чай. Відновлює енергію та настрій',
      en: 'Aromatic green tea. Restores energy and mood',
    },
    price: 40,
    priceCurrency: 'soms' as const,
    imageUrl: '/assets/consumables/green_tea.png',
    rarity: 'common' as const,
    effects: {
      energy: 15,
      mood: 10,
    },
  },
  {
    itemId: 'drink_ayran',
    type: 'consumable' as const,
    category: 'drink' as const,
    name: {
      ru: 'Айран',
      uz: 'Ayron',
      uk: 'Айран',
      en: 'Ayran',
    },
    description: {
      ru: 'Освежающий кисломолочный напиток. Утоляет жажду и голод',
      uz: 'Tetiklashtiruvchi sut mahsuloti ichimligi. Chanqoqlik va ochlikni qondiradi',
      uk: 'Освіжаючий кисломолочний напій. Втамовує спрагу та голод',
      en: 'Refreshing fermented milk drink. Quenches thirst and hunger',
    },
    price: 50,
    priceCurrency: 'soms' as const,
    imageUrl: '/assets/consumables/ayran.png',
    rarity: 'common' as const,
    effects: {
      hunger: 20,
      health: 10,
    },
  },

  // Медицина
  {
    itemId: 'medicine_first_aid',
    type: 'consumable' as const,
    category: 'medicine' as const,
    name: {
      ru: 'Аптечка',
      uz: 'Birinchi yordam to\'plami',
      uk: 'Аптечка',
      en: 'First Aid Kit',
    },
    description: {
      ru: 'Базовая аптечка с бинтами и лекарствами. Восстанавливает здоровье',
      uz: 'Bint va dorilar bilan asosiy birinchi yordam to\'plami. Salomatlikni tiklaydi',
      uk: 'Базова аптечка з бинтами та ліками. Відновлює здоров\'я',
      en: 'Basic first aid kit with bandages and medicine. Restores health',
    },
    price: 200,
    priceCurrency: 'soms' as const,
    imageUrl: '/assets/consumables/first_aid.png',
    rarity: 'rare' as const,
    effects: {
      health: 60,
    },
  },
  {
    itemId: 'medicine_energy_drink',
    type: 'consumable' as const,
    category: 'medicine' as const,
    name: {
      ru: 'Энергетик',
      uz: 'Energetik ichimlik',
      uk: 'Енергетик',
      en: 'Energy Drink',
    },
    description: {
      ru: 'Мощный энергетический напиток. Быстро восстанавливает энергию',
      uz: 'Kuchli energetik ichimlik. Energiyani tez tiklaydi',
      uk: 'Потужний енергетичний напій. Швидко відновлює енергію',
      en: 'Powerful energy drink. Quickly restores energy',
    },
    price: 150,
    priceCurrency: 'soms' as const,
    imageUrl: '/assets/consumables/energy_drink.png',
    rarity: 'rare' as const,
    effects: {
      energy: 50,
    },
  },
  {
    itemId: 'medicine_vitamins',
    type: 'consumable' as const,
    category: 'medicine' as const,
    name: {
      ru: 'Витамины',
      uz: 'Vitaminlar',
      uk: 'Вітаміни',
      en: 'Vitamins',
    },
    description: {
      ru: 'Комплекс витаминов. Улучшает все показатели здоровья',
      uz: 'Vitamin kompleksi. Barcha salomatlik ko\'rsatkichlarini yaxshilaydi',
      uk: 'Комплекс вітамінів. Покращує всі показники здоров\'я',
      en: 'Vitamin complex. Improves all health indicators',
    },
    price: 250,
    priceCurrency: 'soms' as const,
    imageUrl: '/assets/consumables/vitamins.png',
    rarity: 'rare' as const,
    effects: {
      health: 30,
      energy: 20,
      mood: 20,
    },
  },
  {
    itemId: 'medicine_super_potion',
    type: 'consumable' as const,
    category: 'medicine' as const,
    name: {
      ru: 'Супер-зелье',
      uz: 'Super iksir',
      uk: 'Супер-зілля',
      en: 'Super Potion',
    },
    description: {
      ru: 'Легендарное зелье. Полностью восстанавливает все характеристики',
      uz: 'Afsonaviy iksir. Barcha xususiyatlarni to\'liq tiklaydi',
      uk: 'Легендарне зілля. Повністю відновлює всі характеристики',
      en: 'Legendary potion. Fully restores all characteristics',
    },
    price: 100,
    priceCurrency: 'crystals' as const,
    imageUrl: '/assets/consumables/super_potion.png',
    rarity: 'legendary' as const,
    effects: {
      hunger: 100,
      health: 100,
      mood: 100,
      energy: 100,
    },
  },
];

/**
 * Seeds cosmetic items into the database
 * Idempotent: updates existing items or creates new ones
 */
async function seedCosmeticItems(): Promise<void> {
  logger.info('Seeding cosmetic items...');

  const allCosmetics = [
    ...COSMETIC_CLOTHING,
    ...COSMETIC_BACKGROUNDS,
    ...COSMETIC_BACKPACKS,
    ...CONSUMABLE_ITEMS,
  ];

  for (const cosmeticData of allCosmetics) {
    await CosmeticItem.findOneAndUpdate(
      { itemId: cosmeticData.itemId },
      cosmeticData,
      { upsert: true, new: true }
    );
    logger.info(`✓ Cosmetic item seeded: ${cosmeticData.name.en}`);
  }

  logger.info(
    `Successfully seeded ${allCosmetics.length} cosmetic items ` +
    `(${COSMETIC_CLOTHING.length} clothing, ${COSMETIC_BACKGROUNDS.length} backgrounds, ` +
    `${COSMETIC_BACKPACKS.length} backpacks, ${CONSUMABLE_ITEMS.length} consumables)`
  );
}

/**
 * Seeds development user for testing
 * Only creates if DEV_USERNAME and DEV_PASSWORD are set
 * Idempotent: skips if user already exists
 */
async function seedDevUser(): Promise<void> {
  const devUsername = process.env.DEV_USERNAME;
  const devPassword = process.env.DEV_PASSWORD;

  if (!devUsername || !devPassword) {
    logger.warn(
      'DEV_USERNAME or DEV_PASSWORD not set, skipping dev user creation'
    );
    return;
  }

  logger.info('Seeding development user...');

  // Check if dev user already exists
  const existingUser = await User.findOne({ email: `${devUsername}@dev.local` });
  if (existingUser) {
    logger.info('✓ Dev user already exists, skipping');
    return;
  }

  // Create dev user
  // Note: For dev user, we use a special googleId format since they don't authenticate via Google
  const devUser = await User.create({
    googleId: `dev_${devUsername}`,
    email: `${devUsername}@dev.local`,
    displayName: `Developer (${devUsername})`,
    language: 'en',
    ipAddress: '127.0.0.1',
    deviceInfo: {
      userAgent: 'Development Environment',
      platform: 'dev',
      deviceId: 'dev_device',
    },
  });

  // Create player profile for dev user with first character and first city
  const devPlayer = await Player.create({
    userId: devUser._id,
    characterId: CHARACTERS[0].id,
    cityId: CITIES[0].cityId,
    level: 10, // Give dev user a head start for testing
    experience: 0,
    soms: 10000, // Give dev user starting funds for testing
    donationCurrency: 1000, // Give dev user crystals for testing cosmetics
    referralCode: generateReferralCode(),
  });

  logger.info(`✓ Dev user created: ${devUsername}`);
  logger.info(`  - Email: ${devUser.email}`);
  logger.info(`  - Character: ${CHARACTERS[0].name.en}`);
  logger.info(`  - City: ${CITIES[0].name.en}`);
  logger.info(`  - Level: ${devPlayer.level}`);
  logger.info(`  - Soms: ${devPlayer.soms}`);
  logger.info(`  - Crystals: ${devPlayer.donationCurrency}`);
}

/**
 * Seeds initial quests into the database
 */
async function seedQuests(): Promise<void> {
  logger.info('Seeding quests...');

  const quests = GLOBAL_QUESTS;

  for (const questData of quests) {
    await Quest.findOneAndUpdate(
      { id: questData.id },
      questData,
      { upsert: true, new: true }
    );
  }
  logger.info(`Successfully seeded ${quests.length} quests`);
}

/**
 * Seeds daily tasks into the database
 */
async function seedDailyTasks(): Promise<void> {
  logger.info('Seeding daily tasks...');

  const tasks = [
    {
      id: 'daily_login',
      name: {
        ru: 'Ежедневный визит',
        uz: 'Kunlik tashrif',
        uk: 'Щоденний візит',
        en: 'Daily Visit'
      },
      description: {
        ru: 'Просто зайди в игру сегодня',
        uz: 'Bugun shunchaki o\'yinga kir',
        uk: 'Просто зайди в гру сьогодні',
        en: 'Just log in to the game today'
      },
      type: 'login',
      targetValue: 1,
      rewards: {
        experience: 100,
        soms: 500
      },
      requiredLevel: 1,
      isActive: true
    },
    {
      id: 'daily_activities',
      name: {
        ru: 'Трудолюбие',
        uz: 'Mehnatsevarlik',
        uk: 'Працьовитість',
        en: 'Diligence'
      },
      description: {
        ru: 'Выполни 5 активностей за день',
        uz: 'Kun davomida 5 ta faoliyatni bajar',
        uk: 'Виконай 5 активностей за день',
        en: 'Complete 5 activities in a day'
      },
      type: 'activity_count',
      targetValue: 5,
      rewards: {
        experience: 300,
        soms: 1500
      },
      requiredLevel: 1,
      isActive: true
    },
    {
      id: 'daily_arena',
      name: {
        ru: 'Гладиатор',
        uz: 'Gladiator',
        uk: 'Гладіатор',
        en: 'Gladiator'
      },
      description: {
        ru: 'Проведи 3 боя на арене',
        uz: 'Arenada 3 ta jang o\'tkaz',
        uk: 'Проведи 3 бої на арені',
        en: 'Conduct 3 fights in the arena'
      },
      type: 'pvp_battle',
      targetValue: 3,
      rewards: {
        experience: 500,
        soms: 2500
      },
      requiredLevel: 2,
      isActive: true
    }
  ];

  for (const taskData of tasks) {
    await DailyTask.findOneAndUpdate(
      { id: taskData.id },
      taskData,
      { upsert: true, new: true }
    );
  }
  logger.info(`Successfully seeded ${tasks.length} daily tasks`);
}

/**
 * Seeds arena opponents (bot players)
 */
async function seedArenaOpponents(): Promise<void> {
  logger.info('Seeding arena opponents...');

  const bots = [
    {
      username: 'bot_alisher',
      displayName: 'Alisher (Bot)',
      level: 1,
      power: 10,
      characterId: 'char_student'
    },
    {
      username: 'bot_bekzod',
      displayName: 'Bekzod (Bot)',
      level: 5,
      power: 65,
      characterId: 'char_merchant'
    },
    {
      username: 'bot_dilshod',
      displayName: 'Dilshod (Bot)',
      level: 10,
      power: 150,
      characterId: 'char_warrior'
    }
  ];

  for (const bot of bots) {
    let user = await User.findOne({ googleId: `bot_${bot.username}` });
    if (!user) {
      user = await User.create({
        googleId: `bot_${bot.username}`,
        email: `${bot.username}@bot.local`,
        displayName: bot.displayName,
        language: 'uz',
        ipAddress: '127.0.0.1',
        deviceInfo: { userAgent: 'Bot', platform: 'server', deviceId: `bot_${bot.username}` }
      });
    }

    await Player.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        characterId: bot.characterId,
        cityId: 'samarkand',
        level: bot.level,
        experience: 0,
        soms: 1000,
        donationCurrency: 0,
        referralCode: `BOT${bot.username.toUpperCase()}`,
        combatStats: {
          combatPower: bot.power,
          strength: bot.level * 2,
          defense: bot.level,
          agility: bot.level,
          stamina: bot.level * 5,
          luck: 0.1
        }
      },
      { upsert: true, new: true }
    );
  }
  logger.info(`Successfully seeded ${bots.length} arena opponents`);
}

/**
 * Main seed function
 * Executes all seeding operations in sequence
 */
async function seed(): Promise<void> {
  try {
    logger.info('Starting database seed...');
    logger.info('='.repeat(50));

    // Connect to database directly
    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME;

    if (!mongoUri || !dbName) {
      throw new Error('MONGODB_URI and DB_NAME must be set in environment');
    }

    await mongoose.connect(mongoUri, {
      dbName,
    });

    logger.info(`Connected to MongoDB database: ${dbName}`);

    // Execute seeding operations
    await seedCities();
    await seedCosmeticItems();
    await seedDevUser();
    await seedQuests();
    await seedDailyTasks();
    await seedArenaOpponents();

    logger.info('='.repeat(50));
    logger.info('✓ Database seed completed successfully!');
    logger.info(`Characters available: ${CHARACTERS.length}`);
    logger.info(`Cities available: ${CITIES.length}`);
    logger.info(
      `Cosmetic items available: ${COSMETIC_CLOTHING.length + COSMETIC_BACKGROUNDS.length}`
    );
  } catch (error) {
    logger.error('Error during database seed:', error);
    throw error;
  } finally {
    // Close database connection
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
}

// Execute seed if run directly
if (require.main === module) {
  seed()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seed failed:', error);
      process.exit(1);
    });
}

export { seed, CITIES };
