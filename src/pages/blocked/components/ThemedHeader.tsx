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

  // Caucasian-style header (for caucasus theme)
  if (headerStyle === 'caucasian') {
    return (
      <div
        className="mountain-rise"
        style={{
          textAlign: 'center',
          marginBottom: '32px',
          position: 'relative',
        }}
      >
        {/* Mountain peaks decoration */}
        <div style={{
          fontSize: '64px',
          marginBottom: '16px',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
        }}>
          {theme.metadata.emoji}
        </div>

        {/* Tower silhouettes */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          marginBottom: '16px',
        }}>
          <div className="ingush-tower" style={{ transform: 'scale(0.8)' }} />
          <div className="ingush-tower" />
          <div className="ingush-tower" style={{ transform: 'scale(0.8)' }} />
        </div>

        {/* Theme name */}
        <div style={{
          fontSize: '32px',
          fontWeight: 700,
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--text)',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
        }}>
          {theme.metadata.name.split(' - ')[0]}
        </div>

        {/* Honor line */}
        <div className="honor-line" style={{ maxWidth: '300px', margin: '0 auto 12px' }} />

        {/* Description with eagle */}
        <div style={{
          fontSize: '16px',
          color: 'var(--muted)',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}>
          <span>🦅</span>
          <span style={{ letterSpacing: '0.05em' }}>СИЛА · ЧЕСТЬ · СВОБОДА</span>
          <span>🦅</span>
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
