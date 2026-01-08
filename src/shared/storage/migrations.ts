/**
 * Data migration system for Brain Defender
 * Handles versioned migrations of stored data
 */

import browser from 'webextension-polyfill'
import { STORAGE_KEYS, CURRENT_MIGRATION_VERSION } from '../constants'
import { normalizeSites } from './schemas'
import type { SiteObject } from './schemas'

/**
 * Legacy site format (string or object)
 * Used only for migrations from old data
 */
type LegacySite = string | SiteObject

// Migration lock settings
const MIGRATION_LOCK_KEY = 'migrationLock'
const MIGRATION_LOCK_TIMEOUT = 30000 // 30 seconds

/**
 * Migration lock structure
 */
interface MigrationLock {
  timestamp: number
  version: number
}

/**
 * Migration result
 */
export interface MigrationResult {
  migrated: boolean
  reason?: string
  error?: string
  sitesCount?: number
  fromVersion?: number
  toVersion?: number
}

/**
 * Acquire migration lock (mutex)
 * Prevents concurrent migrations from multiple contexts
 *
 * @returns true if lock acquired, false if already locked
 */
async function acquireMigrationLock(): Promise<boolean> {
  try {
    const lockData = await browser.storage.local.get(MIGRATION_LOCK_KEY)
    const lock = lockData[MIGRATION_LOCK_KEY] as MigrationLock | undefined

    if (lock) {
      // Check if lock expired
      const now = Date.now()
      if (now - lock.timestamp < MIGRATION_LOCK_TIMEOUT) {
        // Lock is active
        return false
      }
      // Lock expired, release it
      console.log('[Migration] Lock expired, releasing')
    }

    // Set lock
    await browser.storage.local.set({
      [MIGRATION_LOCK_KEY]: {
        timestamp: Date.now(),
        version: CURRENT_MIGRATION_VERSION,
      },
    })

    return true
  } catch (err) {
    console.error('[Migration] Error acquiring lock:', err)
    return false
  }
}

/**
 * Release migration lock
 */
async function releaseMigrationLock(): Promise<void> {
  try {
    await browser.storage.local.remove(MIGRATION_LOCK_KEY)
  } catch (err) {
    console.error('[Migration] Error releasing lock:', err)
  }
}

/**
 * Get current migration version
 *
 * @returns Current migration version number
 */
export async function getMigrationVersion(): Promise<number> {
  try {
    const data = await browser.storage.local.get(STORAGE_KEYS.MIGRATION_VERSION)
    return (data[STORAGE_KEYS.MIGRATION_VERSION] as number) || 0
  } catch (err) {
    console.error('[Migration] Error getting migration version:', err)
    return 0
  }
}

/**
 * Set migration version
 *
 * @param version - Version number to set
 */
async function setMigrationVersion(version: number): Promise<void> {
  try {
    await browser.storage.local.set({
      [STORAGE_KEYS.MIGRATION_VERSION]: version,
    })
  } catch (err) {
    console.error('[Migration] Error setting migration version:', err)
  }
}

/**
 * Migration: v0 → v1
 * Converts string array format to object format
 */
async function migrateV0toV1(): Promise<void> {
  console.log('[Migration] Running v0 → v1 migration')

  const data = await browser.storage.sync.get(STORAGE_KEYS.BLOCKED_SITES)
  const sites = data[STORAGE_KEYS.BLOCKED_SITES]

  if (!Array.isArray(sites) || sites.length === 0) {
    return
  }

  // Check if already in new format
  if (typeof sites[0] !== 'string') {
    return
  }

  // Convert string array to object array
  const migratedSites = sites.map(host => ({
    host: String(host).toLowerCase().replace(/^www\./, ''),
    addedAt: Date.now(),
    category: null,
    schedule: null,
  }))

  await browser.storage.sync.set({
    [STORAGE_KEYS.BLOCKED_SITES]: migratedSites,
  })

  console.log('[Migration] v0 → v1 complete:', migratedSites.length, 'sites')
}

/**
 * Migration: v1 → v2
 * Adds conditionalRules field to sites
 */
async function migrateV1toV2(): Promise<void> {
  console.log('[Migration] Running v1 → v2 migration')

  const data = await browser.storage.sync.get(STORAGE_KEYS.BLOCKED_SITES)
  const sites = data[STORAGE_KEYS.BLOCKED_SITES] as LegacySite[]

  if (!Array.isArray(sites) || sites.length === 0) {
    return
  }

  // Add conditionalRules field if missing
  const migratedSites = sites.map(site => {
    if (typeof site === 'string') {
      return site // Will be normalized later
    }

    return {
      ...site,
      conditionalRules: site.conditionalRules || [],
    }
  })

  await browser.storage.sync.set({
    [STORAGE_KEYS.BLOCKED_SITES]: migratedSites,
  })

  console.log('[Migration] v1 → v2 complete:', migratedSites.length, 'sites')
}

/**
 * Migration: v2 → v3
 * TypeScript migration marker (no data changes)
 * Normalizes all data with Zod schemas
 */
async function migrateV2toV3(): Promise<void> {
  console.log('[Migration] Running v2 → v3 migration')

  const data = await browser.storage.sync.get(STORAGE_KEYS.BLOCKED_SITES)
  const sites = data[STORAGE_KEYS.BLOCKED_SITES] as LegacySite[]

  if (!Array.isArray(sites) || sites.length === 0) {
    return
  }

  // Convert any legacy strings to objects first
  const sitesAsObjects: SiteObject[] = sites.map(site =>
    typeof site === 'string'
      ? { host: site, addedAt: Date.now(), category: null, schedule: null, conditionalRules: [] }
      : site
  )

  // Normalize with Zod schemas
  const normalizedSites = normalizeSites(sitesAsObjects)

  await browser.storage.sync.set({
    [STORAGE_KEYS.BLOCKED_SITES]: normalizedSites,
  })

  console.log('[Migration] v2 → v3 complete:', normalizedSites.length, 'sites normalized')
}

/**
 * Run all pending migrations
 *
 * @returns Migration result with details
 */
export async function runMigrations(): Promise<MigrationResult> {
  // Try to acquire lock
  const lockAcquired = await acquireMigrationLock()
  if (!lockAcquired) {
    console.log('[Migration] Migration already in progress, skipping')
    return { migrated: false, reason: 'Migration in progress' }
  }

  try {
    // Get current version
    const currentVersion = await getMigrationVersion()

    if (currentVersion >= CURRENT_MIGRATION_VERSION) {
      console.log('[Migration] Data already migrated to version', CURRENT_MIGRATION_VERSION)
      await releaseMigrationLock()
      return { migrated: false, reason: 'Already migrated' }
    }

    console.log(
      '[Migration] Starting migration from version',
      currentVersion,
      'to',
      CURRENT_MIGRATION_VERSION
    )

    // Run migrations in sequence
    if (currentVersion < 1) {
      await migrateV0toV1()
    }

    if (currentVersion < 2) {
      await migrateV1toV2()
    }

    if (currentVersion < 3) {
      await migrateV2toV3()
    }

    // Update version
    await setMigrationVersion(CURRENT_MIGRATION_VERSION)

    // Get final site count
    const data = await browser.storage.sync.get(STORAGE_KEYS.BLOCKED_SITES)
    const sites = data[STORAGE_KEYS.BLOCKED_SITES] as SiteObject[]
    const sitesCount = Array.isArray(sites) ? sites.length : 0

    console.log('[Migration] Successfully migrated to version', CURRENT_MIGRATION_VERSION)

    await releaseMigrationLock()

    return {
      migrated: true,
      sitesCount,
      fromVersion: currentVersion,
      toVersion: CURRENT_MIGRATION_VERSION,
    }
  } catch (err) {
    console.error('[Migration] Error during migration:', err)
    await releaseMigrationLock()
    return {
      migrated: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Force reset migration version (for testing)
 * WARNING: This may cause data loss if used incorrectly
 *
 * @param version - Version to reset to
 */
export async function resetMigrationVersion(version: number): Promise<void> {
  console.warn('[Migration] Resetting migration version to', version)
  await setMigrationVersion(version)
}

/**
 * Check if migrations are needed
 *
 * @returns true if migrations are pending
 */
export async function needsMigration(): Promise<boolean> {
  const currentVersion = await getMigrationVersion()
  return currentVersion < CURRENT_MIGRATION_VERSION
}
