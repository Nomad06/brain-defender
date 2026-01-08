/**
 * Schedule system for time-based site blocking
 * Supports multiple blocking modes: always, work hours, weekends, custom, per-day, vacation
 */

import { z } from 'zod'

// Schedule modes enum
export enum ScheduleMode {
  ALWAYS = 'always',
  WORK_HOURS = 'workHours',
  WEEKENDS = 'weekends',
  CUSTOM = 'custom',
  PER_DAY = 'perDay',
  VACATION = 'vacation',
}

// Zod schemas for runtime validation
export const TimeRangeSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  end: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
})

export const DayScheduleSchema = z.object({
  mode: z.nativeEnum(ScheduleMode),
  timeRange: TimeRangeSchema.optional(),
})

export const ScheduleSchema = z.object({
  mode: z.nativeEnum(ScheduleMode),
  workHours: TimeRangeSchema.optional(),
  customDays: z.array(z.number().min(0).max(6)).optional(),
  customTime: TimeRangeSchema.optional(),
  perDay: z.record(z.string(), DayScheduleSchema).optional(),
  vacationUntil: z.number().nullable().optional(),
})

// Type exports
export type TimeRange = z.infer<typeof TimeRangeSchema>
export type DaySchedule = z.infer<typeof DayScheduleSchema>
export type Schedule = z.infer<typeof ScheduleSchema>

/**
 * Check if blocking is active according to schedule
 * @param schedule - Schedule configuration
 * @returns true if site should be blocked right now
 */
export function isScheduleActive(schedule: Schedule | null | undefined): boolean {
  if (!schedule || !schedule.mode) {
    return true // Default: always block
  }

  const now = new Date()
  const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, ...
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTime = currentHour * 60 + currentMinute // minutes since start of day

  switch (schedule.mode) {
    case ScheduleMode.ALWAYS:
      return true

    case ScheduleMode.VACATION:
      // Vacation mode - all blocks disabled
      // TODO: Check vacationUntil timestamp if set
      return false

    case ScheduleMode.WORK_HOURS: {
      // Block on workdays (Monday-Friday) from 9:00 to 18:00
      const workStart = schedule.workHours?.start ? parseTime(schedule.workHours.start) : 9 * 60
      const workEnd = schedule.workHours?.end ? parseTime(schedule.workHours.end) : 18 * 60
      const isWorkDay = currentDay >= 1 && currentDay <= 5 // Mon-Fri
      return isWorkDay && currentTime >= workStart && currentTime < workEnd
    }

    case ScheduleMode.WEEKENDS:
      // Block only on weekends (Saturday and Sunday)
      return currentDay === 0 || currentDay === 6

    case ScheduleMode.CUSTOM: {
      // Custom schedule
      if (!schedule.customDays || !Array.isArray(schedule.customDays)) {
        return true // If not configured, block always
      }

      const customStart = schedule.customTime?.start ? parseTime(schedule.customTime.start) : 0
      const customEnd = schedule.customTime?.end ? parseTime(schedule.customTime.end) : 24 * 60

      // Check if current day is in the list
      const isCustomDay = schedule.customDays.includes(currentDay)
      const isCustomTime = currentTime >= customStart && currentTime < customEnd

      return isCustomDay && isCustomTime
    }

    case ScheduleMode.PER_DAY: {
      // Different schedules for different days of the week
      if (!schedule.perDay || !schedule.perDay[currentDay]) {
        return true // If not configured for this day, block always
      }

      const daySchedule = schedule.perDay[currentDay]
      if (daySchedule.mode === ScheduleMode.VACATION) {
        return false // Vacation for this day
      }

      if (daySchedule.mode === ScheduleMode.ALWAYS) {
        return true // Always block on this day
      }

      // Check time for this day
      if (daySchedule.timeRange) {
        const dayStart = parseTime(daySchedule.timeRange.start || '00:00')
        const dayEnd = parseTime(daySchedule.timeRange.end || '23:59')
        return currentTime >= dayStart && currentTime < dayEnd
      }

      return true // Default: block
    }

    default:
      return true
  }
}

/**
 * Parse time from string "HH:MM" to minutes since start of day
 * @param timeStr - Time string in HH:MM format
 * @returns Minutes since midnight, or 0 on error
 */
export function parseTime(timeStr: string | null | undefined): number {
  if (!timeStr || typeof timeStr !== 'string') {
    return 0
  }

  const parts = timeStr.split(':')
  if (parts.length !== 2) {
    return 0
  }

  const hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1], 10)

  if (isNaN(hours) || isNaN(minutes)) {
    return 0
  }

  return hours * 60 + minutes
}

/**
 * Format time from minutes to "HH:MM" string
 * @param minutes - Minutes since midnight
 * @returns Time string in HH:MM format
 */
export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

/**
 * Create default schedule configuration
 * @returns Default schedule (ALWAYS mode)
 */
export function createDefaultSchedule(): Schedule {
  return {
    mode: ScheduleMode.ALWAYS,
    workHours: {
      start: '09:00',
      end: '18:00',
    },
    customDays: [],
    customTime: {
      start: '09:00',
      end: '18:00',
    },
    perDay: undefined,
    vacationUntil: null,
  }
}

/**
 * Schedule templates for quick setup
 */
export type ScheduleTemplateName = 'workdays' | 'weekends' | 'perDayWork' | 'vacation'

/**
 * Create a schedule from a template
 * @param templateName - Name of the template
 * @returns Schedule configuration
 */
export function createScheduleTemplate(templateName: ScheduleTemplateName): Schedule {
  const templates: Record<ScheduleTemplateName, Schedule> = {
    workdays: {
      mode: ScheduleMode.WORK_HOURS,
      workHours: {
        start: '09:00',
        end: '18:00',
      },
    },
    weekends: {
      mode: ScheduleMode.WEEKENDS,
    },
    perDayWork: {
      mode: ScheduleMode.PER_DAY,
      perDay: {
        '1': { mode: ScheduleMode.ALWAYS, timeRange: { start: '09:00', end: '18:00' } }, // Monday
        '2': { mode: ScheduleMode.ALWAYS, timeRange: { start: '09:00', end: '18:00' } }, // Tuesday
        '3': { mode: ScheduleMode.ALWAYS, timeRange: { start: '09:00', end: '18:00' } }, // Wednesday
        '4': { mode: ScheduleMode.ALWAYS, timeRange: { start: '09:00', end: '18:00' } }, // Thursday
        '5': { mode: ScheduleMode.ALWAYS, timeRange: { start: '09:00', end: '18:00' } }, // Friday
        '6': { mode: ScheduleMode.VACATION }, // Saturday
        '0': { mode: ScheduleMode.VACATION }, // Sunday
      },
    },
    vacation: {
      mode: ScheduleMode.VACATION,
      vacationUntil: null,
    },
  }

  return templates[templateName] || createDefaultSchedule()
}

/**
 * Template metadata for UI display
 */
export interface ScheduleTemplateInfo {
  name: string
  description: string
}

/**
 * Get available schedule templates with metadata
 * @returns Object with template names as keys and metadata as values
 */
export function getScheduleTemplates(): Record<ScheduleTemplateName, ScheduleTemplateInfo> {
  return {
    workdays: {
      name: 'Рабочие дни',
      description: 'Блокировка в рабочие дни с 9:00 до 18:00',
    },
    weekends: {
      name: 'Выходные',
      description: 'Блокировка только в выходные дни',
    },
    perDayWork: {
      name: 'Рабочая неделя',
      description: 'Блокировка в будни с 9:00 до 18:00, свободные выходные',
    },
    vacation: {
      name: 'Каникулы',
      description: 'Все блокировки отключены',
    },
  }
}

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate schedule configuration
 * @param schedule - Schedule to validate
 * @returns Validation result with error message if invalid
 */
export function validateSchedule(schedule: unknown): ValidationResult {
  if (!schedule || typeof schedule !== 'object') {
    return { valid: false, error: 'Schedule must be an object' }
  }

  // Use Zod schema validation
  const result = ScheduleSchema.safeParse(schedule)
  if (!result.success) {
    return { valid: false, error: result.error.issues[0]?.message || 'Invalid schedule format' }
  }

  const validSchedule = result.data

  // Additional validation logic
  if (validSchedule.mode === ScheduleMode.WORK_HOURS && validSchedule.workHours) {
    const start = parseTime(validSchedule.workHours.start)
    const end = parseTime(validSchedule.workHours.end)
    if (start >= end) {
      return { valid: false, error: 'Work hours: start time must be before end time' }
    }
  }

  if (validSchedule.mode === ScheduleMode.CUSTOM) {
    if (!Array.isArray(validSchedule.customDays) || validSchedule.customDays.length === 0) {
      return { valid: false, error: 'Custom mode requires at least one day selected' }
    }
    if (validSchedule.customTime) {
      const start = parseTime(validSchedule.customTime.start)
      const end = parseTime(validSchedule.customTime.end)
      if (start >= end) {
        return { valid: false, error: 'Custom time: start time must be before end time' }
      }
    }
  }

  return { valid: true }
}

/**
 * Get human-readable description of schedule
 * @param schedule - Schedule configuration
 * @returns Human-readable description in Russian
 */
export function getScheduleDescription(schedule: Schedule): string {
  switch (schedule.mode) {
    case ScheduleMode.ALWAYS:
      return 'Всегда'
    case ScheduleMode.VACATION:
      return 'Каникулы (не блокируется)'
    case ScheduleMode.WORK_HOURS:
      return `Рабочие часы (${schedule.workHours?.start || '09:00'} - ${schedule.workHours?.end || '18:00'})`
    case ScheduleMode.WEEKENDS:
      return 'Только выходные'
    case ScheduleMode.CUSTOM:
      return 'Пользовательское расписание'
    case ScheduleMode.PER_DAY:
      return 'Расписание по дням недели'
    default:
      return 'Неизвестно'
  }
}
