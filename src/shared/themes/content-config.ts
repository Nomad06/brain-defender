/**
 * Theme Content Configuration System
 * Defines what motivational content each theme displays on blocked pages
 */

import type { Haiku } from '../haiku'
import { getRandomHaiku, getRandomSamuraiQuote } from '../haiku'
import { getRandomBlockedPhrase, getCurrentLanguage } from '../i18n'
import { getRandomCaucasusWisdom, getRandomPhrase } from '../caucasus-wisdom'

export type ExerciseType = 'zen' | 'breath' | 'eye' | 'stretch' | 'mountain'

/**
 * Unified motivational content structure
 * Each theme decides which fields to populate
 */
export interface MotivationalContent {
  // Primary message (one of these will be set based on theme config)
  haiku?: Haiku
  quote?: string
  phrase?: string
  seasonal?: string

  // Metadata
  language: 'en' | 'ru'
  themeId: string
}

/**
 * Content source function type
 */
export type ContentSource<T> = (language: 'en' | 'ru') => T

/**
 * Theme-specific content configuration
 * Defines what content to show and how to fetch it
 */
export interface ThemeContentConfig {
  themeId: string

  // Content sources - theme decides what to enable
  contentSources: {
    haiku?: {
      enabled: boolean
      fetch: () => Haiku
    }
    quote?: {
      enabled: boolean
      fetch: (lang: 'en' | 'ru') => string
    }
    phrase?: {
      enabled: boolean
      fetch: () => string
    }
    seasonal?: {
      enabled: boolean
      fetch: (lang: 'en' | 'ru') => string
    }
  }

  // Blocked page layout preferences
  layout: {
    // Which content types to show (in order of priority)
    showHaiku: boolean
    showQuote: boolean
    showPhrase: boolean
    showSeasonal: boolean

    // Exercise button order
    exerciseOrder: ExerciseType[]

    // Header style
    headerStyle: 'default' | 'japanese' | 'caucasian' | 'custom'
  }
}

/**
 * Default theme content configuration
 * Simple motivational phrases, standard layout
 */
export const defaultContentConfig: ThemeContentConfig = {
  themeId: 'default',

  contentSources: {
    phrase: {
      enabled: true,
      fetch: () => getRandomBlockedPhrase()
    }
  },

  layout: {
    showHaiku: false,
    showQuote: false,
    showPhrase: true,
    showSeasonal: false,
    exerciseOrder: ['breath', 'eye', 'stretch'],
    headerStyle: 'default'
  }
}

/**
 * Focusan theme content configuration
 * Japanese haiku, samurai quotes, zen aesthetic
 */
export const focusanContentConfig: ThemeContentConfig = {
  themeId: 'focusan',

  contentSources: {
    haiku: {
      enabled: true,
      fetch: () => getRandomHaiku()
    },
    quote: {
      enabled: true,
      fetch: (lang) => getRandomSamuraiQuote(lang)
    }
  },

  layout: {
    showHaiku: true,
    showQuote: true,
    showPhrase: false,
    showSeasonal: false, // Can be enabled later with seasonal-theme.ts integration
    exerciseOrder: ['zen', 'breath', 'eye', 'stretch'],
    headerStyle: 'japanese'
  }
}

/**
 * Caucasus theme content configuration
 * Mountain proverbs, djigit wisdom, warrior spirit
 */
export const caucasusContentConfig: ThemeContentConfig = {
  themeId: 'caucasus',

  contentSources: {
    quote: {
      enabled: true,
      fetch: (lang) => {
        const wisdom = getRandomCaucasusWisdom()
        return lang === 'ru' ? wisdom.ru : wisdom.en
      }
    },
    phrase: {
      enabled: true,
      fetch: () => {
        const phrase = getRandomPhrase()
        const lang = getCurrentLanguage()
        return lang === 'ru' ? phrase.ru : phrase.en
      }
    }
  },

  layout: {
    showHaiku: false,
    showQuote: true,
    showPhrase: true,
    showSeasonal: false,
    exerciseOrder: ['mountain', 'breath', 'eye', 'stretch'],
    headerStyle: 'caucasian'
  }
}

/**
 * Japanese Zen theme content configuration
 * Zen kanji quotes, breathing exercises, minimal philosophy
 */
export const japaneseContentConfig: ThemeContentConfig = {
  themeId: 'japanese',

  contentSources: {
    haiku: {
      enabled: true,
      fetch: () => getRandomHaiku()
    },
    quote: {
      enabled: true,
      fetch: (lang) => getRandomSamuraiQuote(lang)
    }
  },

  layout: {
    showHaiku: true,
    showQuote: true,
    showPhrase: false,
    showSeasonal: false,
    exerciseOrder: ['zen', 'breath', 'eye', 'stretch'],
    headerStyle: 'japanese'
  }
}

/**
 * Registry of all theme content configurations
 */
export const THEME_CONTENT_CONFIGS: Record<string, ThemeContentConfig> = {
  default: defaultContentConfig,
  focusan: focusanContentConfig,
  caucasus: caucasusContentConfig,
  japanese: japaneseContentConfig
}

/**
 * Get content configuration for a specific theme
 * Falls back to default config if theme not found
 */
export function getContentConfigForTheme(themeId: string): ThemeContentConfig {
  return THEME_CONTENT_CONFIGS[themeId] || defaultContentConfig
}

/**
 * Fetch motivational content based on theme configuration
 * This is the main abstraction - call this instead of individual getHaiku/getQuote functions
 */
export function getMotivationalContent(config: ThemeContentConfig): MotivationalContent {
  const language = getCurrentLanguage()
  const content: MotivationalContent = {
    language,
    themeId: config.themeId
  }

  // Fetch enabled content sources
  if (config.contentSources.haiku?.enabled && config.layout.showHaiku) {
    content.haiku = config.contentSources.haiku.fetch()
  }

  if (config.contentSources.quote?.enabled && config.layout.showQuote) {
    content.quote = config.contentSources.quote.fetch(language)
  }

  if (config.contentSources.phrase?.enabled && config.layout.showPhrase) {
    content.phrase = config.contentSources.phrase.fetch()
  }

  if (config.contentSources.seasonal?.enabled && config.layout.showSeasonal) {
    content.seasonal = config.contentSources.seasonal.fetch(language)
  }

  return content
}
