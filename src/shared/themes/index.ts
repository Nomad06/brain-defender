/**
 * Theme Manager
 * Simplified for single Focusan theme
 */

import { focusanTheme } from './focusan'
import type { Theme } from './types'

/**
 * Get current theme (Always Focusan)
 */
export async function getCurrentTheme(): Promise<Theme> {
  return focusanTheme
}

/**
 * Apply theme to current document
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
 */
export async function initializeTheme(): Promise<void> {
  applyTheme(focusanTheme)
}

// Re-export types and themes for convenience
export type { Theme } from './types'
export { focusanTheme }

