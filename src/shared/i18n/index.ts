/**
 * Internationalization (i18n) system for Brain Defender
 */

import { translations, type Language } from './translations'
import { getLanguage, setLanguage as setStorageLanguage } from '../storage/storage'

let currentLanguage: Language = 'ru'

/**
 * Initialize i18n system
 * Detects browser language or uses saved preference
 */
export async function initI18n(): Promise<void> {
  try {
    // Try to get saved language
    const saved = await getLanguage()
    if (saved && (saved === 'ru' || saved === 'en')) {
      currentLanguage = saved as Language
      return
    }

    // Auto-detect from browser
    const browserLang = navigator.language.toLowerCase()
    if (browserLang.startsWith('ru')) {
      currentLanguage = 'ru'
    } else {
      currentLanguage = 'en'
    }
  } catch (err) {
    console.error('[i18n] Error initializing:', err)
    currentLanguage = 'en'
  }
}

/**
 * Get current language
 */
export function getCurrentLanguage(): Language {
  return currentLanguage
}

/**
 * Set current language
 */
export async function setLanguage(lang: Language): Promise<void> {
  currentLanguage = lang
  await setStorageLanguage(lang)
}

/**
 * Sync language without saving to storage
 * Used by hooks to keep state in sync
 */
export function syncLanguage(lang: Language): void {
  currentLanguage = lang
}

/**
 * Get a translation string
 *
 * @param key - Translation key (e.g., 'popup.title')
 * @param params - Optional parameters for interpolation
 * @returns Translated string
 */
export function t(key: string, params?: Record<string, string | number>): string {
  try {
    const keys = key.split('.')
    let value: any = translations[currentLanguage]

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        console.warn(`[i18n] Missing translation: ${key}`)
        return key
      }
    }

    if (typeof value !== 'string') {
      console.warn(`[i18n] Translation is not a string: ${key}`)
      return key
    }

    // Replace parameters
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return paramKey in params ? String(params[paramKey]) : match
      })
    }

    return value
  } catch (err) {
    console.error('[i18n] Error getting translation:', key, err)
    return key
  }
}

/**
 * Get all translations for current language
 */
export function getAllTranslations() {
  return translations[currentLanguage]
}

/**
 * Get a random phrase from blocked phrases
 */
export function getRandomBlockedPhrase(): string {
  const phrases = translations[currentLanguage].blocked.phrases
  return phrases[Math.floor(Math.random() * phrases.length)]
}

export { translations, type Language }

