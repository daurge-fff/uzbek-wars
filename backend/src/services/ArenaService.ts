import { Player, IPlayer } from '../models/Player';
import { ArenaMatch } from '../models/ArenaMatch';
import { logger } from '../utils/logger';
import { processLevelUp } from './ProgressionService';
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
    /** Потолок раундов: не даём бою закончиться за 4-5 ходов */
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

/** Максимум ударов в одной серии (первый удар + комбо) */
const MAX_COMBO_HITS = 3;

/**
 * Боец внутри одного боя: эффективные статы, здоровье и состояния.
 * Объект живёт только в рамках startFight, в БД не сохраняется.
 */
interface BattleFighter {
    id: string;
    name: string;
    /** Эффективные статы (у соперника уже умножены на сложность боя) */
    stats: Record<string, number | undefined>;
    maxHP: number;
    hp: number;
    stun: number;
    poison: { turns: number; damage: number } | null;
    /** Второе дыхание (выносливость) срабатывает один раз за бой */
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
     * Здоровье бойцов, приведённое к ролям (challenger/opponent), а не к "кто бьёт":
     * attacker/defender меняют смысл в зависимости от хода, из-за этого полоски HP
     * на фронте прыгали между бойцами.
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

        // Apply difficulty multipliers to opponent stats
        const opponentStats = applyDifficultyMultiplier(opponent.combatStats, config.statMultiplier);

        // HP from stamina
        const maxChallengerHP = calculateMaxHP(challenger.combatStats);
        const maxOpponentHP = calculateMaxHP(opponentStats);

        const challengerFighter: BattleFighter = {
            id: challenger._id.toString(),
            name: challengerName,
            stats: (challenger.combatStats || {}) as any,
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
            // === Ход претендента ===
            resolveTurn(challengerFighter, opponentFighter, turn, events, counters);

            // Ход мог закончиться смертью любого из бойцов: противника добили,
            // либо претендент погиб от контрудара
            if (opponentFighter.hp <= 0 || challengerFighter.hp <= 0) {
                const challengerWon = opponentFighter.hp <= 0;
                winnerId = challengerWon ? challenger._id : opponent._id;
                pushFinish(challengerWon ? challengerFighter : opponentFighter, challengerWon ? opponentFighter : challengerFighter);
                break;
            }

            // === Ответный ход противника ===
            resolveTurn(opponentFighter, challengerFighter, turn, events, counters);

            if (challengerFighter.hp <= 0 || opponentFighter.hp <= 0) {
                const challengerWon = opponentFighter.hp <= 0;
                winnerId = challengerWon ? challenger._id : opponent._id;
                pushFinish(challengerWon ? challengerFighter : opponentFighter, challengerWon ? opponentFighter : challengerFighter);
                break;
            }

            turn++;
        }

        // Determine winner by HP if timeout (сравниваем долю здоровья, а не абсолют)
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

        if (isChallengerWinner) {
            await AchievementService.trackProgress(challengerId, 'arena_warrior_1', 1);
        }

        // Track daily task progress for arena fights
        await TaskService.updateTaskProgress(challenger, 'pvp_battle', 1);
        if (isChallengerWinner) {
            await TaskService.updateTaskProgress(challenger, 'pvp_win', 1);
            await TaskService.updateQuestProgress(challenger, 'pvp_win', 1);
        }

        // Приводим здоровье в логе к ролям бойцов (challenger/opponent).
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
 * Мягкий шанс от значения стата: base + weight * stat / (stat + scale), с потолком cap.
 *
 * Раньше шансы считались как stat / 15 (или stat / 25) с жёстким потолком, поэтому
 * 4 и 10 очков в стате давали почти одинаковый результат, а вложение статов
 * не ощущалось. Здесь отдача растёт с каждым очком, но с убыванием.
 */
function statChance(stat: number, scale: number, weight: number, base: number, cap: number): number {
    const value = Math.max(0, stat || 0);
    const soft = value / (value + scale);
    return Math.min(cap, base + weight * soft);
}

/** Доля урона, которую гасит защита (0..0.7) */
function mitigation(defense: number): number {
    const def = Math.max(0, defense || 0);
    return Math.min(0.7, def / (def + 28));
}

function calculateMaxHP(combatStats: any): number {
    const stamina = combatStats?.stamina ?? 5;
    return Math.floor(80 + stamina * 20);
}

/** Урон яда: часть максимального здоровья жертвы + вклад интеллекта отравителя */
function poisonTickDamage(defenderMaxHP: number, attackerIntelligence: number): number {
    return Math.max(2, Math.floor(defenderMaxHP * 0.03) + Math.floor((attackerIntelligence || 0) * 0.7));
}

/** Шанс оглушить: растёт от силы, крит добавляет сверху */
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
 * Один бросок атаки. Порядок: промах → уклонение → крит → блок.
 * Крит пробивает блок, блок гасит 60% урона, защита сокращает урон постоянно.
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

    // Крит ломает защиту, обычный удар может быть заблокирован
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
 * Один ход бойца: тик яда, второе дыхание, серия ударов с эффектами и контрудар.
 *
 * Все случайные события считаются от реальных статов бойцов: сила даёт урон и
 * оглушение, защита — снижение урона и блок, ловкость — криты, уклонение, комбо и
 * контрудар, выносливость — здоровье и второе дыхание, интеллект — силу крита и яд,
 * удача — криты, уклонение и второе дыхание.
 */
function resolveTurn(
    attacker: BattleFighter,
    defender: BattleFighter,
    turn: number,
    events: BattleEvent[],
    counters: BattleCounters
): void {
    // Оглушение: ход пропущен
    if (attacker.stun > 0) {
        pushEvent(events, 'stun_skip', turn, attacker, defender, 0);
        attacker.stun--;
        return;
    }

    // Яд тикает в начале хода
    if (attacker.poison) {
        const tickDamage = attacker.poison.damage;
        attacker.hp = Math.max(1, attacker.hp - tickDamage);
        attacker.poison.turns--;
        if (attacker.poison.turns <= 0) attacker.poison = null;
        pushEvent(events, 'poison_tick', turn, attacker, defender, tickDamage);
    }

    // Второе дыхание (выносливость + удача): один раз за бой при низком здоровье
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

    // Серия ударов: попадание может продолжиться комбо
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

        // Оглушение (сила)
        if (defender.stun === 0 && Math.random() < stunChance(attacker.stats, hit.isCrit)) {
            defender.stun = 1;
            pushEvent(events, 'stun', turn, attacker, defender, 0);
        }

        // Яд (интеллект)
        const poisonChance = statChance(attacker.stats.intelligence ?? 1, 35, 0.30, 0.02, 0.35);
        if (!defender.poison && Math.random() < poisonChance) {
            defender.poison = {
                turns: 3,
                damage: poisonTickDamage(defender.maxHP, attacker.stats.intelligence ?? 1),
            };
            pushEvent(events, 'poison', turn, attacker, defender, 0);
        }

        if (comboLevel >= MAX_COMBO_HITS) break;

        // Комбо (ловкость)
        if (Math.random() >= statChance(attacker.stats.agility ?? 1, 45, 0.28, 0.04, 0.35)) break;
        counters.combos++;
        pushEvent(events, 'combo', turn, attacker, defender, 0);
    }

    attacker.damageDealt += turnDamage;

    // Контрудар (ловкость защищающегося). Мёртвый не бьёт в ответ, иначе лог боя
    // заканчивался событием counter вместо finish.
    if (defender.hp > 0 && attacker.hp > 0) {
        const counterChance = statChance(defender.stats.agility ?? 1, 40, 0.30, 0.03, 0.40);
        if (Math.random() < counterChance) {
            const counterDamage = calculateCounterDamage(defender.stats, Math.max(3, turnDamage));
            attacker.hp = Math.max(0, attacker.hp - counterDamage);
            defender.damageDealt += counterDamage;
            // Контрудар наносит защищающийся, поэтому attacker/defender меняются местами
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
 * Приводит здоровье в логе боя к ролям бойцов (challenger/opponent).
 *
 * В событиях поля attacker/defender зависят от того, кто бьёт в этом ходу, поэтому
 * клиент не мог однозначно понять, чья полоска здоровья, и HP «прыгал» между бойцами.
 * Ожидает, что attackerId в событии — тот, кто бьёт (striker).
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
