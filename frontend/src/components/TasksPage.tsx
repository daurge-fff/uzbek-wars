import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import Emoji from './Emoji';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Task {
    id: string;
    name: { [key: string]: string };
    description: { [key: string]: string };
    completed: boolean;
    progress?: number;
    rewards: {
        experience: number;
        soms: number;
        crystals?: number;
    };
    targetValue: number;
}

interface Quest {
    id: string;
    name: { [key: string]: string };
    description: { [key: string]: string };
    rewards: {
        experience: number;
        soms: number;
        crystals?: number;
    };
    steps?: Array<{
        id: string;
        description: { [key: string]: string };
        targetValue: number;
        type: string;
    }>;
}

interface ActiveQuest {
    questId: string;
    progress: number;
    completed: boolean;
    name?: { [key: string]: string };
    description?: { [key: string]: string };
    steps?: Array<{
        id: string;
        description: { [key: string]: string };
        targetValue: number;
        type: string;
    }>;
    rewards?: {
        experience: number;
        soms: number;
        crystals?: number;
    };
}

export const TasksPage = () => {
    const { t, i18n } = useTranslation();
    const [dailyTasks, setDailyTasks] = useState<Task[]>([]);
    const [availableQuests, setAvailableQuests] = useState<Quest[]>([]);
    const [activeQuests, setActiveQuests] = useState<ActiveQuest[]>([]);
    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(true);

    const lang = i18n.language || 'ru';

    const fetchData = async () => {
        try {
            const resp = await axios.get(`${API_URL}/api/tasks`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            });
            setDailyTasks(resp.data.dailyTasks);
            setAvailableQuests(resp.data.globalAvailableQuests);
            setActiveQuests(resp.data.activeQuests || []);
            setStreak(resp.data.streak);
        } catch (err) {
            console.error('Error fetching tasks', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleStartQuest = async (id: string) => {
        try {
            await axios.post(`${API_URL}/api/tasks/start-quest/${id}`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            });
            toast.success(t('quests.started', 'Квест начат!'));
            fetchData();
        } catch (err) {
            toast.error(t('quests.error', 'Ошибка при старте квеста'));
        }
    };

    if (loading) return <div className="p-8 text-center text-white">Loading...</div>;

    return (
        <div className="min-h-screen bg-black text-white p-6 pb-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto space-y-8"
            >
                <header className="text-center">
                    <Emoji emoji="📜" size={64} />
                    <h1 className="text-3xl font-black mt-2 uppercase tracking-tight">
                        {t('tasks.title', 'Задания и Квесты')}
                    </h1>
                    <div className="mt-4 flex justify-center">
                        <div className="bg-indigo-600 px-4 py-2 rounded-full flex items-center gap-2">
                            <Emoji emoji="🔥" size={20} />
                            <span className="font-bold">{t('tasks.streak', 'Стрик')}: {streak} {t('tasks.days', 'дн.')}</span>
                        </div>
                    </div>
                </header>

                <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Emoji emoji="📅" size={24} /> {t('tasks.dailyTitle', 'Ежедневные задания')}
                    </h2>
                    <div className="space-y-3">
                        {dailyTasks.map(task => (
                            <div key={task.id} className="bg-gray-800 p-4 rounded-2xl border border-gray-700 flex justify-between items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold">{task.name[lang] || task.name.ru}</h3>
                                    <p className="text-xs text-gray-400">{task.description[lang] || task.description.ru}</p>
                                    <div className="mt-2 flex gap-2 flex-wrap items-center">
                                        <span className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full">+{task.rewards.experience} XP</span>
                                        <span className="text-[10px] bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded-full">+{task.rewards.soms} SOMS</span>
                                        {task.targetValue > 1 && (
                                            <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-full font-mono">
                                                {Math.min(task.progress || 0, task.targetValue)}/{task.targetValue}
                                            </span>
                                        )}
                                    </div>
                                    {task.targetValue > 1 && !task.completed && (
                                        <div className="mt-2 h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                                                style={{ width: `${Math.min(100, ((task.progress || 0) / task.targetValue) * 100)}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                                {task.completed ? (
                                    <div className="bg-green-500/20 text-green-500 p-2 rounded-full shrink-0">
                                        <Emoji emoji="✅" size={20} />
                                    </div>
                                ) : (
                                    <div className="text-gray-500 shrink-0">
                                        <Emoji emoji="⏳" size={20} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {activeQuests.length > 0 && (
                    <section>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Emoji emoji="🎯" size={24} /> {t('tasks.activeQuests', 'Активные квесты')}
                        </h2>
                        <div className="grid grid-cols-1 gap-4">
                            {activeQuests.map(quest => {
                                const step = quest.steps?.[0];
                                const target = step?.targetValue || 1;
                                const done = quest.completed || quest.progress >= target;
                                return (
                                    <div key={quest.questId} className={`p-4 rounded-2xl border ${done ? 'bg-green-900/30 border-green-500/30' : 'bg-indigo-900/30 border-indigo-500/30'}`}>
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="font-bold text-lg">
                                                {quest.name ? (quest.name[lang] || quest.name.ru) : quest.questId}
                                            </h3>
                                            {done ? (
                                                <span className="bg-green-500/20 text-green-400 p-1.5 rounded-full"><Emoji emoji="✅" size={18} /></span>
                                            ) : (
                                                <span className="text-gray-400"><Emoji emoji="⏳" size={18} /></span>
                                            )}
                                        </div>
                                        {quest.description && (
                                            <p className="text-sm text-gray-300 mt-1">{quest.description[lang] || quest.description.ru}</p>
                                        )}
                                        {step && (
                                            <>
                                                <p className="text-xs text-indigo-300 mt-2">{step.description[lang] || step.description.ru}</p>
                                                {target > 1 && (
                                                    <>
                                                        <div className="mt-2 h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${done ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                                                                style={{ width: `${Math.min(100, (quest.progress / target) * 100)}%` }}
                                                            />
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 mt-1 font-mono">
                                                            {Math.min(quest.progress, target)}/{target}
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                <section>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Emoji emoji="⚔️" size={24} /> {t('tasks.questsTitle', 'Доступные квесты')}
                    </h2>
                    {availableQuests.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">{t('tasks.noQuests', 'Нет доступных квестов')}</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {availableQuests.map(quest => (
                                <div key={quest.id} className="bg-indigo-900/30 p-4 rounded-2xl border border-indigo-500/30">
                                    <h3 className="font-bold text-lg">{quest.name[lang] || quest.name.ru}</h3>
                                    <p className="text-sm text-gray-300 mt-1">{quest.description[lang] || quest.description.ru}</p>
                                    <button
                                        onClick={() => handleStartQuest(quest.id)}
                                        className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-colors"
                                    >
                                        {t('tasks.startQuest', 'Начать квест')}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </motion.div>
        </div>
    );
};
