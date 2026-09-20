import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Emoji from './Emoji';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface Opponent {
    _id: string;
    characterId: string;
    level: number;
    userId?: {
        displayName: string;
    };
    combatStats: {
        combatPower: number;
    };
}

interface MatchEvent {
    type: 'attack' | 'crit' | 'dodge' | 'counter' | 'block' | 'combo' | 'miss' | 'finish' | 'stun' | 'poison' | 'heal';
    turn: number;
    attackerId: string;
    attackerName: string;
    defenderName: string;
    damage: number;
    attackerHealth: number;
    defenderHealth: number;
    attackerMaxHealth: number;
    defenderMaxHealth: number;
}

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_INFO: Record<Difficulty, { color: string; bgColor: string; emoji: string; energyCost: number; healthCostWin: number; healthCostLose: number; somsCost: number }> = {
    easy: { color: 'text-green-400', bgColor: 'from-green-600 to-emerald-500', emoji: '🟢', energyCost: 10, healthCostWin: 3, healthCostLose: 10, somsCost: 50 },
    medium: { color: 'text-yellow-400', bgColor: 'from-yellow-500 to-orange-500', emoji: '🟡', energyCost: 20, healthCostWin: 8, healthCostLose: 20, somsCost: 150 },
    hard: { color: 'text-red-400', bgColor: 'from-red-600 to-pink-600', emoji: '🔴', energyCost: 30, healthCostWin: 15, healthCostLose: 35, somsCost: 300 },
};

export const ArenaPage = () => {
    const { t } = useTranslation();
    const { player, refreshPlayer } = useAuth();
    const [opponents, setOpponents] = useState<Opponent[]>([]);
    const [loading, setLoading] = useState(true);
    const [fighting, setFighting] = useState(false);
    const [matchResult, setMatchResult] = useState<{
        winnerId: string;
        isWinner?: boolean;
        difficulty: Difficulty;
        rewards: { soms: number; experience: number; ratingPoints: number; energyCost: number; healthCost: number; somsCost: number };
        matchLog: MatchEvent[];
        stats: { totalTurns: number; totalDamageDealt: number; totalDamageReceived: number; crits: number; dodges: number; combos: number };
    } | null>(null);
    const [showLog, setShowLog] = useState(false);
    const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
    const [currentLogIndex, setCurrentLogIndex] = useState(0);

    useEffect(() => {
        fetchOpponents();
    }, []);

    const fetchOpponents = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
            const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/arena/opponents`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOpponents(response.data.opponents);
        } catch (error) {
            toast.error(t('arena.errorFetch', 'Ошибка при поиске противников'));
        } finally {
            setLoading(false);
        }
    };

    const handleFight = async (opponentId: string) => {
        setFighting(true);
        setCurrentLogIndex(0);
        try {
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
            const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/arena/fight`,
                { opponentId, difficulty: selectedDifficulty },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = response.data;
            setMatchResult(data);

            // Animate battle log
            const log = data.matchLog || [];
            for (let i = 0; i < log.length; i++) {
                setCurrentLogIndex(i);
                await new Promise(resolve => setTimeout(resolve, 400));
            }

            setFighting(false);
            if (refreshPlayer) {
                refreshPlayer();
            }
        } catch (error: any) {
            const errorMsg = error?.response?.data?.error;
            if (errorMsg === 'NOT_ENOUGH_ENERGY') {
                toast.error(t('arena.notEnoughEnergy', 'Недостаточно энергии! Отдохните.'));
            } else if (errorMsg === 'NOT_ENOUGH_SOMS') {
                toast.error(t('arena.notEnoughSoms', 'Недостаточно сомов для сложного боя!'));
            } else {
                toast.error(t('arena.errorFight', 'Ошибка во время боя'));
            }
            setFighting(false);
        }
    };

    const getEventMessage = (event: MatchEvent): string => {
        const { type, attackerName, defenderName, damage } = event;
        switch (type) {
            case 'attack':
                return t('battle.event_attack', '{{attacker}} наносит удар по {{defender}} на {{damage}} урона', { attacker: attackerName, defender: defenderName, damage });
            case 'crit':
                return t('battle.event_crit', '💥 КРИТ! {{attacker}} пробивает защиту {{defender}} на {{damage}} урона!', { attacker: attackerName, defender: defenderName, damage });
            case 'dodge':
                return t('battle.event_dodge', '💨 {{defender}} ловко уворачивается от выпада {{attacker}}!', { attacker: attackerName, defender: defenderName });
            case 'counter':
                return t('battle.event_counter', '⚡ {{attacker}} наносит контрудар на {{damage}} урона!', { attacker: attackerName, defender: defenderName, damage });
            case 'block':
                return t('battle.event_block', '🛡️ {{defender}} блокирует часть атаки! Получает {{damage}} урона', { attacker: attackerName, defender: defenderName, damage });
            case 'miss':
                return t('battle.event_miss', '❌ {{attacker}} промахивается!', { attacker: attackerName, defender: defenderName });
            case 'stun':
                return t('battle.event_stun', '💫 {{defender}} оглушён и пропускает ход!', { attacker: attackerName, defender: defenderName });
            case 'poison':
                return t('battle.event_poison', '☠️ {{defender}} отравлен! Теряет здоровье', { attacker: attackerName, defender: defenderName });
            case 'finish':
                return t('battle.event_finish', '⚡ {{attacker}} наносит решающий удар!', { attacker: attackerName, defender: defenderName });
            default:
                return '';
        }
    };

    const getEventEmoji = (type: string): string => {
        switch (type) {
            case 'attack': return '⚔️';
            case 'crit': return '💥';
            case 'dodge': return '💨';
            case 'counter': return '⚡';
            case 'block': return '🛡️';
            case 'miss': return '❌';
            case 'stun': return '💫';
            case 'poison': return '☠️';
            case 'finish': return '💀';
            default: return '⚔️';
        }
    };

    // === BATTLE ANIMATION VIEW ===
    if (fighting) {
        const currentEvent = matchResult?.matchLog?.[currentLogIndex];
        const challengerMax = (matchResult as any)?.challengerMaxHealth || 55;
        const opponentMax = (matchResult as any)?.opponentMaxHealth || 55;
        const challengerName = (matchResult as any)?.challengerName || (player as any)?.displayName || t('arena.you', 'Вы');
        const opponentNameVal = (matchResult as any)?.opponentName || t('arena.opponent', 'Соперник');

        // Use event HP values or fall back to max
        const playerHP = currentEvent
            ? (currentEvent.attackerId === player?.id || currentEvent.attackerId === (player as any)?._id)
                ? currentEvent.attackerHealth
                : currentEvent.defenderHealth
            : challengerMax;
        const opponentHPVal = currentEvent
            ? (currentEvent.attackerId === player?.id || currentEvent.attackerId === (player as any)?._id)
                ? currentEvent.defenderHealth
                : currentEvent.attackerHealth
            : opponentMax;

        const challengerPercent = Math.max(0, Math.min(100, Math.round((playerHP / challengerMax) * 100)));
        const opponentPercent = Math.max(0, Math.min(100, Math.round((opponentHPVal / opponentMax) * 100)));

        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-950 via-black to-gray-900 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-full max-w-sm mb-6 space-y-4">
                    <div className="flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
                        <div className="flex-1 text-left">
                            <div className="text-xs text-indigo-400 font-bold truncate">
                                {challengerName}
                            </div>
                            <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden mt-1.5 border border-white/10">
                                <motion.div
                                    animate={{ width: `${challengerPercent}%` }}
                                    transition={{ duration: 0.3 }}
                                    className={`h-full rounded-full ${challengerPercent > 40 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-red-600 to-orange-500'}`}
                                />
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5 font-mono">{Math.round(playerHP)} / {challengerMax} HP</div>
                        </div>

                        <div className="text-xl font-black text-red-500 animate-pulse">VS</div>

                        <div className="flex-1 text-right">
                            <div className="text-xs text-red-400 font-bold truncate">
                                {opponentNameVal}
                            </div>
                            <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden mt-1.5 border border-white/10">
                                <motion.div
                                    animate={{ width: `${opponentPercent}%` }}
                                    transition={{ duration: 0.3 }}
                                    className={`h-full rounded-full ${opponentPercent > 40 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-red-600 to-orange-500'}`}
                                />
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5 font-mono">{Math.round(opponentHPVal)} / {opponentMax} HP</div>
                        </div>
                    </div>
                </div>

                <motion.div
                    animate={{
                        scale: [1, 1.25, 0.95, 1.15, 1],
                        rotate: [0, -12, 12, -8, 0],
                        filter: ['drop-shadow(0 0 15px rgba(239,68,68,0.5))', 'drop-shadow(0 0 35px rgba(239,68,68,0.9))', 'drop-shadow(0 0 15px rgba(239,68,68,0.5))']
                    }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="text-8xl mb-8"
                >
                    <Emoji emoji="⚔️" size={110} />
                </motion.div>

                <div className="max-w-xs w-full">
                    <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-widest animate-pulse">
                        {t('arena.fighting', 'ИДЕТ БИТВА...')}
                    </h2>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-h-24 flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={currentLogIndex}
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                className="text-gray-200 font-medium text-sm leading-relaxed"
                            >
                                {currentEvent ? getEventMessage(currentEvent) : t('arena.preparing', 'Бойцы выходят на арену...')}
                            </motion.p>
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={() => {
                            setFighting(false);
                            if (refreshPlayer) refreshPlayer();
                        }}
                        className="mt-6 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer shadow-md"
                    >
                        {t('arena.skipFight', 'Пропустить анимацию ⏩')}
                    </button>
                </div>
            </div>
        );
    }

    // === MATCH RESULT VIEW ===
    if (matchResult) {
        const isWinner = matchResult.isWinner !== undefined
            ? matchResult.isWinner
            : (matchResult.winnerId?.toString() === player?.id?.toString() || matchResult.winnerId?.toString() === (player as any)?._id?.toString());

        const diffConfig = DIFFICULTY_INFO[matchResult.difficulty || 'medium'];

        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4 pb-32">
                <div className="max-w-md mx-auto">
                    <div className="flex justify-end mb-2">
                        <button
                            onClick={() => {
                                setMatchResult(null);
                                setFighting(false);
                                fetchOpponents();
                                if (refreshPlayer) refreshPlayer();
                            }}
                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-3xl p-8 text-center mb-6 shadow-2xl ${isWinner ? 'bg-gradient-to-br from-yellow-400 to-orange-600' : 'bg-gradient-to-br from-gray-600 to-gray-800'}`}
                    >
                        <div className="text-8xl mb-4">
                            {isWinner ? <Emoji emoji="🏆" size={96} /> : <Emoji emoji="💀" size={96} />}
                        </div>
                        <h2 className="text-4xl font-black text-white mb-2 uppercase">
                            {isWinner ? t('arena.victory', 'ПОБЕДА!') : t('arena.defeat', 'ПОРАЖЕНИЕ')}
                        </h2>

                        {/* Difficulty badge */}
                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white ${diffConfig.bgColor} bg-gradient-to-r mb-4`}>
                            {diffConfig.emoji} {t(`arena.difficulty_${matchResult.difficulty}`, matchResult.difficulty === 'easy' ? 'Лёгкий' : matchResult.difficulty === 'medium' ? 'Средний' : 'Сложный')}
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-3 gap-3 mt-4">
                            <div className="bg-white/20 rounded-2xl p-3 text-center">
                                <div className="text-2xl mb-1"><Emoji emoji="💰" size={24} /></div>
                                <div className="text-white font-black text-sm">+{matchResult.rewards.soms}</div>
                                <div className="text-[10px] text-white/80 font-bold uppercase mt-0.5">{t('common.soms', 'Сомы')}</div>
                            </div>
                            <div className="bg-white/20 rounded-2xl p-3 text-center">
                                <div className="text-2xl mb-1"><Emoji emoji="✨" size={24} /></div>
                                <div className="text-white font-black text-sm">+{matchResult.rewards.experience}</div>
                                <div className="text-[10px] text-white/80 font-bold uppercase mt-0.5">{t('common.xp', 'Опыт')}</div>
                            </div>
                            <div className="bg-white/20 rounded-2xl p-3 text-center">
                                <div className="text-2xl mb-1"><Emoji emoji="⭐" size={24} /></div>
                                <div className={`font-black text-sm ${matchResult.rewards.ratingPoints >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                                    {matchResult.rewards.ratingPoints > 0 ? `+${matchResult.rewards.ratingPoints}` : matchResult.rewards.ratingPoints}
                                </div>
                                <div className="text-[10px] text-white/80 font-bold uppercase mt-0.5">{t('arena.rating', 'Рейтинг')}</div>
                            </div>
                        </div>

                        {/* Battle costs */}
                        <div className="mt-4 px-3 py-2 rounded-xl bg-black/20 text-white/90 text-xs space-y-1">
                            <div className="flex items-center justify-center gap-2">
                                <span>⚡</span>
                                <span>{t('battle.costEnergy', 'Потрачено энергии')}: -{matchResult.rewards.energyCost}</span>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                                <span>❤️</span>
                                <span>{t('battle.costHealth', 'Потрачено здоровья')}: -{matchResult.rewards.healthCost}</span>
                            </div>
                            {matchResult.rewards.somsCost > 0 && (
                                <div className="flex items-center justify-center gap-2">
                                    <span>💰</span>
                                    <span>{t('battle.costSoms', 'Стоимость входа')}: -{matchResult.rewards.somsCost}</span>
                                </div>
                            )}
                        </div>

                        {/* Battle stats */}
                        <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] text-white/70 font-bold">
                            <div className="text-center">
                                <div className="text-white text-sm font-black">{matchResult.stats?.totalTurns || 0}</div>
                                {t('battle.turns', 'Ходов')}
                            </div>
                            <div className="text-center">
                                <div className="text-white text-sm font-black">{matchResult.stats?.totalDamageDealt || 0}</div>
                                {t('battle.damageDealt', 'Урона нанесено')}
                            </div>
                            <div className="text-center">
                                <div className="text-white text-sm font-black">{matchResult.stats?.crits || 0}</div>
                                {t('battle.crits', 'Критов')}
                            </div>
                        </div>
                    </motion.div>

                    <button
                        onClick={() => setShowLog(!showLog)}
                        className="w-full py-4 rounded-2xl bg-white/10 text-white font-bold mb-4 border border-white/20"
                    >
                        {showLog ? t('arena.hideLog', 'Скрыть лог боя') : t('arena.showLog', 'Показать лог боя')}
                    </button>

                    <AnimatePresence>
                        {showLog && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mb-6"
                            >
                                <div className="bg-white/5 rounded-2xl p-4 font-mono text-sm text-gray-300">
                                    {matchResult.matchLog.map((entry, i) => (
                                        <div key={i} className="mb-2 border-b border-white/10 pb-1 flex items-start gap-2">
                                            <span className="text-gray-500 shrink-0">[{entry.turn}]</span>
                                            <span className="shrink-0">{getEventEmoji(entry.type)}</span>
                                            <span>{getEventMessage(entry)}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={() => {
                            setMatchResult(null);
                            setFighting(false);
                            fetchOpponents();
                            if (refreshPlayer) refreshPlayer();
                        }}
                        className="w-full py-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-xl shadow-lg cursor-pointer"
                    >
                        {t('arena.backToArena', 'ВЕРНУТЬСЯ В АРЕНУ')}
                    </button>
                </div>
            </div>
        );
    }

    // === MAIN ARENA VIEW ===
    const playerEnergy = (player as any)?.stats?.energy || 0;
    const playerSoms = (player as any)?.soms || 0;
    const diffInfo = DIFFICULTY_INFO[selectedDifficulty];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black p-4 pb-32">
            <div className="max-w-xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">
                        {t('arena.title', 'ПВП АРЕНА')}
                    </h1>
                    <button
                        onClick={fetchOpponents}
                        className="p-3 rounded-full bg-white dark:bg-gray-800 shadow-md"
                    >
                        <Emoji emoji="🔄" size={20} />
                    </button>
                </div>

                {/* Difficulty selector */}
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
                        {t('arena.selectDifficulty', 'Выберите сложность')}
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => {
                            const info = DIFFICULTY_INFO[diff];
                            const isSelected = selectedDifficulty === diff;
                            const canAfford = playerSoms >= info.somsCost && playerEnergy >= info.energyCost;

                            return (
                                <motion.button
                                    key={diff}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setSelectedDifficulty(diff)}
                                    className={`relative rounded-2xl p-3 text-center border-2 transition-all cursor-pointer ${
                                        isSelected
                                            ? `border-white/40 bg-gradient-to-br ${info.bgColor} text-white shadow-lg`
                                            : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                                    }`}
                                >
                                    <div className="text-2xl mb-1">{info.emoji}</div>
                                    <div className="text-xs font-black uppercase">
                                        {t(`arena.difficulty_${diff}`, diff === 'easy' ? 'Лёгкий' : diff === 'medium' ? 'Средний' : 'Сложный')}
                                    </div>
                                    <div className="text-[10px] mt-1 opacity-80">
                                        ⚡{info.energyCost} ❤️{info.healthCostWin}-{info.healthCostLose} 💰{info.somsCost}
                                    </div>
                                    {!canAfford && (
                                        <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
                                            <span className="text-[10px] font-bold text-red-300">{t('arena.notAvailable', 'Недоступно')}</span>
                                        </div>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-6 mb-8 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-xl font-black mb-1">{t('arena.matchmaking', 'ПОИСК ПРОТИВНИКОВ')}</h2>
                        <p className="text-indigo-100 text-sm">{t('arena.matchmakingDesc', 'Выберите достойного оппонента для битвы')}</p>
                    </div>
                    <div className="absolute top-0 right-0 text-9xl opacity-10 -translate-y-4">
                        <Emoji emoji="⚔️" size={128} />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="text-4xl"
                        >
                            <Emoji emoji="🌀" size={48} />
                        </motion.div>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {opponents.map((opp) => (
                            <motion.div
                                key={opp._id}
                                whileHover={{ scale: 1.02 }}
                                className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-lg border border-gray-100 dark:border-gray-700 flex items-center gap-4"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-4xl shadow-inner">
                                    <Emoji emoji={opp.characterId === 'char_warrior' ? '⚔️' : '👤'} size={32} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-black text-gray-900 dark:text-white text-lg uppercase">
                                        {opp.userId?.displayName || opp.characterId.split('_')[1]}
                                    </h3>
                                    <div className="flex items-center gap-3 text-sm font-bold text-gray-500">
                                        <span>Lvl {opp.level}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                        <span className="text-indigo-500">⚔️ {opp.combatStats.combatPower}</span>
                                    </div>
                                    {/* Show difficulty stats preview */}
                                    <div className="text-[10px] text-gray-400 mt-1">
                                        {t('arena.opponentPower', 'Сила')}: ×{diffInfo.somsCost === 50 ? '0.7' : diffInfo.somsCost === 150 ? '1.0' : '1.4'}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleFight(opp._id)}
                                    className={`relative overflow-hidden w-full py-3 bg-gradient-to-r ${diffInfo.bgColor} text-white font-black rounded-xl hover:shadow-xl active:scale-95 transition-all`}
                                >
                                    <div className="absolute inset-0 z-0 pointer-events-none">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-100%] animate-shimmer-fast" />
                                    </div>
                                    <span className="relative z-10 uppercase tracking-wider">
                                        {t('arena.attack', 'АТАКА')} {diffInfo.emoji}
                                    </span>
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
