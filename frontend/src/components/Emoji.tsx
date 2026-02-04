import { memo, useMemo, useState } from 'react';

interface EmojiProps {
  emoji: string;
  size?: number;
  className?: string;
  style?: 'apple' | 'google' | 'twitter' | 'facebook' | 'microsoft';
}

// Маппинг популярных эмодзи на локальные файлы
const emojiToLocalFile: Record<string, string> = {
  '🏆': '/emoji-fallback/trophy.png',
  '👤': '/emoji-fallback/user.png',
  '🍖': '/emoji-fallback/meat.png',
  '👋': '/emoji-fallback/wave.png',
  '⚡': '/emoji-fallback/energy.png',
  '❤️': '/emoji-fallback/heart.png',
  '🇷🇺': '/emoji-fallback/flag-ru.png',
  '🇺🇿': '/emoji-fallback/flag-uz.png',
  '🇺🇦': '/emoji-fallback/flag-ua.png',
  '🇬🇧': '/emoji-fallback/flag-gb.png',
  '🎯': '/emoji-fallback/target.png',
  '🏛️': '/emoji-fallback/building.png',
  '💰': '/emoji-fallback/money.png',
  '💎': '/emoji-fallback/gem.png',
  '😊': '/emoji-fallback/smile.png',
  'ℹ️': '/emoji-fallback/info.png',
  '⏱️': '/emoji-fallback/stopwatch.png',
  '⏳': '/emoji-fallback/hourglass.png',
  '⚔️': '/emoji-fallback/swords.png',
  '⚙️': '/emoji-fallback/gear.png',
  '✅': '/emoji-fallback/check.png',
  '✈️': '/emoji-fallback/plane.png',
  '✨': '/emoji-fallback/sparkles.png',
  '❌': '/emoji-fallback/cross.png',
  '⭐': '/emoji-fallback/star.png',
  '🌍': '/emoji-fallback/earth.png',
  '🍀': '/emoji-fallback/clover.png',
  '🎉': '/emoji-fallback/party.png',
  '🎨': '/emoji-fallback/art.png',
  '🎮': '/emoji-fallback/game.png',
  '🎵': '/emoji-fallback/music.png',
  '🏙️': '/emoji-fallback/cityscape.png',
  '🏜️': '/emoji-fallback/desert.png',
  '🏠': '/emoji-fallback/home.png',
  '👑': '/emoji-fallback/crown.png',
  '👥': '/emoji-fallback/users.png',
  '👨‍💻': '/emoji-fallback/developer.png',
  '💝': '/emoji-fallback/heart-gift.png',
  '💥': '/emoji-fallback/boom.png',
  '💪': '/emoji-fallback/biceps.png',
  '💸': '/emoji-fallback/money-wings.png',
  '📅': '/emoji-fallback/calendar.png',
  '📊': '/emoji-fallback/chart.png',
  '📋': '/emoji-fallback/clipboard.png',
  '📍': '/emoji-fallback/pin.png',
  '📜': '/emoji-fallback/scroll.png',
  '📦': '/emoji-fallback/box.png',
  '🔄': '/emoji-fallback/refresh.png',
  '🔊': '/emoji-fallback/speaker.png',
  '🔒': '/emoji-fallback/lock.png',
  '🔔': '/emoji-fallback/bell.png',
  '🗺️': '/emoji-fallback/map.png',
  '🚀': '/emoji-fallback/rocket.png',
  '🛍️': '/emoji-fallback/bags.png',
  '🛡️': '/emoji-fallback/shield.png',
};

const Emoji = memo(({ emoji, size = 24, className = '', style = 'apple' }: EmojiProps) => {
  const [imageError, setImageError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);
  const [useLocal, setUseLocal] = useState(false);

  // Локальный fallback файл
  const localFallback = emojiToLocalFile[emoji];

  // Генерируем URL с использованием emojicdn.elk.sh
  const imageUrl = useMemo(() => {
    return `https://emojicdn.elk.sh/${emoji}?style=${style}`;
  }, [emoji, style]);

  // Проверяем наличие локального файла при монтировании
  useMemo(() => {
    if (localFallback) {
      // Если есть локальный файл, проверяем его доступность
      const img = new Image();
      img.onload = () => setUseLocal(true);
      img.onerror = () => setUseLocal(false);
      img.src = localFallback;
    }
  }, [localFallback]);

  // Если обе загрузки не удались, показываем текстовый эмодзи
  if (imageError && (fallbackError || !localFallback)) {
    return (
      <span
        className={`inline-block ${className}`}
        style={{ fontSize: `${size}px`, lineHeight: 1, verticalAlign: 'middle' }}
      >
        {emoji}
      </span>
    );
  }

  // Если есть локальный файл и он доступен, используем его
  if (localFallback && (useLocal || imageError)) {
    return (
      <img
        src={localFallback}
        alt={emoji}
        width={size}
        height={size}
        className={`inline-block ${className}`}
        style={{ verticalAlign: 'middle' }}
        loading="lazy"
        decoding="async"
        onError={() => setFallbackError(true)}
      />
    );
  }

  // Основная загрузка с CDN (только если нет локального файла)
  return (
    <img
      src={imageUrl}
      alt={emoji}
      width={size}
      height={size}
      className={`inline-block ${className}`}
      style={{ verticalAlign: 'middle' }}
      loading="lazy"
      decoding="async"
      crossOrigin="anonymous"
      onError={() => setImageError(true)}
    />
  );
});

Emoji.displayName = 'Emoji';

export default Emoji;
