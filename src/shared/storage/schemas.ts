/**
 * Zod schemas for all storage data structures
 * Provides runtime validation for data loaded from chrome.storage
 */

import { z } from 'zod'
import {
  ScheduleSchema,
  ConditionalRuleSchema,
  StatsSchema,
  FocusSessionDataSchema,
  AchievementsDataSchema,
} from '../domain'

// Re-export domain schemas for convenience
export { ScheduleSchema, ConditionalRuleSchema, StatsSchema }

/**
 * Site object schema
 */
export const SiteObjectSchema = z.object({
  host: z.string().min(1),
  addedAt: z.number(),
  category: z.string().nullable(),
  schedule: ScheduleSchema.nullable().optional(),
  conditionalRules: z.array(ConditionalRuleSchema).optional(),
})

export type SiteObject = z.infer<typeof SiteObjectSchema>

/**
 * Array of sites
 */
export const SitesArraySchema = z.array(SiteObjectSchema)

/**
 * Temporary whitelist entry
 */
export const TempWhitelistEntrySchema = z.object({
  host: z.string(),
  until: z.number(), // timestamp
  reason: z.string().optional(),
})

export type TempWhitelistEntry = z.infer<typeof TempWhitelistEntrySchema>

/**
 * Temporary whitelist storage
 */
export const TempWhitelistSchema = z.array(TempWhitelistEntrySchema)

/**
 * Complete storage schema for all extension data
 */
export const ExtensionStorageSchema = z.object({
  // Main data (sync storage)
  blockedSites: SitesArraySchema.optional(),
  i18n_language: z.string().optional(),
  siteCategories: z.array(z.string()).optional(),

  // Local storage
  blockStats: StatsSchema.optional(),
  focusSessions: FocusSessionDataSchema.optional(),
  achievements: AchievementsDataSchema.optional(),
  tempWhitelist: TempWhitelistSchema.optional(),
  dataMigrationVersion: z.number().optional(),
})

export type ExtensionStorage = z.infer<typeof ExtensionStorageSchema>

/**
 * Validate and normalize a site object
 * Ensures all required fields exist
 *
 * @param site - Site object
 * @returns Normalized SiteObject
 */
export function normalizeSite(site: SiteObject): SiteObject {
  return {
    host: site.host,
    addedAt: site.addedAt || Date.now(),
    category: site.category || null,
    schedule: site.schedule || null,
    conditionalRules: site.conditionalRules || [],
  }
}

/**
 * Validate and normalize an array of sites
 * Removes duplicates and invalid entries
 *
 * @param sites - Array of site objects
 * @returns Array of normalized SiteObjects
 */
export function normalizeSites(sites: SiteObject[]): SiteObject[] {
  const seen = new Set<string>()
  const normalized: SiteObject[] = []

  for (const site of sites) {
    try {
      const normalizedSite = normalizeSite(site)

      // Skip duplicates
      if (seen.has(normalizedSite.host)) {
        continue
      }

      seen.add(normalizedSite.host)
      normalized.push(normalizedSite)
    } catch (err) {
      console.error('[Storage] Invalid site format, skipping:', site, err)
    }
  }

  // Sort by host alphabetically
  return normalized.sort((a, b) => a.host.localeCompare(b.host))
}

/**
 * Validate storage data with schema
 * Returns validated data or throws error
 *
 * @param data - Raw data from storage
 * @param schema - Zod schema to validate against
 * @returns Validated and typed data
 */
export function validateStorageData<T>(data: unknown, schema: z.ZodSchema<T>): T {
  const result = schema.safeParse(data)

  if (!result.success) {
    console.error('[Storage] Validation error:', result.error.issues)
    throw new Error(`Storage validation failed: ${result.error.issues[0]?.message}`)
  }

  return result.data
}

/**
 * Safely parse storage data, returning default on error
 *
 * @param data - Raw data from storage
 * @param schema - Zod schema to validate against
 * @param defaultValue - Default value if validation fails
 * @returns Validated data or default
 */
export function safeParseStorageData<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  defaultValue: T
): T {
  try {
    return validateStorageData(data, schema)
  } catch (err) {
    console.warn('[Storage] Using default value due to validation error:', err)
    return defaultValue
  }
}
