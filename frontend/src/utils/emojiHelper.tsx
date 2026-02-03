import Emoji from '../components/Emoji';

/**
 * Утилита для быстрого рендера эмодзи через компонент Emoji
 * Использование: {emoji('🎮', 24)}
 */
export const emoji = (emojiChar: string, size: number = 24, className: string = '') => {
  return <Emoji emoji={emojiChar} size={size} className={className} />;
};

/**
 * Маппинг часто используемых эмодзи для быстрого доступа
 */
export const EMOJIS = {
  // Валюта
  soms: '💰',
  crystals: '💎',
  
  // Статы
  hunger: '🍖',
  health: '❤️',
  mood: '😊',
  energy: '⚡',
  
  // Награды и достижения
  trophy: '🏆',
  medal: '🏅',
  star: '⭐',
  fire: '🔥',
  
  // Города и локации
  city: '🏙️',
  building: '🏛️',
  
  // Персонажи и классы
  merchant: '🤑',
  warrior: '⚔️',
  scholar: '📚',
  artisan: '🎨',
  chef: '👨‍🍳',
  user: '👤',
  
  // Действия
  work: '💼',
  shop: '🛍️',
  inventory: '📦',
  settings: '⚙️',
  referral: '👥',
  
  // Статусы
  lock: '🔒',
  check: '✓',
  cross: '✕',
  warning: '⚠️',
  info: 'ℹ️',
  
  // Разное
  gift: '🎁',
  rocket: '🚀',
  target: '🎯',
  heart: '💝',
} as const;
