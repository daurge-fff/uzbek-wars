import { Player, IPlayer } from '../models/Player';
import { ArenaMatch } from '../models/ArenaMatch';
import { logger } from '../utils/logger';
import { processLevelUp } from './ProgressionService';
import * as AchievementService from './AchievementService';

export type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultyConfig {
    statMultiplier: number;
    energyCost: number;
    healthCostWin: number;
    healthCostLose: number;
    somsCost: number;
    rewardMultiplier: number;
    xpMultiplier: number;
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
    easy: {
        statMultiplier: 0.7,
        energyCost: 10,
        healthCostWin: 3,
        healthCostLose: 10,
        somsCost: 50,
        rewardMultiplier: 0.5,
        xpMultiplier: 0.5,
    },
    medium: {
        statMultiplier: 1.0,
        energyCost: 20,
        healthCostWin: 8,
        healthCostLose: 20,
        somsCost: 150,
        rewardMultiplier: 1.0,
        xpMultiplier: 1.0,
    },
    hard: {
        statMultiplier: 1.4,
        energyCost: 30,
        healthCostWin: 15,
        healthCostLose: 35,
        somsCost: 300,
        rewardMultiplier: 2.0,
        xpMultiplier: 2.0,
    },
};

interface BattleEvent {
    type: 'attack' | 'crit' | 'dodge' | 'counter' | 'block' | 'combo' | 'miss' | 'finish' | 'stun' | 'poison' | 'heal';
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

        // Apply difficulty multipliers to opponent stats
        const opponentStats = applyDifficultyMultiplier(opponent.combatStats, config.statMultiplier);

        // HP from stamina
        const maxChallengerHP = calculateMaxHP(challenger.combatStats);
        const maxOpponentHP = calculateMaxHPRaw(opponentStats);

        let challengerHP = maxChallengerHP;
        let opponentHP = maxOpponentHP;

        // Status effects
        let challengerStun = 0;
        let opponentStun = 0;
        let challengerPoison = 0;
        let opponentPoison = 0;
        let challengerCombo = 0;

        const events: BattleEvent[] = [];
        let turn = 1;
        let winnerId = null;
        let totalChallengerDmgDealt = 0;
        let totalOpponentDmgDealt = 0;
        let critCount = 0;
        let dodgeCount = 0;
        let comboCount = 0;

        while (challengerHP > 0 && opponentHP > 0 && turn <= 25) {
            // === Challenger turn ===
            if (challengerStun > 0) {
                events.push(createEvent('stun', turn, challenger._id.toString(), challengerName, opponentName, 0, challengerHP, maxChallengerHP, opponentHP, maxOpponentHP));
                challengerStun--;
            } else {
                // Poison damage
                if (challengerPoison > 0) {
                    const poisonDmg = Math.floor(maxChallengerHP * 0.03);
                    challengerHP = Math.max(1, challengerHP - poisonDmg);
                    challengerPoison--;
                }

                // Combo tracking
                if (challengerCombo > 0) {
                    challengerCombo++;
                }

                const hit = calculateDamage(challenger, opponent, opponentStats, challengerCombo);

                if (hit.isMiss) {
                    events.push(createEvent('miss', turn, challenger._id.toString(), challengerName, opponentName, 0, challengerHP, maxChallengerHP, opponentHP, maxOpponentHP));
                } else if (hit.isDodge) {
                    dodgeCount++;
                    events.push(createEvent('dodge', turn, opponent._id.toString(), challengerName, opponentName, 0, challengerHP, maxChallengerHP, opponentHP, maxOpponentHP));
                } else if (hit.isBlock) {
                    const blockedDmg = Math.floor(hit.damage * 0.6);
                    const actualDmg = hit.damage - blockedDmg;
                    opponentHP = Math.max(0, opponentHP - actualDmg);
                    totalChallengerDmgDealt += actualDmg;
                    events.push(createEvent('block', turn, opponent._id.toString(), challengerName, opponentName, actualDmg, challengerHP, maxChallengerHP, opponentHP, maxOpponentHP));
                } else {
                    opponentHP = Math.max(0, opponentHP - hit.damage);
                    totalChallengerDmgDealt += hit.damage;

                    if (hit.isCrit) {
                        critCount++;
                        events.push(createEvent('crit', turn, challenger._id.toString(), challengerName, opponentName, hit.damage, challengerHP, maxChallengerHP, opponentHP, maxOpponentHP));
                    } else {
                        // Combo tracking
                        if (challengerCombo >= 2) {
                            comboCount++;
                        }
                        challengerCombo = 1;
                        events.push(createEvent('attack', turn, challenger._id.toString(), challengerName, opponentName, hit.damage, challengerHP, maxChallengerHP, opponentHP, maxOpponentHP));
                    }

                    // Stun chance (6% if crit, 2% otherwise)
                    const stunChance = hit.isCrit ? 0.06 : 0.02;
                    if (Math.random() < stunChance && opponentStun === 0) {
                        opponentStun = 1;
                        events.push(createEvent('stun', turn, challenger._id.toString(), challengerName, opponentName, 0, challengerHP, maxChallengerHP, opponentHP, maxOpponentHP));
                    }

                    // Poison chance from intelligence
                    const intStat = challenger.combatStats?.intelligence || 1;
                    const poisonChance = Math.min(0.10, intStat / 50);
                    if (Math.random() < poisonChance && opponentPoison === 0) {
                        opponentPoison = 2;
                        events.push(createEvent('poison', turn, challenger._id.toString(), challengerName, opponentName, 0, challengerHP, maxChallengerHP, opponentHP, maxOpponentHP));
                    }
                }

                if (opponentHP <= 0) {
                    winnerId = challenger._id;
                    events.push(createEvent('finish', turn, challenger._id.toString(), challengerName, opponentName, 0, challengerHP, maxChallengerHP, 0, maxOpponentHP));
                    break;
                }
            }

            // === Opponent counter-turn ===
            if (opponentStun > 0) {
                events.push(createEvent('stun', turn, opponent._id.toString(), opponentName, challengerName, 0, opponentHP, maxOpponentHP, challengerHP, maxChallengerHP));
                opponentStun--;
            } else {
                if (opponentPoison > 0) {
                    const poisonDmg = Math.floor(maxOpponentHP * 0.03);
                    opponentHP = Math.max(1, opponentHP - poisonDmg);
                    opponentPoison--;
                }

                const hit2 = calculateDamageRaw(opponent, challenger, opponentStats, challenger.combatStats);

                if (hit2.isMiss) {
                    events.push(createEvent('miss', turn, opponent._id.toString(), opponentName, challengerName, 0, opponentHP, maxOpponentHP, challengerHP, maxChallengerHP));
                } else if (hit2.isDodge) {
                    dodgeCount++;
                    events.push(createEvent('dodge', turn, challenger._id.toString(), opponentName, challengerName, 0, opponentHP, maxOpponentHP, challengerHP, maxChallengerHP));
                } else if (hit2.isBlock) {
                    const blockedDmg = Math.floor(hit2.damage * 0.6);
                    const actualDmg = hit2.damage - blockedDmg;
                    challengerHP = Math.max(0, challengerHP - actualDmg);
                    totalOpponentDmgDealt += actualDmg;
                    events.push(createEvent('block', turn, challenger._id.toString(), opponentName, challengerName, actualDmg, opponentHP, maxOpponentHP, challengerHP, maxChallengerHP));
                } else {
                    challengerHP = Math.max(0, challengerHP - hit2.damage);
                    totalOpponentDmgDealt += hit2.damage;

                    if (hit2.isCrit) {
                        critCount++;
                        events.push(createEvent('crit', turn, opponent._id.toString(), opponentName, challengerName, hit2.damage, opponentHP, maxOpponentHP, challengerHP, maxChallengerHP));
                    } else {
                        events.push(createEvent('attack', turn, opponent._id.toString(), opponentName, challengerName, hit2.damage, opponentHP, maxOpponentHP, challengerHP, maxChallengerHP));
                    }

                    // Counter-attack chance from agility
                    const agiStat = challenger.combatStats?.agility || 1;
                    const counterChance = Math.min(0.20, agiStat / 15);
                    if (Math.random() < counterChance) {
                        const counterDmg = calculateCounterDamage(challenger, hit2.damage);
                        opponentHP = Math.max(0, opponentHP - counterDmg);
                        totalChallengerDmgDealt += counterDmg;
                        events.push(createEvent('counter', turn, challenger._id.toString(), challengerName, opponentName, counterDmg, challengerHP, maxChallengerHP, opponentHP, maxOpponentHP));
                    }
                }

                if (challengerHP <= 0) {
                    winnerId = opponent._id;
                    events.push(createEvent('finish', turn, opponent._id.toString(), opponentName, challengerName, 0, opponentHP, maxOpponentHP, 0, maxChallengerHP));
                    break;
                }
            }

            turn++;
        }

        // Determine winner by HP if timeout
        if (!winnerId) {
            winnerId = challengerHP >= opponentHP ? challenger._id : opponent._id;
        }

        const isChallengerWinner = winnerId.toString() === challengerId;

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

        if (isChallengerWinner) {
            await AchievementService.trackProgress(challengerId, 'arena_warrior_1', 1);
        }

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
            matchLog: events,
            stats: {
                totalTurns: turn - 1,
                totalDamageDealt: totalChallengerDmgDealt,
                totalDamageReceived: totalOpponentDmgDealt,
                crits: critCount,
                dodges: dodgeCount,
                combos: comboCount,
            }
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
            difficulty,
            rewards,
            matchLog: events,
            stats: {
                totalTurns: turn - 1,
                totalDamageDealt: totalChallengerDmgDealt,
                totalDamageReceived: totalOpponentDmgDealt,
                crits: critCount,
                dodges: dodgeCount,
                combos: comboCount,
            }
        };
    } catch (error) {
        logger.error('Error starting fight:', error);
        throw error;
    }
}

function calculateMaxHP(combatStats: any): number {
    const stamina = combatStats?.stamina || 5;
    return Math.floor(40 + stamina * 3);
}

function calculateMaxHPRaw(stats: any): number {
    const stamina = stats?.stamina || 5;
    return Math.floor(40 + stamina * 3);
}

function applyDifficultyMultiplier(combatStats: any, multiplier: number) {
    return {
        strength: Math.min(100, Math.floor((combatStats?.strength || 10) * multiplier)),
        defense: Math.min(100, Math.floor((combatStats?.defense || 10) * multiplier)),
        agility: Math.min(100, Math.floor((combatStats?.agility || 10) * multiplier)),
        stamina: Math.min(100, Math.floor((combatStats?.stamina || 10) * multiplier)),
        intelligence: Math.min(100, Math.floor((combatStats?.intelligence || 10) * multiplier)),
        luck: combatStats?.luck || 0,
    };
}

function calculateDamage(
    attacker: IPlayer,
    defender: IPlayer,
    defenderStats: any,
    comboLevel: number = 0
): { damage: number; isCrit: boolean; isDodge: boolean; isBlock: boolean; isMiss: boolean } {
    const str = attacker.combatStats?.strength || 1;
    const agi = attacker.combatStats?.agility || 1;
    const def = defenderStats.defense || 1;
    const luck = attacker.combatStats?.luck || 0;

    const missChance = Math.max(0.03, 0.10 - agi / 15);
    if (Math.random() < missChance) {
        return { damage: 0, isCrit: false, isDodge: false, isBlock: false, isMiss: true };
    }

    const defAgi = defender.combatStats?.agility || 1;
    const defLuck = defender.combatStats?.luck || 0;
    const dodgeChance = Math.min(0.25, defAgi / 35 + defLuck * 0.03);
    if (Math.random() < dodgeChance) {
        return { damage: 0, isCrit: false, isDodge: true, isBlock: false, isMiss: false };
    }

    const blockChance = Math.min(0.20, def / 30);
    if (Math.random() < blockChance) {
        const baseDmg = str * 3 + 5;
        const defReduction = def / (def + 30);
        const rawDmg = Math.floor(baseDmg * (1 - defReduction));
        return { damage: Math.max(3, rawDmg), isCrit: false, isDodge: false, isBlock: true, isMiss: false };
    }

    const critChance = Math.min(0.30, agi / 30 + luck * 0.03);
    const isCrit = Math.random() < critChance;

    const baseDmg = str * 3 + 5;
    const defReduction = def / (def + 30);
    const int = attacker.combatStats?.intelligence || 1;
    const critMult = isCrit ? (1.5 + Math.min(0.5, int / 50)) : 1.0;
    const comboMult = comboLevel > 1 ? 1 + (comboLevel - 1) * 0.12 : 1.0;
    const intBonus = Math.floor(int * 0.5);

    const rawDmg = Math.floor((baseDmg + intBonus) * critMult * comboMult * (1 - defReduction));
    const finalDmg = Math.max(3, rawDmg);

    return { damage: finalDmg, isCrit, isDodge: false, isBlock: false, isMiss: false };
}

function calculateDamageRaw(
    _attacker: any,
    defender: any,
    attackerStats: any,
    defenderStats: any
): { damage: number; isCrit: boolean; isDodge: boolean; isBlock: boolean; isMiss: boolean } {
    const str = attackerStats.strength || 1;
    const agi = attackerStats.agility || 1;
    const def = defenderStats.defense || 1;
    const luck = attackerStats.luck || 0;

    const missChance = Math.max(0.03, 0.10 - agi / 15);
    if (Math.random() < missChance) {
        return { damage: 0, isCrit: false, isDodge: false, isBlock: false, isMiss: true };
    }

    const defAgi = defender.combatStats?.agility || 1;
    const defLuck = defender.combatStats?.luck || 0;
    const dodgeChance = Math.min(0.25, defAgi / 35 + defLuck * 0.03);
    if (Math.random() < dodgeChance) {
        return { damage: 0, isCrit: false, isDodge: true, isBlock: false, isMiss: false };
    }

    const blockChance = Math.min(0.20, def / 30);
    if (Math.random() < blockChance) {
        const baseDmg = str * 3 + 5;
        const defReduction = def / (def + 30);
        const rawDmg = Math.floor(baseDmg * (1 - defReduction));
        return { damage: Math.max(3, rawDmg), isCrit: false, isDodge: false, isBlock: true, isMiss: false };
    }

    const critChance = Math.min(0.30, agi / 30 + luck * 0.03);
    const isCrit = Math.random() < critChance;

    const baseDmg = str * 3 + 5;
    const defReduction = def / (def + 30);
    const int = attackerStats.intelligence || 1;
    const critMult = isCrit ? (1.5 + Math.min(0.5, int / 50)) : 1.0;
    const intBonus = Math.floor(int * 0.5);

    const rawDmg = Math.floor((baseDmg + intBonus) * critMult * (1 - defReduction));
    const finalDmg = Math.max(3, rawDmg);

    return { damage: finalDmg, isCrit, isDodge: false, isBlock: false, isMiss: false };
}

function calculateCounterDamage(counterAttacker: IPlayer, originalDamage: number): number {
    const agi = counterAttacker.combatStats?.agility || 1;
    const str = counterAttacker.combatStats?.strength || 1;
    const counterMult = 0.4 + Math.min(0.3, agi / 25);
    const baseCounter = Math.floor(originalDamage * counterMult);
    const agiBonus = Math.floor(str * 0.3);
    return Math.max(2, baseCounter + agiBonus);
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
