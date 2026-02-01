import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type CosmeticType = 'clothing' | 'background' | 'accessory';
type CosmeticRarity = 'common' | 'rare' | 'epic' | 'legendary';

interface CosmeticItem {
  id: string;
  name: string;
  type: CosmeticType;
  rarity: CosmeticRarity;
  price: number;
  icon: string;
  owned: boolean;
  equipped: boolean;
}

interface CosmeticShopProps {
  items: CosmeticItem[];
  playerCrystals: number;
  onPurchase: (itemId: string) => Promise<void>;
  onEquip: (itemId: string) => Promise<void>;
}

const rarityColors = {
  common: 'from-gray-400 to-gray-500',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-500'
};

const rarityBorders = {
  common: 'border-gray-300 dark:border-gray-600',
  rare: 'border-blue-400 dark:border-blue-500',
  epic: 'border-purple-400 dark:border-purple-500',
  legendary: 'border-yellow-400 dark:border-orange-500'
};

export const CosmeticShop = ({ items, playerCrystals, onPurchase, onEquip }: CosmeticShopProps) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<CosmeticType | 'all'>('all');
  const [loading, setLoading] = useState<string | null>(null);

  const filteredItems = filter === 'all' 
    ? items 
    : items.filter(item => item.type === filter);

  const handlePurchase = async (itemId: string) => {
    setLoading(itemId);
    try {
      await onPurchase(itemId);
    } finally {
      setLoading(null);
    }
  };

  const handleEquip = async (itemId: string) => {
    setLoading(itemId);
    try {
      await onEquip(itemId);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[32px] shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              {t('cosmetic.shop', 'Магазин косметики')}
            </h1>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full text-white font-black shadow-lg">
              <span className="text-xl">💎</span>
              <span>{playerCrystals}</span>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {(['all', 'clothing', 'background', 'accessory'] as const).map((type) => (
              <motion.button
                key={type}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all ${
                  filter === type
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {t(`cosmetic.filter.${type}`, type === 'all' ? 'Все' : type)}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[24px] p-4 border-2 ${rarityBorders[item.rarity]} shadow-lg`}
            >
              <div className={`w-full aspect-square rounded-[20px] bg-gradient-to-br ${rarityColors[item.rarity]} flex items-center justify-center text-6xl mb-3 shadow-inner`}>
                {item.icon}
              </div>

              <div className="mb-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1 truncate">
                  {item.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${rarityColors[item.rarity]} text-white`}>
                    {t(`cosmetic.rarity.${item.rarity}`, item.rarity)}
                  </span>
                </div>
              </div>

              {item.owned ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEquip(item.id)}
                  disabled={item.equipped || loading === item.id}
                  className={`w-full py-2 rounded-full font-bold text-sm transition-all ${
                    item.equipped
                      ? 'bg-green-500 text-white'
                      : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                  }`}
                >
                  {item.equipped ? '✓ ' + t('cosmetic.equipped', 'Надето') : t('cosmetic.equip', 'Надеть')}
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePurchase(item.id)}
                  disabled={playerCrystals < item.price || loading === item.id}
                  className={`w-full py-2 rounded-full font-bold text-sm transition-all ${
                    playerCrystals >= item.price
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                  }`}
                >
                  💎 {item.price}
                </motion.button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
