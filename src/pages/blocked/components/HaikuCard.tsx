/**
 * Haiku Card Component
 * Displays a haiku poem with appropriate styling
 */

import React from 'react'
import type { Haiku } from '../../../shared/haiku'

interface HaikuCardProps {
  haiku: Haiku
  language: 'en' | 'ru'
}

export const HaikuCard: React.FC<HaikuCardProps> = ({ haiku, language }) => {
  // Use Russian translation if available and language is Russian
  const lines = (language === 'ru' && haiku.linesRu) ? haiku.linesRu : haiku.lines

  return (
    <div
      className="card bamboo-grid brush-border"
      style={{
        padding: '28px 24px',
        background: 'var(--card2)',
        border: '2px solid var(--border)',
        marginBottom: '20px',
        textAlign: 'center',
      }}
    >
      <div
        className="japanese-serif"
        style={{
          fontSize: '19px',
          lineHeight: 1.9,
          color: 'var(--text)',
          fontStyle: 'italic',
          letterSpacing: '0.05em',
        }}
      >
        {lines.map((line, i) => (
          <div key={i} style={{ marginBottom: i === 2 ? 0 : '10px' }}>
            {line}
          </div>
        ))}
      </div>
    </div>
  )
}
