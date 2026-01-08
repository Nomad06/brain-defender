/**
 * Messaging client for UI components
 * Provides type-safe RPC-style communication with background service worker
 */

import browser from 'webextension-polyfill'
import {
  MessageType,
  type Message,
  type MessageResponse,
  type Response,
  isErrorResponse,
} from './contracts'
import type { SiteObject } from '../storage/schemas'

/**
 * Send a message to the background service worker
 *
 * @param message - Typed message to send
 * @returns Response from background or throws error
 */
async function sendMessage<T extends MessageType>(
  message: Message & { type: T }
): Promise<MessageResponse<T>> {
  try {
    const response = (await browser.runtime.sendMessage(message)) as Response<MessageResponse<T>>

    if (isErrorResponse(response)) {
      throw new Error(response.error)
    }

    return response
  } catch (err) {
    console.error('[Messaging] Error sending message:', message.type, err)
    throw err
  }
}

/**
 * Messaging client API
 * Provides convenient methods for all message types
 */
export const messagingClient = {
  /**
   * Request background to rebuild DNR rules
   */
  async rebuildRules(): Promise<boolean> {
    const response = await sendMessage({
      type: MessageType.REBUILD_RULES,
    })
    return response.success
  },

  /**
   * Add a new site to block list
   */
  async addSite(
    host: string,
    options?: {
      category?: string | null
      schedule?: unknown
      conditionalRules?: unknown[]
    }
  ): Promise<boolean> {
    const response = await sendMessage({
      type: MessageType.ADD_SITE,
      host,
      category: options?.category,
      schedule: options?.schedule,
      conditionalRules: options?.conditionalRules,
    })
    return response.success
  },

  /**
   * Remove a site from block list
   */
  async removeSite(host: string): Promise<boolean> {
    const response = await sendMessage({
      type: MessageType.REMOVE_SITE,
      host,
    })
    return response.success
  },

  /**
   * Update a site's configuration
   */
  async updateSite(
    host: string,
    updates: Partial<Omit<SiteObject, 'host' | 'addedAt'>>
  ): Promise<boolean> {
    const response = await sendMessage({
      type: MessageType.UPDATE_SITE,
      host,
      updates,
    })
    return response.success
  },

  /**
   * Get all blocked sites
   */
  async getSites(): Promise<SiteObject[]> {
    const response = await sendMessage({
      type: MessageType.GET_SITES,
    })
    return response.sites
  },

  /**
   * Start a focus session
   */
  async startFocusSession(duration?: number, sites?: string[]): Promise<boolean> {
    const response = await sendMessage({
      type: MessageType.START_FOCUS_SESSION,
      duration,
      sites,
    })
    return response.success
  },

  /**
   * Stop the current focus session
   */
  async stopFocusSession(): Promise<boolean> {
    const response = await sendMessage({
      type: MessageType.STOP_FOCUS_SESSION,
    })
    return response.success
  },

  /**
   * Pause the current focus session
   */
  async pauseFocusSession(): Promise<boolean> {
    const response = await sendMessage({
      type: MessageType.PAUSE_FOCUS_SESSION,
    })
    return response.success
  },

  /**
   * Resume a paused focus session
   */
  async resumeFocusSession(): Promise<boolean> {
    const response = await sendMessage({
      type: MessageType.RESUME_FOCUS_SESSION,
    })
    return response.success
  },

  /**
   * Get current focus session
   */
  async getCurrentSession() {
    const response = await sendMessage({
      type: MessageType.GET_CURRENT_SESSION,
    })
    return response.session
  },

  /**
   * Add a site to temporary whitelist
   */
  async addTempWhitelist(host: string, durationMs: number, reason?: string): Promise<boolean> {
    const response = await sendMessage({
      type: MessageType.ADD_TEMP_WHITELIST,
      host,
      durationMs,
      reason,
    })
    return response.success
  },

  /**
   * Remove a site from temporary whitelist
   */
  async removeTempWhitelist(host: string): Promise<boolean> {
    const response = await sendMessage({
      type: MessageType.REMOVE_TEMP_WHITELIST,
      host,
    })
    return response.success
  },

  /**
   * Get temporary whitelist
   */
  async getTempWhitelist() {
    const response = await sendMessage({
      type: MessageType.GET_TEMP_WHITELIST,
    })
    return response.whitelist
  },

  /**
   * Record a block attempt
   */
  async recordBlock(host: string): Promise<boolean> {
    const response = await sendMessage({
      type: MessageType.RECORD_BLOCK,
      host,
    })
    return response.success
  },

  /**
   * Get statistics
   */
  async getStats() {
    const response = await sendMessage({
      type: MessageType.GET_STATS,
    })
    return response.stats
  },

  /**
   * Clear all statistics
   */
  async clearStats(): Promise<boolean> {
    const response = await sendMessage({
      type: MessageType.CLEAR_STATS,
    })
    return response.success
  },

  /**
   * Check achievements
   */
  async checkAchievements(siteHost?: string) {
    const response = await sendMessage({
      type: MessageType.CHECK_ACHIEVEMENTS,
      siteHost,
    })
    return response.newAchievements
  },

  /**
   * Get achievements
   */
  async getAchievements() {
    const response = await sendMessage({
      type: MessageType.GET_ACHIEVEMENTS,
    })
    return response.achievements
  },

  /**
   * Export all data
   */
  async exportData(): Promise<string> {
    const response = await sendMessage({
      type: MessageType.EXPORT_DATA,
    })
    return response.data
  },

  /**
   * Import data from JSON string
   */
  async importData(jsonString: string): Promise<boolean> {
    const response = await sendMessage({
      type: MessageType.IMPORT_DATA,
      jsonString,
    })
    return response.success
  },

  /**
   * Get migration status
   */
  async getMigrationStatus() {
    const response = await sendMessage({
      type: MessageType.GET_MIGRATION_STATUS,
    })
    return response
  },

  /**
   * Run pending migrations
   */
  async runMigrations() {
    const response = await sendMessage({
      type: MessageType.RUN_MIGRATIONS,
    })
    return response.result
  },
}

/**
 * Default export for convenience
 */
export default messagingClient
