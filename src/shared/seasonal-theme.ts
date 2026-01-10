/**
 * Seasonal Theme System for Focusan
 * Automatically adjusts color scheme based on Japanese seasons
 */

export enum Season {
  SPRING = 'spring',   // 春 (haru) - March 20 to June 20
  SUMMER = 'summer',   // 夏 (natsu) - June 21 to September 22
  AUTUMN = 'autumn',   // 秋 (aki) - September 23 to December 20
  WINTER = 'winter',   // 冬 (fuyu) - December 21 to March 19
}

export interface SeasonalColors {
  name: string
  emoji: string
  accent: string
  accentLight: string
  background: string
  description: string
}

export const SEASONAL_THEMES: Record<Season, SeasonalColors> = {
  [Season.SPRING]: {
    name: '春 (Haru)',
    emoji: '🌸',
    accent: '#ffb7c5',        // Sakura pink
    accentLight: '#ffd6e0',   // Lighter sakura
    background: '#fff5f7',    // Very light pink
    description: 'Cherry blossom season - renewal and hope',
  },
  [Season.SUMMER]: {
    name: '夏 (Natsu)',
    emoji: '🌿',
    accent: '#00a381',        // Fresh green (midori)
    accentLight: '#66d9b4',   // Lighter green
    background: '#f0fdf7',    // Very light green
    description: 'Vibrant green summer - energy and growth',
  },
  [Season.AUTUMN]: {
    name: '秋 (Aki)',
    emoji: '🍁',
    accent: '#d66a4c',        // Maple red (momiji)
    accentLight: '#e89b7d',   // Lighter maple
    background: '#fff6f0',    // Warm cream
    description: 'Autumn leaves - reflection and harvest',
  },
  [Season.WINTER]: {
    name: '冬 (Fuyu)',
    emoji: '❄️',
    accent: '#5a79a5',        // Winter blue
    accentLight: '#8fa7c6',   // Lighter winter blue
    background: '#f5f8fc',    // Cool white
    description: 'Winter calm - clarity and inner peace',
  },
}

/**
 * Get current season based on date
 * Uses meteorological seasons aligned with Japanese traditional seasons
 */
export function getCurrentSeason(): Season {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-12
  const day = now.getDate()

  // Spring: March 20 - June 20
  if (month === 3 && day >= 20) return Season.SPRING
  if (month >= 4 && month <= 5) return Season.SPRING
  if (month === 6 && day <= 20) return Season.SPRING

  // Summer: June 21 - September 22
  if (month === 6 && day >= 21) return Season.SUMMER
  if (month >= 7 && month <= 8) return Season.SUMMER
  if (month === 9 && day <= 22) return Season.SUMMER

  // Autumn: September 23 - December 20
  if (month === 9 && day >= 23) return Season.AUTUMN
  if (month >= 10 && month <= 11) return Season.AUTUMN
  if (month === 12 && day <= 20) return Season.AUTUMN

  // Winter: December 21 - March 19
  return Season.WINTER
}

/**
 * Get seasonal theme colors
 */
export function getSeasonalTheme(): SeasonalColors {
  const season = getCurrentSeason()
  return SEASONAL_THEMES[season]
}

/**
 * Apply seasonal theme to document
 * Sets CSS custom properties for seasonal colors
 */
export function applySeasonalTheme(): void {
  const theme = getSeasonalTheme()
  const root = document.documentElement

  // Set seasonal CSS variables
  root.style.setProperty('--season-accent', theme.accent)
  root.style.setProperty('--season-accent-light', theme.accentLight)
  root.style.setProperty('--season-bg', theme.background)
  root.setAttribute('data-season', getCurrentSeason())

  console.log(`[Seasonal Theme] Applied ${theme.name} ${theme.emoji} - ${theme.description}`)
}

/**
 * Get seasonal message for current season
 */
export function getSeasonalMessage(): string {
  const messages: Record<Season, string[]> = {
    [Season.SPRING]: [
      'Spring brings new beginnings. Focus on growth.',
      'Like cherry blossoms, let your focus bloom.',
      'Renewal season - time to cultivate new habits.',
    ],
    [Season.SUMMER]: [
      'Summer energy - channel it into productive focus.',
      'Vibrant and alive - stay present in this moment.',
      'Growth season - nurture your concentration.',
    ],
    [Season.AUTUMN]: [
      'Autumn reflection - harvest the fruits of your focus.',
      'Like falling leaves, let distractions go.',
      'Season of change - adapt with mindful awareness.',
    ],
    [Season.WINTER]: [
      'Winter stillness - find clarity in quiet focus.',
      'Like snow, let your mind settle and become pure.',
      'Inner peace season - cultivate deep concentration.',
    ],
  }

  const season = getCurrentSeason()
  const seasonMessages = messages[season]
  return seasonMessages[Math.floor(Math.random() * seasonMessages.length)]
}

/**
 * Check if seasonal themes are enabled (from settings)
 */
export async function isSeasonalThemeEnabled(): Promise<boolean> {
  try {
    const result = await chrome.storage.sync.get('seasonalThemeEnabled')
    return result.seasonalThemeEnabled !== false // Default to true
  } catch {
    return true
  }
}

/**
 * Toggle seasonal theme setting
 */
export async function setSeasonalThemeEnabled(enabled: boolean): Promise<void> {
  await chrome.storage.sync.set({ seasonalThemeEnabled: enabled })
  if (enabled) {
    applySeasonalTheme()
  } else {
    // Reset to default theme
    document.documentElement.removeAttribute('data-season')
  }
}

/**
 * Initialize seasonal theme on page load
 */
export async function initializeSeasonalTheme(): Promise<void> {
  const enabled = await isSeasonalThemeEnabled()
  if (enabled) {
    applySeasonalTheme()
  }
}
