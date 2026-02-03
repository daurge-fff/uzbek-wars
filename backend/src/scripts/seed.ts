import '../loadEnv';

import mongoose from 'mongoose';
import { City } from '../models/City';
import { CosmeticItem } from '../models/CosmeticItem';
import { User } from '../models/User';
import { Player } from '../models/Player';
import { logger } from '../utils/logger';

/**
 * Character class system with real stat modifiers
 * Each class has unique bonuses and penalties that affect gameplay
 */
export const CHARACTERS = [
  {
    id: 'char_merchant',
    avatar: '🤑',
    name: {
      ru: 'Торговец',
      uz: 'Savdogar',
      uk: 'Торговець',
      en: 'Merchant',
    },
    description: {
      ru: 'Опытный торговец с Чорсу. Мастер переговоров и торговли',
      uz: 'Chorsudan tajribali savdogar. Muzokaralar va savdo ustasi',
      uk: 'Досвідчений торговець з Чорсу. Майстер переговорів та торгівлі',
      en: 'Experienced trader from Chorsu. Master of negotiation and trade',
    },
    strengths: {
      ru: '💰 +30% к заработку сомов\n🤝 -15% цены в магазинах\n📦 +5 слотов инвентаря',
      uz: '💰 So\'m daromadiga +30%\n🤝 Do\'konlarda -15% narx\n📦 +5 inventar slotlari',
      uk: '💰 +30% до заробітку сомів\n🤝 -15% ціни в магазинах\n📦 +5 слотів інвентаря',
      en: '💰 +30% soms income\n🤝 -15% shop prices\n📦 +5 inventory slots',
    },
    weaknesses: {
      ru: '⚡ -20% восстановление энергии\n😴 Энергия падает на 20% быстрее',
      uz: '⚡ -20% energiya tiklanishi\n😴 Energiya 20% tezroq tushadi',
      uk: '⚡ -20% відновлення енергії\n😴 Енергія падає на 20% швидше',
      en: '⚡ -20% energy recovery\n😴 Energy drains 20% faster',
    },
    statModifiers: {
      incomeBonus: 30,
      shopDiscount: 15,
      inventoryBonus: 5,
      energyRecovery: -20,
      energyDrain: 20,
    },
  },
  {
    id: 'char_warrior',
    avatar: '⚔️',
    name: {
      ru: 'Воин',
      uz: 'Jangchi',
      uk: 'Воїн',
      en: 'Warrior',
    },
    description: {
      ru: 'Потомок воинов Тамерлана. Сильный и выносливый боец',
      uz: 'Amir Temur jangchilarining avlodi. Kuchli va chidamli jangchi',
      uk: 'Нащадок воїнів Тамерлана. Сильний і витривалий боєць',
      en: 'Descendant of Tamerlane\'s warriors. Strong and resilient fighter',
    },
    strengths: {
      ru: '❤️ +30% максимальное здоровье\n💪 +25% урон в бою\n🛡️ +15% защита',
      uz: '❤️ +30% maksimal salomatlik\n💪 +25% jangda zarar\n🛡️ +15% himoya',
      uk: '❤️ +30% максимальне здоров\'я\n💪 +25% урон в бою\n🛡️ +15% захист',
      en: '❤️ +30% max health\n💪 +25% combat damage\n🛡️ +15% defense',
    },
    weaknesses: {
      ru: '🍽️ -30% восстановление от еды\n🍖 Голод падает на 40% быстрее',
      uz: '🍽️ -30% ovqatdan tiklanish\n🍖 Ochlik 40% tezroq tushadi',
      uk: '🍽️ -30% відновлення від їжі\n🍖 Голод падає на 40% швидше',
      en: '🍽️ -30% food recovery\n🍖 Hunger drains 40% faster',
    },
    statModifiers: {
      maxHealthBonus: 30,
      damageBonus: 25,
      defenseBonus: 15,
      foodRecovery: -30,
      hungerDrain: 40,
    },
  },
  {
    id: 'char_scholar',
    avatar: '📚',
    name: {
      ru: 'Ученый',
      uz: 'Olim',
      uk: 'Вчений',
      en: 'Scholar',
    },
    description: {
      ru: 'Мудрец из медресе Улугбека. Быстро учится и медленно устает',
      uz: 'Ulug\'bek madrasasidan donishmand. Tez o\'rganadi va sekin charchaydi',
      uk: 'Мудрець з медресе Улугбека. Швидко вчиться і повільно втомлюється',
      en: 'Sage from Ulugbek\'s madrasah. Learns fast and tires slowly',
    },
    strengths: {
      ru: '✨ +35% получение опыта\n⚡ +30% восстановление энергии\n📖 -25% время крафта',
      uz: '✨ +35% tajriba olish\n⚡ +30% energiya tiklanishi\n📖 -25% kraft vaqti',
      uk: '✨ +35% отримання досвіду\n⚡ +30% відновлення енергії\n📖 -25% час крафту',
      en: '✨ +35% experience gain\n⚡ +30% energy recovery\n📖 -25% crafting time',
    },
    weaknesses: {
      ru: '❤️ -25% максимальное здоровье\n🤕 Здоровье падает на 20% быстрее',
      uz: '❤️ -25% maksimal salomatlik\n🤕 Salomatlik 20% tezroq tushadi',
      uk: '❤️ -25% максимальне здоров\'я\n🤕 Здоров\'я падає на 20% швидше',
      en: '❤️ -25% max health\n🤕 Health drains 20% faster',
    },
    statModifiers: {
      experienceBonus: 35,
      energyRecovery: 30,
      craftingSpeed: 25,
      maxHealthBonus: -25,
      healthDrain: 20,
    },
  },
  {
    id: 'char_artisan',
    avatar: '🎨',
    name: {
      ru: 'Ремесленник',
      uz: 'Hunarmand',
      uk: 'Ремісник',
      en: 'Artisan',
    },
    description: {
      ru: 'Искусный мастер из Бухары. Работа приносит радость',
      uz: 'Buxorodan mohir usta. Ish quvonch keltiradi',
      uk: 'Майстерний ремісник з Бухари. Робота приносить радість',
      en: 'Skilled artisan from Bukhara. Work brings joy',
    },
    strengths: {
      ru: '😊 +35% настроение от работы\n💰 +20% заработок\n🔨 -30% стоимость крафта',
      uz: '😊 +35% ishdan kayfiyat\n💰 +20% daromad\n🔨 -30% kraft narxi',
      uk: '😊 +35% настрій від роботи\n💰 +20% заробіток\n🔨 -30% вартість крафту',
      en: '😊 +35% mood from work\n💰 +20% income\n🔨 -30% crafting cost',
    },
    weaknesses: {
      ru: '🍽️ -20% восстановление от еды\n⏰ +15% время активностей',
      uz: '🍽️ -20% ovqatdan tiklanish\n⏰ +15% faoliyat vaqti',
      uk: '🍽️ -20% відновлення від їжі\n⏰ +15% час активностей',
      en: '🍽️ -20% food recovery\n⏰ +15% activity time',
    },
    statModifiers: {
      moodFromWork: 35,
      incomeBonus: 20,
      craftingCost: -30,
      foodRecovery: -20,
      activityTime: 15,
    },
  },
  {
    id: 'char_chef',
    avatar: '👨‍🍳',
    name: {
      ru: 'Повар',
      uz: 'Oshpaz',
      uk: 'Кухар',
      en: 'Chef',
    },
    description: {
      ru: 'Мастер плова из Ферганы. Еда лечит душу и тело',
      uz: 'Farg\'onadan osh ustasi. Ovqat ruh va tanani davolaydi',
      uk: 'Майстер плову з Фергани. Їжа лікує душу і тіло',
      en: 'Plov master from Fergana. Food heals body and soul',
    },
    strengths: {
      ru: '🍽️ +50% восстановление от еды\n❤️ +25% здоровье от еды\n🍲 -40% время готовки',
      uz: '🍽️ +50% ovqatdan tiklanish\n❤️ +25% ovqatdan salomatlik\n🍲 -40% pishirish vaqti',
      uk: '🍽️ +50% відновлення від їжі\n❤️ +25% здоров\'я від їжі\n🍲 -40% час готування',
      en: '🍽️ +50% food recovery\n❤️ +25% health from food\n🍲 -40% cooking time',
    },
    weaknesses: {
      ru: '💰 -25% заработок\n💸 +20% стоимость ингредиентов',
      uz: '💰 -25% daromad\n💸 +20% ingredientlar narxi',
      uk: '💰 -25% заробіток\n💸 +20% вартість інгредієнтів',
      en: '💰 -25% income\n💸 +20% ingredient cost',
    },
    statModifiers: {
      foodRecovery: 50,
      healthFromFood: 25,
      cookingSpeed: 40,
      incomeBonus: -25,
      ingredientCost: 20,
    },
  },
];

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
      backgroundImage: '/assets/cities/samarkand.jpg',
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
      backgroundImage: '/assets/cities/tashkent.jpg',
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
      backgroundImage: '/assets/cities/bukhara.jpg',
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
      backgroundImage: '/assets/cities/khiva.jpg',
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
      backgroundImage: '/assets/cities/andijan.jpg',
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
