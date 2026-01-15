/**
 * Strictness Calculation Module
 *
 * Compares the "strictness" of schedules and conditional rules to determine
 * if updating them makes protection weaker (requiring challenge) or stronger (no challenge).
 *
 * Key principle: A site with NO schedule and NO rules is ALWAYS blocked (maximum strictness).
 * Adding any schedule or rules actually makes it LESS strict by allowing some access.
 */

import type { Schedule } from './schedule'
import type { ConditionalRule } from './conditional-rules'

/**
 * Maximum strictness score for schedules.
 * Represents 24/7 blocking (168 hours per week × 60 = 10,080 points).
 */
const MAX_SCHEDULE_STRICTNESS = 10080

/**
 * Calculates strictness score for a schedule.
 * Higher score = more strict (more blocking).
 *
 * Scoring logic:
 * - null (no schedule) = MAX (always blocked)
 * - ALWAYS = MAX (explicitly always blocked)
 * - VACATION = 0 (not blocked at all)
 * - Other modes = hours blocked per week × 60
 *
 * @param schedule - The schedule to evaluate (null means always blocked)
 * @returns Strictness score (0 to MAX_SCHEDULE_STRICTNESS)
 */
export function calculateScheduleStrictness(schedule: Schedule | null): number {
  // No schedule means ALWAYS blocked (maximum strictness)
  if (schedule === null) {
    return MAX_SCHEDULE_STRICTNESS
  }

  switch (schedule.mode) {
    case 'always':
      // Explicitly always blocked
      return MAX_SCHEDULE_STRICTNESS

    case 'vacation':
      // Vacation mode = not blocked (minimum strictness)
      return 0

    case 'workHours': {
      // Work hours: Monday-Friday, specified time range
      if (!schedule.workHours) return 0
      const hoursPerDay = calculateTimeRangeHours(schedule.workHours)
      return hoursPerDay * 5 * 60 // 5 work days
    }

    case 'weekends': {
      // Weekends: Saturday-Sunday, all day
      return 48 * 60 // 48 hours (2 days × 24 hours)
    }

    case 'custom': {
      // Custom days and time range
      if (!schedule.customDays || !schedule.customTime) return 0
      const hoursPerDay = calculateTimeRangeHours(schedule.customTime)
      const numDays = schedule.customDays.length
      return hoursPerDay * numDays * 60
    }

    case 'perDay': {
      // Per-day schedule with individual time ranges
      if (!schedule.perDay) return 0
      let totalMinutes = 0

      for (const daySchedule of Object.values(schedule.perDay)) {
        // A day is blocking if mode is 'always' or has a timeRange
        if (daySchedule.mode === 'always') {
          totalMinutes += 24 * 60 // Full day
        } else if (daySchedule.mode !== 'vacation' && daySchedule.timeRange) {
          const hours = calculateTimeRangeHours(daySchedule.timeRange)
          totalMinutes += hours * 60
        }
        // 'vacation' mode for a day contributes 0 minutes
      }

      return totalMinutes
    }

    default:
      return 0
  }
}

/**
 * Calculates the number of hours in a time range.
 * Handles ranges that cross midnight (e.g., 22:00 to 02:00).
 *
 * @param timeRange - Time range with start and end in "HH:MM" format
 * @returns Number of hours (can be fractional, e.g., 1.5 for 90 minutes)
 */
function calculateTimeRangeHours(timeRange: { start: string; end: string }): number {
  const [startHour, startMin] = timeRange.start.split(':').map(Number)
  const [endHour, endMin] = timeRange.end.split(':').map(Number)

  const startMinutes = startHour * 60 + startMin
  let endMinutes = endHour * 60 + endMin

  // Handle crossing midnight
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60
  }

  const totalMinutes = endMinutes - startMinutes
  return totalMinutes / 60
}

/**
 * Calculates strictness score for conditional rules.
 * Higher score = more strict (more restrictive limits).
 *
 * Scoring logic for each enabled rule:
 * - VISITS_PER_DAY: max(0, 1000 - (maxVisits × 100))
 *   Lower visit limits = higher scores
 *   Examples: 1 visit = 900, 5 visits = 500, 10+ visits = 0
 *
 * - TIME_LIMIT: max(0, 2000 - (maxTimeMinutes × 10))
 *   Lower time limits = higher scores
 *   Examples: 10 min = 1900, 60 min = 1400, 200+ min = 0
 *
 * Empty rules array (or all disabled) = 0 (not strict at all when no schedule exists)
 *
 * @param rules - Array of conditional rules
 * @returns Strictness score (0 to ~3000 for typical configurations)
 */
export function calculateRulesStrictness(rules: ConditionalRule[] | null | undefined): number {
  if (!rules || rules.length === 0) {
    return 0
  }

  let totalScore = 0

  for (const rule of rules) {
    if (!rule.enabled) {
      continue
    }

    switch (rule.type) {
      case 'visitsPerDay': {
        const maxVisits = rule.maxVisits ?? 10
        // Lower visit limit = higher strictness
        // Score formula: 1000 - (visits × 100), clamped to 0 minimum
        const score = Math.max(0, 1000 - (maxVisits * 100))
        totalScore += score
        break
      }

      case 'timeLimit': {
        const maxTimeMinutes = rule.maxTimeMinutes ?? 200
        // Lower time limit = higher strictness
        // Score formula: 2000 - (minutes × 10), clamped to 0 minimum
        const score = Math.max(0, 2000 - (maxTimeMinutes * 10))
        totalScore += score
        break
      }
    }
  }

  return totalScore
}

/**
 * Calculates combined strictness for a site's complete blocking configuration.
 *
 * Key insight:
 * - A site with NO schedule and NO rules is ALWAYS blocked (maximum strictness)
 * - Adding schedule OR rules makes it less strict by allowing some access
 * - The overall strictness is the MAX of schedule or rules strictness
 *
 * @param schedule - The site's schedule (null = always blocked)
 * @param rules - The site's conditional rules
 * @returns Combined strictness score
 */
export function calculateCombinedStrictness(
  schedule: Schedule | null,
  rules: ConditionalRule[] | null | undefined
): number {
  const scheduleScore = calculateScheduleStrictness(schedule)
  const rulesScore = calculateRulesStrictness(rules)

  // If schedule is null (always blocked), that's maximum strictness
  // Rules don't matter in this case
  if (schedule === null) {
    return MAX_SCHEDULE_STRICTNESS
  }

  // If schedule is set, we're already less strict than always-blocked
  // The schedule score represents when it's blocked
  // Rules can add additional conditions, but don't make it MORE strict than the schedule
  // They work within the schedule's blocking periods

  // For now, we use schedule as primary strictness measure
  // Rules are secondary (they apply within the scheduled blocking time)
  return scheduleScore + (rulesScore * 0.1) // Rules contribute 10% weight
}

/**
 * Compares two strictness scores to determine if change requires challenge.
 *
 * @param oldScore - Previous strictness score
 * @param newScore - New strictness score
 * @returns Comparison result
 */
export type StrictnessComparison = 'stricter' | 'same' | 'less-strict'

export function compareStrictness(
  oldScore: number,
  newScore: number
): StrictnessComparison {
  // Add 5% tolerance to avoid triggering challenge on negligible changes
  const tolerance = oldScore * 0.05

  if (newScore >= oldScore - tolerance) {
    // New is same or stricter (equal or higher score)
    return newScore > oldScore + tolerance ? 'stricter' : 'same'
  } else {
    // New is less strict (lower score)
    return 'less-strict'
  }
}

/**
 * Determines if a challenge should be shown for a schedule update.
 * Challenge is required when making protection weaker.
 *
 * @param oldSchedule - Current schedule
 * @param newSchedule - New schedule to apply
 * @returns true if challenge should be shown
 */
export function shouldShowChallengeForSchedule(
  oldSchedule: Schedule | null,
  newSchedule: Schedule | null
): boolean {
  const oldStrictness = calculateScheduleStrictness(oldSchedule)
  const newStrictness = calculateScheduleStrictness(newSchedule)
  const comparison = compareStrictness(oldStrictness, newStrictness)

  return comparison === 'less-strict'
}

/**
 * Determines if a challenge should be shown for conditional rules update.
 * Challenge is required when making protection weaker.
 *
 * @param oldRules - Current conditional rules
 * @param newRules - New conditional rules to apply
 * @returns true if challenge should be shown
 */
export function shouldShowChallengeForRules(
  oldRules: ConditionalRule[] | null | undefined,
  newRules: ConditionalRule[] | null | undefined
): boolean {
  const oldStrictness = calculateRulesStrictness(oldRules)
  const newStrictness = calculateRulesStrictness(newRules)
  const comparison = compareStrictness(oldStrictness, newStrictness)

  return comparison === 'less-strict'
}

/**
 * Generates a human-readable explanation of strictness scores for debugging.
 */
export function explainStrictnessChange(
  oldScore: number,
  newScore: number,
  type: 'schedule' | 'rules'
): string {
  const comparison = compareStrictness(oldScore, newScore)
  const diff = newScore - oldScore
  const percentChange = oldScore > 0 ? ((diff / oldScore) * 100).toFixed(1) : 'N/A'

  let message = `${type === 'schedule' ? 'Schedule' : 'Rules'} strictness change:\n`
  message += `  Old: ${oldScore.toFixed(0)} points\n`
  message += `  New: ${newScore.toFixed(0)} points\n`
  message += `  Change: ${diff > 0 ? '+' : ''}${diff.toFixed(0)} (${percentChange}%)\n`
  message += `  Result: ${comparison}`

  return message
}
