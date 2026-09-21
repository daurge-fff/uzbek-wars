/**
 * Arena balance / stat-sensitivity tests
 *
 * Доказывают две вещи, которые нельзя проверить руками без живого боя:
 *  1) бой длится достаточно долго и в нём есть события (не 4-5 ходов подряд);
 *  2) каждое вложение в боевой стат реально меняет исход, а не тонет в потолках.
 *
 * Модели замоканы, БД не трогается. Math.random заменяется детерминированным
 * генератором, поэтому результаты воспроизводимы и тест не флакает.
 */

jest.mock('../utils/logger', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('../models/Player', () => ({
    Player: {
        findById: jest.fn(),
        find: jest.fn(),
        findByIdAndUpdate: jest.fn().mockResolvedValue(undefined),
    },
}));

jest.mock('../models/ArenaMatch', () => ({
    ArenaMatch: jest.fn().mockImplementation((doc: any) => ({
        ...doc,
        _id: { toString: () => 'match1' },
        save: jest.fn().mockResolvedValue(undefined),
    })),
}));

jest.mock('./TaskService', () => ({
    updateTaskProgress: jest.fn().mockResolvedValue(undefined),
    updateQuestProgress: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./AchievementService', () => ({
    trackProgress: jest.fn().mockResolvedValue(undefined),
}));

import { startFight, Difficulty } from './ArenaService';
import { Player } from '../models/Player';

const CHALLENGER_ID = 'challenger1';
const OPPONENT_ID = 'opponent1';

type StatLine = {
    strength: number;
    defense: number;
    agility: number;
    stamina: number;
    intelligence: number;
    luck: number;
};

/** Билд German GPT на 8 уровне без вложенных очков — «база» для сравнения */
const NO_INVESTMENT: StatLine = {
    strength: 10,
    defense: 1,
    agility: 4,
    stamina: 10,
    intelligence: 5,
    luck: 0,
};

/** Типичный соперник того же уровня из матчмейкинга */
const MID_OPPONENT: StatLine = {
    strength: 11,
    defense: 6,
    agility: 6,
    stamina: 11,
    intelligence: 5,
    luck: 1,
};

/** Слабый бот вроде Alisher (Bot) из живого лога: бьёт на ~14 урона */
const WEAK_BOT: StatLine = {
    strength: 5,
    defense: 5,
    agility: 5,
    stamina: 8,
    intelligence: 3,
    luck: 1,
};

function makePlayer(id: string, stats: StatLine, level = 8) {
    const combatPower = Math.round(
        stats.strength + stats.defense + stats.agility + stats.stamina + stats.intelligence + stats.luck
    );
    return {
        _id: { toString: () => id },
        characterId: 'char_warrior',
        level,
        experience: 0,
        soms: 1_000_000,
        stats: { hunger: 100, health: 100, mood: 100, energy: 100 },
        combatStats: { ...stats, statPoints: 0, combatPower },
        userId: { displayName: `name-${id}` },
        save: jest.fn().mockResolvedValue(undefined),
    };
}

/** Детерминированный ГПСЧ вместо Math.random, чтобы тест не флакал */
function seedRandom(seed: number) {
    let state = seed >>> 0;
    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 4294967296;
    };
}

interface SimResult {
    winRate: number;
    avgTurns: number;
    avgDamageDealt: number;
    /** Максимальное здоровье претендента в бою (зависит от выносливости) */
    avgMaxHealth: number;
    counts: Record<string, number>;
    /** События, где бьёт претендент */
    challengerEvents: Record<string, number>;
    /** События, где бьёт противник */
    opponentEvents: Record<string, number>;
    battles: number;
}

async function simulate(
    challengerStats: StatLine,
    opponentStats: StatLine,
    difficulty: Difficulty,
    battles: number,
    seed: number
): Promise<SimResult> {
    const randomMock = jest.spyOn(Math, 'random').mockImplementation(seedRandom(seed));

    try {
        let wins = 0;
        let turns = 0;
        let damage = 0;
        let maxHealth = 0;
        const counts: Record<string, number> = {};
        const challengerEvents: Record<string, number> = {};
        const opponentEvents: Record<string, number> = {};

        for (let i = 0; i < battles; i++) {
            const challenger = makePlayer(CHALLENGER_ID, challengerStats);
            const opponent = makePlayer(OPPONENT_ID, opponentStats);

            (Player.findById as jest.Mock).mockImplementation((id: unknown) => ({
                populate: () => Promise.resolve(String(id) === CHALLENGER_ID ? challenger : opponent),
            }));

            const result = await startFight(CHALLENGER_ID, OPPONENT_ID, difficulty);

            if (result.isWinner) wins++;
            turns += result.stats.totalTurns;
            damage += result.stats.totalDamageDealt;
            maxHealth += result.challengerMaxHealth;
            for (const event of result.matchLog) {
                counts[event.type] = (counts[event.type] ?? 0) + 1;
                const bucket = event.attackerId === CHALLENGER_ID ? challengerEvents : opponentEvents;
                bucket[event.type] = (bucket[event.type] ?? 0) + 1;
            }
        }

        return {
            winRate: wins / battles,
            avgTurns: turns / battles,
            avgDamageDealt: damage / battles,
            avgMaxHealth: maxHealth / battles,
            counts,
            challengerEvents,
            opponentEvents,
            battles,
        };
    } finally {
        randomMock.mockRestore();
    }
}

const perBattle = (result: SimResult, type: string) => (result.counts[type] ?? 0) / result.battles;

/** Сколько раз я сделал событие type (attackerId = я) */
const myPerBattle = (result: SimResult, type: string) => (result.challengerEvents[type] ?? 0) / result.battles;
/** Сколько раз событие type сделал противник (для уклонений/блоков это мои защиты) */
const theirPerBattle = (result: SimResult, type: string) => (result.opponentEvents[type] ?? 0) / result.battles;

/**
 * Шансы считаем на попадание, а не на бой: сила/выносливость укорачивают бой,
 * и абсолютное число событий падает вместе с длиной боя — метрика вводила бы в заблуждение.
 */
const landedAttacks = (result: SimResult) => result.challengerEvents.attack ?? 0;
const theirLandedAttacks = (result: SimResult) => result.opponentEvents.attack ?? 0;
const myRate = (result: SimResult, type: string) => (result.challengerEvents[type] ?? 0) / Math.max(1, landedAttacks(result));
const myDefenseRate = (result: SimResult, type: string) => (result.opponentEvents[type] ?? 0) / Math.max(1, theirLandedAttacks(result));

describe('Arena balance: бой должен быть длинным, а статы — решать', () => {
    it('бой против слабого бота длится много ходов и содержит события', async () => {
        const result = await simulate(NO_INVESTMENT, WEAK_BOT, 'medium', 300, 12345);

        console.log(
            `[balance] бой против слабого бота: ходов=${result.avgTurns.toFixed(1)}, ` +
            `побед=${(result.winRate * 100).toFixed(0)}%, урона за бой=${result.avgDamageDealt.toFixed(0)}, ` +
            `события=${JSON.stringify(result.counts)}`
        );

        // Раньше бой заканчивался за 5-7 ходов — это и делало его «слишком простым»
        expect(result.avgTurns).toBeGreaterThanOrEqual(8);
        expect(result.avgTurns).toBeLessThanOrEqual(45);

        // В бою реально должны случаться разные события, а не только «удар-удар»
        expect(perBattle(result, 'attack')).toBeGreaterThan(1);
        expect(perBattle(result, 'crit') + perBattle(result, 'dodge') + perBattle(result, 'block')).toBeGreaterThan(1);
    });

    it('на сложном режиме базовый билд без вложений проигрывает', async () => {
        const hard = await simulate(NO_INVESTMENT, MID_OPPONENT, 'hard', 300, 999);
        const easy = await simulate(NO_INVESTMENT, MID_OPPONENT, 'easy', 300, 999);

        console.log(
            `[balance] без вложений: easy=${(easy.winRate * 100).toFixed(0)}%, hard=${(hard.winRate * 100).toFixed(0)}%`
        );

        expect(easy.winRate).toBeGreaterThan(hard.winRate);
        expect(hard.winRate).toBeLessThan(0.5);
    });

    it('вложение в боевой стат улучшает результат против одного и того же соперника', async () => {
        const INVEST = 20;
        const baseline = await simulate(NO_INVESTMENT, MID_OPPONENT, 'medium', 300, 4242);

        const rows: Record<string, number> = { base: baseline.winRate };
        for (const stat of ['strength', 'defense', 'agility', 'stamina', 'intelligence'] as const) {
            const invested: StatLine = { ...NO_INVESTMENT, [stat]: NO_INVESTMENT[stat] + INVEST };
            const result = await simulate(invested, MID_OPPONENT, 'medium', 300, 4242 + INVEST);
            rows[stat] = result.winRate;
            expect(result.winRate).toBeGreaterThan(baseline.winRate);
        }

        console.log(
            `[balance] win rate (medium, +${INVEST} в стат): ` +
            Object.entries(rows).map(([k, v]) => `${k}=${(v * 100).toFixed(0)}%`).join(', ')
        );
    });

    it('каждый стат меняет свой тип событий, а не «средний шум»', async () => {
        const invested = (stat: keyof StatLine, value: number): StatLine => ({
            ...NO_INVESTMENT,
            [stat]: NO_INVESTMENT[stat] + value,
        });

        const base = await simulate(NO_INVESTMENT, MID_OPPONENT, 'medium', 400, 777);

        // Ловкость → мои криты и мои уклонения (шанс на попадание)
        const agility = await simulate(invested('agility', 25), MID_OPPONENT, 'medium', 400, 777);
        expect(myRate(agility, 'crit')).toBeGreaterThan(myRate(base, 'crit'));
        expect(myDefenseRate(agility, 'dodge')).toBeGreaterThan(myDefenseRate(base, 'dodge'));

        // Интеллект → я накладываю яд, соперник теряет здоровье от яда
        const intelligence = await simulate(invested('intelligence', 25), MID_OPPONENT, 'medium', 400, 777);
        expect(myRate(intelligence, 'poison')).toBeGreaterThan(myRate(base, 'poison'));
        expect(theirPerBattle(intelligence, 'poison_tick')).toBeGreaterThan(theirPerBattle(base, 'poison_tick'));

        // Сила → мои оглушения и мой урон
        const strength = await simulate(invested('strength', 25), MID_OPPONENT, 'medium', 400, 777);
        expect(myRate(strength, 'stun')).toBeGreaterThan(myRate(base, 'stun'));
        expect(strength.avgDamageDealt).toBeGreaterThan(base.avgDamageDealt);

        // Выносливость → больше здоровья и срабатывающее второе дыхание
        const stamina = await simulate(invested('stamina', 25), MID_OPPONENT, 'medium', 400, 777);
        const shortFight = await simulate(NO_INVESTMENT, MID_OPPONENT, 'hard', 400, 777);
        expect(stamina.avgMaxHealth).toBeGreaterThan(base.avgMaxHealth);
        expect(stamina.counts.heal ?? 0).toBeGreaterThan(0);
        // На сложном бою без вложений второе дыхание срабатывает заметно реже
        expect(myPerBattle(stamina, 'heal')).toBeGreaterThan(myPerBattle(shortFight, 'heal'));

        // Защита → я чаще блокирую удары соперника
        const defense = await simulate(invested('defense', 25), MID_OPPONENT, 'medium', 400, 777);
        expect(myDefenseRate(defense, 'block')).toBeGreaterThan(myDefenseRate(base, 'block'));

        // Удача → мои криты
        const luck = await simulate(invested('luck', 40), MID_OPPONENT, 'medium', 400, 777);
        expect(myRate(luck, 'crit')).toBeGreaterThan(myRate(base, 'crit'));

        console.log(
            `[balance] шансы на попадание: base(crit=${myRate(base, 'crit').toFixed(3)}, stun=${myRate(base, 'stun').toFixed(3)}, poison=${myRate(base, 'poison').toFixed(3)}, block=${myDefenseRate(base, 'block').toFixed(3)}, dodge=${myDefenseRate(base, 'dodge').toFixed(3)}, heals=${myPerBattle(base, 'heal').toFixed(2)}) ` +
            `agi25(crit=${myRate(agility, 'crit').toFixed(3)}, dodge=${myDefenseRate(agility, 'dodge').toFixed(3)}) ` +
            `int25(poison=${myRate(intelligence, 'poison').toFixed(3)}) ` +
            `str25(stun=${myRate(strength, 'stun').toFixed(3)}, dmg=${strength.avgDamageDealt.toFixed(0)}) ` +
            `sta25(HP=${stamina.avgMaxHealth.toFixed(0)}, heals=${myPerBattle(stamina, 'heal').toFixed(2)}) ` +
            `def25(block=${myDefenseRate(defense, 'block').toFixed(3)}) luck40(crit=${myRate(luck, 'crit').toFixed(3)})`
        );
    });
});
