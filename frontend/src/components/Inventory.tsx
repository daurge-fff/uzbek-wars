import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import Emoji from './Emoji';
import CosmeticIcon from './CosmeticIcon';
import { mergeCosmeticItems } from '../utils/cosmetics';

type CosmeticType = 'clothing' | 'background' | 'accessory' | 'equipment' | 'backpack';
type CosmeticRarity = 'common' | 'rare' | 'epic' | 'legendary';

interface CosmeticItem {
  id: string;
  name: string | { ru: string; en: string; uz: string; uk: string };
  type: CosmeticType;
  rarity: CosmeticRarity;
  icon: string;
  imageSrc?: string;
  owned: boolean;
  equipped: boolean;
  bonus?: {
    type: 'xp' | 'soms' | 'stats';
    value: number;
    description: string | { ru: string; en: string; uz: string; uk: string };
  };
  stats?: {
    strength?: number;
    defense?: number;
    agility?: number;
    stamina?: number;
    intelligence?: number;
    luck?: number;
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

const typeEmojis: Record<CosmeticType, string> = {
  clothing: '👕',
  background: '🖼️',
  accessory: '✨',
  equipment: '⚔️',
  backpack: '🎒'
};

export const Inventory = ({ items, onEquip, onUnequip }: InventoryProps) => {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<CosmeticType | 'all'>('all');
  const [loading, setLoading] = useState<string | null>(null);

  const ownedItems = mergeCosmeticItems(items ? items.filter(item => item.owned) : []);
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
    if (item.stats) {
      const stats = [];
      if (item.stats.strength) stats.push(`${t('stats.strength', 'Сила')}: +${item.stats.strength}`);
      if (item.stats.defense) stats.push(`${t('stats.defense', 'Защита')}: +${item.stats.defense}`);
      if (item.stats.agility) stats.push(`${t('stats.agility', 'Ловкость')}: +${item.stats.agility}`);
      if (item.stats.stamina) stats.push(`${t('stats.stamina', 'Выносливость')}: +${item.stats.stamina}`);
      if (item.stats.intelligence) stats.push(`${t('stats.intelligence', 'Интеллект')}: +${item.stats.intelligence}`);
      if (item.stats.luck) stats.push(`${t('stats.luck', 'Удача')}: +${item.stats.luck}`);
      if (stats.length > 0) return stats.join(', ');
    }
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-black dark:from-black dark:via-black dark:to-black p-4 pb-32">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-sm p-6 mb-6 border border-white/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              {t('inventory.title', 'Инвентарь')}
            </h1>

            {/* Items Count */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full text-white font-black shadow-lg text-sm">
              <Emoji emoji="📦" size={16} />
              <span>{ownedItems.length}</span>
            </div>
          </div>

          {/* Currently Equipped */}
          {equippedItems.length > 0 && (
            <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800">
              <h2 className="text-sm font-black text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Emoji emoji="✨" size={18} />
                {t('inventory.equipped', 'Надето')}
              </h2>
              <div className="flex gap-2 flex-wrap">
                {equippedItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border-2 shadow-md text-xs font-bold relative overflow-hidden"
                    style={{
                      borderColor: rarityBorders[item.rarity].includes('gray-300') ? '#d1d5db' :
                        rarityBorders[item.rarity].includes('blue-400') ? '#60a5fa' :
                          rarityBorders[item.rarity].includes('purple-400') ? '#c084fc' : '#fbbf24'
                    }}
                  >
                    {item.rarity === 'legendary' && (
                      <div className="absolute inset-0 z-0 pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 translate-x-[-100%] animate-shimmer" />
                      </div>
                    )}
                    <CosmeticIcon emoji={item.icon} imageSrc={item.imageSrc} size={18} />
                    <span className="text-gray-900 dark:text-white relative z-10">{getItemName(item)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {(['all', 'clothing', 'background', 'equipment', 'accessory', 'backpack'] as const).map((type) => (
              <motion.button
                key={type}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all text-xs ${filter === type
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
            <div className="mb-4"><Emoji emoji="🛍️" size={72} /></div>
            <p className="text-xl font-bold text-gray-600 dark:text-gray-400">
              {t('inventory.empty', 'Инвентарь пуст')}
            </p>
            <p className="text-gray-500 dark:text-gray-500 mt-2">
              {t('inventory.emptyHint', 'Купите предметы в магазине')}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item, index) => {
              const isThirdItem = filteredItems.length === 3 && index === 2;
              return (
                <div
                  key={item.id}
                  className={`${isThirdItem ? 'col-span-2 lg:col-span-1' : ''}`}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-4 border-2 relative overflow-hidden w-full"
                    style={{
                      borderColor: rarityBorders[item.rarity].includes('gray-300') ? '#d1d5db' :
                        rarityBorders[item.rarity].includes('blue-400') ? '#60a5fa' :
                          rarityBorders[item.rarity].includes('purple-400') ? '#c084fc' : '#fbbf24'
                    }}
                  >
                    {/* Rarity Badge */}
                    <div className="absolute top-2 right-2 z-10">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg bg-gradient-to-r text-white shadow-lg uppercase tracking-wide ${item.rarity === 'legendary' ? 'text-glow-gold' : ''}`}
                        style={{
                          backgroundImage: `linear-gradient(to right, ${rarityColors[item.rarity].includes('gray') ? '#9ca3af, #6b7280' :
                            rarityColors[item.rarity].includes('blue') ? '#60a5fa, #2563eb' :
                              rarityColors[item.rarity].includes('purple') ? '#c084fc, #9333ea' : '#fbbf24, #f97316'
                            })`
                        }}>
                        {t(`cosmetic.rarity.${item.rarity}`)}
                      </span>
                    </div>

                    {/* Type Emoji */}
                    <div className="absolute top-2 left-2 z-10">
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center">
                        <Emoji emoji={typeEmojis[item.type]} size={20} />
                      </div>
                    </div>

                    {/* Equipped Badge */}
                    {item.equipped && (
                      <div className="absolute top-11 left-2 z-10">
                        <div className="w-6 h-6 rounded-full bg-green-500 shadow-lg flex items-center justify-center">
                          <Emoji emoji="✅" size={14} />
                        </div>
                      </div>
                    )}

                    {/* Item Icon */}
                    <div className="w-full aspect-square max-h-64 rounded-2xl bg-gradient-to-br flex items-center justify-center text-6xl mb-3 shadow-inner relative overflow-hidden mx-auto"
                      style={{
                        backgroundImage: `linear-gradient(to bottom right, ${rarityColors[item.rarity].includes('gray') ? '#9ca3af, #6b7280' :
                          rarityColors[item.rarity].includes('blue') ? '#60a5fa, #2563eb' :
                            rarityColors[item.rarity].includes('purple') ? '#c084fc, #9333ea' : '#fbbf24, #f97316'
                          })`
                      }}>
                      {item.rarity === 'legendary' && (
                        <div className="absolute inset-0 z-0 pointer-events-none">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-100%] animate-shimmer" />
                        </div>
                      )}
                      <motion.div
                        animate={{ rotate: item.equipped ? [0, 5, -5, 0] : 0 }}
                        transition={{ duration: 0.5, repeat: item.equipped ? Infinity : 0, repeatDelay: 2 }}
                        className="relative z-10"
                      >
                        <CosmeticIcon emoji={item.icon} imageSrc={item.imageSrc} size={72} />
                      </motion.div>
                      {item.equipped && (
                        <div className="absolute inset-0 bg-gradient-to-t from-green-500/30 to-transparent" />
                      )}
                    </div>

                    {/* Item Name */}
                    <h3 className="font-black text-gray-900 dark:text-white text-base mb-3 text-center line-clamp-2 min-h-[2.5rem]">
                      {getItemName(item)}
                    </h3>

                    {/* Bonus Display */}
                    {(item.bonus || item.stats) && (
                      <div className="mb-3 px-3 py-1.5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40 rounded-xl border border-indigo-100 dark:border-indigo-800 shadow-sm">
                        <div className="flex flex-wrap justify-center gap-2">
                          {item.stats && Object.entries(item.stats).map(([stat, val]) => (
                            <div key={stat} className="flex items-center gap-1 bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded-lg border border-indigo-200/50 dark:border-indigo-700/50">
                              <span className="text-[10px] uppercase font-black text-indigo-600 dark:text-indigo-400">
                                {t(`stats.${stat}`)}
                              </span>
                              <span className="text-[10px] font-black text-gray-900 dark:text-white">
                                +{val}
                              </span>
                            </div>
                          ))}
                          {item.bonus && (
                            <p className="text-[10px] text-center font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-tight w-full mt-1">
                              {getBonusDescription(item)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Equip/Unequip Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggleEquip(item)}
                      disabled={loading === item.id}
                      className={`w-full py-3 rounded-xl font-black text-sm transition-all ${item.equipped
                        ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg'
                        }`}
                    >
                      {item.equipped ? <><Emoji emoji="✅" size={14} className="mr-1" /> {t('cosmetic.equipped')}</> : t('cosmetic.equip')}
                    </motion.button>
                  </motion.div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
};
