import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Emoji from './Emoji';
import { toast } from 'react-hot-toast';

interface Achievement {
    id: string;
    name: { ru: string; en: string; uz: string; uk: string };
    description: { ru: string; en: string; uz: string; uk: string };
    icon: string;
    targetValue: number;
    progress: number;
    unlocked: boolean;
    unlockedAt?: string;
}

export const AchievementsPage = () => {
    const { t, i18n } = useTranslation();
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAchievements();
    }, []);

    const fetchAchievements = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/achievements`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            });
            setAchievements(response.data.achievements);
        } catch (error) {
            toast.error(t('achievements.errorFetch', 'Ошибка при загрузке достижений'));
        } finally {
            setLoading(false);
        }
    };

    const getLocalized = (obj: any) => {
        return obj[i18n.language] || obj.ru;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black p-4 pb-32">
            <div className="max-w-xl mx-auto">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-8">
                    {t('achievements.title', 'ДОСТИЖЕНИЯ')}
                </h1>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="text-4xl"
                        >
                            🌀
                        </motion.div>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {achievements.map((ach) => {
                            const progressPercent = Math.min(100, Math.floor((ach.progress / ach.targetValue) * 100));

                            return (
                                <motion.div
                                    key={ach.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`relative overflow-hidden rounded-3xl p-5 border-2 transition-all ${ach.unlocked
                                        ? 'bg-white dark:bg-gray-800 border-yellow-400 dark:border-yellow-500 shadow-xl'
                                        : 'bg-white/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 opacity-75'
                                        }`}
                                >
                                    {ach.unlocked && (
                                        <div className="absolute inset-0 z-0 pointer-events-none">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/5 to-transparent skew-x-12 translate-x-[-100%] animate-shimmer" />
                                        </div>
                                    )}
                                    <div className="flex gap-4 items-center mb-3">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-inner ${ach.unlocked ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-gray-100 dark:bg-gray-800 grayscale'
                                            }`}>
                                            <Emoji emoji={ach.icon} size={32} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`font-black text-xl mb-1 ${ach.unlocked ? 'text-gray-900 dark:text-white text-glow-gold' : 'text-gray-400'}`}>
                                                {getLocalized(ach.name)}
                                            </h3>
                                            <p className="text-sm text-gray-400 font-bold">
                                                {getLocalized(ach.description)}
                                            </p>
                                        </div>
                                        {ach.unlocked && (
                                            <div className="text-yellow-500">
                                                <Emoji emoji="⭐" size={24} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs font-black mb-1.5 uppercase tracking-wider">
                                            <span className={ach.unlocked ? 'text-yellow-600' : 'text-gray-400'}>
                                                {ach.unlocked ? t('achievements.unlocked', 'Разблокировано') : t('achievements.inProgress', 'В процессе')}
                                            </span>
                                            <span className="text-gray-500">{ach.progress} / {ach.targetValue}</span>
                                        </div>
                                        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progressPercent}%` }}
                                                className={`h-full rounded-full ${ach.unlocked
                                                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                                                    : 'bg-gradient-to-r from-indigo-400 to-purple-500'
                                                    }`}
                                            />
                                        </div>
                                    </div>

                                    {ach.unlockedAt && (
                                        <div className="absolute top-2 right-2 text-[10px] font-black text-gray-300 uppercase">
                                            {new Date(ach.unlockedAt).toLocaleDateString()}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
