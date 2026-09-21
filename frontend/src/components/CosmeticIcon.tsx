import { useState } from 'react';
import Emoji from './Emoji';

interface CosmeticIconProps {
    /** Emoji fallback when there is no image */
    emoji?: string;
    /** Path to the item image (/assets/cosmetics/<id>.png) */
    imageSrc?: string;
    size?: number;
    className?: string;
}

/**
 * Cosmetic item icon: image first, then emoji.
 *
 * Previously the store showed only the emoji from the API, which wasn't there,
 * so the cards looked empty.
 */
export const CosmeticIcon = ({ emoji, imageSrc, size = 48, className = '' }: CosmeticIconProps) => {
    const [failed, setFailed] = useState(false);

    if (!imageSrc || failed) {
        return <Emoji emoji={emoji || '🎁'} size={size} className={className} />;
    }

    return (
        <img
            src={imageSrc}
            alt={emoji || 'item'}
            width={size}
            height={size}
            loading="lazy"
            decoding="async"
            className={`object-contain ${className}`}
            style={{ width: size, height: size }}
            onError={() => setFailed(true)}
        />
    );
};

export default CosmeticIcon;
