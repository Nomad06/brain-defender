/**
 * DNR (declarativeNetRequest) Rule Manager
 * Handles building and updating Chrome's declarative blocking rules
 */

import browser from 'webextension-polyfill'
import { getSites, getTempWhitelist, cleanupExpiredWhitelist } from '../shared/storage/storage'
import { isScheduleActive } from '../shared/domain/schedule'
import { hostToRegex } from '../shared/utils/domain'
import { DNR_RULE_IDS } from '../shared/constants'

/**
 * Build DNR rules from blocked sites
 * Applies schedule and conditional rule filters
 *
 * @returns Array of DNR rules ready to be registered
 */
async function buildRules() {
  try {
    // Get all blocked sites
    const sites = await getSites()

    // Get temporary whitelist
    const tempWhitelist = await getTempWhitelist()
    const tempWhitelistedHosts = new Set(tempWhitelist.map(e => e.host))

    // Filter sites based on schedule and conditional rules
    const activeSites = []

    for (const site of sites) {
      // Skip if temporarily whitelisted
      if (tempWhitelistedHosts.has(site.host)) {
        continue
      }

      // Check schedule
      if (site.schedule && !isScheduleActive(site.schedule)) {
        continue // Not active according to schedule
      }

      // Sites with conditional rules are handled by tab listeners, not DNR
      // DNR can't dynamically check visit counts or time conditions
      if (site.conditionalRules && site.conditionalRules.length > 0) {
        // Skip DNR for conditional sites - they'll be handled by handleTabUpdate
        continue
      }

      activeSites.push(site)
    }

    // Build DNR rules
    const rules = activeSites.map((site, index) => {
      const ruleId = DNR_RULE_IDS.MIN + index

      // Ensure we don't exceed max rule ID
      if (ruleId > DNR_RULE_IDS.MAX) {
        console.warn('[DNR] Exceeded max rule count, skipping site:', site.host)
        return null
      }

      return {
        id: ruleId,
        priority: 1,
        action: {
          type: 'block' as const, // Changed from redirect to block
        },
        condition: {
          regexFilter: hostToRegex(site.host),
          resourceTypes: ['main_frame' as const],
        },
      }
    })

    // Filter out null entries
    return rules.filter((rule): rule is NonNullable<typeof rule> => rule !== null)
  } catch (err) {
    console.error('[DNR] Error building rules:', err)
    return []
  }
}

/**
 * Rebuild all DNR rules
 * Removes all existing rules and registers new ones
 *
 * @returns true if successful
 */
export async function rebuildRules(): Promise<boolean> {
  try {
    console.log('[DNR] Rebuilding rules...')

    // Clean up expired temporary whitelist entries first
    await cleanupExpiredWhitelist()

    // Get all existing rules
    const existingRules = await browser.declarativeNetRequest.getDynamicRules()
    const existingRuleIds = existingRules.map(rule => rule.id)

    // Build new rules
    const newRules = await buildRules()

    // Update rules
    await browser.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,
      addRules: newRules,
    })

    // Update badge with count
    const activeCount = newRules.length
    await browser.action.setBadgeText({
      text: activeCount > 0 ? String(activeCount) : '',
    })
    await browser.action.setBadgeBackgroundColor({
      color: '#4CAF50',
    })

    console.log(`[DNR] Rules rebuilt: ${activeCount} active sites`)
    return true
  } catch (err) {
    console.error('[DNR] Error rebuilding rules:', err)
    return false
  }
}

/**
 * Get count of active DNR rules
 *
 * @returns Number of active blocking rules
 */
export async function getActiveRulesCount(): Promise<number> {
  try {
    const rules = await browser.declarativeNetRequest.getDynamicRules()
    return rules.length
  } catch (err) {
    console.error('[DNR] Error getting rules count:', err)
    return 0
  }
}

/**
 * Clear all DNR rules
 *
 * @returns true if successful
 */
export async function clearAllRules(): Promise<boolean> {
  try {
    const existingRules = await browser.declarativeNetRequest.getDynamicRules()
    const existingRuleIds = existingRules.map(rule => rule.id)

    await browser.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,
      addRules: [],
    })

    await browser.action.setBadgeText({ text: '' })
    console.log('[DNR] All rules cleared')
    return true
  } catch (err) {
    console.error('[DNR] Error clearing rules:', err)
    return false
  }
}
