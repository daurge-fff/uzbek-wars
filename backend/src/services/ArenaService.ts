import { Player, IPlayer } from '../models/Player';
import { ArenaMatch } from '../models/ArenaMatch';
import { logger } from '../utils/logger';
import { processLevelUp } from './ProgressionService';
import { CosmeticBonusService } from './CosmeticBonusService';
import * as AchievementService from './AchievementService';
import * as TaskService from './TaskService';

export type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultyConfig {
    statMultiplier: number;
    energyCost: number;
    healthCostWin: number;
    healthCostLose: number;
    somsCost: number;
    rewardMultiplier: number;
    xpMultiplier: number;
    /** Round cap: don't let a fight end in 4-5 moves */
    maxTurns: number;
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
    easy: {
        statMultiplier: 0.8,
        energyCost: 10,
        healthCostWin: 3,
        healthCostLose: 10,
        somsCost: 50,
        rewardMultiplier: 0.5,
        xpMultiplier: 0.5,
        maxTurns: 40,
    },
    medium: {
        statMultiplier: 1.15,
        energyCost: 20,
        healthCostWin: 8,
        healthCostLose: 20,
        somsCost: 150,
        rewardMultiplier: 1.0,
        xpMultiplier: 1.0,
        maxTurns: 40,
    },
    hard: {
        statMultiplier: 1.7,
        energyCost: 30,
        healthCostWin: 15,
        healthCostLose: 35,
        somsCost: 300,
        rewardMultiplier: 2.0,
        xpMultiplier: 2.0,
        maxTurns: 45,
    },
};

/** Maximum hits in one series (first hit + combo) */
const MAX_COMBO_HITS = 3;

/**
 * A fighter inside a single fight: effective stats, health and statuses.
 * The object lives only within startFight and is never saved to the DB.
 */
interface BattleFighter {
    id: string;
    name: string;
    /** Effective stats (the opponent's are already multiplied by the fight difficulty) */
    stats: Record<string, number | undefined>;
    maxHP: number;
    hp: number;
    stun: number;
    poison: { turns: number; damage: number } | null;
    /** Second wind (stamina) triggers once per fight */
    secondWindUsed: boolean;
    damageDealt: number;
}

interface BattleCounters {
    crits: number;
    dodges: number;
    combos: number;
}

export interface BattleEvent {
    type: 'attack' | 'crit' | 'dodge' | 'counter' | 'block' | 'combo' | 'miss' | 'finish' | 'stun' | 'stun_skip' | 'poison' | 'poison_tick' | 'heal';
    turn: number;
    attackerId: string;
    attackerName: string;
    defenderName: string;
    damage: number;
    isCrit?: boolean;
    isDodge?: boolean;
    isCounter?: boolean;
    isBlock?: boolean;
    isCombo?: boolean;
    isMiss?: boolean;
    isStun?: boolean;
    attackerHealth: number;
    defenderHealth: number;
    attackerMaxHealth: number;
    defenderMaxHealth: number;
    /**
     * Fighter health mapped to roles (challenger/opponent) rather than to "who strikes":
     * attacker/defender change meaning depending on the turn, which made the HP bars
     * on the frontend jump between fighters.
     */
    challengerHealth?: number;
    challengerMaxHealth?: number;
    opponentHealth?: number;
    opponentMaxHealth?: number;
    effect?: string;
}

/**
 * Find potential opponents for arena matchmaking
 * Finds players within a power range based on difficulty
 */
export async function findOpponents(playerId: string, limit: number = 3): Promise<IPlayer[]> {
    try {
        const player = await Player.findById(playerId);
        if (!player) throw new Error('Player not found');

        const power = player.combatStats.combatPower || 10;

        // Wider range for matchmaking: +/- 40%
        const minPower = power * 0.6;
        const maxPower = power * 1.4;

        return await Player.find({
            _id: { $ne: player._id },
            'combatStats.combatPower': { $gte: minPower, $lte: maxPower }
        })
            .limit(limit)
            .sort({ 'combatStats.combatPower': -1 })
            .populate('userId', 'displayName');
    } catch (error) {
        logger.error('Error finding opponents:', error);
        throw error;
    }
}

/**
 * Start a fight with difficulty settings
 */
export async function startFight(
    challengerId: string,
    opponentId: string,
    difficulty: Difficulty = 'medium'
) {
    try {
        const challenger = await Player.findById(challengerId).populate('userId', 'displayName');
        const opponent = await Player.findById(opponentId).populate('userId', 'displayName');

        if (!challenger || !opponent) throw new Error('Player(s) not found');

        const config = DIFFICULTY_CONFIG[difficulty];
        const challengerName = (challenger.userId as any)?.displayName || challenger.characterId;
        const opponentName = (opponent.userId as any)?.displayName || opponent.characterId;

        // Check energy
        if ((challenger.stats?.energy || 0) < config.energyCost) {
            throw new Error('NOT_ENOUGH_ENERGY');
        }

        // Check soms
        if ((challenger.soms || 0) < config.somsCost) {
            throw new Error('NOT_ENOUGH_SOMS');
        }

        // Deduct energy
        challenger.stats.energy = Math.max(0, (challenger.stats?.energy || 0) - config.energyCost);

        // Deduct soms
        challenger.soms = Math.max(0, challenger.soms - config.somsCost);

        // Effective stats = own stats + equipment bonus. Gear has to matter in battle,
        // and the player's base stats stay untouched when items are sold or taken off.
        const challengerEffectiveStats = await CosmeticBonusService.getEffectiveCombatStats(challenger);
        const opponentEffectiveStats = await CosmeticBonusService.getEffectiveCombatStats(opponent);

        // Apply difficulty multipliers to opponent stats
        const opponentStats = applyDifficultyMultiplier(opponentEffectiveStats, config.statMultiplier);

        // HP from stamina
        const maxChallengerHP = calculateMaxHP(challengerEffectiveStats);
        const maxOpponentHP = calculateMaxHP(opponentStats);

        const challengerFighter: BattleFighter = {
            id: challenger._id.toString(),
            name: challengerName,
            stats: challengerEffectiveStats as any,
            maxHP: maxChallengerHP,
            hp: maxChallengerHP,
            stun: 0,
            poison: null,
            secondWindUsed: false,
            damageDealt: 0,
        };

        const opponentFighter: BattleFighter = {
            id: opponent._id.toString(),
            name: opponentName,
            stats: opponentStats,
            maxHP: maxOpponentHP,
            hp: maxOpponentHP,
            stun: 0,
            poison: null,
            secondWindUsed: false,
            damageDealt: 0,
        };

        const counters: BattleCounters = { crits: 0, dodges: 0, combos: 0 };
        const events: BattleEvent[] = [];
        let turn = 1;
        let winnerId: any = null;

        const pushFinish = (winner: BattleFighter, loser: BattleFighter) => {
            events.push(createEvent('finish', turn, winner.id, winner.name, loser.name, 0, winner.hp, winner.maxHP, 0, loser.maxHP));
        };

        while (challengerFighter.hp > 0 && opponentFighter.hp > 0 && turn <= config.maxTurns) {
            // === Challenger's turn ===
            resolveTurn(challengerFighter, opponentFighter, turn, events, counters);

            // The turn could end with either fighter dead: the opponent was finished off,
            // or the challenger died from a counterattack
            if (opponentFighter.hp <= 0 || challengerFighter.hp <= 0) {
                const challengerWon = opponentFighter.hp <= 0;
                winnerId = challengerWon ? challenger._id : opponent._id;
                pushFinish(challengerWon ? challengerFighter : opponentFighter, challengerWon ? opponentFighter : challengerFighter);
                break;
            }

            // === Opponent's counter turn ===
            resolveTurn(opponentFighter, challengerFighter, turn, events, counters);

            if (challengerFighter.hp <= 0 || opponentFighter.hp <= 0) {
                const challengerWon = opponentFighter.hp <= 0;
                winnerId = challengerWon ? challenger._id : opponent._id;
                pushFinish(challengerWon ? challengerFighter : opponentFighter, challengerWon ? opponentFighter : challengerFighter);
                break;
            }

            turn++;
        }

        // Determine winner by HP if timeout (compare the health fraction, not the absolute value)
        if (!winnerId) {
            const challengerShare = challengerFighter.hp / challengerFighter.maxHP;
            const opponentShare = opponentFighter.hp / opponentFighter.maxHP;
            winnerId = challengerShare >= opponentShare ? challenger._id : opponent._id;
        }

        const isChallengerWinner = winnerId.toString() === challengerId;
        const totalTurns = events.length > 0 ? events[events.length - 1].turn : turn;

        // Health costs based on difficulty and outcome
        const healthCost = isChallengerWinner ? config.healthCostWin : config.healthCostLose;
        challenger.stats.health = Math.max(0, (challenger.stats?.health || 100) - healthCost);

        // Rewards scaled by difficulty
        const baseSoms = isChallengerWinner ? 500 : 100;
        const baseXP = isChallengerWinner ? 100 : 20;
        const baseRating = isChallengerWinner ? 15 : -10;

        const rewards = {
            soms: Math.floor(baseSoms * config.rewardMultiplier),
            experience: Math.floor(baseXP * config.xpMultiplier),
            ratingPoints: isChallengerWinner ? Math.floor(baseRating * config.rewardMultiplier) : baseRating,
            energyCost: config.energyCost,
            healthCost,
            somsCost: config.somsCost,
        };

        // Update challenger
        challenger.soms += rewards.soms;
        challenger.experience += rewards.experience;
        processLevelUp(challenger);
        await challenger.save();

        // Daily task, quest and achievement tracking runs in the background.
        // Awaiting these extra round-trips used to keep the fight response busy for seconds,
        // so the client sat on "preparing battle" instead of showing the fight.
        void trackArenaProgress(challenger._id.toString(), isChallengerWinner).catch((error) => {
            logger.error('Error tracking arena progress:', error);
        });

        // Map the health in the log to fighter roles (challenger/opponent).
        const normalizedEvents = toRoleBasedLog(events, challenger._id.toString());

        const stats = {
            totalTurns,
            totalDamageDealt: challengerFighter.damageDealt,
            totalDamageReceived: opponentFighter.damageDealt,
            crits: counters.crits,
            dodges: counters.dodges,
            combos: counters.combos,
        };

        // Create match record
        const match = new ArenaMatch({
            challengerId,
            opponentId,
            winnerId,
            difficulty,
            challengerStats: {
                level: challenger.level,
                combatPower: challenger.combatStats?.combatPower || 10
            },
            opponentStats: {
                level: opponent.level,
                combatPower: opponent.combatStats?.combatPower || 10
            },
            rewards,
            matchLog: normalizedEvents,
            stats
        });

        await match.save();

        return {
            matchId: match._id,
            winnerId,
            isWinner: isChallengerWinner,
            challengerName,
            opponentName,
            challengerMaxHealth: maxChallengerHP,
            opponentMaxHealth: maxOpponentHP,
            challengerHealth: challengerFighter.hp,
            opponentHealth: opponentFighter.hp,
            difficulty,
            rewards,
            matchLog: normalizedEvents,
            stats
        };
    } catch (error) {
        logger.error('Error starting fight:', error);
        throw error;
    }
}

/**
 * Tracks arena daily tasks, quests and achievements for a finished fight.
 *
 * Re-reads the player so the updates work on the freshly saved document instead of a
 * stale one, and runs detached from the HTTP response.
 */
async function trackArenaProgress(challengerId: string, isChallengerWinner: boolean): Promise<void> {
    const freshPlayer = await Player.findById(challengerId);
    if (!freshPlayer) return;

    if (isChallengerWinner) {
        await AchievementService.trackProgress(challengerId, 'arena_warrior_1', 1);
    }

    await TaskService.updateTaskProgress(freshPlayer, 'pvp_battle', 1);
    if (isChallengerWinner) {
        await TaskService.updateTaskProgress(freshPlayer, 'pvp_win', 1);
        await TaskService.updateQuestProgress(freshPlayer, 'pvp_win', 1);
    }
}

/**
 * Soft chance from a stat value: base + weight * stat / (stat + scale), capped at cap.
 *
 * Previously chances were computed as stat / 15 (or stat / 25) with a hard cap, so
 * 4 and 10 points in a stat gave almost the same result, and investing in stats
 * wasn't felt. Here the return grows with every point, but with diminishing returns.
 */
function statChance(stat: number, scale: number, weight: number, base: number, cap: number): number {
    const value = Math.max(0, stat || 0);
    const soft = value / (value + scale);
    return Math.min(cap, base + weight * soft);
}

/** Fraction of damage absorbed by defense (0..0.7) */
function mitigation(defense: number): number {
    const def = Math.max(0, defense || 0);
    return Math.min(0.7, def / (def + 28));
}

function calculateMaxHP(combatStats: any): number {
    const stamina = combatStats?.stamina ?? 5;
    return Math.floor(80 + stamina * 20);
}

/** Poison damage: part of the victim's max health + the poisoner's intellect contribution */
function poisonTickDamage(defenderMaxHP: number, attackerIntelligence: number): number {
    return Math.max(2, Math.floor(defenderMaxHP * 0.03) + Math.floor((attackerIntelligence || 0) * 0.7));
}

/** Stun chance: grows with strength, a crit adds on top */
function stunChance(attackerStats: Record<string, number | undefined>, isCrit: boolean): number {
    const chance = statChance(attackerStats.strength ?? 1, 45, 0.10, 0.02, 0.15) + (isCrit ? 0.10 : 0);
    return Math.min(0.35, chance);
}

function applyDifficultyMultiplier(combatStats: any, multiplier: number) {
    const scale = (value: number) => Math.min(200, Math.floor(value * multiplier));
    return {
        strength: scale(combatStats?.strength || 10),
        defense: scale(combatStats?.defense || 10),
        agility: scale(combatStats?.agility || 10),
        stamina: scale(combatStats?.stamina || 10),
        intelligence: scale(combatStats?.intelligence || 10),
        luck: scale(combatStats?.luck || 0),
    };
}

interface AttackRoll {
    damage: number;
    isCrit: boolean;
    isDodge: boolean;
    isBlock: boolean;
    isMiss: boolean;
}

/**
 * A single attack roll. Order: miss → dodge → crit → block.
 * A crit pierces the block, the block absorbs 60% of the damage, and defense reduces damage permanently.
 */
function rollAttack(attackerStats: any, defenderStats: any, comboLevel = 0): AttackRoll {
    const str = attackerStats?.strength ?? 1;
    const agi = attackerStats?.agility ?? 1;
    const int = attackerStats?.intelligence ?? 1;
    const luck = attackerStats?.luck ?? 0;

    const def = defenderStats?.defense ?? 1;
    const defAgi = defenderStats?.agility ?? 1;
    const defLuck = defenderStats?.luck ?? 0;

    const missChance = Math.max(0.02, 0.06 - 0.03 * (agi / (agi + 30)));
    if (Math.random() < missChance) {
        return { damage: 0, isCrit: false, isDodge: false, isBlock: false, isMiss: true };
    }

    const dodgeChance = statChance(defAgi, 40, 0.30, 0.02, 0.40) + statChance(defLuck, 25, 0.08, 0, 0.10);
    if (Math.random() < dodgeChance) {
        return { damage: 0, isCrit: false, isDodge: true, isBlock: false, isMiss: false };
    }

    const critChance = statChance(agi, 40, 0.35, 0.05, 0.45) + statChance(luck, 25, 0.06, 0, 0.10);
    const isCrit = Math.random() < critChance;

    // A crit breaks through defense, a normal hit can be blocked
    const isBlock = !isCrit && Math.random() < statChance(def, 40, 0.30, 0.02, 0.35);

    const baseDamage = 4 + str * 1.5 + int * 0.8;
    const critMult = isCrit ? 1.55 + Math.min(0.6, int / 60) : 1;
    const comboMult = comboLevel > 1 ? 1 + (comboLevel - 1) * 0.12 : 1;

    let damage = Math.max(3, Math.floor(baseDamage * critMult * comboMult * (1 - mitigation(def))));
    if (isBlock) {
        damage = Math.max(2, Math.floor(damage * 0.4));
    }

    return { damage, isCrit, isDodge: false, isBlock, isMiss: false };
}

function calculateCounterDamage(counterAttackerStats: any, originalDamage: number): number {
    const agi = counterAttackerStats?.agility ?? 1;
    const str = counterAttackerStats?.strength ?? 1;
    const counterMult = 0.45 + 0.25 * (agi / (agi + 25));
    return Math.max(3, Math.floor(originalDamage * counterMult + str * 0.5));
}

function pushEvent(
    events: BattleEvent[],
    type: BattleEvent['type'],
    turn: number,
    attacker: BattleFighter,
    defender: BattleFighter,
    damage: number
): void {
    events.push(
        createEvent(type, turn, attacker.id, attacker.name, defender.name, damage, attacker.hp, attacker.maxHP, defender.hp, defender.maxHP)
    );
}

/**
 * A single fighter's turn: poison tick, second wind, a series of hits with effects, and a counterattack.
 *
 * All random events are computed from the fighters' real stats: strength gives damage and
 * stun, defense — damage reduction and block, agility — crits, dodge, combo and
 * counterattack, stamina — health and second wind, intellect — crit power and poison,
 * luck — crits, dodge and second wind.
 */
function resolveTurn(
    attacker: BattleFighter,
    defender: BattleFighter,
    turn: number,
    events: BattleEvent[],
    counters: BattleCounters
): void {
    // Stun: the turn is skipped
    if (attacker.stun > 0) {
        pushEvent(events, 'stun_skip', turn, attacker, defender, 0);
        attacker.stun--;
        return;
    }

    // Poison ticks at the start of the turn
    if (attacker.poison) {
        const tickDamage = attacker.poison.damage;
        attacker.hp = Math.max(1, attacker.hp - tickDamage);
        attacker.poison.turns--;
        if (attacker.poison.turns <= 0) attacker.poison = null;
        pushEvent(events, 'poison_tick', turn, attacker, defender, tickDamage);
    }

    // Second wind (stamina + luck): once per fight at low health
    if (!attacker.secondWindUsed && attacker.hp / attacker.maxHP <= 0.35) {
        const stamina = attacker.stats.stamina ?? 5;
        const luck = attacker.stats.luck ?? 0;
        const healChance = statChance(stamina, 50, 0.30, 0.05, 0.35) + statChance(luck, 25, 0.10, 0, 0.10);
        if (Math.random() < healChance) {
            const heal = Math.max(1, Math.floor(attacker.maxHP * (0.12 + stamina * 0.004)));
            attacker.hp = Math.min(attacker.maxHP, attacker.hp + heal);
            attacker.secondWindUsed = true;
            pushEvent(events, 'heal', turn, attacker, defender, heal);
        }
    }

    // Hit series: a hit may continue as a combo
    let turnDamage = 0;
    for (let comboLevel = 1; comboLevel <= MAX_COMBO_HITS; comboLevel++) {
        const hit = rollAttack(attacker.stats, defender.stats, comboLevel);

        if (hit.isMiss) {
            pushEvent(events, 'miss', turn, attacker, defender, 0);
            break;
        }

        if (hit.isDodge) {
            counters.dodges++;
            pushEvent(events, 'dodge', turn, attacker, defender, 0);
            break;
        }

        defender.hp = Math.max(0, defender.hp - hit.damage);
        turnDamage += hit.damage;

        if (hit.isBlock) {
            pushEvent(events, 'block', turn, attacker, defender, hit.damage);
        } else if (hit.isCrit) {
            counters.crits++;
            pushEvent(events, 'crit', turn, attacker, defender, hit.damage);
        } else {
            pushEvent(events, 'attack', turn, attacker, defender, hit.damage);
        }

        if (defender.hp <= 0) break;

        // Stun (strength)
        if (defender.stun === 0 && Math.random() < stunChance(attacker.stats, hit.isCrit)) {
            defender.stun = 1;
            pushEvent(events, 'stun', turn, attacker, defender, 0);
        }

        // Poison (intellect)
        const poisonChance = statChance(attacker.stats.intelligence ?? 1, 35, 0.30, 0.02, 0.35);
        if (!defender.poison && Math.random() < poisonChance) {
            defender.poison = {
                turns: 3,
                damage: poisonTickDamage(defender.maxHP, attacker.stats.intelligence ?? 1),
            };
            pushEvent(events, 'poison', turn, attacker, defender, 0);
        }

        if (comboLevel >= MAX_COMBO_HITS) break;

        // Combo (agility)
        if (Math.random() >= statChance(attacker.stats.agility ?? 1, 45, 0.28, 0.04, 0.35)) break;
        counters.combos++;
        pushEvent(events, 'combo', turn, attacker, defender, 0);
    }

    attacker.damageDealt += turnDamage;

    // Counterattack (the defender's agility). The dead don't strike back, otherwise the battle log
    // ended with a counter event instead of finish.
    if (defender.hp > 0 && attacker.hp > 0) {
        const counterChance = statChance(defender.stats.agility ?? 1, 40, 0.30, 0.03, 0.40);
        if (Math.random() < counterChance) {
            const counterDamage = calculateCounterDamage(defender.stats, Math.max(3, turnDamage));
            attacker.hp = Math.max(0, attacker.hp - counterDamage);
            defender.damageDealt += counterDamage;
            // The counterattack is dealt by the defender, so attacker/defender swap places
            pushEvent(events, 'counter', turn, defender, attacker, counterDamage);
        }
    }
}

function createEvent(
    type: BattleEvent['type'],
    turn: number,
    attackerId: string,
    attackerName: string,
    defenderName: string,
    damage: number,
    attackerHP: number,
    attackerMaxHP: number,
    defenderHP: number,
    defenderMaxHP: number,
    _effect?: string,
    _blockedDamage?: number
): BattleEvent {
    return {
        type,
        turn,
        attackerId,
        attackerName,
        defenderName,
        damage,
        attackerHealth: attackerHP,
        defenderHealth: defenderHP,
        attackerMaxHealth: attackerMaxHP,
        defenderMaxHealth: defenderMaxHP,
    };
}

/**
 * Maps the health in the battle log to fighter roles (challenger/opponent).
 *
 * In the events, the attacker/defender fields depend on who strikes during that turn, so
 * the client couldn't tell which health bar was whose, and HP "jumped" between fighters.
 * Expects the attackerId in an event to be the one who strikes (the striker).
 */
export function toRoleBasedLog(events: BattleEvent[], challengerId: string): BattleEvent[] {
    return events.map((event) => {
        const challengerIsStriker = event.attackerId === challengerId;
        return {
            ...event,
            challengerHealth: challengerIsStriker ? event.attackerHealth : event.defenderHealth,
            challengerMaxHealth: challengerIsStriker ? event.attackerMaxHealth : event.defenderMaxHealth,
            opponentHealth: challengerIsStriker ? event.defenderHealth : event.attackerHealth,
            opponentMaxHealth: challengerIsStriker ? event.defenderMaxHealth : event.attackerMaxHealth,
        };
    });
}
