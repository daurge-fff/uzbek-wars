/**
 * Activity Service
 * 
 * Manages game activities that players can perform to earn rewards
 * and modify their character stats. Activities are the core gameplay loop.
 * 
 * Features:
 * - Activity execution with rewards and risks
 * - Cooldown management
 * - Level requirements
 * - Soms cost validation
 * - Stat modifications (Tamagotchi-style)
 * - Risk-based penalties
 */

import { IPlayer } from '../models/Player';
import { StatModifiers, updatePlayerStats } from './StatsService';
import { processLevelUp } from './ProgressionService';
import { 
  applyIncomeBonus, 
  applyExperienceBonus,
  applyMoodFromWork,
} from './CharacterBonusService';
import { logger } from '../utils/logger';

/**
 * Activity definition with all gameplay parameters
 */
export interface Activity {
  id: string;
  name: {
    ru: string;
    uz: string;
    uk: string;
    en: string;
  };
  description: {
    ru: string;
    uz: string;
    uk: string;
    en: string;
  };
  rewards: {
    experience: number;
    soms: number;
  };
  statModifiers: StatModifiers;
  risks?: {
    probability: number; // 0-1 range
    penalty: number; // Soms penalty
  };
  duration: number; // Seconds - how long the activity takes to complete
  cooldown: number; // Seconds - cooldown after completion
  requiredLevel: number;
  cost?: number; // Soms cost to perform activity
}

/**
 * Result of activity execution
 */
export interface ActivityResult {
  success: boolean;
  experienceGained: number;
  somsGained: number;
  levelUp: boolean;
  newLevel?: number;
  levelsGained?: number;
  penaltyApplied: boolean;
  statChanges: StatModifiers;
  message?: string;
}

/**
 * Predefined activities with balanced rewards and risks
 * 
 * Design philosophy:
 * - Early activities (level 1-2) are safe and provide steady income
 * - Mid activities (level 3-5) offer higher rewards with moderate risk
 * - Activities affect multiple stats to create strategic choices
 * - Cooldowns prevent grinding and encourage variety
 */
export const ACTIVITIES: Activity[] = [
  {
    id: 'work_svyaznoy',
    name: {
      ru: 'Работать в Связном',
      uz: 'Svyaznoyda ishlash',
      uk: 'Працювати в Связному',
      en: 'Work at Svyaznoy',
    },
    description: {
      ru: 'Честная работа в магазине электроники. Стабильный доход без рисков.',
      uz: 'Elektronika do\'konida halol ish. Xavfsiz barqaror daromad.',
      uk: 'Чесна робота в магазині електроніки. Стабільний дохід без ризиків.',
      en: 'Honest work at electronics store. Stable income without risks.',
    },
    rewards: {
      experience: 50,
      soms: 200,
    },
    statModifiers: {
      energy: -15,
      mood: -5,
      hunger: -10,
    },
    duration: 120, // 2 минуты
    cooldown: 60, // 1 минута кулдаун
    requiredLevel: 1,
  },
  {
    id: 'rob',
    name: {
      ru: 'Грабить',
      uz: 'Talon-taroj qilish',
      uk: 'Грабувати',
      en: 'Rob',
    },
    description: {
      ru: 'Рискованное дело. Большие деньги, но можно попасться.',
      uz: 'Xavfli ish. Katta pul, lekin qo\'lga tushish mumkin.',
      uk: 'Ризикована справа. Великі гроші, але можна попастися.',
      en: 'Risky business. Big money, but you might get caught.',
    },
    rewards: {
      experience: 150,
      soms: 500,
    },
    statModifiers: {
      energy: -25,
      mood: -15,
      hunger: -15,
      health: -10,
    },
    risks: {
      probability: 0.3,
      penalty: 300,
    },
    duration: 180, // 3 минуты
    cooldown: 300, // 5 минут кулдаун
    requiredLevel: 3,
  },
  {
    id: 'cook_plov',
    name: {
      ru: 'Готовить плов',
      uz: 'Osh pishirish',
      uk: 'Готувати плов',
      en: 'Cook plov',
    },
    description: {
      ru: 'Приготовить традиционный узбекский плов. Восстанавливает голод и настроение.',
      uz: 'An\'anaviy o\'zbek oshini pishirish. Ochlikni va kayfiyatni tiklaydi.',
      uk: 'Приготувати традиційний узбецький плов. Відновлює голод і настрій.',
      en: 'Cook traditional Uzbek plov. Restores hunger and mood.',
    },
    rewards: {
      experience: 80,
      soms: 300,
    },
    statModifiers: {
      hunger: 30,
      mood: 20,
      energy: -10,
    },
    risks: {
      probability: 0.1,
      penalty: 100,
    },
    duration: 150, // 2.5 минуты
    cooldown: 120, // 2 минуты кулдаун
    requiredLevel: 2,
  },
  {
    id: 'trade_bazaar',
    name: {
      ru: 'Торговать на базаре',
      uz: 'Bozorda savdo qilish',
      uk: 'Торгувати на базарі',
      en: 'Trade at bazaar',
    },
    description: {
      ru: 'Торговля на восточном базаре. Хороший доход, но требует энергии.',
      uz: 'Sharq bozorida savdo. Yaxshi daromad, lekin energiya talab qiladi.',
      uk: 'Торгівля на східному базарі. Хороший дохід, але потребує енергії.',
      en: 'Trade at eastern bazaar. Good income, but requires energy.',
    },
    rewards: {
      experience: 100,
      soms: 400,
    },
    statModifiers: {
      energy: -20,
      mood: 5,
      hunger: -15,
    },
    risks: {
      probability: 0.2,
      penalty: 200,
    },
    duration: 240, // 4 минуты
    cooldown: 180, // 3 минуты кулдаун
    requiredLevel: 4,
  },
  {
    id: 'rest',
    name: {
      ru: 'Отдохнуть',
      uz: 'Dam olish',
      uk: 'Відпочити',
      en: 'Rest',
    },
    description: {
      ru: 'Отдохнуть и восстановить энергию. Важно для здоровья.',
      uz: 'Dam olib, energiyani tiklash. Salomatlik uchun muhim.',
      uk: 'Відпочити і відновити енергію. Важливо для здоров\'я.',
      en: 'Rest and restore energy. Important for health.',
    },
    rewards: {
      experience: 10,
      soms: 0,
    },
    statModifiers: {
      energy: 40,
      mood: 15,
    },
    duration: 60, // 1 минута
    cooldown: 30, // 30 секунд кулдаун
    requiredLevel: 1,
  },
  {
    id: 'eat',
    name: {
      ru: 'Поесть',
      uz: 'Ovqatlanish',
      uk: 'Поїсти',
      en: 'Eat',
    },
    description: {
      ru: 'Купить еду и поесть. Восстанавливает голод и здоровье.',
      uz: 'Ovqat sotib olib, ovqatlanish. Ochlik va salomatlikni tiklaydi.',
      uk: 'Купити їжу і поїсти. Відновлює голод і здоров\'я.',
      en: 'Buy food and eat. Restores hunger and health.',
    },
    rewards: {
      experience: 5,
      soms: 0,
    },
    statModifiers: {
      hunger: 50,
      health: 10,
      mood: 10,
    },
    duration: 30, // 30 секунд
    cooldown: 60, // 1 минута кулдаун
    requiredLevel: 1,
    cost: 50,
  },
];

/**
 * Gets activity by ID
 * 
 * @param activityId - Activity identifier
 * @returns Activity definition or undefined if not found
 */
export function getActivityById(activityId: string): Activity | undefined {
  return ACTIVITIES.find((activity) => activity.id === activityId);
}

/**
 * Gets all activities available to a player based on their level
 * 
 * @param playerLevel - Current player level
 * @returns Array of available activities
 */
export function getAvailableActivities(playerLevel: number): Activity[] {
  return ACTIVITIES.filter((activity) => activity.requiredLevel <= playerLevel);
}

/**
 * Checks if activity is on cooldown for player
 * 
 * @param player - Player document
 * @param activity - Activity to check
 * @returns true if activity is on cooldown
 */
export function isActivityOnCooldown(player: IPlayer, activity: Activity): boolean {
  const now = Date.now();
  const lastActivity = player.lastActivityTime.getTime();
  const timeSinceLastActivity = (now - lastActivity) / 1000; // Convert to seconds
  
  return timeSinceLastActivity < activity.cooldown;
}

/**
 * Gets remaining cooldown time in seconds
 * 
 * @param player - Player document
 * @param activity - Activity to check
 * @returns Remaining cooldown in seconds, or 0 if not on cooldown
 */
export function getRemainingCooldown(player: IPlayer, activity: Activity): number {
  const now = Date.now();
  const lastActivity = player.lastActivityTime.getTime();
  const timeSinceLastActivity = (now - lastActivity) / 1000;
  const remaining = activity.cooldown - timeSinceLastActivity;
  
  return Math.max(0, Math.ceil(remaining));
}

/**
 * Validates if player can execute an activity
 * 
 * Checks all prerequisites:
 * - Level requirement
 * - Cooldown status
 * - Soms cost (if applicable)
 * 
 * @param player - Player document
 * @param activity - Activity to validate
 * @returns Validation result with error message if invalid
 */
export function validateActivityExecution(
  player: IPlayer,
  activity: Activity
): { valid: boolean; error?: string } {
  // Check level requirement
  if (player.level < activity.requiredLevel) {
    return {
      valid: false,
      error: `Level ${activity.requiredLevel} required. Current level: ${player.level}`,
    };
  }
  
  // Check cooldown
  if (isActivityOnCooldown(player, activity)) {
    const remaining = getRemainingCooldown(player, activity);
    return {
      valid: false,
      error: `Activity on cooldown. Wait ${remaining} seconds`,
    };
  }
  
  // Check soms cost
  if (activity.cost && player.soms < activity.cost) {
    return {
      valid: false,
      error: `Insufficient soms. Required: ${activity.cost}, Available: ${player.soms}`,
    };
  }
  
  return { valid: true };
}

/**
 * Executes an activity for a player
 * 
 * Core gameplay loop:
 * 1. Validate prerequisites (level, cooldown, soms)
 * 2. Apply stat modifiers
 * 3. Calculate rewards (experience, soms)
 * 4. Apply risk-based penalties (if applicable)
 * 5. Process level-ups
 * 6. Update last activity time
 * 
 * Note: This function modifies the player object but does NOT save it.
 * Caller is responsible for persisting changes to database.
 * 
 * @param player - Player document to execute activity for
 * @param activity - Activity to execute
 * @returns Activity execution result with rewards and stat changes
 * @throws Error if validation fails
 */
export function executeActivity(player: IPlayer, activity: Activity): ActivityResult {
  // Validate prerequisites
  const validation = validateActivityExecution(player, activity);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // Initialize result
  let experienceGained = activity.rewards.experience;
  let somsGained = activity.rewards.soms;
  let penaltyApplied = false;
  
  // Apply character class bonuses
  experienceGained = applyExperienceBonus(experienceGained, player.characterId);
  somsGained = applyIncomeBonus(somsGained, player.characterId);
  
  // Apply stat modifiers with character bonuses
  const modifiedStats = { ...activity.statModifiers };
  
  // Apply mood bonus from work if activity gives negative mood
  if (modifiedStats.mood && modifiedStats.mood > 0) {
    modifiedStats.mood = applyMoodFromWork(modifiedStats.mood, player.characterId);
  }
  
  updatePlayerStats(player, modifiedStats);
  
  // Check for risk-based penalty
  if (activity.risks && Math.random() < activity.risks.probability) {
    somsGained -= activity.risks.penalty;
    penaltyApplied = true;
    
    logger.info(
      `Player ${player._id} triggered penalty in activity ${activity.id}: -${activity.risks.penalty} soms`
    );
  }
  
  // Apply rewards
  player.experience += experienceGained;
  player.soms = Math.max(0, player.soms + somsGained);
  
  // Deduct cost if applicable
  if (activity.cost) {
    player.soms -= activity.cost;
  }
  
  // Update last activity time
  player.lastActivityTime = new Date();
  
  // Check for level-up
  const levelsGained = processLevelUp(player);
  const levelUp = levelsGained > 0;
  
  logger.info(
    `Player ${player._id} executed activity ${activity.id}: ` +
    `+${experienceGained} XP, ${somsGained >= 0 ? '+' : ''}${somsGained} soms` +
    (levelUp ? `, leveled up to ${player.level}` : '')
  );
  
  return {
    success: true,
    experienceGained,
    somsGained,
    levelUp,
    newLevel: levelUp ? player.level : undefined,
    levelsGained: levelUp ? levelsGained : undefined,
    penaltyApplied,
    statChanges: modifiedStats,
  };
}

/**
 * Gets activity statistics for analytics
 * 
 * @param activity - Activity to analyze
 * @returns Activity statistics
 */
export function getActivityStats(activity: Activity): {
  expectedValue: number;
  riskAdjustedValue: number;
  experiencePerSecond: number;
  somsPerSecond: number;
} {
  const expectedSoms = activity.risks
    ? activity.rewards.soms - activity.risks.probability * activity.risks.penalty
    : activity.rewards.soms;
  
  const cost = activity.cost || 0;
  const netSoms = expectedSoms - cost;
  
  return {
    expectedValue: netSoms,
    riskAdjustedValue: netSoms,
    experiencePerSecond: activity.rewards.experience / activity.cooldown,
    somsPerSecond: netSoms / activity.cooldown,
  };
}

/**
 * Gets all available activities
 * 
 * @returns Array of all activities
 */
export function getActivities(): Activity[] {
  return ACTIVITIES;
}

/**
 * Performs an activity for a player (high-level function for API)
 * 
 * This function:
 * 1. Finds player by user ID
 * 2. Validates activity exists
 * 3. Executes activity
 * 4. Saves player to database
 * 5. Returns result with level-up info
 * 
 * @param userId - User ID (from authentication)
 * @param activityId - Activity to perform
 * @returns Activity result with updated player and level-up info
 * @throws Error if player not found or activity invalid
 */
export async function performActivity(
  userId: string,
  activityId: string
): Promise<{
  player: IPlayer;
  leveledUp: boolean;
  newLevel?: number;
}> {
  const { Player } = await import('../models/Player');
  
  // Find player by user ID
  const player = await Player.findOne({ userId });
  if (!player) {
    throw new Error('Player not found');
  }
  
  // Find activity
  const activity = getActivityById(activityId);
  if (!activity) {
    throw new Error(`Invalid activity ID: ${activityId}`);
  }
  
  // Execute activity
  const result = executeActivity(player, activity);
  
  // Save player
  await player.save();
  
  return {
    player,
    leveledUp: result.levelUp,
    newLevel: result.newLevel,
  };
}
