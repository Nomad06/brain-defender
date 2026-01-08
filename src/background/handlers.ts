/**
 * Message handlers for background service worker
 * Processes messages from UI components and coordinates responses
 */

import browser from 'webextension-polyfill'
import {
  MessageType,
  type Message,
  type MessageResponse,
  createErrorResponse,
  createSuccessResponse,
} from '../shared/messaging/contracts'
import {
  getSites,
  addSite as storageAddSite,
  removeSite as storageRemoveSite,
  updateSite as storageUpdateSite,
  getTempWhitelist,
  addTempWhitelist as storageAddTempWhitelist,
  removeTempWhitelist as storageRemoveTempWhitelist,
  exportAllData,
  importAllData,
} from '../shared/storage/storage'
import { rebuildRules } from './dnr-manager'
import { recordVisitAttempt, recordBlock, getStats, clearStats } from '../shared/domain/stats'
import {
  startFocusSession,
  stopFocusSession,
  pauseFocusSession,
  resumeFocusSession,
  getCurrentSession,
} from '../shared/domain/focus-sessions'
import { checkAchievements, getAchievements } from '../shared/domain/achievements'
import { runMigrations, getMigrationVersion, needsMigration } from '../shared/storage/migrations'

/**
 * Handle incoming messages from UI components
 *
 * @param message - Incoming message
 * @returns Response for the message type
 */
export async function handleMessage(message: Message): Promise<unknown> {
  try {
    console.log('[Handlers] Received message:', message.type)

    switch (message.type) {
      // ========================================
      // DNR Rules Management
      // ========================================
      case MessageType.REBUILD_RULES:
        return await handleRebuildRules()

      // ========================================
      // Site Management
      // ========================================
      case MessageType.ADD_SITE:
        return await handleAddSite(
          message.host,
          message.category,
          message.schedule,
          message.conditionalRules
        )

      case MessageType.REMOVE_SITE:
        return await handleRemoveSite(message.host)

      case MessageType.UPDATE_SITE:
        return await handleUpdateSite(message.host, message.updates)

      case MessageType.GET_SITES:
        return await handleGetSites()

      // ========================================
      // Focus Sessions
      // ========================================
      case MessageType.START_FOCUS_SESSION:
        return await handleStartFocusSession(message.duration, message.sites)

      case MessageType.STOP_FOCUS_SESSION:
        return await handleStopFocusSession()

      case MessageType.PAUSE_FOCUS_SESSION:
        return await handlePauseFocusSession()

      case MessageType.RESUME_FOCUS_SESSION:
        return await handleResumeFocusSession()

      case MessageType.GET_CURRENT_SESSION:
        return await handleGetCurrentSession()

      // ========================================
      // Temporary Whitelist
      // ========================================
      case MessageType.ADD_TEMP_WHITELIST:
        return await handleAddTempWhitelist(message.host, message.durationMs, message.reason)

      case MessageType.REMOVE_TEMP_WHITELIST:
        return await handleRemoveTempWhitelist(message.host)

      case MessageType.GET_TEMP_WHITELIST:
        return await handleGetTempWhitelist()

      // ========================================
      // Statistics
      // ========================================
      case MessageType.RECORD_VISIT_ATTEMPT:
        return await handleRecordVisitAttempt(message.host)

      case MessageType.RECORD_BLOCK:
        return await handleRecordBlock(message.host)

      case MessageType.GET_STATS:
        return await handleGetStats()

      case MessageType.CLEAR_STATS:
        return await handleClearStats()

      // ========================================
      // Achievements
      // ========================================
      case MessageType.CHECK_ACHIEVEMENTS:
        return await handleCheckAchievements(message.siteHost)

      case MessageType.GET_ACHIEVEMENTS:
        return await handleGetAchievements()

      // ========================================
      // Data Management
      // ========================================
      case MessageType.EXPORT_DATA:
        return await handleExportData()

      case MessageType.IMPORT_DATA:
        return await handleImportData(message.jsonString)

      // ========================================
      // System
      // ========================================
      case MessageType.GET_MIGRATION_STATUS:
        return await handleGetMigrationStatus()

      case MessageType.RUN_MIGRATIONS:
        return await handleRunMigrations()

      default:
        console.error('[Handlers] Unknown message type:', message)
        return createErrorResponse('Unknown message type', 'UNKNOWN_MESSAGE_TYPE')
    }
  } catch (err) {
    console.error('[Handlers] Error handling message:', message.type, err)
    return createErrorResponse(
      err instanceof Error ? err.message : String(err),
      'HANDLER_ERROR',
      err
    )
  }
}

// ============================================
// Handler Implementations
// ============================================

async function handleRebuildRules(): Promise<MessageResponse<MessageType.REBUILD_RULES>> {
  const success = await rebuildRules()
  return { success }
}

async function handleAddSite(
  host: string,
  category?: string | null,
  schedule?: unknown,
  conditionalRules?: unknown[]
): Promise<MessageResponse<MessageType.ADD_SITE>> {
  await storageAddSite(host, {
    category: category || null,
    schedule: schedule || null,
    conditionalRules: conditionalRules || [],
  })

  // Rebuild DNR rules to apply new site
  await rebuildRules()

  return createSuccessResponse()
}

async function handleRemoveSite(host: string): Promise<MessageResponse<MessageType.REMOVE_SITE>> {
  await storageRemoveSite(host)

  // Rebuild DNR rules to remove site
  await rebuildRules()

  return createSuccessResponse()
}

async function handleUpdateSite(
  host: string,
  updates: unknown
): Promise<MessageResponse<MessageType.UPDATE_SITE>> {
  await storageUpdateSite(host, updates as Record<string, unknown>)

  // Rebuild DNR rules to apply updates
  await rebuildRules()

  return createSuccessResponse()
}

async function handleGetSites(): Promise<MessageResponse<MessageType.GET_SITES>> {
  const sites = await getSites()
  return { sites }
}

async function handleStartFocusSession(
  duration?: number,
  sites?: string[]
): Promise<MessageResponse<MessageType.START_FOCUS_SESSION>> {
  await startFocusSession(duration, sites)

  // Rebuild DNR rules to apply focus session
  await rebuildRules()

  return createSuccessResponse()
}

async function handleStopFocusSession(): Promise<
  MessageResponse<MessageType.STOP_FOCUS_SESSION>
> {
  await stopFocusSession()

  // Rebuild DNR rules to remove focus session
  await rebuildRules()

  return createSuccessResponse()
}

async function handlePauseFocusSession(): Promise<
  MessageResponse<MessageType.PAUSE_FOCUS_SESSION>
> {
  await pauseFocusSession()
  return createSuccessResponse()
}

async function handleResumeFocusSession(): Promise<
  MessageResponse<MessageType.RESUME_FOCUS_SESSION>
> {
  await resumeFocusSession()
  return createSuccessResponse()
}

async function handleGetCurrentSession(): Promise<
  MessageResponse<MessageType.GET_CURRENT_SESSION>
> {
  const session = await getCurrentSession()
  return { session }
}

async function handleAddTempWhitelist(
  host: string,
  durationMs: number,
  reason?: string
): Promise<MessageResponse<MessageType.ADD_TEMP_WHITELIST>> {
  await storageAddTempWhitelist(host, durationMs, reason)

  // Rebuild DNR rules to apply whitelist
  await rebuildRules()

  return createSuccessResponse()
}

async function handleRemoveTempWhitelist(
  host: string
): Promise<MessageResponse<MessageType.REMOVE_TEMP_WHITELIST>> {
  await storageRemoveTempWhitelist(host)

  // Rebuild DNR rules to remove whitelist
  await rebuildRules()

  return createSuccessResponse()
}

async function handleGetTempWhitelist(): Promise<
  MessageResponse<MessageType.GET_TEMP_WHITELIST>
> {
  const whitelist = await getTempWhitelist()
  return { whitelist }
}

async function handleRecordVisitAttempt(host: string): Promise<MessageResponse<MessageType.RECORD_VISIT_ATTEMPT>> {
  await recordVisitAttempt(host)
  return createSuccessResponse()
}

async function handleRecordBlock(host: string): Promise<MessageResponse<MessageType.RECORD_BLOCK>> {
  await recordBlock(host)

  // Rebuild DNR rules to account for conditional rules (e.g., visits per day)
  // This ensures that if a site has conditional blocking based on visit count,
  // the rules are updated after each visit
  await rebuildRules()

  // Check for achievements after recording block
  const stats = await getStats()
  if (stats) {
    const sites = await getSites()
    await checkAchievements(stats, sites, host)
  }

  return createSuccessResponse()
}

async function handleGetStats(): Promise<MessageResponse<MessageType.GET_STATS>> {
  const stats = await getStats()
  return { stats }
}

async function handleClearStats(): Promise<MessageResponse<MessageType.CLEAR_STATS>> {
  await clearStats()
  return createSuccessResponse()
}

async function handleCheckAchievements(
  siteHost?: string
): Promise<MessageResponse<MessageType.CHECK_ACHIEVEMENTS>> {
  const stats = await getStats()
  if (!stats) {
    return { newAchievements: [] }
  }
  const sites = await getSites()
  const newAchievements = await checkAchievements(stats, sites, siteHost || null)
  return { newAchievements }
}

async function handleGetAchievements(): Promise<MessageResponse<MessageType.GET_ACHIEVEMENTS>> {
  const achievements = await getAchievements()
  return { achievements }
}

async function handleExportData(): Promise<MessageResponse<MessageType.EXPORT_DATA>> {
  const data = await exportAllData()
  return { data }
}

async function handleImportData(
  jsonString: string
): Promise<MessageResponse<MessageType.IMPORT_DATA>> {
  await importAllData(jsonString)

  // Rebuild DNR rules after import
  await rebuildRules()

  return createSuccessResponse()
}

async function handleGetMigrationStatus(): Promise<
  MessageResponse<MessageType.GET_MIGRATION_STATUS>
> {
  const version = await getMigrationVersion()
  const needsMigrationCheck = await needsMigration()
  return {
    version,
    needsMigration: needsMigrationCheck,
  }
}

async function handleRunMigrations(): Promise<MessageResponse<MessageType.RUN_MIGRATIONS>> {
  const result = await runMigrations()

  // Rebuild DNR rules after migrations
  await rebuildRules()

  return { result }
}

/**
 * Initialize message listener
 * Called by service worker on startup
 */
export function initializeMessageHandlers(): void {
  browser.runtime.onMessage.addListener((message: unknown) => {
    return handleMessage(message as Message)
  })

  console.log('[Handlers] Message handlers initialized')
}
