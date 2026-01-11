/**
 * Phrase Card Component
 * Displays simple motivational phrases for default theme
 */

import React from 'react'

interface PhraseCardProps {
  phrase: string
}

export const PhraseCard: React.FC<PhraseCardProps> = ({ phrase }) => {
  return (
    <div
      className="card"
      style={{
        padding: '24px',
        background: 'var(--card2)',
        border: '2px solid var(--accent)',
        marginBottom: '20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 'clamp(18px, 2.5vw, 24px)',
          fontWeight: 600,
          lineHeight: 1.5,
          color: 'var(--text)',
        }}
      >
        {phrase}
      </div>
    </div>
  )
}
