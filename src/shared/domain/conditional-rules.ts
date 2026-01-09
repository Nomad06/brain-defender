/**
 * Conditional blocking rules system
 * Extends site blocking with conditional logic based on time, visits, and other factors
 */

import { z } from 'zod'
import { t } from '../i18n'
import type { SiteStats } from './stats'

// Condition types enum
export enum ConditionType {
  VISITS_PER_DAY = 'visitsPerDay', // Block after N visits per day
  TIME_LIMIT = 'timeLimit', // Block when time limit exceeded
}

// Zod schemas for runtime validation
export const ConditionalRuleSchema = z.object({
  type: z.nativeEnum(ConditionType),
  enabled: z.boolean(),
  maxVisits: z.number().min(1).optional(), // For VISITS_PER_DAY
  timeAfter: z.string().regex(/^\d{2}:\d{2}$/).optional(), // For TIME_AFTER (HH:MM)
  days: z.array(z.number().min(0).max(6)).optional(), // For DAYS_OF_WEEK (0-6)
  maxTimeMinutes: z.number().min(1).optional(), // For TIME_LIMIT
})

export const ConditionalRulesArraySchema = z.array(ConditionalRuleSchema)

// Type exports
export type ConditionalRule = z.infer<typeof ConditionalRuleSchema>

/**
 * Site object that may have conditional rules
 */
export interface SiteWithRules {
  host: string
  conditionalRules?: ConditionalRule[]
  [key: string]: unknown
}

/**
 * Check if a site should be blocked based on conditional rules
 *
 * @param site - Site object with potential conditional rules
 * @param siteStats - Statistics for this site (from stats.ts)
 * @returns true if site should be blocked, false otherwise
 *
 * Logic:
 * - If no conditional rules exist, default to blocking (return true)
 * - If any rule matches its condition, block the site
 * - If no rules match, don't block (return false)
 */
export function shouldBlockByConditionalRules(
  site: SiteWithRules | null | undefined,
  siteStats: SiteStats | null | undefined
): boolean {
  if (
    !site ||
    !site.conditionalRules ||
    !Array.isArray(site.conditionalRules) ||
    site.conditionalRules.length === 0
  ) {
    return true // No conditional rules - block always
  }

  const now = new Date()
  const today = now.toISOString().split('T')[0]

  // Check each rule
  for (const rule of site.conditionalRules) {
    if (!rule.type || !rule.enabled) {
      continue
    }

    switch (rule.type) {
      case ConditionType.VISITS_PER_DAY: {
        // Block after N visits per day
        if (!rule.maxVisits) {
          break
        }

        // Get today's visit count (0 if no stats)
        const visitsToday =
          siteStats && siteStats.visitsByDate && siteStats.visitsByDate[today]
            ? siteStats.visitsByDate[today]
            : 0

        if (visitsToday >= rule.maxVisits) {
          return true // Visit limit exceeded
        }

        // If visits are below limit, don't block
        // (but this rule takes precedence - return false immediately)
        return false
      }

      case ConditionType.TIME_LIMIT: {
        // Block when time limit is exceeded
        if (!rule.maxTimeMinutes) {
          break
        }
        const timeSpentToday = siteStats && siteStats.timeSpentToday ? siteStats.timeSpentToday : 0
        if (timeSpentToday >= rule.maxTimeMinutes) {
          return true // Time limit exceeded
        }
        // If time not exceeded, don't block
        return false
      }
    }
  }

  // If no rule matched, DON'T block (conditional rules don't require blocking)
  return false
}

/**
 * Create a default conditional rule
 * @param type - Type of condition
 * @returns Default rule configuration
 */
export function createDefaultRule(type: ConditionType): ConditionalRule {
  const baseRule = {
    type,
    enabled: true,
  }

  switch (type) {
    case ConditionType.VISITS_PER_DAY:
      return { ...baseRule, maxVisits: 5 }

    case ConditionType.TIME_LIMIT:
      return { ...baseRule, maxTimeMinutes: 30 }

    default:
      return baseRule as ConditionalRule
  }
}

/**
 * Validate a conditional rule
 * @param rule - Rule to validate
 * @returns Validation result with error message if invalid
 */
export function validateConditionalRule(
  rule: unknown
): { valid: boolean; error?: string } {
  const result = ConditionalRuleSchema.safeParse(rule)
  if (!result.success) {
    return {
      valid: false,
      error: result.error.issues[0]?.message || 'Invalid conditional rule format',
    }
  }

  const validRule = result.data

  // Additional validation
  switch (validRule.type) {
    case ConditionType.VISITS_PER_DAY:
      if (!validRule.maxVisits || validRule.maxVisits < 1) {
        return { valid: false, error: 'maxVisits must be at least 1' }
      }
      break

    case ConditionType.TIME_LIMIT:
      if (!validRule.maxTimeMinutes || validRule.maxTimeMinutes < 1) {
        return { valid: false, error: 'maxTimeMinutes must be at least 1' }
      }
      break
  }

  return { valid: true }
}

/**
 * Get human-readable description of a conditional rule
 * @param rule - Conditional rule
 * @returns Human-readable description
 */
export function getConditionDescription(rule: ConditionalRule): string {
  switch (rule.type) {
    case ConditionType.VISITS_PER_DAY:
      return t('conditionalRules.descVisitsPerDay', { maxVisits: rule.maxVisits || 0 })

    case ConditionType.TIME_LIMIT:
      return t('conditionalRules.descTimeLimit', { maxTimeMinutes: rule.maxTimeMinutes || 0 })

    default:
      return t('conditionalRules.descUnknown')
  }
}

/**
 * Get all available condition types with metadata
 * @returns Array of condition type info objects
 */
export function getConditionTypes(): Array<{
  type: ConditionType
  name: string
  description: string
  icon: string
}> {
  return [
    {
      type: ConditionType.VISITS_PER_DAY,
      name: t("conditionalRules.visitsLimit"),
      description: t("conditionalRules.visitsLimitDesc"),
      icon: '🔢',
    },
    {
      type: ConditionType.TIME_LIMIT,
      name: t("conditionalRules.timeLimit"),
      description: t("conditionalRules.timeLimitDesc"),
      icon: '⏱️',
    },
  ]
}

/**
 * Check if a site has any enabled conditional rules
 * @param site - Site object
 * @returns true if site has enabled rules
 */
export function hasEnabledConditionalRules(site: SiteWithRules | null | undefined): boolean {
  if (!site || !site.conditionalRules || !Array.isArray(site.conditionalRules)) {
    return false
  }

  return site.conditionalRules.some(rule => rule.enabled)
}

/**
 * Add a conditional rule to a site
 * @param site - Site object
 * @param rule - Rule to add
 * @returns Updated site object
 */
export function addConditionalRule(site: SiteWithRules, rule: ConditionalRule): SiteWithRules {
  if (!site.conditionalRules) {
    site.conditionalRules = []
  }

  site.conditionalRules.push(rule)
  return site
}

/**
 * Remove a conditional rule from a site
 * @param site - Site object
 * @param ruleIndex - Index of rule to remove
 * @returns Updated site object
 */
export function removeConditionalRule(site: SiteWithRules, ruleIndex: number): SiteWithRules {
  if (!site.conditionalRules || ruleIndex < 0 || ruleIndex >= site.conditionalRules.length) {
    return site
  }

  site.conditionalRules.splice(ruleIndex, 1)
  return site
}

/**
 * Toggle a conditional rule's enabled state
 * @param site - Site object
 * @param ruleIndex - Index of rule to toggle
 * @returns Updated site object
 */
export function toggleConditionalRule(site: SiteWithRules, ruleIndex: number): SiteWithRules {
  if (!site.conditionalRules || ruleIndex < 0 || ruleIndex >= site.conditionalRules.length) {
    return site
  }

  site.conditionalRules[ruleIndex].enabled = !site.conditionalRules[ruleIndex].enabled
  return site
}
