import { memo, useMemo, useState } from 'react';

interface EmojiProps {
  emoji: string;
  size?: number;
  className?: string;
  style?: 'apple' | 'google' | 'twitter' | 'facebook' | 'microsoft';
}

// Maps popular emoji to local files (no network dependency)
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

/**
 * Emoji rendered as an image with a guaranteed fallback.
 *
 * Order: local file → CDN → system emoji as text. Previously an empty
 * value rendered a broken image (the card looked empty), and `crossOrigin`
 * broke CDN loading, so now the emoji never "disappears".
 */
const Emoji = memo(({ emoji, size = 24, className = '', style = 'apple' }: EmojiProps) => {
  const [failedLocal, setFailedLocal] = useState(false);
  const [failedCdn, setFailedCdn] = useState(false);

  const localFallback = emoji ? emojiToLocalFile[emoji] : undefined;

  const cdnUrl = useMemo(() => {
    return `https://emojicdn.elk.sh/${encodeURIComponent(emoji)}?style=${style}`;
  }, [emoji, style]);

  if (!emoji) {
    return null;
  }

  if (localFallback && !failedLocal) {
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
        onError={() => setFailedLocal(true)}
      />
    );
  }

  if (!failedCdn) {
    return (
      <img
        src={cdnUrl}
        alt={emoji}
        width={size}
        height={size}
        className={`inline-block ${className}`}
        style={{ verticalAlign: 'middle' }}
        loading="lazy"
        decoding="async"
        onError={() => setFailedCdn(true)}
      />
    );
  }

  // Last level: system emoji (works with no images at all)
  return (
    <span
      role="img"
      aria-label={emoji}
      className={`inline-block ${className}`}
      style={{ fontSize: `${size}px`, lineHeight: 1, verticalAlign: 'middle' }}
    >
      {emoji}
    </span>
  );
});

Emoji.displayName = 'Emoji';

export default Emoji;
