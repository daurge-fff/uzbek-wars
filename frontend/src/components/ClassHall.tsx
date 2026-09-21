import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { Carousel3D } from './Carousel3D';
import Emoji from './Emoji';

interface ClassData {
  id: string;
  avatar: string;
  tier: number;
  requiredLevel: number;
  name: { ru: string; uz: string; uk: string; en: string };
  description: { ru: string; uz: string; uk: string; en: string };
  strengths: { ru: string; uz: string; uk: string; en: string };
  weaknesses: { ru: string; uz: string; uk: string; en: string };
  uniqueAbilityDescription?: { ru: string; uz: string; uk: string; en: string };
}

const ClassHall: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { token, player } = useAuth();
  const [classes, setClasses] = useState<{ tier1: ClassData[]; tier2: ClassData[]; tier3: ClassData[] } | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentClass, setCurrentClass] = useState(player?.characterId || 'char_trader');
  const [currentLevel, setCurrentLevel] = useState(player?.level || 1);
  const [playerSoms, setPlayerSoms] = useState(player?.soms || 0);
  const [playerCrystals, setPlayerCrystals] = useState(player?.donationCurrency || 0);

  useEffect(() => {
    if (player) {
      setCurrentClass(player.characterId);
      setCurrentLevel(player.level);
      setPlayerSoms(player.soms);
      setPlayerCrystals(player.donationCurrency);
    }
  }, [player]);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/characters/by-tier', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
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
      3: { label: t('character.tier3'), color: 'from-yellow-400 to-orange-600', number: '3' }
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

  const isCurrentClass = (classData: ClassData) => classData.id === currentClass;

  const isClassLocked = (classData: ClassData) => currentLevel < classData.requiredLevel;

  const handleClassSelect = (classData: ClassData) => {
    if (classData.id === currentClass || isClassLocked(classData)) return;
    setSelectedClass(classData);
    setShowConfirmModal(true);
  };

  const confirmClassChange = async () => {
    if (!selectedClass || !token) return;
    try {
      const response = await fetch('/api/player/change-class', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ characterId: selectedClass.id })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.player) {
          setCurrentClass(data.player.characterId);
          setCurrentLevel(data.player.level);
          setPlayerSoms(data.player.soms);
          setPlayerCrystals(data.player.donationCurrency);
        }
        setShowConfirmModal(false);
        setSelectedClass(null);
      }
    } catch (error) {
      console.error('Failed to change class:', error);
    }
  };

  const renderClassCard = (classData: ClassData) => {
    const isLocked = isClassLocked(classData);
    const isCurrent = isCurrentClass(classData);
    const lang = i18n.language as 'ru' | 'uz' | 'uk' | 'en';
    const cost = getChangeCost(classData.tier);

    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -8 }}
        whileTap={{ scale: 0.98 }}
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-[32px] shadow-sm p-6 border-2 transition-colors border-green-200 dark:border-green-700 h-[580px] flex flex-col"
      >
        {isLocked && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-xl shadow-lg flex items-center gap-1">
            <Emoji emoji="🔒" size={16} />
            <span>LVL {classData.requiredLevel}</span>
          </div>
        )}
        {isCurrent && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white text-lg font-bold rounded-xl shadow-lg">
            <Emoji emoji="✅" size={18} />
          </div>
        )}

        <div className="w-full h-60 bg-gradient-to-br from-purple-100 to-pink-100 dark:bg-gray-700 rounded-[24px] mb-4 flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="text-8xl"
          >
            {classData.avatar}
          </motion.div>
        </div>

        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 text-center flex-shrink-0">
          {classData.name[lang]}
        </h2>

        <div className="space-y-2 mb-4 flex-1 flex flex-col min-h-0">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 px-3 py-2 rounded-[16px] border border-green-200 dark:border-green-700 flex-1 min-h-0 overflow-auto">
            <div className="text-xs text-green-700 dark:text-green-300 font-bold mb-1">
              {t('character.strengths')}
            </div>
            <div className="text-xs text-gray-700 dark:text-gray-300">
              {classData.strengths[lang]}
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 px-3 py-2 rounded-[16px] border border-red-200 dark:border-red-700 flex-1 min-h-0 overflow-auto">
            <div className="text-xs text-red-700 dark:text-red-300 font-bold mb-1">
              {t('character.weaknesses')}
            </div>
            <div className="text-xs text-gray-700 dark:text-gray-300">
              {classData.weaknesses[lang]}
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-center flex-shrink-0">
          <div className={`px-3 py-1 rounded-lg font-bold text-sm flex items-center gap-1 ${playerSoms < cost.soms ? 'bg-red-500 text-white' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
            }`}>
            <Emoji emoji="💰" size={14} />
            <span>{cost.soms.toLocaleString()}</span>
          </div>
          <div className={`px-3 py-1 rounded-lg font-bold text-sm flex items-center gap-1 ${playerCrystals < cost.crystals ? 'bg-red-500 text-white' : 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
            }`}>
            <Emoji emoji="💎" size={14} />
            <span>{cost.crystals}</span>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3 flex-shrink-0">
          {classData.description[lang]}
        </p>
      </motion.div>
    );
  };

  const renderTierCarousel = (tierClasses: ClassData[], tier: number) => {
    const tierBadge = getTierBadge(tier);

    const currentClassIndex = tierClasses.findIndex(c => c.id === currentClass);
    const initialIndex = currentClassIndex >= 0 ? currentClassIndex : 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: tier * 0.1 }}
        className="relative rounded-3xl p-6 backdrop-blur-2xl bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-gray-800/90 dark:via-gray-800/80 dark:to-gray-800/70 shadow-sm border border-white/50 dark:border-gray-700/50 overflow-hidden"
      >
        {/* Animated background blobs */}
        <div className="absolute inset-0 opacity-30 dark:opacity-20">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-2xl animate-blob" />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-2xl animate-blob animation-delay-2000" />
          <div className="absolute -bottom-10 left-1/2 w-40 h-40 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-2xl animate-blob animation-delay-4000" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
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

          <Carousel3D
            key={`${tier}-${currentClass}`}
            items={tierClasses}
            renderItem={(classData) => renderClassCard(classData)}
            onSelect={(classData) => handleClassSelect(classData)}
            showArrows={true}
            selectButtonText={t('character.changeClass', 'Сменить класс')}
            canSelect={(classData) => !isClassLocked(classData) && classData.id !== currentClass}
            initialIndex={initialIndex}
          />
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-black dark:via-black dark:to-black pb-32">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl p-4 backdrop-blur-2xl bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-gray-800/90 dark:via-gray-800/80 dark:to-gray-800/70 shadow-sm border border-white/50 dark:border-gray-700/50"
        >
          <div className="relative flex items-center justify-center">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              <Emoji emoji="🏛️" size={24} className="inline mr-2" /> {t('character.classHall')}
            </h1>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl p-4 backdrop-blur-2xl bg-gradient-to-br from-white/90 via-white/80 to-white/70 dark:from-gray-800/90 dark:via-gray-800/80 dark:to-gray-800/70 shadow-sm border border-white/50 dark:border-gray-700/50"
        >
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-400/30 to-orange-500/30 border border-yellow-400/40">
              <Emoji emoji="💰" size={24} />
              <div>
                <div className="text-gray-900 dark:text-white font-bold text-lg">{playerSoms.toLocaleString()}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{t('currency.soms')}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400/30 to-blue-500/30 border border-cyan-400/40">
              <Emoji emoji="💎" size={24} />
              <div>
                <div className="text-gray-900 dark:text-white font-bold text-lg">{playerCrystals}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{t('currency.crystals')}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-400/30 to-pink-500/30 border border-purple-400/40">
              <Emoji emoji="📊" size={24} />
              <div>
                <div className="text-gray-900 dark:text-white font-bold text-lg">{currentLevel}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{t('character.level')}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {classes?.tier1 && renderTierCarousel(classes.tier1, 1)}
        {classes?.tier2 && renderTierCarousel(classes.tier2, 2)}
        {classes?.tier3 && renderTierCarousel(classes.tier3, 3)}
      </div>

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
                  <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-[32px] p-1 shadow-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-[28px] p-6">
                      <div className="text-center mb-6">
                        <div className="text-8xl mb-4">{selectedClass.avatar}</div>
                        <h2 className="text-3xl font-black bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 bg-clip-text text-transparent mb-2">
                          {t('character.confirmChange')}
                        </h2>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {selectedClass.name[i18n.language as 'ru' | 'uz' | 'uk' | 'en']}
                        </div>
                      </div>

                      <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-[20px] border border-yellow-200 dark:border-yellow-800">
                        <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center">
                          {t('character.changeCost')}
                        </div>
                        <div className="flex items-center justify-center gap-6">
                          <div className="text-center">
                            <Emoji emoji="💰" size={32} />
                            <div className={`font-bold text-lg ${playerSoms >= getChangeCost(selectedClass.tier).soms ? 'text-green-600' : 'text-red-600'
                              }`}>
                              {getChangeCost(selectedClass.tier).soms.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">{t('common.have')}: {playerSoms.toLocaleString()}</div>
                          </div>
                          <div className="text-center">
                            <Emoji emoji="💎" size={32} />
                            <div className={`font-bold text-lg ${playerCrystals >= getChangeCost(selectedClass.tier).crystals ? 'text-green-600' : 'text-red-600'
                              }`}>
                              {getChangeCost(selectedClass.tier).crystals}
                            </div>
                            <div className="text-xs text-gray-500">{t('common.have')}: {playerCrystals}</div>
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
                          className={`flex-1 py-3 font-bold rounded-full shadow-lg ${canAffordClass(selectedClass)
                              ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white'
                              : 'bg-gray-400 text-gray-200 opacity-50 cursor-not-allowed'
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
