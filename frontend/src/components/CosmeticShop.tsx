import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { PurchaseConfirmModal } from './PurchaseConfirmModal';
import Emoji from './Emoji';

type CosmeticType = 'clothing' | 'background' | 'accessory' | 'combat';
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
  stats?: {
    strength?: number;
    defense?: number;
    agility?: number;
    stamina?: number;
    intelligence?: number;
    luck?: number;
  };
  bonus?: {
    type: 'xp' | 'soms' | 'stats' | 'combat';
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

const typeEmojis: Record<CosmeticType, string> = {
  clothing: '👕',
  background: '🖼️',
  accessory: '💎',
  combat: '⚔️'
};

export const CosmeticShop = ({ items, playerCrystals, playerSoms, onPurchase, onEquip }: CosmeticShopProps) => {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<CosmeticType | 'all'>('all');
  const [loading, setLoading] = useState<string | null>(null);
  const [purchaseModal, setPurchaseModal] = useState<{
    isOpen: boolean;
    item: CosmeticItem | null;
  }>({ isOpen: false, item: null });

  const filteredItems = items ? (filter === 'all'
    ? items
    : filter === 'combat'
      ? items.filter(item => item.stats && (item.stats.strength || item.stats.defense || item.stats.agility || item.stats.stamina || item.stats.intelligence || item.stats.luck))
      : items.filter(item => item.type === filter)) : [];

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
      setPurchaseModal({ isOpen: false, item: null });
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

  const openPurchaseModal = (item: CosmeticItem) => {
    setPurchaseModal({ isOpen: true, item });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-black dark:from-black dark:via-black dark:to-black p-4 pb-32">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 mb-6 border border-white/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              {t('cosmetic.shopTitle', 'Магазин')}
            </h1>

            {/* Currency Display */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full text-white font-black shadow-lg text-sm">
                <Emoji emoji="💰" size={16} />
                <span>{playerSoms?.toLocaleString() || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full text-white font-black shadow-lg text-sm">
                <Emoji emoji="💎" size={16} />
                <span>{playerCrystals || 0}</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {(['all', 'clothing', 'background', 'accessory', 'combat'] as const).map((type) => (
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
              {t('cosmetic.noItems')}
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
                    className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-4 border-2 relative overflow-hidden w-full ${item.rarity === 'legendary' ? 'shadow-[0_0_20px_rgba(251,191,36,0.2)]' : ''}`}
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

                    {/* Owned Badge */}
                    {item.owned && (
                      <div className="absolute top-11 left-2 z-10">
                        <div className="w-6 h-6 rounded-full bg-green-500 shadow-lg flex items-center justify-center">
                          <span className="text-white text-xs font-black">✓</span>
                        </div>
                      </div>
                    )}

                    {/* Item Icon */}
                    <div className="w-full aspect-square max-h-64 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-3 shadow-inner relative overflow-hidden mx-auto"
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
                        <Emoji emoji={item.icon} size={72} />
                      </motion.div>
                      {item.equipped && (
                        <div className="absolute inset-0 bg-gradient-to-t from-green-500/30 to-transparent" />
                      )}
                    </div>

                    {/* Item Name */}
                    <h3 className="font-black text-gray-900 dark:text-white text-base mb-2 text-center line-clamp-2 min-h-[2.5rem]">
                      {getItemName(item)}
                    </h3>

                    {/* Combat Stats */}
                    {item.stats && (
                      <div className="flex flex-wrap gap-1 justify-center mb-2">
                        {item.stats.strength ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">⚔️+{item.stats.strength}</span> : null}
                        {item.stats.defense ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">🛡️+{item.stats.defense}</span> : null}
                        {item.stats.agility ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">💨+{item.stats.agility}</span> : null}
                        {item.stats.stamina ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">❤️+{item.stats.stamina}</span> : null}
                        {item.stats.intelligence ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">🧠+{item.stats.intelligence}</span> : null}
                        {item.stats.luck ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">🍀+{item.stats.luck}</span> : null}
                      </div>
                    )}

                    {/* Price Display */}
                    {!item.owned && (
                      <div className="mb-3 flex gap-2 justify-center">
                        {item.priceSoms && (
                          <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl text-white font-black text-sm shadow-lg">
                            <Emoji emoji="💰" size={20} />
                            <span>{item.priceSoms.toLocaleString()}</span>
                          </div>
                        )}
                        {item.priceCrystals && (
                          <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl text-white font-black text-sm shadow-lg">
                            <Emoji emoji="💎" size={20} />
                            <span>{item.priceCrystals}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    {item.owned ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEquip(item.id)}
                        disabled={item.equipped || loading === item.id}
                        className={`w-full py-3 rounded-xl font-black text-sm transition-all ${item.equipped
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg'
                          }`}
                      >
                        {item.equipped ? <div className="flex items-center justify-center gap-2"><Emoji emoji="✅" size={16} /> <span>{t('cosmetic.equipped')}</span></div> : t('cosmetic.equip')}
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openPurchaseModal(item)}
                        disabled={loading === item.id}
                        className="w-full py-3 rounded-xl font-black text-sm transition-all bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg"
                      >
                        {t('cosmetic.buy', 'Купить')}
                      </motion.button>
                    )}
                  </motion.div>
                </div>
              )
            })}
          </div>
        )}

        {/* Purchase Confirmation Modal */}
        {purchaseModal.item && (
          <PurchaseConfirmModal
            isOpen={purchaseModal.isOpen}
            itemName={getItemName(purchaseModal.item)}
            itemIcon={purchaseModal.item.icon}
            itemRarity={purchaseModal.item.rarity}
            priceSoms={purchaseModal.item.priceSoms}
            priceCrystals={purchaseModal.item.priceCrystals}
            playerSoms={playerSoms}
            playerCrystals={playerCrystals}
            bonus={purchaseModal.item.bonus ? {
              type: purchaseModal.item.bonus.type,
              value: purchaseModal.item.bonus.value,
              description: getBonusDescription(purchaseModal.item)
            } : undefined}
            onConfirm={(currency) => handlePurchase(purchaseModal.item!.id, currency)}
            onCancel={() => setPurchaseModal({ isOpen: false, item: null })}
            loading={loading === purchaseModal.item.id}
          />
        )}
      </div>
    </div>
  );
};
