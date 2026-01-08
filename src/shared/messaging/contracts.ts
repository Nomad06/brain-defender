/**
 * Typed messaging contracts for Brain Defender
 * Defines all message types for communication between UI and background
 */

import type { SiteObject } from '../storage/schemas'
import type { Stats } from '../domain/stats'
import type { FocusSession } from '../domain/focus-sessions'

/**
 * Message types enum
 */
export enum MessageType {
  // DNR Rules Management
  REBUILD_RULES = 'REBUILD_RULES',

  // Site Management
  ADD_SITE = 'ADD_SITE',
  REMOVE_SITE = 'REMOVE_SITE',
  UPDATE_SITE = 'UPDATE_SITE',
  GET_SITES = 'GET_SITES',

  // Focus Sessions
  START_FOCUS_SESSION = 'START_FOCUS_SESSION',
  STOP_FOCUS_SESSION = 'STOP_FOCUS_SESSION',
  PAUSE_FOCUS_SESSION = 'PAUSE_FOCUS_SESSION',
  RESUME_FOCUS_SESSION = 'RESUME_FOCUS_SESSION',
  GET_CURRENT_SESSION = 'GET_CURRENT_SESSION',

  // Temporary Whitelist
  ADD_TEMP_WHITELIST = 'ADD_TEMP_WHITELIST',
  REMOVE_TEMP_WHITELIST = 'REMOVE_TEMP_WHITELIST',
  GET_TEMP_WHITELIST = 'GET_TEMP_WHITELIST',

  // Statistics
  RECORD_BLOCK = 'RECORD_BLOCK',
  GET_STATS = 'GET_STATS',
  CLEAR_STATS = 'CLEAR_STATS',

  // Achievements
  CHECK_ACHIEVEMENTS = 'CHECK_ACHIEVEMENTS',
  GET_ACHIEVEMENTS = 'GET_ACHIEVEMENTS',

  // Data Management
  EXPORT_DATA = 'EXPORT_DATA',
  IMPORT_DATA = 'IMPORT_DATA',

  // System
  GET_MIGRATION_STATUS = 'GET_MIGRATION_STATUS',
  RUN_MIGRATIONS = 'RUN_MIGRATIONS',
}

/**
 * Base message structure
 */
export interface BaseMessage {
  type: MessageType
  timestamp?: number
}

/**
 * Message with no payload
 */
export interface SimpleMessage extends BaseMessage {
  type:
    | MessageType.REBUILD_RULES
    | MessageType.GET_SITES
    | MessageType.STOP_FOCUS_SESSION
    | MessageType.PAUSE_FOCUS_SESSION
    | MessageType.RESUME_FOCUS_SESSION
    | MessageType.GET_CURRENT_SESSION
    | MessageType.GET_TEMP_WHITELIST
    | MessageType.GET_STATS
    | MessageType.CLEAR_STATS
    | MessageType.GET_ACHIEVEMENTS
    | MessageType.EXPORT_DATA
    | MessageType.GET_MIGRATION_STATUS
    | MessageType.RUN_MIGRATIONS
}

/**
 * Add site message
 */
export interface AddSiteMessage extends BaseMessage {
  type: MessageType.ADD_SITE
  host: string
  category?: string | null
  schedule?: unknown
  conditionalRules?: unknown[]
}

/**
 * Remove site message
 */
export interface RemoveSiteMessage extends BaseMessage {
  type: MessageType.REMOVE_SITE
  host: string
}

/**
 * Update site message
 */
export interface UpdateSiteMessage extends BaseMessage {
  type: MessageType.UPDATE_SITE
  host: string
  updates: Partial<Omit<SiteObject, 'host' | 'addedAt'>>
}

/**
 * Start focus session message
 */
export interface StartFocusSessionMessage extends BaseMessage {
  type: MessageType.START_FOCUS_SESSION
  duration?: number // minutes
  sites?: string[] // additional sites to block
}

/**
 * Add temporary whitelist message
 */
export interface AddTempWhitelistMessage extends BaseMessage {
  type: MessageType.ADD_TEMP_WHITELIST
  host: string
  durationMs: number
  reason?: string
}

/**
 * Remove temporary whitelist message
 */
export interface RemoveTempWhitelistMessage extends BaseMessage {
  type: MessageType.REMOVE_TEMP_WHITELIST
  host: string
}

/**
 * Record block message
 */
export interface RecordBlockMessage extends BaseMessage {
  type: MessageType.RECORD_BLOCK
  host: string
}

/**
 * Check achievements message
 */
export interface CheckAchievementsMessage extends BaseMessage {
  type: MessageType.CHECK_ACHIEVEMENTS
  siteHost?: string
}

/**
 * Import data message
 */
export interface ImportDataMessage extends BaseMessage {
  type: MessageType.IMPORT_DATA
  jsonString: string
}

/**
 * Union of all possible messages
 */
export type Message =
  | SimpleMessage
  | AddSiteMessage
  | RemoveSiteMessage
  | UpdateSiteMessage
  | StartFocusSessionMessage
  | AddTempWhitelistMessage
  | RemoveTempWhitelistMessage
  | RecordBlockMessage
  | CheckAchievementsMessage
  | ImportDataMessage

/**
 * Response types for each message
 */
export interface MessageResponses {
  [MessageType.REBUILD_RULES]: { success: boolean }
  [MessageType.ADD_SITE]: { success: boolean }
  [MessageType.REMOVE_SITE]: { success: boolean }
  [MessageType.UPDATE_SITE]: { success: boolean }
  [MessageType.GET_SITES]: { sites: SiteObject[] }
  [MessageType.START_FOCUS_SESSION]: { success: boolean }
  [MessageType.STOP_FOCUS_SESSION]: { success: boolean }
  [MessageType.PAUSE_FOCUS_SESSION]: { success: boolean }
  [MessageType.RESUME_FOCUS_SESSION]: { success: boolean }
  [MessageType.GET_CURRENT_SESSION]: { session: FocusSession | null }
  [MessageType.ADD_TEMP_WHITELIST]: { success: boolean }
  [MessageType.REMOVE_TEMP_WHITELIST]: { success: boolean }
  [MessageType.GET_TEMP_WHITELIST]: { whitelist: Array<{ host: string; until: number }> }
  [MessageType.RECORD_BLOCK]: { success: boolean }
  [MessageType.GET_STATS]: { stats: Stats | null }
  [MessageType.CLEAR_STATS]: { success: boolean }
  [MessageType.CHECK_ACHIEVEMENTS]: { newAchievements: unknown[] }
  [MessageType.GET_ACHIEVEMENTS]: { achievements: unknown }
  [MessageType.EXPORT_DATA]: { data: string }
  [MessageType.IMPORT_DATA]: { success: boolean }
  [MessageType.GET_MIGRATION_STATUS]: { version: number; needsMigration: boolean }
  [MessageType.RUN_MIGRATIONS]: { result: unknown }
}

/**
 * Get response type for a specific message type
 */
export type MessageResponse<T extends MessageType> = MessageResponses[T]

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: string
  code?: string
  details?: unknown
}

/**
 * Success response wrapper
 */
export type Response<T> = T | ErrorResponse

/**
 * Type guard for error responses
 */
export function isErrorResponse(response: unknown): response is ErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as ErrorResponse).error === 'string'
  )
}

/**
 * Create an error response
 */
export function createErrorResponse(error: string, code?: string, details?: unknown): ErrorResponse {
  return { error, code, details }
}

/**
 * Create a success response
 */
export function createSuccessResponse(): { success: boolean } {
  return { success: true }
}
