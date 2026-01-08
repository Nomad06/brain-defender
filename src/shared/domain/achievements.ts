/**
 * Achievements and badges system for Brain Defender
 * Gamification system to encourage focus and productivity
 */

import { z } from 'zod'
import browser from 'webextension-polyfill'
import { STORAGE_KEYS } from '../constants'
import type { Stats } from './stats'

// Achievement types enum
export enum AchievementType {
  STREAK_7 = 'streak_7',
  STREAK_30 = 'streak_30',
  STREAK_100 = 'streak_100',
  TOTAL_BLOCKS_100 = 'total_blocks_100',
  TOTAL_BLOCKS_500 = 'total_blocks_500',
  TOTAL_BLOCKS_1000 = 'total_blocks_1000',
  SITES_BLOCKED_10 = 'sites_blocked_10',
  SITES_BLOCKED_50 = 'sites_blocked_50',
  SITES_BLOCKED_100 = 'sites_blocked_100',
  WEEK_NO_BLOCK = 'week_no_block',
}

// Achievement definition interface
export interface AchievementDefinition {
  id: AchievementType
  name: string
  description: string
  icon: string
  check: (stats: Stats, sites?: unknown[], siteHost?: string) => boolean
}

// Achievement definitions with check functions
export const ACHIEVEMENT_DEFINITIONS: Record<AchievementType, AchievementDefinition> = {
  [AchievementType.STREAK_7]: {
    id: AchievementType.STREAK_7,
    name: 'Неделя силы',
    description: '7 дней подряд без блокировок',
    icon: '🔥',
    check: (stats: Stats) => (stats.streakDays || 0) >= 7,
  },
  [AchievementType.STREAK_30]: {
    id: AchievementType.STREAK_30,
    name: 'Месяц дисциплины',
    description: '30 дней подряд без блокировок',
    icon: '💪',
    check: (stats: Stats) => (stats.streakDays || 0) >= 30,
  },
  [AchievementType.STREAK_100]: {
    id: AchievementType.STREAK_100,
    name: 'Мастер фокуса',
    description: '100 дней подряд без блокировок',
    icon: '👑',
    check: (stats: Stats) => (stats.streakDays || 0) >= 100,
  },
  [AchievementType.TOTAL_BLOCKS_100]: {
    id: AchievementType.TOTAL_BLOCKS_100,
    name: 'Первые 100',
    description: '100 блокировок всего',
    icon: '🎯',
    check: (stats: Stats) => (stats.totalBlocks || 0) >= 100,
  },
  [AchievementType.TOTAL_BLOCKS_500]: {
    id: AchievementType.TOTAL_BLOCKS_500,
    name: 'Половина тысячи',
    description: '500 блокировок всего',
    icon: '🏆',
    check: (stats: Stats) => (stats.totalBlocks || 0) >= 500,
  },
  [AchievementType.TOTAL_BLOCKS_1000]: {
    id: AchievementType.TOTAL_BLOCKS_1000,
    name: 'Тысяча побед',
    description: '1000 блокировок всего',
    icon: '🌟',
    check: (stats: Stats) => (stats.totalBlocks || 0) >= 1000,
  },
  [AchievementType.SITES_BLOCKED_10]: {
    id: AchievementType.SITES_BLOCKED_10,
    name: 'Десяточка',
    description: '10 заблокированных сайтов',
    icon: '📋',
    check: (_stats: Stats, sites?: unknown[]) => (sites?.length || 0) >= 10,
  },
  [AchievementType.SITES_BLOCKED_50]: {
    id: AchievementType.SITES_BLOCKED_50,
    name: 'Полсотни',
    description: '50 заблокированных сайтов',
    icon: '📚',
    check: (_stats: Stats, sites?: unknown[]) => (sites?.length || 0) >= 50,
  },
  [AchievementType.SITES_BLOCKED_100]: {
    id: AchievementType.SITES_BLOCKED_100,
    name: 'Сотня защит',
    description: '100 заблокированных сайтов',
    icon: '🛡️',
    check: (_stats: Stats, sites?: unknown[]) => (sites?.length || 0) >= 100,
  },
  [AchievementType.WEEK_NO_BLOCK]: {
    id: AchievementType.WEEK_NO_BLOCK,
    name: 'Неделя без отвлечений',
    description: 'Неделя без блокировок определенного сайта',
    icon: '✨',
    check: (stats: Stats, _sites?: unknown[], siteHost?: string) => {
      if (!siteHost || !stats.bySite || !stats.bySite[siteHost]) {
        return false
      }
      const siteStats = stats.bySite[siteHost]
      const lastBlocked = new Date(siteStats.lastBlocked)
      const now = new Date()
      const daysDiff = Math.floor((now.getTime() - lastBlocked.getTime()) / (1000 * 60 * 60 * 24))
      return daysDiff >= 7
    },
  },
}

// Zod schemas for runtime validation
export const AchievementsDataSchema = z.object({
  unlocked: z.array(z.nativeEnum(AchievementType)).default([]),
  progress: z.record(z.string(), z.unknown()).default({}),
  lastChecked: z.number().nullable(),
})

export const UnlockedAchievementSchema = z.object({
  id: z.nativeEnum(AchievementType),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  unlockedAt: z.number(),
})

// Type exports
export type AchievementsData = z.infer<typeof AchievementsDataSchema>
export type UnlockedAchievement = z.infer<typeof UnlockedAchievementSchema>

export interface AchievementProgress {
  unlocked: boolean
  progress: number // 0-100
  current?: number
  target?: number
}

/**
 * Initialize achievements system with default values
 */
export async function initAchievements(): Promise<void> {
  try {
    const data = await browser.storage.local.get(STORAGE_KEYS.ACHIEVEMENTS)
    if (!data[STORAGE_KEYS.ACHIEVEMENTS]) {
      await browser.storage.local.set({
        [STORAGE_KEYS.ACHIEVEMENTS]: {
          unlocked: [],
          progress: {},
          lastChecked: null,
        },
      })
    }
  } catch (err) {
    console.error('[Achievements] Error initializing:', err)
  }
}

/**
 * Get achievements data from storage
 * @returns AchievementsData
 */
export async function getAchievements(): Promise<AchievementsData> {
  try {
    const data = await browser.storage.local.get(STORAGE_KEYS.ACHIEVEMENTS)
    if (!data[STORAGE_KEYS.ACHIEVEMENTS]) {
      await initAchievements()
      const freshData = await browser.storage.local.get(STORAGE_KEYS.ACHIEVEMENTS)
      return freshData[STORAGE_KEYS.ACHIEVEMENTS] as AchievementsData
    }
    return data[STORAGE_KEYS.ACHIEVEMENTS] as AchievementsData
  } catch (err) {
    console.error('[Achievements] Error getting achievements:', err)
    return { unlocked: [], progress: {}, lastChecked: null }
  }
}

/**
 * Check achievements and unlock new ones
 *
 * @param stats - Block statistics
 * @param sites - List of blocked sites
 * @param siteHost - Optional: specific site to check
 * @returns Array of newly unlocked achievements
 */
export async function checkAchievements(
  stats: Stats,
  sites: unknown[] = [],
  siteHost: string | null = null
): Promise<UnlockedAchievement[]> {
  try {
    const achievementsData = await getAchievements()
    const unlocked = achievementsData.unlocked || []
    const newAchievements: UnlockedAchievement[] = []

    // Check each achievement
    for (const [type, definition] of Object.entries(ACHIEVEMENT_DEFINITIONS)) {
      const achievementType = type as AchievementType

      // Skip already unlocked
      if (unlocked.includes(achievementType)) {
        continue
      }

      // Check achievement condition
      let passed = false
      try {
        if (achievementType === AchievementType.WEEK_NO_BLOCK && siteHost) {
          passed = definition.check(stats, sites, siteHost)
        } else {
          passed = definition.check(stats, sites)
        }
      } catch (err) {
        console.error(`[Achievements] Error checking ${type}:`, err)
        continue
      }

      if (passed) {
        unlocked.push(achievementType)
        newAchievements.push({
          ...definition,
          unlockedAt: Date.now(),
        })
      }
    }

    // Save updated achievements
    if (newAchievements.length > 0) {
      await browser.storage.local.set({
        [STORAGE_KEYS.ACHIEVEMENTS]: {
          unlocked,
          progress: achievementsData.progress || {},
          lastChecked: Date.now(),
        },
      })
    }

    return newAchievements
  } catch (err) {
    console.error('[Achievements] Error checking achievements:', err)
    return []
  }
}

/**
 * Get progress for all achievements
 *
 * @param stats - Block statistics
 * @param sites - List of blocked sites
 * @returns Object with progress for each achievement type
 */
export async function getAchievementProgress(
  stats: Stats,
  sites: unknown[] = []
): Promise<Record<AchievementType, AchievementProgress>> {
  try {
    const achievementsData = await getAchievements()
    const unlocked = achievementsData.unlocked || []
    const progress: Record<string, AchievementProgress> = {}

    for (const [type, _definition] of Object.entries(ACHIEVEMENT_DEFINITIONS)) {
      const achievementType = type as AchievementType

      if (unlocked.includes(achievementType)) {
        progress[type] = { unlocked: true, progress: 100 }
        continue
      }

      // Calculate progress
      let current = 0
      let target = 0

      switch (achievementType) {
        case AchievementType.STREAK_7:
          current = stats.streakDays || 0
          target = 7
          break
        case AchievementType.STREAK_30:
          current = stats.streakDays || 0
          target = 30
          break
        case AchievementType.STREAK_100:
          current = stats.streakDays || 0
          target = 100
          break
        case AchievementType.TOTAL_BLOCKS_100:
          current = stats.totalBlocks || 0
          target = 100
          break
        case AchievementType.TOTAL_BLOCKS_500:
          current = stats.totalBlocks || 0
          target = 500
          break
        case AchievementType.TOTAL_BLOCKS_1000:
          current = stats.totalBlocks || 0
          target = 1000
          break
        case AchievementType.SITES_BLOCKED_10:
          current = sites?.length || 0
          target = 10
          break
        case AchievementType.SITES_BLOCKED_50:
          current = sites?.length || 0
          target = 50
          break
        case AchievementType.SITES_BLOCKED_100:
          current = sites?.length || 0
          target = 100
          break
        default:
          current = 0
          target = 1
      }

      progress[type] = {
        unlocked: false,
        progress: Math.min(100, Math.round((current / target) * 100)),
        current,
        target,
      }
    }

    return progress as Record<AchievementType, AchievementProgress>
  } catch (err) {
    console.error('[Achievements] Error getting progress:', err)
    return {} as Record<AchievementType, AchievementProgress>
  }
}

/**
 * Get all achievement definitions
 * @returns Array of all achievement definitions
 */
export function getAllAchievementDefinitions(): AchievementDefinition[] {
  return Object.values(ACHIEVEMENT_DEFINITIONS)
}

/**
 * Get a specific achievement definition
 * @param type - Achievement type
 * @returns Achievement definition or undefined
 */
export function getAchievementDefinition(
  type: AchievementType
): AchievementDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS[type]
}

/**
 * Check if an achievement is unlocked
 * @param type - Achievement type
 * @returns true if unlocked
 */
export async function isAchievementUnlocked(type: AchievementType): Promise<boolean> {
  try {
    const data = await getAchievements()
    return data.unlocked.includes(type)
  } catch (err) {
    console.error('[Achievements] Error checking if unlocked:', err)
    return false
  }
}

/**
 * Get all unlocked achievements with full details
 * @returns Array of unlocked achievements with definitions and unlock times
 */
export async function getUnlockedAchievements(): Promise<UnlockedAchievement[]> {
  try {
    const data = await getAchievements()
    const unlocked: UnlockedAchievement[] = []

    for (const type of data.unlocked) {
      const definition = ACHIEVEMENT_DEFINITIONS[type]
      if (definition) {
        unlocked.push({
          ...definition,
          unlockedAt: Date.now(), // Note: We don't store unlock times in current format
        })
      }
    }

    return unlocked
  } catch (err) {
    console.error('[Achievements] Error getting unlocked achievements:', err)
    return []
  }
}

/**
 * Reset all achievements (for testing or user request)
 * @returns true if successful
 */
export async function resetAchievements(): Promise<boolean> {
  try {
    await browser.storage.local.set({
      [STORAGE_KEYS.ACHIEVEMENTS]: {
        unlocked: [],
        progress: {},
        lastChecked: null,
      },
    })
    return true
  } catch (err) {
    console.error('[Achievements] Error resetting achievements:', err)
    return false
  }
}
