import '../loadEnv';

import mongoose from 'mongoose';
import { City } from '../models/City';
import { CosmeticItem } from '../models/CosmeticItem';
import { User } from '../models/User';
import { Player } from '../models/Player';
import { logger } from '../utils/logger';

/**
 * Character definitions for initial game setup
 * These characters represent different Uzbek cultural archetypes
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
      ru: 'Умеет зарабатывать деньги, но быстро устает',
      uz: 'Pul topishni yaxshi biladi, lekin tez charchaydi',
      uk: 'Вміє заробляти гроші, але швидко втомлюється',
      en: 'Good at making money but gets tired quickly',
    },
    strengths: {
      ru: '💰 +30% к заработку сомов',
      uz: '💰 So\'m daromadiga +30%',
      uk: '💰 +30% до заробітку сомів',
      en: '💰 +30% soms income',
    },
    weaknesses: {
      ru: '⚡ -20% к восстановлению энергии',
      uz: '⚡ Energiya tiklanishiga -20%',
      uk: '⚡ -20% до відновлення енергії',
      en: '⚡ -20% energy recovery',
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
      ru: 'Крепкое здоровье и выносливость, но ест много',
      uz: 'Mustahkam salomatlik va chidamlilik, lekin ko\'p ovqatlanadi',
      uk: 'Міцне здоров\'я та витривалість, але їсть багато',
      en: 'Strong health and stamina but eats a lot',
    },
    strengths: {
      ru: '❤️ +30% к максимальному здоровью',
      uz: '❤️ Maksimal salomatlikka +30%',
      uk: '❤️ +30% до максимального здоров\'я',
      en: '❤️ +30% max health',
    },
    weaknesses: {
      ru: '🍽️ -25% к скорости насыщения',
      uz: '🍽️ To\'yish tezligiga -25%',
      uk: '🍽️ -25% до швидкості насичення',
      en: '🍽️ -25% satiety rate',
    },
  },
  {
    id: 'char_scholar',
    avatar: '📚',
    name: {
      ru: 'Философ',
      uz: 'Faylasuf',
      uk: 'Філософ',
      en: 'Philosopher',
    },
    description: {
      ru: 'Медленно устает и быстро учится, но слабое здоровье',
      uz: 'Sekin charchaydi va tez o\'rganadi, lekin zaif salomatlik',
      uk: 'Повільно втомлюється і швидко вчиться, але слабке здоров\'я',
      en: 'Slow to tire and learns fast but weak health',
    },
    strengths: {
      ru: '⚡ +25% к восстановлению энергии\n✨ +20% к получению опыта',
      uz: '⚡ Energiya tiklanishiga +25%\n✨ Tajriba olishga +20%',
      uk: '⚡ +25% до відновлення енергії\n✨ +20% до отримання досвіду',
      en: '⚡ +25% energy recovery\n✨ +20% experience gain',
    },
    weaknesses: {
      ru: '❤️ -20% к максимальному здоровью',
      uz: '❤️ Maksimal salomatlikka -20%',
      uk: '❤️ -20% до максимального здоров\'я',
      en: '❤️ -20% max health',
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
      ru: 'Работа приносит радость и хороший доход',
      uz: 'Ish quvonch va yaxshi daromad keltiradi',
      uk: 'Робота приносить радість і хороший дохід',
      en: 'Work brings joy and good income',
    },
    strengths: {
      ru: '😊 +25% к настроению от работы\n💰 +15% к заработку',
      uz: '😊 Ishdan kayfiyatga +25%\n💰 Daromadga +15%',
      uk: '😊 +25% до настрою від роботи\n💰 +15% до заробітку',
      en: '😊 +25% mood from work\n💰 +15% income',
    },
    weaknesses: {
      ru: '🍽️ -15% к восстановлению от еды',
      uz: '🍽️ Ovqatdan tiklanishga -15%',
      uk: '🍽️ -15% до відновлення від їжі',
      en: '🍽️ -15% food recovery',
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
      ru: 'Еда восстанавливает больше здоровья и голода',
      uz: 'Ovqat ko\'proq salomatlik va ochlikni tiklaydi',
      uk: 'Їжа відновлює більше здоров\'я та голоду',
      en: 'Food restores more health and hunger',
    },
    strengths: {
      ru: '🍽️ +40% к восстановлению от еды\n❤️ +15% к здоровью от еды',
      uz: '🍽️ Ovqatdan tiklanishga +40%\n❤️ Ovqatdan salomatlikka +15%',
      uk: '🍽️ +40% до відновлення від їжі\n❤️ +15% до здоров\'я від їжі',
      en: '🍽️ +40% food recovery\n❤️ +15% health from food',
    },
    weaknesses: {
      ru: '💰 -20% к заработку',
      uz: '💰 Daromadga -20%',
      uk: '💰 -20% до заробітку',
      en: '💰 -20% income',
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
      description: 'Древний город на Великом шелковом пути',
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
      description: 'Столица Узбекистана',
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
      description: 'Священный город Средней Азии',
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
      description: 'Город-музей под открытым небом',
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
      description: 'Город в Ферганской долине',
    },
  },
];

/**
 * Cosmetic clothing items with Uzbek cultural aesthetics
 * Purchasable with donation currency (crystals)
 */
const COSMETIC_CLOTHING = [
  {
    itemId: 'clothing_chapan_blue',
    type: 'clothing' as const,
    name: {
      ru: 'Синий чапан',
      uz: 'Moviy chopon',
      uk: 'Синій чапан',
      en: 'Blue Chapan',
    },
    description: {
      ru: 'Традиционный узбекский халат синего цвета',
      uz: 'An\'anaviy moviy o\'zbek xalati',
      uk: 'Традиційний узбецький халат синього кольору',
      en: 'Traditional Uzbek robe in blue color',
    },
    price: 100,
    imageUrl: '/assets/cosmetics/chapan_blue.png',
    rarity: 'common' as const,
  },
  {
    itemId: 'clothing_chapan_gold',
    type: 'clothing' as const,
    name: {
      ru: 'Золотой чапан',
      uz: 'Oltin chopon',
      uk: 'Золотий чапан',
      en: 'Golden Chapan',
    },
    description: {
      ru: 'Роскошный чапан с золотой вышивкой',
      uz: 'Oltin kashta bilan hashamatli chopon',
      uk: 'Розкішний чапан із золотою вишивкою',
      en: 'Luxurious chapan with golden embroidery',
    },
    price: 500,
    imageUrl: '/assets/cosmetics/chapan_gold.png',
    rarity: 'epic' as const,
  },
  {
    itemId: 'clothing_doppi_traditional',
    type: 'clothing' as const,
    name: {
      ru: 'Традиционная тюбетейка',
      uz: 'An\'anaviy do\'ppi',
      uk: 'Традиційна тюбетейка',
      en: 'Traditional Doppi',
    },
    description: {
      ru: 'Классическая узбекская тюбетейка с орнаментом',
      uz: 'Naqshli klassik o\'zbek do\'ppisi',
      uk: 'Класична узбецька тюбетейка з орнаментом',
      en: 'Classic Uzbek skullcap with ornament',
    },
    price: 50,
    imageUrl: '/assets/cosmetics/doppi_traditional.png',
    rarity: 'common' as const,
  },
  {
    itemId: 'clothing_atlas_dress',
    type: 'clothing' as const,
    name: {
      ru: 'Платье из атласа',
      uz: 'Atlas ko\'ylak',
      uk: 'Сукня з атласу',
      en: 'Atlas Dress',
    },
    description: {
      ru: 'Яркое платье из узбекского шелка-атласа',
      uz: 'O\'zbek atlas ipagidan yorqin ko\'ylak',
      uk: 'Яскрава сукня з узбецького шовку-атласу',
      en: 'Bright dress made from Uzbek atlas silk',
    },
    price: 300,
    imageUrl: '/assets/cosmetics/atlas_dress.png',
    rarity: 'rare' as const,
  },
  {
    itemId: 'clothing_modern_suit',
    type: 'clothing' as const,
    name: {
      ru: 'Современный костюм',
      uz: 'Zamonaviy kostyum',
      uk: 'Сучасний костюм',
      en: 'Modern Suit',
    },
    description: {
      ru: 'Стильный деловой костюм для городской жизни',
      uz: 'Shahar hayoti uchun zamonaviy biznes kostyumi',
      uk: 'Стильний діловий костюм для міського життя',
      en: 'Stylish business suit for city life',
    },
    price: 200,
    imageUrl: '/assets/cosmetics/modern_suit.png',
    rarity: 'rare' as const,
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
      ru: 'Знаменитая площадь в центре Самарканда',
      uz: 'Samarqand markazidagi mashhur maydon',
      uk: 'Знаменита площа в центрі Самарканду',
      en: 'Famous square in the center of Samarkand',
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
      ru: 'Оживленный восточный базар в Ташкенте',
      uz: 'Toshkentdagi gavjum sharq bozori',
      uk: 'Жвавий східний базар у Ташкенті',
      en: 'Bustling oriental bazaar in Tashkent',
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
      ru: 'Древняя крепость правителей Бухары',
      uz: 'Buxoro hukmdorlarining qadimiy qal\'asi',
      uk: 'Стародавня фортеця правителів Бухари',
      en: 'Ancient fortress of Bukhara rulers',
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
      ru: 'Красивая станция метро с узбекским орнаментом',
      uz: 'O\'zbek naqshlari bilan chiroyli metro stansiyasi',
      uk: 'Красива станція метро з узбецьким орнаментом',
      en: 'Beautiful metro station with Uzbek ornament',
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
      ru: 'Величественные горы Средней Азии',
      uz: 'O\'rta Osiyoning ulug\'vor tog\'lari',
      uk: 'Величні гори Середньої Азії',
      en: 'Majestic mountains of Central Asia',
    },
    price: 250,
    imageUrl: '/assets/backgrounds/mountains.jpg',
    rarity: 'epic' as const,
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
 * Seeds cosmetic items into the database
 * Idempotent: updates existing items or creates new ones
 */
async function seedCosmeticItems(): Promise<void> {
  logger.info('Seeding cosmetic items...');

  const allCosmetics = [...COSMETIC_CLOTHING, ...COSMETIC_BACKGROUNDS];

  for (const cosmeticData of allCosmetics) {
    await CosmeticItem.findOneAndUpdate(
      { itemId: cosmeticData.itemId },
      cosmeticData,
      { upsert: true, new: true }
    );
    logger.info(`✓ Cosmetic item seeded: ${cosmeticData.name.en}`);
  }

  logger.info(
    `Successfully seeded ${allCosmetics.length} cosmetic items (${COSMETIC_CLOTHING.length} clothing, ${COSMETIC_BACKGROUNDS.length} backgrounds)`
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
