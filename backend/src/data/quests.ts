/**
 * Глобальные квесты игры.
 *
 * Вынесены из seed.ts, чтобы их можно было накатывать отдельно
 * (`npm run seed:quests --workspace=backend`) и не трогать остальные данные.
 *
 * Важно: `steps[].type` должен быть одним из типов, которые реально обновляет
 * TaskService.updateQuestProgress — сейчас это `activity_count` (завершение активностей)
 * и `pvp_win` (победа на арене). Квест с другим типом шага никогда не завершится.
 */
export interface QuestStep {
    id: string;
    description: { ru: string; uz: string; uk: string; en: string };
    targetValue: number;
    type: 'activity_count' | 'pvp_win';
}

export interface QuestDefinition {
    id: string;
    name: { ru: string; uz: string; uk: string; en: string };
    description: { ru: string; uz: string; uk: string; en: string };
    requirements: { level: number };
    steps: QuestStep[];
    rewards: { experience: number; soms: number; crystals: number };
    isGlobal: boolean;
}

export const GLOBAL_QUESTS: QuestDefinition[] = [
    {
        id: 'quest_village_hero',
        name: {
            ru: 'Герой махалли',
            uz: 'Mahalla qahramoni',
            uk: 'Герой махаллі',
            en: 'Village Hero'
        },
        description: {
            ru: 'Начни свой путь великого воина. Выполни свои первые поручения.',
            uz: "Buyuk jangchi yo'lingni boshla. Birinchi topshiriqlaringni bajar.",
            uk: 'Почни свій шлях великого воїна. Виконай свої перші доручення.',
            en: 'Start your journey as a great warrior. Complete your first tasks.'
        },
        requirements: { level: 1 },
        steps: [
            {
                id: 'step_1',
                description: {
                    ru: 'Выполни 3 любые активности',
                    uz: 'Har qanday 3 ta faoliyatni bajar',
                    uk: 'Виконай 3 будь-які активності',
                    en: 'Complete any 3 activities'
                },
                targetValue: 3,
                type: 'activity_count'
            }
        ],
        rewards: { experience: 500, soms: 2000, crystals: 10 },
        isGlobal: true
    },
    {
        id: 'quest_arena_novice',
        name: {
            ru: 'Новичок арены',
            uz: 'Arena yangi ishtirokchisi',
            uk: 'Новачок арени',
            en: 'Arena Novice'
        },
        description: {
            ru: 'Покажи свою силу в честном бою на арене.',
            uz: "Arenada halol jangda o'z kuchingni ko'rsat.",
            uk: 'Покажи свою силу в чесному бою на арені.',
            en: 'Show your strength in a fair fight in the arena.'
        },
        requirements: { level: 2 },
        steps: [
            {
                id: 'step_1',
                description: {
                    ru: 'Одержи 1 победу на арене',
                    uz: "Arenada 1 ta g'alabaga erish",
                    uk: 'Здобудь 1 перемогу на арені',
                    en: 'Win 1 fight in the arena'
                },
                targetValue: 1,
                type: 'pvp_win'
            }
        ],
        rewards: { experience: 1000, soms: 5000, crystals: 50 },
        isGlobal: true
    },
    {
        id: 'quest_honest_worker',
        name: {
            ru: 'Честный работяга',
            uz: 'Halol mehnatkash',
            uk: 'Чесний трудівник',
            en: 'Honest Worker'
        },
        description: {
            ru: 'Десять завершённых дел — и махалля начнёт тебя уважать.',
            uz: "O'nta tugatilgan ish — mahalla seni hurmat qiladi.",
            uk: 'Десять завершених справ — і махалля почне тебе поважати.',
            en: 'Ten finished jobs and the neighbourhood will respect you.'
        },
        requirements: { level: 3 },
        steps: [
            {
                id: 'step_1',
                description: {
                    ru: 'Заверши 10 активностей',
                    uz: '10 ta faoliyatni tugat',
                    uk: 'Заверши 10 активностей',
                    en: 'Complete 10 activities'
                },
                targetValue: 10,
                type: 'activity_count'
            }
        ],
        rewards: { experience: 1500, soms: 4000, crystals: 20 },
        isGlobal: true
    },
    {
        id: 'quest_arena_fighter',
        name: {
            ru: 'Боец арены',
            uz: 'Arena jangchisi',
            uk: 'Боєць арени',
            en: 'Arena Fighter'
        },
        description: {
            ru: 'Пять побед на арене: слухи о тебе уже ходят по базару.',
            uz: "Arenada besh g'alaba: bozorda sendan gapirishadi.",
            uk: 'П’ять перемог на арені: чутки про тебе вже ходять базаром.',
            en: 'Five arena wins — the bazaar is already talking about you.'
        },
        requirements: { level: 4 },
        steps: [
            {
                id: 'step_1',
                description: {
                    ru: 'Одержи 5 побед на арене',
                    uz: "Arenada 5 ta g'alaba qozon",
                    uk: 'Здобудь 5 перемог на арені',
                    en: 'Win 5 arena fights'
                },
                targetValue: 5,
                type: 'pvp_win'
            }
        ],
        rewards: { experience: 3000, soms: 7000, crystals: 40 },
        isGlobal: true
    },
    {
        id: 'quest_bazaar_master',
        name: {
            ru: 'Хозяин базара',
            uz: 'Bozor xo\u2018jayini',
            uk: 'Господар базару',
            en: 'Bazaar Master'
        },
        description: {
            ru: 'Двадцать пять дел — теперь ты знаешь базар лучше торговцев.',
            uz: 'Yigirma besh ish — endi bozorni savdogarlardan yaxshi bilasan.',
            uk: 'Двадцять п’ять справ — тепер ти знаєш базар краще за торговців.',
            en: 'Twenty-five jobs — you now know the bazaar better than the traders.'
        },
        requirements: { level: 5 },
        steps: [
            {
                id: 'step_1',
                description: {
                    ru: 'Заверши 25 активностей',
                    uz: '25 ta faoliyatni tugat',
                    uk: 'Заверши 25 активностей',
                    en: 'Complete 25 activities'
                },
                targetValue: 25,
                type: 'activity_count'
            }
        ],
        rewards: { experience: 4500, soms: 12000, crystals: 60 },
        isGlobal: true
    },
    {
        id: 'quest_silk_road',
        name: {
            ru: 'Караван Шёлкового пути',
            uz: "Buyuk ipak yo'li karvoni",
            uk: 'Караван Шовкового шляху',
            en: 'Silk Road Caravan'
        },
        description: {
            ru: 'Пятьдесят завершённых дел делают тебя частью Великого пути.',
            uz: "Ellikta tugatilgan ish seni Buyuk yo'lning bir qismiga aylantiradi.",
            uk: 'П’ятдесят завершених справ роблять тебе частиною Великого шляху.',
            en: 'Fifty finished jobs make you part of the Great Road.'
        },
        requirements: { level: 7 },
        steps: [
            {
                id: 'step_1',
                description: {
                    ru: 'Заверши 50 активностей',
                    uz: '50 ta faoliyatni tugat',
                    uk: 'Заверши 50 активностей',
                    en: 'Complete 50 activities'
                },
                targetValue: 50,
                type: 'activity_count'
            }
        ],
        rewards: { experience: 9000, soms: 25000, crystals: 120 },
        isGlobal: true
    },
    {
        id: 'quest_arena_champion',
        name: {
            ru: 'Чемпион арены',
            uz: 'Arena chempioni',
            uk: 'Чемпіон арени',
            en: 'Arena Champion'
        },
        description: {
            ru: 'Пятнадцать побед в честных боях — тебя знают в каждом городе.',
            uz: "O'n besh halol g'alaba — seni har bir shaharda bilishadi.",
            uk: 'П’ятнадцять перемог у чесних боях — тебе знають у кожному місті.',
            en: 'Fifteen wins in fair fights — every city knows your name.'
        },
        requirements: { level: 8 },
        steps: [
            {
                id: 'step_1',
                description: {
                    ru: 'Одержи 15 побед на арене',
                    uz: "Arenada 15 ta g'alaba qozon",
                    uk: 'Здобудь 15 перемог на арені',
                    en: 'Win 15 arena fights'
                },
                targetValue: 15,
                type: 'pvp_win'
            }
        ],
        rewards: { experience: 12000, soms: 30000, crystals: 150 },
        isGlobal: true
    },
    {
        id: 'quest_legend_of_uzbekistan',
        name: {
            ru: 'Легенда Узбекистана',
            uz: "O'zbekiston afsonasi",
            uk: 'Легенда Узбекистану',
            en: 'Legend of Uzbekistan'
        },
        description: {
            ru: 'Тридцать побед на арене. О тебе сложат дастаны.',
            uz: "Arenada o'ttiz g'alaba. Sen haqingda dostonlar aytishadi.",
            uk: 'Тридцять перемог на арені. Про тебе складатимуть дастани.',
            en: 'Thirty arena wins. Songs will be written about you.'
        },
        requirements: { level: 10 },
        steps: [
            {
                id: 'step_1',
                description: {
                    ru: 'Одержи 30 побед на арене',
                    uz: "Arenada 30 ta g'alaba qozon",
                    uk: 'Здобудь 30 перемог на арені',
                    en: 'Win 30 arena fights'
                },
                targetValue: 30,
                type: 'pvp_win'
            }
        ],
        rewards: { experience: 25000, soms: 75000, crystals: 300 },
        isGlobal: true
    }
];
