import { useState } from 'react';
import Emoji from './Emoji';

interface CosmeticIconProps {
    /** Эмодзи-заглушка, если картинки нет */
    emoji?: string;
    /** Путь к картинке предмета (/assets/cosmetics/<id>.png) */
    imageSrc?: string;
    size?: number;
    className?: string;
}

/**
 * Иконка косметического предмета: сначала картинка, затем эмодзи.
 *
 * Раньше витрина показывала только эмодзи из API, которого там не было,
 * поэтому карточки выглядели пустыми.
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
