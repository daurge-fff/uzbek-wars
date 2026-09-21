import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import toast from 'react-hot-toast';
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
  /** Item art at /assets/cosmetics/<id>.png — falls back to the emoji above */
  imageSrc?: string;
  owned: boolean;
  equipped: boolean;
  priceSoms?: number;
  priceCrystals?: number;
  bonus?: {
    type: 'xp' | 'soms' | 'stats' | 'combat' | 'mood' | 'health' | 'hunger' | 'energy';
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
  onSell?: (itemId: string) => Promise<void>;
}

const rarityBorder: Record<CosmeticRarity, string> = {
  common: '#d1d5db',
  rare: '#60a5fa',
  epic: '#c084fc',
  legendary: '#fbbf24'
};

const rarityText: Record<CosmeticRarity, string> = {
  common: 'text-gray-600 dark:text-gray-300',
  rare: 'text-blue-600 dark:text-blue-400',
  epic: 'text-purple-600 dark:text-purple-400',
  legendary: 'text-yellow-600 dark:text-yellow-400'
};

const STAT_ROWS: Array<{ key: keyof NonNullable<CosmeticItem['stats']>; emoji: string; className: string }> = [
  { key: 'strength', emoji: '⚔️', className: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' },
  { key: 'defense', emoji: '🛡️', className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
  { key: 'agility', emoji: '💨', className: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
  { key: 'stamina', emoji: '❤️', className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
  { key: 'intelligence', emoji: '🧠', className: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
  { key: 'luck', emoji: '🍀', className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' }
];

export const Inventory = ({ items, onEquip, onUnequip, onSell }: InventoryProps) => {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<CosmeticType | 'all'>('all');
  const [loading, setLoading] = useState<string | null>(null);

  const ownedItems = mergeCosmeticItems(items ? items.filter((item) => item.owned) : []) as CosmeticItem[];
  const filteredItems = filter === 'all' ? ownedItems : ownedItems.filter((item) => item.type === filter);

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

  const runAction = async (itemId: string, action: () => Promise<void>, successText: string, errorText: string) => {
    setLoading(itemId);
    try {
      await action();
      toast.success(successText);
    } catch {
      toast.error(errorText);
    } finally {
      setLoading(null);
    }
  };

  const handleSell = (item: CosmeticItem) => {
    if (!onSell) return;
    if (!window.confirm(t('cosmetic.sellConfirm', 'Продать «{{name}}»? Предмет исчезнет из инвентаря.', { name: getItemName(item) }))) {
      return;
    }
    return runAction(item.id, () => onSell(item.id), t('cosmetic.sellSuccess', 'Продано!'), t('cosmetic.sellFailed', 'Не удалось продать предмет'));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 pb-32">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-5">
          {t('inventory.title', 'Инвентарь')}
        </h1>

        {/* Filters: natural width, horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-5">
          {(['all', 'clothing', 'equipment', 'accessory', 'background', 'backpack'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`shrink-0 px-4 py-2 rounded-full font-bold text-xs whitespace-nowrap transition-colors ${
                filter === type
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {t(`cosmetic.filter.${type}`)}
            </button>
          ))}
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-4"><Emoji emoji="📦" size={72} /></div>
            <p className="text-xl font-bold text-gray-600 dark:text-gray-400">{t('inventory.empty')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('inventory.emptyHint')}</p>
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
                  <div className="flex items-center gap-1.5 mb-2 min-h-[22px]">
                    <span className={`px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] font-black uppercase ${rarityText[item.rarity]}`}>
                      {t(`cosmetic.rarity.${item.rarity}`)}
                    </span>
                    {item.equipped && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-[10px] font-black text-green-700 dark:text-green-400">
                        <Emoji emoji="✅" size={12} /> {t('inventory.equipped')}
                      </span>
                    )}
                  </div>

                  <div className="w-full aspect-square rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-3 overflow-hidden">
                    <CosmeticIcon emoji={item.icon} imageSrc={item.imageSrc} size={96} />
                  </div>

                  <h3 className="font-black text-gray-900 dark:text-white text-sm text-center line-clamp-2 min-h-[2.5rem] mb-2">
                    {getItemName(item)}
                  </h3>

                  {/* Fixed-height bonus block keeps all cards the same height */}
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

                  <div className="mt-auto space-y-2">
                    <button
                      onClick={() =>
                        runAction(
                          item.id,
                          () => (item.equipped ? onUnequip(item.id) : onEquip(item.id)),
                          item.equipped ? t('cosmetic.unequipSuccess', 'Предмет снят') : t('cosmetic.equipSuccess'),
                          item.equipped ? t('cosmetic.unequipFailed', 'Не удалось снять предмет') : t('cosmetic.equipFailed', 'Не удалось надеть предмет')
                        )
                      }
                      disabled={loading === item.id}
                      className={`w-full py-2.5 rounded-xl font-black text-xs transition-colors ${
                        item.equipped
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                          : 'bg-indigo-500 text-white'
                      }`}
                    >
                      {item.equipped ? t('inventory.unequip', 'Снять') : t('inventory.equip', 'Надеть')}
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
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
