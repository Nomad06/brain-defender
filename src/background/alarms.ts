/**
 * Alarm handlers for scheduled tasks
 * Manages focus sessions, schedule checks, and periodic maintenance
 */

import browser from 'webextension-polyfill'
import { getCurrentSession, stopFocusSession, SessionState } from '../shared/domain/focus-sessions'
import { cleanupExpiredWhitelist, getSites } from '../shared/storage/storage'
import { rebuildRules } from './dnr-manager'
import { normalizeHost } from '../shared/utils/domain'
import { addTimeSpent } from '../shared/domain/stats'

/**
 * Alarm names
 */
export const ALARM_NAMES = {
  FOCUS_SESSION_END: 'focusSessionEnd',
  SCHEDULE_CHECK: 'scheduleCheck',
  WHITELIST_CLEANUP: 'whitelistCleanup',
  TIME_TRACKING: 'timeTracking',
} as const

/**
 * Handle alarm events
 *
 * @param alarm - The alarm that fired
 */
async function handleAlarm(alarm: browser.Alarms.Alarm): Promise<void> {
  console.log('[Alarms] Alarm triggered:', alarm.name)

  try {
    switch (alarm.name) {
      case ALARM_NAMES.FOCUS_SESSION_END:
        await handleFocusSessionEnd()
        break

      case ALARM_NAMES.SCHEDULE_CHECK:
        await handleScheduleCheck()
        break

      case ALARM_NAMES.WHITELIST_CLEANUP:
        await handleWhitelistCleanup()
        break

      case ALARM_NAMES.TIME_TRACKING:
        await handleTimeTracking()
        break

      default:
        console.warn('[Alarms] Unknown alarm:', alarm.name)
    }
  } catch (err) {
    console.error('[Alarms] Error handling alarm:', alarm.name, err)
  }
}

/**
 * Handle focus session end
 * Called when a focus session timer expires
 */
async function handleFocusSessionEnd(): Promise<void> {
  console.log('[Alarms] Focus session ended')

  const session = await getCurrentSession()

  if (!session || session.state === SessionState.IDLE) {
    console.log('[Alarms] No active session to end')
    return
  }

  // Stop the session
  await stopFocusSession()

  // Rebuild rules to remove focus session blocks
  await rebuildRules()

  // Show notification
  await browser.notifications.create({
    type: 'basic',
    iconUrl: browser.runtime.getURL('icons/icon-48.png'),
    title: 'Focus Session Complete',
    message: 'Your focus session has ended. Great work!',
  })
}

/**
 * Handle periodic schedule check
 * Rebuilds DNR rules if schedule changes (e.g., entering/exiting work hours)
 */
async function handleScheduleCheck(): Promise<void> {
  console.log('[Alarms] Checking schedules')

  // Rebuild rules to apply current schedules
  await rebuildRules()
}

/**
 * Handle whitelist cleanup
 * Removes expired temporary whitelist entries
 */
async function handleWhitelistCleanup(): Promise<void> {
  console.log('[Alarms] Cleaning up expired whitelist entries')

  await cleanupExpiredWhitelist()

  // Rebuild rules if any entries were cleaned up
  await rebuildRules()
}

/**
 * Handle time tracking
 * Tracks time spent on blocked sites for TIME_LIMIT conditional rules
 */
async function handleTimeTracking(): Promise<void> {
  try {
    // Get active tab
    const tabs = await browser.tabs.query({ active: true, currentWindow: true })
    if (!tabs || tabs.length === 0) return

    const tab = tabs[0]
    if (!tab.url) return

    // Skip chrome:// and extension pages
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      return
    }

    const hostname = normalizeHost(tab.url)
    if (!hostname) return

    // Check if this is a blocked site with TIME_LIMIT rule
    const sites = await getSites()
    const site = sites.find(s => s.host === hostname)

    if (!site || !site.conditionalRules || site.conditionalRules.length === 0) {
      return // Not a site with conditional rules
    }

    // Check if site has TIME_LIMIT rule
    const hasTimeLimit = site.conditionalRules.some(
      rule => rule.type === 'timeLimit' && rule.enabled
    )

    if (!hasTimeLimit) return

    // Add 1 minute to time spent
    await addTimeSpent(hostname, 1)
    console.log('[Alarms] Added 1 minute to', hostname)

    // Rebuild rules to check if time limit exceeded
    await rebuildRules()
  } catch (err) {
    console.error('[Alarms] Error tracking time:', err)
  }
}

/**
 * Schedule focus session end alarm
 *
 * @param endTime - Timestamp when session should end
 */
export async function scheduleFocusSessionEnd(endTime: number): Promise<void> {
  try {
    const delayInMinutes = Math.max(1, (endTime - Date.now()) / 60000)

    await browser.alarms.create(ALARM_NAMES.FOCUS_SESSION_END, {
      delayInMinutes,
    })

    console.log(`[Alarms] Focus session end scheduled in ${delayInMinutes.toFixed(1)} minutes`)
  } catch (err) {
    console.error('[Alarms] Error scheduling focus session end:', err)
  }
}

/**
 * Cancel focus session end alarm
 */
export async function cancelFocusSessionEnd(): Promise<void> {
  try {
    await browser.alarms.clear(ALARM_NAMES.FOCUS_SESSION_END)
    console.log('[Alarms] Focus session end alarm cancelled')
  } catch (err) {
    console.error('[Alarms] Error cancelling focus session end:', err)
  }
}

/**
 * Setup periodic alarms
 * Called on service worker startup
 */
export async function setupPeriodicAlarms(): Promise<void> {
  try {
    // Check schedules every 5 minutes
    await browser.alarms.create(ALARM_NAMES.SCHEDULE_CHECK, {
      periodInMinutes: 5,
    })

    // Cleanup whitelist every 15 minutes
    await browser.alarms.create(ALARM_NAMES.WHITELIST_CLEANUP, {
      periodInMinutes: 15,
    })

    // Track time spent every 1 minute (for TIME_LIMIT conditional rules)
    await browser.alarms.create(ALARM_NAMES.TIME_TRACKING, {
      periodInMinutes: 1,
    })

    console.log('[Alarms] Periodic alarms set up')
  } catch (err) {
    console.error('[Alarms] Error setting up periodic alarms:', err)
  }
}

/**
 * Initialize alarm handlers
 * Called by service worker on startup
 */
export function initializeAlarmHandlers(): void {
  browser.alarms.onAlarm.addListener(handleAlarm)
  console.log('[Alarms] Alarm handlers initialized')
}
