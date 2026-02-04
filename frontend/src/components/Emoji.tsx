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
