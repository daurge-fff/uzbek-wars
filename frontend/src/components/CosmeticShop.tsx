import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

type CosmeticType = 'clothing' | 'background' | 'accessory';
type CosmeticRarity = 'common' | 'rare' | 'epic' | 'legendary';

interface CosmeticItem {
  id: string;
  name: string | { ru: string; en: string; uz: string; uk: string };
  type: CosmeticType;
  rarity: CosmeticRarity;
  priceSoms?: number;
  priceCrystals?: number;
  icon: string;
  owned: boolean;
  equipped: boolean;
  bonus?: {
    type: 'xp' | 'soms' | 'stats';
    value: number;
    description: string | { ru: string; en: string; uz: string; uk: string };
  };
}

interface CosmeticShopProps {
  items: CosmeticItem[];
  playerCrystals: number;
  playerSoms: number;
  onPurchase: (itemId: string, currency: 'soms' | 'crystals') => Promise<void>;
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

const rarityGlow = {
  common: 'shadow-gray-400/50',
  rare: 'shadow-blue-400/50',
  epic: 'shadow-purple-400/50',
  legendary: 'shadow-yellow-400/50'
};

const typeEmojis = {
  clothing: '👕',
  background: '🖼️',
  accessory: '💎'
};

export const CosmeticShop = ({ items, playerCrystals, playerSoms, onPurchase, onEquip }: CosmeticShopProps) => {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<CosmeticType | 'all'>('all');
  const [loading, setLoading] = useState<string | null>(null);

  const filteredItems = filter === 'all' 
    ? items 
    : items.filter(item => item.type === filter);

  const getItemName = (item: CosmeticItem): string => {
    if (typeof item.name === 'object') {
      return item.name[i18n.language as keyof typeof item.name] || item.name.ru;
    }
    return item.name;
  };

  const getBonusDescription = (item: CosmeticItem): string => {
    if (!item.bonus) return '';
    if (typeof item.bonus.description === 'object') {
      return item.bonus.description[i18n.language as keyof typeof item.bonus.description] || item.bonus.description.ru;
    }
    return item.bonus.description;
  };

  const handlePurchase = async (itemId: string, currency: 'soms' | 'crystals') => {
    setLoading(itemId);
    try {
      await onPurchase(itemId, currency);
      toast.success(t('cosmetic.purchaseSuccess'));
    } catch (error) {
      toast.error(currency === 'soms' ? t('cosmetic.notEnoughSoms') : t('cosmetic.notEnoughCrystals'));
    } finally {
      setLoading(null);
    }
  };

  const handleEquip = async (itemId: string) => {
    setLoading(itemId);
    try {
      await onEquip(itemId);
      toast.success(t('cosmetic.equipSuccess'));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 mb-6 border border-white/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              {t('cosmetic.shop')}
            </h1>
            
            {/* Currency Display */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full text-white font-black shadow-lg">
                <span className="text-xl">💰</span>
                <span>{playerSoms?.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full text-white font-black shadow-lg">
                <span className="text-xl">💎</span>
                <span>{playerCrystals || 0}</span>
              </div>
            </div>
          </div>

          {/* Filters */}
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
                {t(`cosmetic.filter.${type}`)}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🛍️</div>
            <p className="text-xl font-bold text-gray-600 dark:text-gray-400">
              {t('cosmetic.noItems')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item, index) => {
              const canAffordSoms = item.priceSoms ? playerSoms >= item.priceSoms : false;
              const canAffordCrystals = item.priceCrystals ? playerCrystals >= item.priceCrystals : false;
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-4 border-2 ${rarityBorders[item.rarity]} relative overflow-hidden`}
                >
                  {/* Rarity Badge - в правом верхнем углу */}
                  <div className="absolute top-2 right-2 z-10">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg bg-gradient-to-r ${rarityColors[item.rarity]} text-white shadow-lg uppercase tracking-wide`}>
                      {t(`cosmetic.rarity.${item.rarity}`)}
                    </span>
                  </div>

                  {/* Type Emoji с кружком - в левом верхнем углу */}
                  <div className="absolute top-2 left-2 z-10">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center">
                      <span className="text-lg">
                        {typeEmojis[item.type]}
                      </span>
                    </div>
                  </div>

                  {/* Owned Badge - под type emoji */}
                  {item.owned && (
                    <div className="absolute top-11 left-2 z-10">
                      <div className="w-6 h-6 rounded-full bg-green-500 shadow-lg flex items-center justify-center">
                        <span className="text-white text-xs font-black">✓</span>
                      </div>
                    </div>
                  )}

                  {/* Item Icon */}
                  <div className={`w-full aspect-square rounded-2xl bg-gradient-to-br ${rarityColors[item.rarity]} flex items-center justify-center text-6xl mb-3 shadow-inner relative overflow-hidden`}>
                    <motion.div
                      animate={{ rotate: item.equipped ? [0, 5, -5, 0] : 0 }}
                      transition={{ duration: 0.5, repeat: item.equipped ? Infinity : 0, repeatDelay: 2 }}
                    >
                      {item.icon}
                    </motion.div>
                    {item.equipped && (
                      <div className="absolute inset-0 bg-gradient-to-t from-green-500/30 to-transparent" />
                    )}
                  </div>

                  {/* Item Name */}
                  <h3 className="font-black text-gray-900 dark:text-white text-sm mb-2 text-center line-clamp-2 min-h-[2.5rem]">
                    {getItemName(item)}
                  </h3>

                  {/* Bonus Badge */}
                  {item.bonus && (
                    <div className="mb-3 px-2 py-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg">
                      <div className="text-[10px] font-black text-white text-center">
                        {getBonusDescription(item)}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {item.owned ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEquip(item.id)}
                      disabled={item.equipped || loading === item.id}
                      className={`w-full py-2.5 rounded-xl font-black text-sm transition-all ${
                        item.equipped
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg'
                      }`}
                    >
                      {item.equipped ? '✓ ' + t('cosmetic.equipped') : t('cosmetic.equip')}
                    </motion.button>
                  ) : (
                    <div className="space-y-2">
                      {/* Buy with Soms */}
                      {item.priceSoms && (
                        <motion.button
                          whileHover={canAffordSoms ? { scale: 1.05 } : {}}
                          whileTap={canAffordSoms ? { scale: 0.95 } : {}}
                          onClick={() => handlePurchase(item.id, 'soms')}
                          disabled={!canAffordSoms || loading === item.id}
                          className={`w-full py-2 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-1 ${
                            canAffordSoms
                              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg hover:shadow-xl'
                              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <span>💰</span>
                          <span>{item.priceSoms.toLocaleString()}</span>
                        </motion.button>
                      )}
                      
                      {/* Buy with Crystals */}
                      {item.priceCrystals && (
                        <motion.button
                          whileHover={canAffordCrystals ? { scale: 1.05 } : {}}
                          whileTap={canAffordCrystals ? { scale: 0.95 } : {}}
                          onClick={() => handlePurchase(item.id, 'crystals')}
                          disabled={!canAffordCrystals || loading === item.id}
                          className={`w-full py-2 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-1 ${
                            canAffordCrystals
                              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg hover:shadow-xl'
                              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <span>💎</span>
                          <span>{item.priceCrystals}</span>
                        </motion.button>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
