/**
 * Unified storage abstraction layer for Brain Defender
 * Provides type-safe access to chrome.storage with validation
 */

import browser from 'webextension-polyfill'
import { STORAGE_KEYS } from '../constants'
import { normalizeHost } from '../utils/domain'
import {
  SitesArraySchema,
  TempWhitelistSchema,
  normalizeSites,
  safeParseStorageData,
  type SiteObject,
  type TempWhitelistEntry,
} from './schemas'

/**
 * Get all blocked sites from storage
 * Automatically normalizes legacy format to modern format
 *
 * @returns Array of normalized site objects
 */
export async function getSites(): Promise<SiteObject[]> {
  try {
    const data = await browser.storage.sync.get(STORAGE_KEYS.BLOCKED_SITES)
    const rawSites = data[STORAGE_KEYS.BLOCKED_SITES]

    // If no data, return empty array
    if (!rawSites) {
      return []
    }

    // Parse and validate with schema
    const sites = safeParseStorageData(rawSites, SitesArraySchema, [])

    // Normalize to modern format
    return normalizeSites(sites)
  } catch (err) {
    console.error('[Storage] Error getting sites:', err)
    return []
  }
}

/**
 * Save blocked sites to storage
 * Automatically deduplicates and sorts
 *
 * @param sites - Array of sites to save
 * @returns true if successful
 */
export async function setSites(sites: SiteObject[]): Promise<boolean> {
  try {
    // Normalize and deduplicate
    const normalized = normalizeSites(sites)

    // Save to storage
    await browser.storage.sync.set({
      [STORAGE_KEYS.BLOCKED_SITES]: normalized,
    })

    return true
  } catch (err) {
    console.error('[Storage] Error setting sites:', err)
    return false
  }
}

/**
 * Add a new site to the blocked list
 *
 * @param hostOrUrl - Domain or URL to block
 * @param options - Optional site configuration
 * @returns true if added, false if already exists or error
 */
export async function addSite(
  hostOrUrl: string,
  options?: {
    category?: string | null
    schedule?: unknown
    conditionalRules?: unknown[]
  }
): Promise<boolean> {
  try {
    const host = normalizeHost(hostOrUrl)
    if (!host) {
      console.error('[Storage] Invalid host:', hostOrUrl)
      return false
    }

    const sites = await getSites()

    // Check if already exists
    if (sites.some(s => s.host === host)) {
      console.warn('[Storage] Site already blocked:', host)
      return false
    }

    // Add new site
    sites.push({
      host,
      addedAt: Date.now(),
      category: options?.category || null,
      schedule: (options?.schedule as any) || null,
      conditionalRules: (options?.conditionalRules as any) || [],
    })

    return await setSites(sites)
  } catch (err) {
    console.error('[Storage] Error adding site:', err)
    return false
  }
}

/**
 * Remove a site from the blocked list
 *
 * @param host - Normalized hostname to remove
 * @returns true if removed, false if not found or error
 */
export async function removeSite(host: string): Promise<boolean> {
  try {
    const sites = await getSites()
    const filtered = sites.filter(s => s.host !== host)

    // Check if anything was removed
    if (filtered.length === sites.length) {
      console.warn('[Storage] Site not found:', host)
      return false
    }

    return await setSites(filtered)
  } catch (err) {
    console.error('[Storage] Error removing site:', err)
    return false
  }
}

/**
 * Update a site's configuration
 *
 * @param host - Normalized hostname
 * @param updates - Partial site object with updates
 * @returns true if updated, false if not found or error
 */
export async function updateSite(
  host: string,
  updates: Partial<Omit<SiteObject, 'host' | 'addedAt'>>
): Promise<boolean> {
  try {
    const sites = await getSites()
    const siteIndex = sites.findIndex(s => s.host === host)

    if (siteIndex === -1) {
      console.warn('[Storage] Site not found:', host)
      return false
    }

    // Apply updates
    sites[siteIndex] = {
      ...sites[siteIndex],
      ...updates,
    }

    return await setSites(sites)
  } catch (err) {
    console.error('[Storage] Error updating site:', err)
    return false
  }
}

/**
 * Check if a site is blocked
 *
 * @param hostOrUrl - Domain or URL to check
 * @returns true if blocked
 */
export async function isSiteBlocked(hostOrUrl: string): Promise<boolean> {
  try {
    const host = normalizeHost(hostOrUrl)
    if (!host) return false

    const sites = await getSites()
    return sites.some(s => s.host === host)
  } catch (err) {
    console.error('[Storage] Error checking if site blocked:', err)
    return false
  }
}

/**
 * Get a specific site's configuration
 *
 * @param host - Normalized hostname
 * @returns Site object or null if not found
 */
export async function getSite(host: string): Promise<SiteObject | null> {
  try {
    const sites = await getSites()
    return sites.find(s => s.host === host) || null
  } catch (err) {
    console.error('[Storage] Error getting site:', err)
    return null
  }
}

/**
 * Clear all blocked sites
 *
 * @returns true if successful
 */
export async function clearAllSites(): Promise<boolean> {
  try {
    await browser.storage.sync.set({
      [STORAGE_KEYS.BLOCKED_SITES]: [],
    })
    return true
  } catch (err) {
    console.error('[Storage] Error clearing sites:', err)
    return false
  }
}

/**
 * Get temporary whitelist
 *
 * @returns Array of temporarily whitelisted sites
 */
export async function getTempWhitelist(): Promise<TempWhitelistEntry[]> {
  try {
    const data = await browser.storage.local.get(STORAGE_KEYS.TEMP_WHITELIST)
    const rawWhitelist = data[STORAGE_KEYS.TEMP_WHITELIST]

    if (!rawWhitelist) {
      return []
    }

    return safeParseStorageData(rawWhitelist, TempWhitelistSchema, [])
  } catch (err) {
    console.error('[Storage] Error getting temp whitelist:', err)
    return []
  }
}

/**
 * Add a site to temporary whitelist
 *
 * @param host - Normalized hostname
 * @param durationMs - Duration in milliseconds
 * @param reason - Optional reason for whitelisting
 * @returns true if successful
 */
export async function addTempWhitelist(
  host: string,
  durationMs: number,
  reason?: string
): Promise<boolean> {
  try {
    const whitelist = await getTempWhitelist()
    const until = Date.now() + durationMs

    // Remove any existing entry for this host
    const filtered = whitelist.filter(e => e.host !== host)

    // Add new entry
    filtered.push({
      host,
      until,
      reason,
    })

    await browser.storage.local.set({
      [STORAGE_KEYS.TEMP_WHITELIST]: filtered,
    })

    return true
  } catch (err) {
    console.error('[Storage] Error adding temp whitelist:', err)
    return false
  }
}

/**
 * Remove a site from temporary whitelist
 *
 * @param host - Normalized hostname
 * @returns true if successful
 */
export async function removeTempWhitelist(host: string): Promise<boolean> {
  try {
    const whitelist = await getTempWhitelist()
    const filtered = whitelist.filter(e => e.host !== host)

    await browser.storage.local.set({
      [STORAGE_KEYS.TEMP_WHITELIST]: filtered,
    })

    return true
  } catch (err) {
    console.error('[Storage] Error removing temp whitelist:', err)
    return false
  }
}

/**
 * Clean up expired temporary whitelist entries
 *
 * @returns Number of entries removed
 */
export async function cleanupExpiredWhitelist(): Promise<number> {
  try {
    const whitelist = await getTempWhitelist()
    const now = Date.now()
    const filtered = whitelist.filter(e => e.until > now)

    const removedCount = whitelist.length - filtered.length

    if (removedCount > 0) {
      await browser.storage.local.set({
        [STORAGE_KEYS.TEMP_WHITELIST]: filtered,
      })
    }

    return removedCount
  } catch (err) {
    console.error('[Storage] Error cleaning up whitelist:', err)
    return 0
  }
}

/**
 * Check if a site is temporarily whitelisted
 *
 * @param host - Normalized hostname
 * @returns true if whitelisted and not expired
 */
export async function isTempWhitelisted(host: string): Promise<boolean> {
  try {
    const whitelist = await getTempWhitelist()
    const now = Date.now()

    return whitelist.some(e => e.host === host && e.until > now)
  } catch (err) {
    console.error('[Storage] Error checking temp whitelist:', err)
    return false
  }
}

/**
 * Get current language setting
 *
 * @returns Language code or null if not set
 */
export async function getLanguage(): Promise<string | null> {
  try {
    const data = await browser.storage.local.get(STORAGE_KEYS.I18N_LANGUAGE)
    return (data[STORAGE_KEYS.I18N_LANGUAGE] as string) || null
  } catch (err) {
    console.error('[Storage] Error getting language:', err)
    return null
  }
}

/**
 * Set language preference
 *
 * @param language - Language code (e.g., 'en', 'ru')
 * @returns true if successful
 */
export async function setLanguage(language: string): Promise<boolean> {
  try {
    await browser.storage.local.set({
      [STORAGE_KEYS.I18N_LANGUAGE]: language,
    })
    return true
  } catch (err) {
    console.error('[Storage] Error setting language:', err)
    return false
  }
}

/**
 * Export all data for backup
 *
 * @returns JSON string of all data
 */
export async function exportAllData(): Promise<string> {
  try {
    const syncData = await browser.storage.sync.get(null)
    const localData = await browser.storage.local.get(null)

    return JSON.stringify(
      {
        sync: syncData,
        local: localData,
        exportedAt: Date.now(),
        version: '2.0.0',
      },
      null,
      2
    )
  } catch (err) {
    console.error('[Storage] Error exporting data:', err)
    throw err
  }
}

/**
 * Import data from backup
 *
 * @param jsonString - JSON string from exportAllData
 * @returns true if successful
 */
export async function importAllData(jsonString: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonString)

    if (data.sync) {
      await browser.storage.sync.set(data.sync)
    }

    if (data.local) {
      await browser.storage.local.set(data.local)
    }

    return true
  } catch (err) {
    console.error('[Storage] Error importing data:', err)
    return false
  }
}
