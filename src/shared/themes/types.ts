/**
 * Theme System Types
 * Defines the structure for switchable themes in the extension
 */

import type { ThemeContentConfig } from './content-config'

export interface ThemeColors {
  // Background colors
  bg1: string
  bg2: string
  card: string
  card2: string

  // Text colors
  text: string
  muted: string

  // UI colors
  border: string
  accent: string
  accent2: string
  danger: string
  success?: string
  gold?: string

  // Additional palette (optional)
  palette?: Record<string, string>
}

export interface ThemeTypography {
  sans: string
  mono: string
}

export interface ThemeEffects {
  shadow: string
  shadowLg?: string
  radius: string
  radiusLg?: string
}

export interface ThemeAnimations {
  // CSS animation names that this theme provides
  available: string[]
}

export interface ThemeMetadata {
  id: string
  name: string
  description: string
  emoji: string
  author?: string
  version?: string
}

/**
 * Complete theme definition
 */
export interface Theme {
  metadata: ThemeMetadata
  colors: ThemeColors
  typography: ThemeTypography
  effects: ThemeEffects
  animations?: ThemeAnimations

  // Custom CSS that gets injected
  customCSS?: string

  // Content configuration for blocked pages (optional)
  // If not provided, uses default content config
  contentConfig?: ThemeContentConfig
}

/**
 * Theme preference stored in chrome.storage
 */
export interface ThemePreference {
  themeId: string
  appliedAt: number
}

/**
 * Helper type for theme registry
 */
export type ThemeRegistry = Record<string, Theme>
