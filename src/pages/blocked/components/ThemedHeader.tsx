/**
 * Themed Header Component
 * Displays header based on theme style (default or Japanese)
 */

import React from 'react'
import type { Theme } from '../../../shared/themes/types'
import type { ThemeContentConfig } from '../../../shared/themes/content-config'

interface ThemedHeaderProps {
  theme: Theme
  contentConfig: ThemeContentConfig
}

export const ThemedHeader: React.FC<ThemedHeaderProps> = ({ theme, contentConfig }) => {
  const { headerStyle } = contentConfig.layout

  // Japanese-style header (for focusan theme)
  if (headerStyle === 'japanese') {
    return (
      <div className="text-center mb-8 fade-in-up">
        <div className="header-emoji torii-shadow">
          {theme.metadata.emoji}
        </div>
        <div className="japanese-title ink-drip">
          {theme.metadata.name}
        </div>
        <div className="japanese-sub kanji-highlight">
          集中 · FOCUS
        </div>
      </div>
    )
  }

  // Default header style
  return (
    <div className="text-center mb-6">
      <div className="text-4xl mb-4">
        {theme.metadata.emoji}
      </div>
      <div className="text-2xl font-bold mb-2">
        {theme.metadata.name}
      </div>
      <div className="text-base text-muted">
        {theme.metadata.description}
      </div>
    </div>
  )
}
