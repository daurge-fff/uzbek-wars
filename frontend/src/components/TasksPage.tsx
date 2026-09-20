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
}

export const TasksPage = () => {
    const { t, i18n } = useTranslation();
    const [dailyTasks, setDailyTasks] = useState<Task[]>([]);
    const [availableQuests, setAvailableQuests] = useState<Quest[]>([]);
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
                            <div key={task.id} className="bg-gray-800 p-4 rounded-2xl border border-gray-700 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold">{task.name[lang] || task.name.ru}</h3>
                                    <p className="text-xs text-gray-400">{task.description[lang] || task.description.ru}</p>
                                    <div className="mt-2 flex gap-2">
                                        <span className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full">+{task.rewards.experience} XP</span>
                                        <span className="text-[10px] bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded-full">+{task.rewards.soms} SOMS</span>
                                    </div>
                                </div>
                                {task.completed ? (
                                    <div className="bg-green-500/20 text-green-500 p-2 rounded-full">
                                        <Emoji emoji="✅" size={20} />
                                    </div>
                                ) : (
                                    <div className="text-gray-500">
                                        <Emoji emoji="⏳" size={20} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

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
