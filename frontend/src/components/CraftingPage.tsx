import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Emoji from './Emoji';
import { toast } from 'react-hot-toast';

interface Recipe {
    recipeId: string;
    resultItemId: string;
    requirements: {
        level: number;
        soms: number;
        materials: Array<{
            itemId: string;
            quantity: number;
        }>;
    };
    successRate: number;
}

export const CraftingPage = () => {
    const { t } = useTranslation();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [crafting, setCrafting] = useState<string | null>(null);

    useEffect(() => {
        fetchRecipes();
    }, []);

    const fetchRecipes = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/crafting/recipes`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            });
            setRecipes(response.data.recipes);
        } catch (error) {
            toast.error(t('crafting.errorFetch', 'Ошибка при загрузке рецептов'));
        } finally {
            setLoading(false);
        }
    };

    const handleCraft = async (recipeId: string) => {
        setCrafting(recipeId);
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/crafting/craft`,
                { recipeId },
                { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } }
            );

            if (response.data.success) {
                toast.success(t('crafting.success', 'Предмет успешно создан!'));
            } else {
                toast.error(response.data.message || t('crafting.fail', 'Не удалось создать предмет'));
            }
        } catch (error: any) {
            toast.error(error.response?.data?.error || t('crafting.error', 'Ошибка при создании'));
        } finally {
            setCrafting(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black p-4 pb-32">
            <div className="max-w-xl mx-auto">
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-8">
                    {t('crafting.title', 'РЕМЕСЛО')}
                </h1>

                <div className="bg-gradient-to-r from-amber-600 to-orange-700 rounded-3xl p-6 mb-8 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-xl font-black mb-1">{t('crafting.workshop', 'МАСТЕРСКАЯ')}</h2>
                        <p className="text-amber-100 text-sm">{t('crafting.workshopDesc', 'Создавайте редкое снаряжение из материалов')}</p>
                    </div>
                    <div className="absolute top-0 right-0 text-9xl opacity-10 -translate-y-4">⚒️</div>
                </div>

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
                    <div className="grid gap-6">
                        {recipes.map((recipe) => (
                            <motion.div
                                key={recipe.recipeId}
                                whileHover={{ scale: 1.01 }}
                                className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-5xl shadow-lg">
                                        <Emoji emoji="⚔️" size={48} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-xl text-gray-900 dark:text-white">
                                            {t(`item.${recipe.resultItemId}.name`, 'Элитный Меч')}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-black">
                                                LVL {recipe.requirements.level}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-black">
                                                {Math.floor(recipe.successRate * 100)}% SUCCESS
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                        {t('crafting.requirements', 'ТРЕБОВАНИЯ')}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-3 flex items-center gap-3">
                                            <Emoji emoji="💰" size={20} />
                                            <span className="font-bold text-sm text-gray-700 dark:text-gray-300">
                                                {recipe.requirements.soms} Soms
                                            </span>
                                        </div>
                                        {recipe.requirements.materials.map((mat, i) => (
                                            <div key={i} className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-3 flex items-center gap-3">
                                                <Emoji emoji="📦" size={20} />
                                                <span className="font-bold text-sm text-gray-700 dark:text-gray-300">
                                                    {mat.itemId} x{mat.quantity}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    disabled={crafting === recipe.recipeId}
                                    onClick={() => handleCraft(recipe.recipeId)}
                                    className={`relative overflow-hidden w-full py-4 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-95 ${crafting === recipe.recipeId
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                                        }`}
                                >
                                    {crafting !== recipe.recipeId && (
                                        <div className="absolute inset-0 z-0 pointer-events-none">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-100%] animate-shimmer-fast" />
                                        </div>
                                    )}
                                    <span className="relative z-10">
                                        {crafting === recipe.recipeId ? t('crafting.processing', 'СОЗДАНИЕ...') : t('crafting.craftAction', 'РЕМЕСЛО')}
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
