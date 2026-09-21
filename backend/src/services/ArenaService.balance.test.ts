/**
 * Arena balance / stat-sensitivity tests
 *
 * They prove two things that can't be checked by hand without a live fight:
 *  1) a fight lasts long enough and contains events (not 4-5 turns in a row);
 *  2) every point invested in a combat stat actually changes the outcome instead of drowning in caps.
 *
 * Models are mocked, the DB isn't touched. Math.random is replaced with a deterministic
 * generator, so the results are reproducible and the test doesn't flake.
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

/** German GPT build at level 8 with no invested points — the "baseline" for comparison */
const NO_INVESTMENT: StatLine = {
    strength: 10,
    defense: 1,
    agility: 4,
    stamina: 10,
    intelligence: 5,
    luck: 0,
};

/** A typical opponent of the same level from matchmaking */
const MID_OPPONENT: StatLine = {
    strength: 11,
    defense: 6,
    agility: 6,
    stamina: 11,
    intelligence: 5,
    luck: 1,
};

/** A weak bot like Alisher (Bot) from a live log: hits for ~14 damage */
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

/** A deterministic PRNG instead of Math.random so the test doesn't flake */
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
    /** The challenger's max health in the fight (depends on stamina) */
    avgMaxHealth: number;
    counts: Record<string, number>;
    /** Events where the challenger strikes */
    challengerEvents: Record<string, number>;
    /** Events where the opponent strikes */
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

/** How many times I produced an event of type (attackerId = me) */
const myPerBattle = (result: SimResult, type: string) => (result.challengerEvents[type] ?? 0) / result.battles;
/** How many times the opponent produced an event of type (for dodges/blocks these are my defenses) */
const theirPerBattle = (result: SimResult, type: string) => (result.opponentEvents[type] ?? 0) / result.battles;

/**
 * We measure chances per hit, not per fight: strength/stamina shorten the fight,
 * and the absolute number of events drops with the fight length — the metric would be misleading.
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

        // Previously a fight ended in 5-7 turns — that's what made it "too easy"
        expect(result.avgTurns).toBeGreaterThanOrEqual(8);
        expect(result.avgTurns).toBeLessThanOrEqual(45);

        // Different events must actually happen in a fight, not just "hit-hit"
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

        // Agility → my crits and my dodges (chance per hit)
        const agility = await simulate(invested('agility', 25), MID_OPPONENT, 'medium', 400, 777);
        expect(myRate(agility, 'crit')).toBeGreaterThan(myRate(base, 'crit'));
        expect(myDefenseRate(agility, 'dodge')).toBeGreaterThan(myDefenseRate(base, 'dodge'));

        // Intellect → I apply poison, the opponent loses health to poison
        const intelligence = await simulate(invested('intelligence', 25), MID_OPPONENT, 'medium', 400, 777);
        expect(myRate(intelligence, 'poison')).toBeGreaterThan(myRate(base, 'poison'));
        expect(theirPerBattle(intelligence, 'poison_tick')).toBeGreaterThan(theirPerBattle(base, 'poison_tick'));

        // Strength → my stuns and my damage
        const strength = await simulate(invested('strength', 25), MID_OPPONENT, 'medium', 400, 777);
        expect(myRate(strength, 'stun')).toBeGreaterThan(myRate(base, 'stun'));
        expect(strength.avgDamageDealt).toBeGreaterThan(base.avgDamageDealt);

        // Stamina → more health and a triggering second wind
        const stamina = await simulate(invested('stamina', 25), MID_OPPONENT, 'medium', 400, 777);
        const shortFight = await simulate(NO_INVESTMENT, MID_OPPONENT, 'hard', 400, 777);
        expect(stamina.avgMaxHealth).toBeGreaterThan(base.avgMaxHealth);
        expect(stamina.counts.heal ?? 0).toBeGreaterThan(0);
        // In a hard fight without investments, second wind triggers noticeably less often
        expect(myPerBattle(stamina, 'heal')).toBeGreaterThan(myPerBattle(shortFight, 'heal'));

        // Defense → I block the opponent's hits more often
        const defense = await simulate(invested('defense', 25), MID_OPPONENT, 'medium', 400, 777);
        expect(myDefenseRate(defense, 'block')).toBeGreaterThan(myDefenseRate(base, 'block'));

        // Luck → my crits
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
