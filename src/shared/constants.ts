/**
 * Core constants for Brain Defender extension
 * These storage keys must remain unchanged for backward compatibility
 */

// Storage keys (DO NOT CHANGE - used by existing users)
export const STORAGE_KEYS = {
  BLOCKED_SITES: 'blockedSites',
  I18N_LANGUAGE: 'i18n_language',
  BLOCK_STATS: 'blockStats',
  MIGRATION_VERSION: 'dataMigrationVersion',
  TEMP_WHITELIST: 'tempWhitelist',
  FOCUS_SESSIONS: 'focusSessions',
  ACHIEVEMENTS: 'achievements',
  CATEGORIES: 'siteCategories',
  STRICT_MODE: 'strictMode',
} as const

// Migration version - increment when data format changes
export const CURRENT_MIGRATION_VERSION = 3

// DNR rule ID ranges
export const DNR_RULE_IDS = {
  MIN: 1,
  MAX: 5000, // Chrome allows up to 5000 dynamic rules
} as const

// Temporary allowance durations (in milliseconds)
export const ALLOWANCE_DURATIONS = {
  SHORT: 15 * 60 * 1000, // 15 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 60 * 60 * 1000, // 1 hour
} as const

// Focus session defaults
export const FOCUS_SESSION_DEFAULTS = {
  DEFAULT_DURATION: 25, // minutes (Pomodoro standard)
  MAX_DURATION: 180, // 3 hours
  MIN_DURATION: 5, // 5 minutes
} as const

// Extension metadata
export const EXTENSION_INFO = {
  NAME: 'Brain Defender',
  VERSION: '2.0.0',
  DESCRIPTION: 'Защищает ваш фокус и внимание, блокируя отвлекающие сайты',
} as const

// Type exports for storage keys
export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]
