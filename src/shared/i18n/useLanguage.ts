/**
 * Language Hook
 * Reactive hook that listens to language changes in storage
 */

import { useState, useEffect } from 'react'
import browser from 'webextension-polyfill'
import { getLanguage } from '../storage/storage'
import type { Language } from './translations'

/**
 * Hook to get current language with reactive updates
 * Listens to storage changes and re-renders when language changes
 */
export function useLanguage(): Language {
  const [language, setLanguage] = useState<Language>('ru')

  useEffect(() => {
    let mounted = true

    // Load initial language
    const loadLanguage = async () => {
      try {
        const saved = await getLanguage()
        if (mounted && saved && (saved === 'ru' || saved === 'en')) {
          setLanguage(saved as Language)
        } else if (mounted) {
          // Auto-detect from browser
          const browserLang = navigator.language.toLowerCase()
          setLanguage(browserLang.startsWith('ru') ? 'ru' : 'en')
        }
      } catch (err) {
        console.error('[useLanguage] Error loading language:', err)
        if (mounted) {
          setLanguage('en')
        }
      }
    }

    loadLanguage()

    // Listen for language changes in storage
    const handleStorageChange = (
      changes: Record<string, browser.Storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName === 'local' && changes['i18n_language']) {
        const newLang = changes['i18n_language'].newValue
        if (newLang && (newLang === 'ru' || newLang === 'en')) {
          console.log('[useLanguage] Language changed to:', newLang)
          const validLang = newLang as Language
          // Sync global state immediately so t() works in the upcoming render
          import('./index').then(({ syncLanguage }) => syncLanguage(validLang))
          setLanguage(validLang)
        }
      }
    }

    browser.storage.onChanged.addListener(handleStorageChange)

    return () => {
      mounted = false
      browser.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [])

  return language
}
