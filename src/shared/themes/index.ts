/**
 * Theme Manager
 * Handles theme registration, switching, and application
 */

import browser from 'webextension-polyfill'
import { defaultTheme } from './default'
import { focusanTheme } from './focusan'
import type { Theme, ThemeRegistry, ThemePreference } from './types'

const STORAGE_KEY = 'theme_preference'

/**
 * Registry of all available themes
 * To add a new theme: import it and add to this object
 */
export const THEMES: ThemeRegistry = {
  default: defaultTheme,
  focusan: focusanTheme,
  // Add new themes here:
  // mytheme: myTheme,
}

/**
 * Get all available themes as an array
 */
export function getAllThemes(): Theme[] {
  return Object.values(THEMES)
}

/**
 * Get a theme by ID
 */
export function getThemeById(id: string): Theme | null {
  return THEMES[id] || null
}

/**
 * Get current theme preference from storage
 */
export async function getCurrentThemeId(): Promise<string> {
  try {
    const result = await browser.storage.sync.get(STORAGE_KEY)
    const preference = result[STORAGE_KEY] as ThemePreference | undefined
    return preference?.themeId || 'default'
  } catch (error) {
    console.error('[Theme] Error getting theme preference:', error)
    return 'default'
  }
}

/**
 * Get current theme object
 */
export async function getCurrentTheme(): Promise<Theme> {
  const themeId = await getCurrentThemeId()
  return getThemeById(themeId) || defaultTheme
}

/**
 * Set theme preference in storage
 */
export async function setThemePreference(themeId: string): Promise<boolean> {
  try {
    if (!THEMES[themeId]) {
      console.error(`[Theme] Theme "${themeId}" not found`)
      return false
    }

    const preference: ThemePreference = {
      themeId,
      appliedAt: Date.now(),
    }

    await browser.storage.sync.set({ [STORAGE_KEY]: preference })
    return true
  } catch (error) {
    console.error('[Theme] Error setting theme preference:', error)
    return false
  }
}

/**
 * Apply theme to current document
 * Sets CSS custom properties and injects custom CSS
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement

  // Apply color variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    if (key === 'palette' && typeof value === 'object' && value !== null) {
      // Apply palette colors with prefix
      Object.entries(value).forEach(([paletteKey, paletteValue]) => {
        if (typeof paletteValue === 'string') {
          root.style.setProperty(`--palette-${paletteKey}`, paletteValue)
        }
      })
    } else if (typeof value === 'string') {
      root.style.setProperty(`--${key}`, value)
    }
  })

  // Apply typography
  root.style.setProperty('--font-sans', theme.typography.sans)
  root.style.setProperty('--font-mono', theme.typography.mono)

  // Apply effects
  root.style.setProperty('--shadow', theme.effects.shadow)
  root.style.setProperty('--shadow-lg', theme.effects.shadowLg || theme.effects.shadow)
  root.style.setProperty('--radius', theme.effects.radius)
  root.style.setProperty('--radius-lg', theme.effects.radiusLg || theme.effects.radius)

  // Set theme ID as data attribute for CSS targeting
  root.setAttribute('data-theme', theme.metadata.id)

  // Inject custom CSS if not already injected
  const customStyleId = `theme-custom-${theme.metadata.id}`
  let customStyle = document.getElementById(customStyleId)

  if (!customStyle && theme.customCSS) {
    customStyle = document.createElement('style')
    customStyle.id = customStyleId
    customStyle.textContent = theme.customCSS
    document.head.appendChild(customStyle)
  }

  // Remove old theme custom CSS
  document.querySelectorAll('style[id^="theme-custom-"]').forEach((style) => {
    if (style.id !== customStyleId) {
      style.remove()
    }
  })

  console.log(`[Theme] Applied theme: ${theme.metadata.name} ${theme.metadata.emoji}`)
}

/**
 * Initialize theme on page load
 * Call this in every page's entry point
 */
export async function initializeTheme(): Promise<void> {
  const theme = await getCurrentTheme()
  applyTheme(theme)
}

/**
 * Switch to a different theme
 * Saves preference and applies immediately
 */
export async function switchTheme(themeId: string): Promise<boolean> {
  const success = await setThemePreference(themeId)
  if (success) {
    const theme = getThemeById(themeId)
    if (theme) {
      applyTheme(theme)
      return true
    }
  }
  return false
}

// Re-export types and themes for convenience
export type { Theme, ThemePreference } from './types'
export { defaultTheme, focusanTheme }
