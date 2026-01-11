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
      <div
        style={{
          textAlign: 'center',
          marginBottom: '28px',
          animation: 'toriiGateFade 0.8s ease-out',
        }}
      >
        <div className="torii-shadow" style={{ fontSize: '56px', marginBottom: '12px' }}>
          {theme.metadata.emoji}
        </div>
        <div className="japanese-title ink-drip" style={{ fontSize: '28px', marginBottom: '8px', fontWeight: 700 }}>
          {theme.metadata.name}
        </div>
        <div className="kanji-highlight" style={{ fontSize: '18px', letterSpacing: '0.2em' }}>
          集中 · FOCUS
        </div>
      </div>
    )
  }



  // Default header style
  return (
    <div
      style={{
        textAlign: 'center',
        marginBottom: '24px',
      }}
    >
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>
        {theme.metadata.emoji}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
        {theme.metadata.name}
      </div>
      <div style={{ fontSize: '16px', color: 'var(--muted)' }}>
        {theme.metadata.description}
      </div>
    </div>
  )
}
