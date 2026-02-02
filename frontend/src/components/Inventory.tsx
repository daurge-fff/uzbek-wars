import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

type CosmeticType = 'clothing' | 'background' | 'accessory';
type CosmeticRarity = 'common' | 'rare' | 'epic' | 'legendary';

interface CosmeticItem {
  id: string;
  name: string | { ru: string; en: string; uz: string; uk: string };
  type: CosmeticType;
  rarity: CosmeticRarity;
  icon: string;
  owned: boolean;
  equipped: boolean;
  bonus?: {
    type: 'xp' | 'soms' | 'stats';
    value: number;
    description: string | { ru: string; en: string; uz: string; uk: string };
  };
}

interface InventoryProps {
  items: CosmeticItem[];
  onEquip: (itemId: string) => Promise<void>;
  onUnequip: (itemId: string) => Promise<void>;
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

const typeEmojis = {
  clothing: '👕',
  background: '🖼️',
  accessory: '💎'
};

export const Inventory = ({ items, onEquip, onUnequip }: InventoryProps) => {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<CosmeticType | 'all'>('all');
  const [loading, setLoading] = useState<string | null>(null);

  const ownedItems = items ? items.filter(item => item.owned) : [];
  const filteredItems = filter === 'all' 
    ? ownedItems 
    : ownedItems.filter(item => item.type === filter);

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

  const handleToggleEquip = async (item: CosmeticItem) => {
    setLoading(item.id);
    try {
      if (item.equipped) {
        await onUnequip(item.id);
      } else {
        await onEquip(item.id);
      }
    } finally {
      setLoading(null);
    }
  };

  const equippedItems = ownedItems.filter(item => item.equipped);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 mb-6 border border-white/50 dark:border-gray-700/50">
          <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mb-6">
            {t('inventory.title', 'Инвентарь')}
          </h1>

          {/* Currently Equipped */}
          {equippedItems.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-3">
                {t('inventory.equipped', 'Надето')}
              </h2>
              <div className="flex gap-3 flex-wrap">
                {equippedItems.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r ${rarityColors[item.rarity]} text-white font-bold shadow-lg`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span>{getItemName(item)}</span>
                    {item.bonus && (
                      <span className="text-xs opacity-90">({getBonusDescription(item)})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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
            <div className="text-6xl mb-4">📦</div>
            <p className="text-xl font-bold text-gray-600 dark:text-gray-400">
              {t('inventory.empty', 'Инвентарь пуст')}
            </p>
            <p className="text-gray-500 dark:text-gray-500 mt-2">
              {t('inventory.emptyHint', 'Купите предметы в магазине')}
            </p>
          </div>
        ) : (
          <div className="grid gap-4" style={{
            gridTemplateColumns: filteredItems.length === 1 ? '1fr' : filteredItems.length === 2 ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(280px, 1fr))',
            maxWidth: filteredItems.length <= 2 ? '900px' : '100%',
            margin: filteredItems.length <= 2 ? '0 auto' : '0'
          }}>
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-4 border-2 ${rarityBorders[item.rarity]} relative overflow-hidden`}
              >
                {/* Rarity Badge */}
                <div className="absolute top-2 right-2 z-10">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg bg-gradient-to-r ${rarityColors[item.rarity]} text-white shadow-lg uppercase tracking-wide`}>
                    {t(`cosmetic.rarity.${item.rarity}`)}
                  </span>
                </div>

                {/* Type Emoji */}
                <div className="absolute top-2 left-2 z-10">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center">
                    <span className="text-lg">{typeEmojis[item.type]}</span>
                  </div>
                </div>

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
                <h3 className="font-black text-gray-900 dark:text-white text-base mb-3 text-center line-clamp-2 min-h-[2.5rem]">
                  {getItemName(item)}
                </h3>

                {/* Equip/Unequip Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleToggleEquip(item)}
                  disabled={loading === item.id}
                  className={`w-full py-3 rounded-xl font-black text-sm transition-all ${
                    item.equipped
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg'
                  }`}
                >
                  {item.equipped ? t('inventory.unequip', 'Снять') : t('inventory.equip', 'Надеть')}
                </motion.button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
