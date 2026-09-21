/**
 * Arena battle log regression tests
 *
 * We check that the battle log returns health in fighter roles (challenger/opponent)
 * and that the HP bars on the client can't "jump": each fighter's HP must
 * decrease monotonically from the start of the fight to the end.
 *
 * Previously the frontend compared attackerId with the player's id, while dodge/block events
 * were recorded with the defender's attackerId — which made the health jump between fighters.
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

import { startFight, toRoleBasedLog, BattleEvent } from './ArenaService';
import { Player } from '../models/Player';

const CHALLENGER_ID = 'challenger1';
const OPPONENT_ID = 'opponent1';

function makePlayer(id: string, overrides: Record<string, unknown> = {}) {
    return {
        _id: { toString: () => id },
        characterId: 'char_warrior',
        level: 5,
        experience: 0,
        soms: 10000,
        stats: { hunger: 100, health: 100, mood: 100, energy: 100 },
        combatStats: {
            strength: 12,
            defense: 10,
            agility: 10,
            stamina: 10,
            intelligence: 8,
            luck: 2,
            combatPower: 60,
            statPoints: 0,
        },
        userId: { displayName: `name-${id}` },
        save: jest.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}

function mockPlayers() {
    const challenger = makePlayer(CHALLENGER_ID);
    const opponent = makePlayer(OPPONENT_ID);
    (Player.findById as jest.Mock).mockImplementation((id: unknown) => ({
        populate: () =>
            Promise.resolve(String(id) === CHALLENGER_ID ? challenger : opponent),
    }));
    return { challenger, opponent };
}

function assertHpInvariants(log: BattleEvent[], challengerMax: number, opponentMax: number) {
    let prevChallenger = challengerMax;
    let prevOpponent = opponentMax;

    log.forEach((event) => {
        expect(typeof event.challengerHealth).toBe('number');
        expect(typeof event.opponentHealth).toBe('number');

        // HP is never greater than the maximum
        expect(event.challengerHealth!).toBeLessThanOrEqual(challengerMax);
        expect(event.opponentHealth!).toBeLessThanOrEqual(opponentMax);

        // Second wind (heal) is the only event that raises health,
        // and only for its own fighter. Everything else only decreases health.
        const healedIsChallenger = event.type === 'heal' && event.attackerId === CHALLENGER_ID;
        const healedIsOpponent = event.type === 'heal' && event.attackerId !== CHALLENGER_ID;

        expect(event.challengerHealth!).toBeLessThanOrEqual(healedIsChallenger ? challengerMax : prevChallenger);
        expect(event.opponentHealth!).toBeLessThanOrEqual(healedIsOpponent ? opponentMax : prevOpponent);
        if (healedIsChallenger) expect(event.challengerHealth!).toBeGreaterThanOrEqual(prevChallenger);
        if (healedIsOpponent) expect(event.opponentHealth!).toBeGreaterThanOrEqual(prevOpponent);

        // The values must match the HP of the one who strikes, with no swaps
        const challengerIsStriker = event.attackerId === CHALLENGER_ID;
        expect(event.challengerHealth).toBe(
            challengerIsStriker ? event.attackerHealth : event.defenderHealth
        );
        expect(event.opponentHealth).toBe(
            challengerIsStriker ? event.defenderHealth : event.attackerHealth
        );

        prevChallenger = event.challengerHealth!;
        prevOpponent = event.opponentHealth!;
    });
}

describe('ArenaService battle log', () => {
    it('returns role-based HP with no unexplained jumps (many random battles)', async () => {
        for (let battle = 0; battle < 200; battle++) {
            mockPlayers();

            const result = await startFight(CHALLENGER_ID, OPPONENT_ID, 'medium');

            expect(result.matchLog.length).toBeGreaterThan(0);
            assertHpInvariants(
                result.matchLog as BattleEvent[],
                result.challengerMaxHealth,
                result.opponentMaxHealth
            );

            // The fight ends with the death of one of the fighters
            const finish = result.matchLog[result.matchLog.length - 1];
            expect(finish.type).toBe('finish');
            const loserIsChallenger = result.winnerId.toString() === OPPONENT_ID;
            expect(loserIsChallenger ? finish.challengerHealth : finish.opponentHealth).toBe(0);
        }
    });

    it('marks self-inflicted events with the party they happen to', async () => {
        const events: BattleEvent[] = [
            {
                type: 'poison_tick',
                turn: 1,
                attackerId: CHALLENGER_ID,
                attackerName: 'challenger',
                defenderName: 'opponent',
                damage: 5,
                attackerHealth: 90,
                defenderHealth: 100,
                attackerMaxHealth: 100,
                defenderMaxHealth: 100,
            },
            {
                type: 'stun_skip',
                turn: 1,
                attackerId: OPPONENT_ID,
                attackerName: 'opponent',
                defenderName: 'challenger',
                damage: 0,
                attackerHealth: 100,
                defenderHealth: 90,
                attackerMaxHealth: 100,
                defenderMaxHealth: 100,
            },
        ];

        const [challengerPoisoned, opponentStunned] = toRoleBasedLog(events, CHALLENGER_ID);

        expect(challengerPoisoned.challengerHealth).toBe(90);
        expect(challengerPoisoned.opponentHealth).toBe(100);
        // stun_skip is struck by the opponent, so its HP stays first
        expect(opponentStunned.challengerHealth).toBe(90);
        expect(opponentStunned.opponentHealth).toBe(100);
    });
});
