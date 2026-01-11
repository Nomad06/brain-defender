/**
 * Default Theme - Original Brain Defender Style
 * Clean, modern, blue-focused design
 */

import type { Theme } from './types'
import { defaultContentConfig } from './content-config'

export const defaultTheme: Theme = {
  metadata: {
    id: 'default',
    name: 'Brain Defender',
    description: 'Original clean and modern style',
    emoji: '🧠',
    version: '1.0.0',
  },

  colors: {
    bg1: '#f8f9fa',
    bg2: '#ffffff',
    card: '#ffffff',
    card2: '#f5f6f8',
    text: '#2d3748',
    muted: '#718096',
    border: '#e2e8f0',
    accent: '#5b8def',
    accent2: '#7c9ef2',
    danger: '#f56565',
    success: '#48bb78',
  },

  typography: {
    sans: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },

  effects: {
    shadow: '0 2px 8px rgba(0,0,0,.06)',
    shadowLg: '0 10px 40px rgba(0,0,0,.1)',
    radius: '12px',
    radiusLg: '16px',
  },

  animations: {
    available: ['fadeIn', 'slideIn'],
  },

  customCSS: `
    /* Default theme has no custom CSS */
  `,

  // Content configuration for blocked pages
  contentConfig: defaultContentConfig,
}
