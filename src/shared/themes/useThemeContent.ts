/**
 * Theme Content Provider Hook
 * Provides theme-aware motivational content for blocked pages
 */

import { useState, useEffect } from 'react'
import browser from 'webextension-polyfill'
import type { Theme } from './types'
import { getCurrentTheme, applyTheme } from './index'

interface UseThemeContentReturn {
  theme: Theme | null
  isLoading: boolean
}

/**
 * Hook to get theme-specific motivational content for blocked pages
 *
 * Usage:
 * ```tsx
 * const { theme, content, contentConfig } = useThemeContent()
 *
 * if (content?.haiku) {
 *   return <HaikuCard haiku={content.haiku} />
 * }
 * ```
 */
export function useThemeContent(): UseThemeContentReturn {
  const [theme, setTheme] = useState<Theme | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadTheme = async () => {
      try {
        const currentTheme = await getCurrentTheme()
        if (mounted) {
          setTheme(currentTheme)
          setIsLoading(false)
          // Apply theme to DOM
          applyTheme(currentTheme)
        }
      } catch (error) {
        console.error('[useThemeContent] Error loading theme:', error)
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadTheme()

    // Listen for theme changes in storage
    const handleStorageChange = (
      changes: Record<string, browser.Storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName === 'sync' && changes.theme_preference) {
        console.log('[useThemeContent] Theme changed, reloading...')
        loadTheme()
      }
    }

    browser.storage.onChanged.addListener(handleStorageChange)

    return () => {
      mounted = false
      browser.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [])

  return {
    theme,
    isLoading
  }
}
