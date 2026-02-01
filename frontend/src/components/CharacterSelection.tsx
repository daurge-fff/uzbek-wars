import { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface Character {
  id: string;
  name: string;
  avatar: string;
  description: string;
}

interface CharacterSelectionProps {
  characters: Character[];
  onSelect: (characterId: string) => void;
}

export const CharacterSelection = ({ characters, onSelect }: CharacterSelectionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { t } = useTranslation();

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentIndex < characters.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    },
    onSwipedRight: () => {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    },
    trackMouse: true
  });

  const currentCharacter = characters[currentIndex];

  const cardVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background-primary p-4">
      <h1 className="text-2xl font-bold text-text-primary mb-8">
        {t('character.select')}
      </h1>

      <div {...handlers} className="relative w-full max-w-sm h-96 mb-8">
        <AnimatePresence initial={false} custom={currentIndex}>
          <motion.div
            key={currentCharacter.id}
            custom={currentIndex}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="absolute w-full"
          >
            <div className="bg-white rounded-2xl shadow-xl p-6 min-h-touch">
              <div className="w-full h-48 bg-background-secondary rounded-xl mb-4 flex items-center justify-center">
                <img
                  src={currentCharacter.avatar}
                  alt={currentCharacter.name}
                  className="w-32 h-32 object-contain"
                />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">
                {currentCharacter.name}
              </h2>
              <p className="text-text-secondary">
                {currentCharacter.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex gap-2 mb-8">
        {characters.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-colors min-h-touch min-w-touch ${
              index === currentIndex ? 'bg-primary' : 'bg-gray-300'
            }`}
            aria-label={`Select character ${index + 1}`}
          />
        ))}
      </div>

      <button
        onClick={() => onSelect(currentCharacter.id)}
        className="min-h-touch w-full max-w-sm bg-primary text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-primary-dark transition-colors"
      >
        {t('ui.confirm')}
      </button>
    </div>
  );
};
