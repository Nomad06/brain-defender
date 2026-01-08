/**
 * Alarm handlers for scheduled tasks
 * Manages focus sessions, schedule checks, and periodic maintenance
 */

import browser from 'webextension-polyfill'
import { getCurrentSession, stopFocusSession, SessionState } from '../shared/domain/focus-sessions'
import { cleanupExpiredWhitelist } from '../shared/storage/storage'
import { rebuildRules } from './dnr-manager'

/**
 * Alarm names
 */
export const ALARM_NAMES = {
  FOCUS_SESSION_END: 'focusSessionEnd',
  SCHEDULE_CHECK: 'scheduleCheck',
  WHITELIST_CLEANUP: 'whitelistCleanup',
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
