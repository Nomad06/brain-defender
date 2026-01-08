/**
 * Background Service Worker for Brain Defender
 * Main entry point that coordinates all extension functionality
 */

import browser from 'webextension-polyfill'
import { initializeMessageHandlers } from './handlers'
import { initializeAlarmHandlers, setupPeriodicAlarms } from './alarms'
import { rebuildRules } from './dnr-manager'
import { runMigrations, needsMigration } from '../shared/storage/migrations'
import { initFocusSessions, getCurrentSession, SessionState } from '../shared/domain/focus-sessions'
import { getSites, getTempWhitelist } from '../shared/storage/storage'
import { normalizeHost } from '../shared/utils/domain'
import { isScheduleActive } from '../shared/domain/schedule'
import { shouldBlockByConditionalRules } from '../shared/domain/conditional-rules'
import { getSiteStats, recordVisitAttempt } from '../shared/domain/stats'

/**
 * Extension installation/update handler
 */
async function handleInstalled(
  details: browser.Runtime.OnInstalledDetailsType
): Promise<void> {
  console.log('[Background] Extension installed/updated:', details.reason)

  try {
    if (details.reason === 'install') {
      console.log('[Background] First-time installation')

      // Initialize focus sessions
      await initFocusSessions()

      // Show welcome notification
      await browser.notifications.create({
        type: 'basic',
        iconUrl: browser.runtime.getURL('icons/icon-48.png'),
        title: 'Brain Defender Installed',
        message: 'Your digital attention guardian is ready to help you stay focused!',
      })
    }

    if (details.reason === 'update') {
      console.log('[Background] Extension updated from', details.previousVersion)
    }

    // Check if migrations are needed
    const migrationNeeded = await needsMigration()
    if (migrationNeeded) {
      console.log('[Background] Running data migrations...')
      const result = await runMigrations()
      if (result.migrated) {
        console.log('[Background] Migrations completed:', result)
      } else {
        console.warn('[Background] Migrations not completed:', result)
      }
    }

    // Initial DNR rules build
    console.log('[Background] Building initial DNR rules...')
    const success = await rebuildRules()
    if (success) {
      console.log('[Background] Initial rules built successfully')
    } else {
      console.error('[Background] Failed to build initial rules')
    }

    // Setup periodic alarms
    await setupPeriodicAlarms()
  } catch (err) {
    console.error('[Background] Error in handleInstalled:', err)
  }
}

/**
 * Service worker startup handler
 * Runs when service worker wakes up from idle state
 */
async function handleStartup(): Promise<void> {
  console.log('[Background] Service worker started')

  try {
    // Check for active focus session
    const session = await getCurrentSession()
    if (session && session.state === SessionState.WORKING) {
      console.log('[Background] Active focus session detected:', session.id)

      // Verify alarm is set
      const alarms = await browser.alarms.getAll()
      const sessionAlarm = alarms.find(a => a.name === 'focusSession')
      if (!sessionAlarm) {
        console.log('[Background] Recreating focus session alarm')
        await browser.alarms.create('focusSession', {
          when: session.endTime,
        })
      }
    }

    // Rebuild DNR rules to ensure they're up to date
    console.log('[Background] Rebuilding DNR rules on startup...')
    await rebuildRules()

    // Ensure periodic alarms are running
    await setupPeriodicAlarms()
  } catch (err) {
    console.error('[Background] Error in handleStartup:', err)
  }
}

/**
 * Handle browser action (extension icon) clicks
 */
async function handleActionClick(): Promise<void> {
  try {
    // Open popup (default behavior, but we can customize if needed)
    console.log('[Background] Extension icon clicked')
  } catch (err) {
    console.error('[Background] Error handling action click:', err)
  }
}

/**
 * Handle tab updates to track navigation
 * Also catches already-open tabs that should be blocked
 */
async function handleTabUpdate(
  tabId: number,
  changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
  tab: browser.Tabs.Tab
): Promise<void> {
  try {
    // Only process completed navigations
    if (changeInfo.status !== 'complete') return
    if (!tab.url) return

    // Skip internal pages
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      return
    }

    // Skip our own blocked page
    if (tab.url.includes('blocked/index.html')) {
      return
    }

    // Normalize URL to hostname
    const hostname = normalizeHost(tab.url)
    if (!hostname) return

    // Get blocked sites
    const sites = await getSites()
    const tempWhitelist = await getTempWhitelist()
    const tempWhitelistedHosts = new Set(tempWhitelist.map(e => e.host))

    // Check if this site should be blocked
    for (const site of sites) {
      if (site.host !== hostname) continue

      // Skip if temporarily whitelisted
      if (tempWhitelistedHosts.has(site.host)) {
        continue
      }

      // Check schedule
      if (site.schedule && !isScheduleActive(site.schedule)) {
        continue
      }

      // For sites with conditional rules, check if we should block
      if (site.conditionalRules && site.conditionalRules.length > 0) {
        // Record visit attempt
        await recordVisitAttempt(hostname)

        // Check if should block
        const siteStats = await getSiteStats(hostname)
        if (!shouldBlockByConditionalRules(site, siteStats)) {
          console.log('[Background] Conditional rule: allow visit (limit not reached)', hostname)
          return // Don't block - allow the visit
        }
        console.log('[Background] Conditional rule: block (limit reached)', hostname)
      }

      // Site should be blocked - redirect the tab
      const blockedUrl = browser.runtime.getURL(
        `src/pages/blocked/index.html?url=${encodeURIComponent(tab.url)}`
      )

      await browser.tabs.update(tabId, { url: blockedUrl })
      console.log('[Background] Redirected already-open tab:', hostname)
      return
    }
  } catch (err) {
    console.error('[Background] Error handling tab update:', err)
  }
}

/**
 * Handle navigation errors (catches DNR blocks)
 * When DNR blocks a request, it triggers onErrorOccurred with net::ERR_BLOCKED_BY_CLIENT
 */
async function handleNavigationError(details: any): Promise<void> {
  try {
    console.log('[Background] Navigation error:', details.error, 'url:', details.url, 'tabId:', details.tabId)

    // Only handle DNR blocks
    if (details.error !== 'net::ERR_BLOCKED_BY_CLIENT') {
      return
    }

    // Only handle main_frame navigations
    if (details.frameId !== 0) {
      return
    }

    if (!details.url) return

    // Redirect to blocked page
    const blockedUrl = browser.runtime.getURL(
      `src/pages/blocked/index.html?url=${encodeURIComponent(details.url)}`
    )

    console.log('[Background] ⛔ DNR blocked navigation, redirecting to:', blockedUrl)
    await browser.tabs.update(details.tabId, { url: blockedUrl })
  } catch (err) {
    console.error('[Background] Error handling navigation error:', err)
  }
}

/**
 * Handle History API navigation (for SPAs like YouTube)
 * This catches URL changes that don't trigger full page loads
 */
async function handleHistoryStateUpdate(
  details: browser.WebNavigation.OnHistoryStateUpdatedDetailsType
): Promise<void> {
  try {
    console.log('[Background] History state updated:', details.url, 'tabId:', details.tabId)

    if (!details.url) return

    // Skip internal pages
    if (details.url.startsWith('chrome://') || details.url.startsWith('chrome-extension://')) {
      return
    }

    // Skip our own blocked page
    if (details.url.includes('blocked/index.html')) {
      return
    }

    // Get blocked sites
    const sites = await getSites()
    const tempWhitelist = await getTempWhitelist()
    const tempWhitelistedHosts = new Set(tempWhitelist.map(e => e.host))

    // Normalize URL to hostname
    const hostname = normalizeHost(details.url)
    console.log('[Background] Normalized hostname:', hostname)

    if (!hostname) return

    // Check if this site should be blocked
    for (const site of sites) {
      if (site.host !== hostname) continue

      console.log('[Background] Found matching site in block list:', site.host)

      // Skip if temporarily whitelisted
      if (tempWhitelistedHosts.has(site.host)) {
        console.log('[Background] Site is temporarily whitelisted')
        continue
      }

      // Check schedule
      if (site.schedule && !isScheduleActive(site.schedule)) {
        console.log('[Background] Site blocked but schedule not active')
        continue
      }

      // For sites with conditional rules, check if we should block
      if (site.conditionalRules && site.conditionalRules.length > 0) {
        // Record visit attempt
        await recordVisitAttempt(hostname)

        // Check if should block
        const siteStats = await getSiteStats(hostname)
        if (!shouldBlockByConditionalRules(site, siteStats)) {
          console.log('[Background] Conditional rule: allow visit (limit not reached)', hostname)
          return // Don't block - allow the visit
        }
        console.log('[Background] Conditional rule: block (limit reached)', hostname)
      }

      // Site should be blocked - redirect the tab
      const blockedUrl = browser.runtime.getURL(
        `src/pages/blocked/index.html?url=${encodeURIComponent(details.url)}`
      )

      console.log('[Background] ⛔ Blocking SPA navigation to:', hostname, 'redirecting to:', blockedUrl)
      await browser.tabs.update(details.tabId, { url: blockedUrl })
      return
    }

    console.log('[Background] No matching block rule for:', hostname)
  } catch (err) {
    console.error('[Background] Error handling history state update:', err)
  }
}

/**
 * Initialize all background systems
 */
async function initialize(): Promise<void> {
  console.log('[Background] Initializing Brain Defender v2.0.0...')

  try {
    // Initialize message handlers
    initializeMessageHandlers()

    // Initialize alarm handlers
    initializeAlarmHandlers()

    // Register event listeners
    browser.runtime.onInstalled.addListener(handleInstalled)
    browser.runtime.onStartup.addListener(handleStartup)
    browser.action.onClicked.addListener(handleActionClick)
    browser.tabs.onUpdated.addListener(handleTabUpdate)
    browser.webNavigation.onErrorOccurred.addListener(handleNavigationError)
    browser.webNavigation.onHistoryStateUpdated.addListener(handleHistoryStateUpdate)

    console.log('[Background] Brain Defender initialized successfully')

    // Perform startup tasks
    await handleStartup()
  } catch (err) {
    console.error('[Background] Fatal error during initialization:', err)
  }
}

// Start the extension
initialize().catch(err => {
  console.error('[Background] Fatal error in main initialization:', err)
})

/**
 * Export types for testing
 */
export type { }
