import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { PurchaseConfirmModal } from './PurchaseConfirmModal';
import Emoji from './Emoji';
import CosmeticIcon from './CosmeticIcon';
import { mergeCosmeticItems } from '../utils/cosmetics';

type CosmeticType = 'clothing' | 'background' | 'accessory' | 'equipment' | 'backpack' | 'combat';

interface CosmeticItem {
  id: string;
  name: string | { ru: string; en: string; uz: string; uk: string };
  type: CosmeticType;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  priceSoms?: number;
  priceCrystals?: number;
  icon: string;
  /** Item art at /assets/cosmetics/<id>.png — falls back to the emoji above */
  imageSrc?: string;
  owned: boolean;
  equipped: boolean;
  ownedCount?: number;
  stats?: {
    strength?: number;
    defense?: number;
    agility?: number;
    stamina?: number;
    intelligence?: number;
    luck?: number;
  };
  bonus?: {
    type: 'xp' | 'soms' | 'stats' | 'combat' | 'mood' | 'health' | 'hunger' | 'energy';
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
  onUnequip?: (itemId: string) => Promise<void>;
  onSell?: (itemId: string) => Promise<void>;
}

/** Filter tabs. `owned` is the player's own inventory, not a catalog category */
type ShopFilter = CosmeticType | 'all' | 'owned';

const FILTERS: ShopFilter[] = ['all', 'clothing', 'equipment', 'accessory', 'background', 'owned'];

const rarityBorder: Record<CosmeticItem['rarity'], string> = {
  common: '#d1d5db',
  rare: '#60a5fa',
  epic: '#c084fc',
  legendary: '#fbbf24'
};

const rarityText: Record<CosmeticItem['rarity'], string> = {
  common: 'text-gray-600 dark:text-gray-300',
  rare: 'text-blue-600 dark:text-blue-400',
  epic: 'text-purple-600 dark:text-purple-400',
  legendary: 'text-yellow-600 dark:text-yellow-400'
};

const typeEmojis: Record<string, string> = {
  clothing: '👕',
  background: '🖼️',
  accessory: '💎',
  combat: '⚔️',
  equipment: '⚔️',
  backpack: '🎒'
};

const STAT_ROWS: Array<{ key: keyof NonNullable<CosmeticItem['stats']>; emoji: string; className: string }> = [
  { key: 'strength', emoji: '⚔️', className: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  { key: 'defense', emoji: '🛡️', className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
  { key: 'agility', emoji: '💨', className: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
  { key: 'stamina', emoji: '❤️', className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
  { key: 'intelligence', emoji: '🧠', className: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
  { key: 'luck', emoji: '🍀', className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' }
];

export const CosmeticShop = ({ items, playerCrystals, playerSoms, onPurchase, onEquip, onUnequip, onSell }: CosmeticShopProps) => {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<ShopFilter>('all');
  const [loading, setLoading] = useState<string | null>(null);
  const [purchaseModal, setPurchaseModal] = useState<{ isOpen: boolean; item: CosmeticItem | null }>({ isOpen: false, item: null });

  const allItems = mergeCosmeticItems(items || []) as CosmeticItem[];

  const filteredItems: CosmeticItem[] = (() => {
    if (filter === 'all') return allItems;
    if (filter === 'owned') return allItems.filter((item) => item.owned);
    return allItems.filter((item) => item.type === filter);
  })();

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

  const sellAmount = (item: CosmeticItem): { emoji: string; amount: number } | null => {
    if (item.priceSoms) return { emoji: '💰', amount: Math.floor(item.priceSoms * 0.5) };
    if (item.priceCrystals) return { emoji: '💎', amount: Math.floor(item.priceCrystals * 0.5) };
    return null;
  };

  const handlePurchase = async (itemId: string, currency: 'soms' | 'crystals') => {
    setLoading(itemId);
    try {
      await onPurchase(itemId, currency);
      toast.success(t('cosmetic.purchaseSuccess'));
      setPurchaseModal({ isOpen: false, item: null });
    } catch {
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
    } catch {
      toast.error(t('cosmetic.equipFailed', 'Не удалось надеть предмет'));
    } finally {
      setLoading(null);
    }
  };

  const handleUnequip = async (itemId: string) => {
    if (!onUnequip) return;
    setLoading(itemId);
    try {
      await onUnequip(itemId);
      toast.success(t('cosmetic.unequipSuccess', 'Предмет снят'));
    } catch {
      toast.error(t('cosmetic.unequipFailed', 'Не удалось снять предмет'));
    } finally {
      setLoading(null);
    }
  };

  const handleSell = async (item: CosmeticItem) => {
    if (!onSell) return;
    if (!window.confirm(t('cosmetic.sellConfirm', 'Продать «{{name}}»? Предмет исчезнет из инвентаря.', { name: getItemName(item) }))) {
      return;
    }
    setLoading(item.id);
    try {
      await onSell(item.id);
      toast.success(t('cosmetic.sellSuccess', 'Продано!'));
    } catch {
      toast.error(t('cosmetic.sellFailed', 'Не удалось продать предмет'));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 pb-32">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 mb-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h1 className="text-xl font-black text-gray-900 dark:text-white">
              {t('cosmetic.shopTitle', 'Магазин')}
            </h1>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-black text-sm">
                <Emoji emoji="💰" size={16} />
                {playerSoms?.toLocaleString() || 0}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-black text-sm">
                <Emoji emoji="💎" size={16} />
                {playerCrystals || 0}
              </span>
            </div>
          </div>

          {/* Filters: sized by their own text and scrolled horizontally on small screens */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {FILTERS.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`shrink-0 px-4 py-2 rounded-full font-bold text-xs whitespace-nowrap transition-colors ${
                  filter === type
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {type === 'owned' ? t('cosmetic.filter.owned', 'Инвентарь') : t(`cosmetic.filter.${type}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Items */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-4"><Emoji emoji="🛍️" size={72} /></div>
            <p className="text-xl font-bold text-gray-600 dark:text-gray-400">
              {filter === 'owned' ? t('inventory.empty', 'Инвентарь пуст') : t('cosmetic.noItems')}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const refund = sellAmount(item);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-2xl p-3 border-2"
                  style={{ borderColor: rarityBorder[item.rarity] }}
                >
                  {/* Badges row: fixed height keeps every card aligned */}
                  <div className="flex items-center gap-1.5 mb-2 min-h-[22px]">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] font-black text-gray-600 dark:text-gray-300">
                      <Emoji emoji={typeEmojis[item.type] || '🎁'} size={12} />
                      {t(`cosmetic.filter.${item.type}`, item.type)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] font-black uppercase ${rarityText[item.rarity]}`}>
                      {t(`cosmetic.rarity.${item.rarity}`)}
                    </span>
                  </div>

                  {/* Item art */}
                  <div className="w-full aspect-square rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-3 overflow-hidden">
                    <CosmeticIcon emoji={item.icon} imageSrc={item.imageSrc} size={96} />
                  </div>

                  <h3 className="font-black text-gray-900 dark:text-white text-sm text-center line-clamp-2 min-h-[2.5rem] mb-2">
                    {getItemName(item)}
                  </h3>

                  {/* Reserves a fixed block so bonus items are not taller than plain ones */}
                  <div className="min-h-[3.5rem] mb-3">
                    {item.stats && Object.keys(item.stats).length > 0 ? (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {STAT_ROWS.map(({ key, emoji, className }) =>
                          item.stats?.[key] ? (
                            <span key={key} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${className}`}>
                              {emoji}+{item.stats[key]}
                            </span>
                          ) : null
                        )}
                      </div>
                    ) : item.bonus ? (
                      <p className="text-[11px] font-bold text-center text-emerald-600 dark:text-emerald-400">
                        {getBonusDescription(item)}
                      </p>
                    ) : (
                      <p className="text-[11px] text-center text-gray-400">{t('cosmetic.noBonus', 'Без бонусов')}</p>
                    )}
                  </div>

                  {/* Price or owned label */}
                  <div className="min-h-[2rem] mb-2 flex items-center justify-center">
                    {item.owned ? (
                      <span className="flex items-center gap-1 text-xs font-black text-green-600 dark:text-green-400">
                        <Emoji emoji="✅" size={14} /> {t('cosmetic.owned')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {item.priceSoms ? (
                          <span className="flex items-center gap-1 text-sm font-black text-gray-900 dark:text-white">
                            <Emoji emoji="💰" size={16} /> {item.priceSoms.toLocaleString()}
                          </span>
                        ) : null}
                        {item.priceCrystals ? (
                          <span className="flex items-center gap-1 text-sm font-black text-gray-900 dark:text-white">
                            <Emoji emoji="💎" size={16} /> {item.priceCrystals}
                          </span>
                        ) : null}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-auto space-y-2">
                    {item.owned ? (
                      <>
                        <button
                          onClick={() => (item.equipped ? handleUnequip(item.id) : handleEquip(item.id))}
                          disabled={loading === item.id || (item.equipped && !onUnequip)}
                          className={`w-full py-2.5 rounded-xl font-black text-xs transition-colors ${
                            item.equipped
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-800'
                              : 'bg-indigo-500 text-white'
                          }`}
                        >
                          {item.equipped ? t('cosmetic.equipped') : t('cosmetic.equip')}
                        </button>
                        {onSell && (
                          <button
                            onClick={() => handleSell(item)}
                            disabled={loading === item.id}
                            className="w-full py-2 rounded-xl font-bold text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                          >
                            {refund
                              ? t('cosmetic.sellFor', 'Продать за {{amount}} {{emoji}}', { amount: refund.amount.toLocaleString(), emoji: refund.emoji })
                              : t('cosmetic.sell', 'Продать')}
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => setPurchaseModal({ isOpen: true, item })}
                        disabled={loading === item.id}
                        className="w-full py-2.5 rounded-xl font-black text-xs bg-indigo-500 text-white"
                      >
                        {t('cosmetic.buy', 'Купить')}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

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

export default CosmeticShop;
