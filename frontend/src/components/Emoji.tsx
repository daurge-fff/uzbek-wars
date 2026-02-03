import { memo, useMemo } from 'react';

interface EmojiProps {
  emoji: string;
  size?: number;
  className?: string;
  style?: 'apple' | 'google' | 'twitter' | 'facebook' | 'microsoft';
}

const Emoji = memo(({ emoji, size = 24, className = '', style = 'apple' }: EmojiProps) => {
  // Генерируем URL с использованием emojicdn.elk.sh
  const imageUrl = useMemo(() => {
    // API автоматически обрабатывает эмодзи и возвращает PNG высокого качества
    return `https://emojicdn.elk.sh/${emoji}?style=${style}`;
  }, [emoji, style]);

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
    />
  );
});

Emoji.displayName = 'Emoji';

export default Emoji;
