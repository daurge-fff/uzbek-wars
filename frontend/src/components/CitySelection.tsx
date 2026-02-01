import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface City {
  cityId: string;
  name: {
    ru: string;
    uz: string;
    uk: string;
    en: string;
  };
  playerCount: number;
  maxPlayers: number;
  isOpen: boolean;
  theme: {
    primaryColor: string;
    backgroundImage: string;
  };
}

interface CitySelectionProps {
  cities: City[];
  onSelect: (cityId: string) => void;
}

export const CitySelection = ({ cities, onSelect }: CitySelectionProps) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language as 'ru' | 'uz' | 'uk' | 'en';

  const getCityName = (city: City) => {
    return city.name[currentLang] || city.name.ru;
  };

  const getOccupancyPercentage = (city: City) => {
    return Math.round((city.playerCount / city.maxPlayers) * 100);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-background-primary p-4">
      <h1 className="text-2xl font-bold text-text-primary mb-8">
        {t('cities.select')}
      </h1>

      <div className="w-full max-w-md space-y-4">
        {cities.map((city, index) => {
          const occupancy = getOccupancyPercentage(city);
          const isAlmostFull = occupancy >= 80;

          return (
            <motion.button
              key={city.cityId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => city.isOpen && onSelect(city.cityId)}
              disabled={!city.isOpen}
              className={`w-full min-h-touch p-4 rounded-xl shadow-md transition-all ${
                city.isOpen
                  ? 'bg-white hover:shadow-lg'
                  : 'bg-gray-200 opacity-60 cursor-not-allowed'
              }`}
              style={{
                borderLeft: `4px solid ${city.theme.primaryColor}`
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-text-primary">
                  {getCityName(city)}
                </h3>
                {!city.isOpen && (
                  <span className="text-xs bg-danger text-white px-2 py-1 rounded">
                    {t('cities.full')}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isAlmostFull ? 'bg-warning' : 'bg-success'
                    }`}
                    style={{ width: `${occupancy}%` }}
                  />
                </div>
                <span className="text-sm text-text-secondary">
                  {city.playerCount}/{city.maxPlayers}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
