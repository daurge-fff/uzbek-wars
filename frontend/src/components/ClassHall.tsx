import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';

interface ClassData {
  id: string;
  avatar: string;
  tier: number;
  requiredLevel: number;
  name: {
    ru: string;
    uz: string;
    uk: string;
    en: string;
  };
  description: {
    ru: string;
    uz: string;
    uk: string;
    en: string;
  };
  strengths: {
    ru: string;
    uz: string;
    uk: string;
    en: string;
  };
  weaknesses: {
    ru: string;
    uz: string;
    uk: string;
    en: string;
  };
  uniqueAbility?: string | null;
  uniqueAbilityDescription?: {
    ru: string;
    uz: string;
    uk: string;
    en: string;
  };
}

interface ClassHallProps {
  currentClass?: string;
  currentLevel?: number;
  playerSoms?: number;
  playerCrystals?: number;
  onClassChange?: (classId: string) => void;
}

const ClassHall: React.FC<ClassHallProps> = ({
  onClassChange,
}) => {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const [classes, setClasses] = useState<{
    tier1: ClassData[];
    tier2: ClassData[];
    tier3: ClassData[];
  } | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentClass, setCurrentClass] = useState('char_trader');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [playerSoms, setPlayerSoms] = useState(0);
  const [playerCrystals, setPlayerCrystals] = useState(0);

  useEffect(() => {
    fetchPlayerData();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (token) {
      fetchPlayerData();
    }
  }, [token]);

  const fetchPlayerData = async () => {
    try {
      if (!token) {
        console.log('No token found');
        return;
      }
      
      const response = await fetch('/api/player/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        console.error('Failed to fetch player data:', response.status);
        return;
      }
      
      const data = await response.json();
      console.log('Player data loaded:', data);
      if (data.player) {
        setCurrentClass(data.player.characterId);
        setCurrentLevel(data.player.level);
        setPlayerSoms(data.player.soms);
        setPlayerCrystals(data.player.donationCurrency);
      }
    } catch (error) {
      console.error('Failed to fetch player data:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/characters/by-tier', {
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
      });
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierBadge = (tier: number) => {
    const badges = {
      1: { label: t('character.tier1'), color: 'from-gray-400 to-gray-600', number: '1' },
      2: { label: t('character.tier2'), color: 'from-blue-400 to-purple-600', number: '2' },
      3: { label: t('character.tier3'), color: 'from-yellow-400 to-orange-600', number: '3' },
    };
    return badges[tier as keyof typeof badges];
  };

  const getChangeCost = (tier: number) => {
    if (tier === 1) return { soms: 1000, crystals: 10 };
    if (tier === 2) return { soms: 3000, crystals: 50 };
    if (tier === 3) return { soms: 10000, crystals: 200 };
    return { soms: 0, crystals: 0 };
  };

  const canAffordClass = (classData: ClassData) => {
    const cost = getChangeCost(classData.tier);
    return playerSoms >= cost.soms && playerCrystals >= cost.crystals;
  };

  const isClassLocked = (classData: ClassData) => {
    return currentLevel < classData.requiredLevel;
  };

  const handleClassSelect = (classData: ClassData) => {
    if (classData.id === currentClass) return;
    if (isClassLocked(classData)) return;
    
    setSelectedClass(classData);
    setShowConfirmModal(true);
  };

  const confirmClassChange = async () => {
    if (!selectedClass) return;

    try {
      if (!token) {
        return;
      }

      const response = await fetch('/api/player/change-class', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ characterId: selectedClass.id }),
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      
      // Обновляем локальное состояние
      setCurrentClass(selectedClass.id);
      if (data.player) {
        setPlayerSoms(data.player.soms);
        setPlayerCrystals(data.player.donationCurrency);
      }
      
      setShowConfirmModal(false);
      setSelectedClass(null);
      
      // Уведомляем родительский компонент
      if (onClassChange) {
        onClassChange(selectedClass.id);
      }

      // Перезагружаем данные игрока
      await fetchPlayerData();
    } catch (error) {
      console.error('Failed to change class:', error);
    }
  };

  const renderClassCard = (classData: ClassData) => {
    const isLocked = isClassLocked(classData);
    const isCurrent = classData.id === currentClass;
    const canAfford = canAffordClass(classData);
    const tierBadge = getTierBadge(classData.tier);
    const lang = i18n.language as 'ru' | 'uz' | 'uk' | 'en';

    return (
      <motion.div
        key={classData.id}
        whileTap={!isLocked && !isCurrent ? { scale: 0.98 } : {}}
        onClick={() => !isLocked && !isCurrent && handleClassSelect(classData)}
        className={`relative flex-shrink-0 w-[340px] h-[480px] rounded-2xl p-4 backdrop-blur-xl border-2 transition-all duration-300 overflow-hidden ${
          isCurrent
            ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 dark:from-green-500/30 dark:to-emerald-600/30 border-green-400 dark:border-green-500 shadow-lg shadow-green-500/20'
            : isLocked
            ? 'bg-gray-900/90 border-gray-700/50 opacity-30 cursor-not-allowed'
            : canAfford
            ? 'bg-white/80 dark:bg-gray-800/80 border-white/30 dark:border-gray-700/50 hover:border-purple-400 dark:hover:border-purple-500 cursor-pointer hover:shadow-xl'
            : 'bg-red-900/20 dark:bg-red-900/30 border-red-700/50 cursor-not-allowed opacity-60'
        }`}
        style={{ userSelect: 'none' }}
      >
        {/* Tier Badge */}
        <div className={`absolute top-4 right-4 w-10 h-10 rounded-full bg-gradient-to-r ${tierBadge.color} text-white text-lg font-black flex items-center justify-center shadow-lg`}>
          {tierBadge.number}
        </div>

        {/* Lock Overlay */}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-2xl backdrop-blur-md z-10">
            <div className="text-center px-4">
              <div className="text-6xl mb-3">🔒</div>
              <div className="text-white font-bold text-lg">
                Lvl {classData.requiredLevel}
              </div>
            </div>
          </div>
        )}

        {/* Current Badge */}
        {isCurrent && (
          <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-green-500 text-white text-2xl flex items-center justify-center shadow-lg">
            ✓
          </div>
        )}

        {/* Avatar */}
        <div className="text-5xl mb-2 text-center">{classData.avatar}</div>

        {/* Name */}
        <h3 className="text-lg font-black text-gray-900 dark:text-white text-center mb-1">
          {classData.name[lang]}
        </h3>

        {/* Description */}
        <p className="text-xs text-gray-600 dark:text-gray-400 text-center mb-3 leading-tight">
          {classData.description[lang]}
        </p>

        {/* Strengths */}
        <div className="mb-2 p-2 rounded-xl bg-green-100/80 dark:bg-green-900/30 border border-green-300 dark:border-green-700/50">
          <div className="text-[10px] font-bold text-green-700 dark:text-green-400 mb-1">
            {t('character.strengths')}
          </div>
          <div className="text-[10px] text-green-800 dark:text-green-200 whitespace-pre-line leading-relaxed">
            {classData.strengths[lang]}
          </div>
        </div>

        {/* Weaknesses */}
        <div className="mb-2 p-2 rounded-xl bg-red-100/80 dark:bg-red-900/30 border border-red-300 dark:border-red-700/50">
          <div className="text-[10px] font-bold text-red-700 dark:text-red-400 mb-1">
            {t('character.weaknesses')}
          </div>
          <div className="text-[10px] text-red-800 dark:text-red-200 whitespace-pre-line leading-relaxed">
            {classData.weaknesses[lang]}
          </div>
        </div>

        {/* Unique Ability */}
        {classData.uniqueAbilityDescription && (
          <div className="p-2 rounded-xl bg-purple-100/80 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700/50">
            <div className="text-[10px] font-bold text-purple-700 dark:text-purple-400 mb-1">
              🌟 {t('character.uniqueAbility')}
            </div>
            <div className="text-[10px] text-purple-800 dark:text-purple-200 leading-relaxed">
              {classData.uniqueAbilityDescription[lang]}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const renderCarousel = (tierClasses: ClassData[], tier: number) => {
    const tierBadge = getTierBadge(tier);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: tier * 0.1 }}
        className="relative rounded-3xl p-5 backdrop-blur-2xl bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-gray-800/90 dark:via-gray-800/80 dark:to-gray-800/70 shadow-2xl border border-white/50 dark:border-gray-700/50"
      >
        {/* Tier Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${tierBadge.color} text-white text-2xl font-black flex items-center justify-center shadow-lg`}>
            {tierBadge.number}
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              {tierBadge.label}
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {tier === 1 && t('character.tier1Description')}
              {tier === 2 && t('character.tier2Description')}
              {tier === 3 && t('character.tier3Description')}
            </p>
          </div>
        </div>

        {/* Carousel */}
        <div 
          className="relative overflow-x-auto scrollbar-hide snap-x snap-mandatory"
          style={{ 
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div className="flex gap-4 pb-2">
            {tierClasses.map((classData) => (
              <div key={classData.id} className="snap-center">
                {renderClassCard(classData)}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-black flex items-center justify-center">
        <div className="text-gray-900 dark:text-white text-2xl font-bold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-black dark:from-black dark:via-black dark:to-black pb-20">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl p-4 backdrop-blur-2xl bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-gray-800/90 dark:via-gray-800/80 dark:to-gray-800/70 shadow-2xl border border-white/50 dark:border-gray-700/50 overflow-hidden"
        >
          {/* Animated background blobs */}
          <div className="absolute inset-0 opacity-30 dark:opacity-20">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-2xl animate-blob" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-2xl animate-blob animation-delay-2000" />
            <div className="absolute -bottom-10 left-1/2 w-40 h-40 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-2xl animate-blob animation-delay-4000" />
          </div>

          <div className="relative flex items-center justify-center">
            <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              <span className="bg-none text-gray-900 dark:text-white bg-clip-border">🏛️</span> {t('character.classHall')}
            </h1>
          </div>
        </motion.div>

        {/* Player Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl p-4 backdrop-blur-2xl bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-gray-800/90 dark:via-gray-800/80 dark:to-gray-800/70 shadow-2xl border border-white/50 dark:border-gray-700/50"
        >
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-400/30 to-orange-500/30 backdrop-blur-sm border border-yellow-400/40">
              <span className="text-2xl">💰</span>
              <div className="flex flex-col leading-none">
                <span className="text-gray-900 dark:text-white font-bold text-lg">{playerSoms.toLocaleString()}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">{t('currency.soms')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400/30 to-blue-500/30 backdrop-blur-sm border border-cyan-400/40">
              <span className="text-2xl">💎</span>
              <div className="flex flex-col leading-none">
                <span className="text-gray-900 dark:text-white font-bold text-lg">{playerCrystals}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">{t('currency.crystals')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-400/30 to-pink-500/30 backdrop-blur-sm border border-purple-400/40">
              <span className="text-2xl">📊</span>
              <div className="flex flex-col leading-none">
                <span className="text-gray-900 dark:text-white font-bold text-lg">{currentLevel}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">{t('character.level')}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tier 1 Carousel */}
        {classes?.tier1 && renderCarousel(classes.tier1, 1)}

        {/* Tier 2 Carousel */}
        {classes?.tier2 && renderCarousel(classes.tier2, 2)}

        {/* Tier 3 Carousel */}
        {classes?.tier3 && renderCarousel(classes.tier3, 3)}
      </div>

      {/* Confirm Modal */}
      {createPortal(
        <AnimatePresence>
          {showConfirmModal && selectedClass && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowConfirmModal(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              />
              
              <div className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="w-full max-w-[450px] pointer-events-auto"
                >
                  <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-[32px] p-1 shadow-2xl">
                    <div className="bg-white dark:bg-gray-900 rounded-[28px] p-6">
                      <div className="text-center mb-6">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 500, delay: 0.1 }}
                          className="text-8xl mb-4"
                        >
                          {selectedClass.avatar}
                        </motion.div>
                        <h2 className="text-3xl font-black bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent mb-2">
                          {t('character.confirmChange')}
                        </h2>
                        <div className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                          {selectedClass.name[i18n.language as 'ru' | 'uz' | 'uk' | 'en']}
                        </div>
                      </div>

                      {/* Cost Display */}
                      <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-[20px] border border-yellow-200 dark:border-yellow-800">
                        <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center">
                          {t('character.changeCost')}
                        </div>
                        <div className="flex items-center justify-center gap-6">
                          <div className="text-center">
                            <motion.div 
                              className="text-3xl mb-1"
                              animate={playerSoms < getChangeCost(selectedClass.tier).soms ? { 
                                rotate: [0, -10, 10, -10, 10, 0],
                                scale: [1, 1.1, 1]
                              } : {}}
                              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                            >
                              💰
                            </motion.div>
                            <div className={`font-bold text-lg ${
                              playerSoms >= getChangeCost(selectedClass.tier).soms
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {getChangeCost(selectedClass.tier).soms.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {t('common.have')}: {playerSoms.toLocaleString()}
                            </div>
                          </div>
                          <div className="text-center">
                            <motion.div 
                              className="text-3xl mb-1"
                              animate={playerCrystals < getChangeCost(selectedClass.tier).crystals ? { 
                                rotate: [0, -10, 10, -10, 10, 0],
                                scale: [1, 1.1, 1]
                              } : {}}
                              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                            >
                              💎
                            </motion.div>
                            <div className={`font-bold text-lg ${
                              playerCrystals >= getChangeCost(selectedClass.tier).crystals
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {getChangeCost(selectedClass.tier).crystals}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {t('common.have')}: {playerCrystals}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowConfirmModal(false)}
                          className="flex-1 py-3 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 text-gray-900 dark:text-white font-bold rounded-full shadow-lg"
                        >
                          {t('common.cancel')}
                        </motion.button>
                        <motion.button
                          whileHover={canAffordClass(selectedClass) ? { scale: 1.02 } : {}}
                          whileTap={canAffordClass(selectedClass) ? { scale: 0.98 } : {}}
                          onClick={confirmClassChange}
                          disabled={!canAffordClass(selectedClass)}
                          className={`flex-1 py-3 font-bold rounded-full shadow-lg transition-all ${
                            canAffordClass(selectedClass)
                              ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white cursor-pointer'
                              : 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed opacity-50'
                          }`}
                        >
                          {t('common.confirm')}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
};

export default ClassHall;
