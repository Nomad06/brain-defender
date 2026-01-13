/**
 * Focus sessions (Pomodoro) system for Brain Defender
 * Allows users to start timed work sessions with additional site blocking
 */

import { z } from 'zod'
import browser from 'webextension-polyfill'
import { STORAGE_KEYS, FOCUS_SESSION_DEFAULTS } from '../constants'
import { t } from '../i18n'

// Session states enum
export enum SessionState {
  IDLE = 'idle',
  WORKING = 'working',
  BREAK = 'break',
  PAUSED = 'paused',
}

// Alarm names for Chrome alarms API
export const ALARM_SESSION_NAME = 'focusSession'
export const ALARM_BREAK_NAME = 'focusBreak'

// Zod schemas for runtime validation
export const FocusSessionSchema = z.object({
  id: z.string(),
  state: z.nativeEnum(SessionState),
  startTime: z.number(),
  endTime: z.number(),
  duration: z.number().min(1),
  sitesToBlock: z.array(z.string()),
  pausedTime: z.number().default(0),
  pausedAt: z.number().nullable(),
})

export const FocusSessionSettingsSchema = z.object({
  workDuration: z.number().min(1).default(FOCUS_SESSION_DEFAULTS.DEFAULT_DURATION),
  breakDuration: z.number().min(1).default(5),
  autoStartBreak: z.boolean().default(true),
  soundEnabled: z.boolean().default(true),
})

export const FocusSessionStatsSchema = z.object({
  totalSessions: z.number().min(0).default(0),
  totalWorkTime: z.number().min(0).default(0), // minutes
  totalBreakTime: z.number().min(0).default(0), // minutes
})

export const FocusSessionDataSchema = z.object({
  currentSession: FocusSessionSchema.nullable(),
  settings: FocusSessionSettingsSchema,
  history: z.array(FocusSessionSchema.extend({ completedAt: z.number() })),
  stats: FocusSessionStatsSchema,
})

// Type exports
export type FocusSession = z.infer<typeof FocusSessionSchema>
export type FocusSessionSettings = z.infer<typeof FocusSessionSettingsSchema>
export type FocusSessionStats = z.infer<typeof FocusSessionStatsSchema>
export type FocusSessionData = z.infer<typeof FocusSessionDataSchema>

/**
 * Initialize focus sessions system with default values
 */
export async function initFocusSessions(): Promise<void> {
  try {
    const data = await browser.storage.local.get(STORAGE_KEYS.FOCUS_SESSIONS)
    if (!data[STORAGE_KEYS.FOCUS_SESSIONS]) {
      await browser.storage.local.set({
        [STORAGE_KEYS.FOCUS_SESSIONS]: {
          currentSession: null,
          settings: {
            workDuration: FOCUS_SESSION_DEFAULTS.DEFAULT_DURATION,
            breakDuration: 5,
            autoStartBreak: true,
            soundEnabled: true,
          },
          history: [],
          stats: {
            totalSessions: 0,
            totalWorkTime: 0,
            totalBreakTime: 0,
          },
        },
      })
    }
  } catch (err) {
    console.error('[FocusSessions] Error initializing:', err)
  }
}

/**
 * Get focus sessions data from storage
 * @returns FocusSessionData or null on error
 */
export async function getFocusSessionsData(): Promise<FocusSessionData | null> {
  try {
    const data = await browser.storage.local.get(STORAGE_KEYS.FOCUS_SESSIONS)
    if (!data[STORAGE_KEYS.FOCUS_SESSIONS]) {
      await initFocusSessions()
      const freshData = await browser.storage.local.get(STORAGE_KEYS.FOCUS_SESSIONS)
      return freshData[STORAGE_KEYS.FOCUS_SESSIONS] as FocusSessionData
    }
    return data[STORAGE_KEYS.FOCUS_SESSIONS] as FocusSessionData
  } catch (err) {
    console.error('[FocusSessions] Error getting data:', err)
    return null
  }
}

/**
 * Save focus sessions data to storage
 * @param data - FocusSessionData to save
 */
export async function saveFocusSessionsData(data: FocusSessionData): Promise<void> {
  try {
    await browser.storage.local.set({ [STORAGE_KEYS.FOCUS_SESSIONS]: data })
  } catch (err) {
    console.error('[FocusSessions] Error saving data:', err)
  }
}

/**
 * Start a new focus session
 *
 * @param durationMinutes - Session duration in minutes (null = use default from settings)
 * @param sitesToBlock - Additional sites to block during session
 * @returns true if session started successfully
 */
export async function startFocusSession(
  durationMinutes: number | null = null,
  sitesToBlock: string[] | null = null
): Promise<boolean> {
  try {
    const data = await getFocusSessionsData()
    if (!data) return false

    const settings = data.settings || {}
    const duration =
      durationMinutes || settings.workDuration || FOCUS_SESSION_DEFAULTS.DEFAULT_DURATION
    const startTime = Date.now()
    const endTime = startTime + duration * 60 * 1000

    const session: FocusSession = {
      id: `session_${startTime}`,
      state: SessionState.WORKING,
      startTime: startTime,
      endTime: endTime,
      duration: duration,
      sitesToBlock: sitesToBlock || [],
      pausedTime: 0,
      pausedAt: null,
    }

    data.currentSession = session
    await saveFocusSessionsData(data)

    // Set alarm for session end
    await browser.alarms.create(ALARM_SESSION_NAME, {
      when: endTime,
    })

    // Note: DNR rules are rebuilt by the background handler after this function returns
    // No need to send another message here

    // Show notification
    try {
      await browser.notifications.create(`focusSession_${startTime}`, {
        type: 'basic',
        iconUrl: browser.runtime.getURL('icons/icon128.png'),
        title: `🍅 ${t('focusSession.title')}`,
        message: t('notifications.focusSessionStarted', { duration: String(duration) }),
      })
    } catch (notifErr) {
      console.debug('[FocusSessions] Failed to show notification:', notifErr)
    }

    return true
  } catch (err) {
    console.error('[FocusSessions] Error starting session:', err)
    return false
  }
}

/**
 * Stop the current focus session
 * @returns true if session stopped successfully
 */
export async function stopFocusSession(): Promise<boolean> {
  try {
    const data = await getFocusSessionsData()
    if (!data || !data.currentSession) return false

    const session = data.currentSession
    const now = Date.now()
    const actualDuration = Math.floor(
      (now - session.startTime - (session.pausedTime || 0)) / (60 * 1000)
    )

    // Save session to history
    if (!data.history) data.history = []
    data.history.push({
      ...session,
      state: SessionState.IDLE,
      completedAt: now,
    } as FocusSession & { completedAt: number })

    // Update statistics
    if (!data.stats)
      data.stats = { totalSessions: 0, totalWorkTime: 0, totalBreakTime: 0 }
    data.stats.totalSessions = (data.stats.totalSessions || 0) + 1
    data.stats.totalWorkTime = (data.stats.totalWorkTime || 0) + actualDuration

    data.currentSession = null
    await saveFocusSessionsData(data)

    // Clear alarms
    await browser.alarms.clear(ALARM_SESSION_NAME)
    await browser.alarms.clear(ALARM_BREAK_NAME)

    // Note: DNR rules are rebuilt by the background handler after this function returns
    // No need to send another message here

    return true
  } catch (err) {
    console.error('[FocusSessions] Error stopping session:', err)
    return false
  }
}

/**
 * Pause the current session
 * @returns true if session paused successfully
 */
export async function pauseFocusSession(): Promise<boolean> {
  try {
    const data = await getFocusSessionsData()
    if (
      !data ||
      !data.currentSession ||
      data.currentSession.state !== SessionState.WORKING
    ) {
      return false
    }

    data.currentSession.state = SessionState.PAUSED
    data.currentSession.pausedAt = Date.now()
    await saveFocusSessionsData(data)

    // Clear alarm (time won't expire while paused)
    await browser.alarms.clear(ALARM_SESSION_NAME)

    return true
  } catch (err) {
    console.error('[FocusSessions] Error pausing session:', err)
    return false
  }
}

/**
 * Resume a paused session
 * @returns true if session resumed successfully
 */
export async function resumeFocusSession(): Promise<boolean> {
  try {
    const data = await getFocusSessionsData()
    if (
      !data ||
      !data.currentSession ||
      data.currentSession.state !== SessionState.PAUSED
    ) {
      return false
    }

    const session = data.currentSession
    const pausedDuration = Date.now() - (session.pausedAt || Date.now())
    session.pausedTime = (session.pausedTime || 0) + pausedDuration
    session.state = SessionState.WORKING
    session.pausedAt = null

    // Recalculate end time
    const remainingTime = session.endTime - Date.now() + session.pausedTime
    session.endTime = Date.now() + remainingTime

    await saveFocusSessionsData(data)

    // Set alarm again
    await browser.alarms.create(ALARM_SESSION_NAME, {
      when: session.endTime,
    })

    return true
  } catch (err) {
    console.error('[FocusSessions] Error resuming session:', err)
    return false
  }
}

/**
 * Get current session
 * @returns Current FocusSession or null if none active
 */
export async function getCurrentSession(): Promise<FocusSession | null> {
  try {
    const data = await getFocusSessionsData()
    return data?.currentSession || null
  } catch (err) {
    console.error('[FocusSessions] Error getting current session:', err)
    return null
  }
}

/**
 * Get remaining time of current session in seconds
 * @returns Remaining seconds, or 0 if no active session
 */
export async function getRemainingTime(): Promise<number> {
  try {
    const session = await getCurrentSession()
    if (
      !session ||
      session.state === SessionState.IDLE ||
      session.state === SessionState.PAUSED
    ) {
      return 0
    }

    const now = Date.now()
    const remaining = Math.max(0, Math.floor((session.endTime - now) / 1000))
    return remaining
  } catch (err) {
    console.error('[FocusSessions] Error getting remaining time:', err)
    return 0
  }
}

/**
 * Update focus session settings
 * @param settings - Partial settings to update
 * @returns true if successful
 */
export async function updateFocusSessionSettings(
  settings: Partial<FocusSessionSettings>
): Promise<boolean> {
  try {
    const data = await getFocusSessionsData()
    if (!data) return false

    data.settings = { ...data.settings, ...settings }
    await saveFocusSessionsData(data)
    return true
  } catch (err) {
    console.error('[FocusSessions] Error updating settings:', err)
    return false
  }
}

/**
 * Get focus session statistics
 * @returns FocusSessionStats or null on error
 */
export async function getFocusSessionStats(): Promise<FocusSessionStats | null> {
  try {
    const data = await getFocusSessionsData()
    return data?.stats || null
  } catch (err) {
    console.error('[FocusSessions] Error getting stats:', err)
    return null
  }
}

/**
 * Get session history
 * @param limit - Maximum number of sessions to return
 * @returns Array of completed sessions
 */
export async function getSessionHistory(
  limit = 10
): Promise<Array<FocusSession & { completedAt: number }>> {
  try {
    const data = await getFocusSessionsData()
    if (!data || !data.history) {
      return []
    }

    return data.history.slice(-limit).reverse()
  } catch (err) {
    console.error('[FocusSessions] Error getting history:', err)
    return []
  }
}

/**
 * Clear session history
 * @returns true if successful
 */
export async function clearSessionHistory(): Promise<boolean> {
  try {
    const data = await getFocusSessionsData()
    if (!data) return false

    data.history = []
    await saveFocusSessionsData(data)
    return true
  } catch (err) {
    console.error('[FocusSessions] Error clearing history:', err)
    return false
  }
}
