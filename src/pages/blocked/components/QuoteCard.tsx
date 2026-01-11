/**
 * Quote Card Component
 * Displays motivational quotes with appropriate styling
 */

import React from 'react'

interface QuoteCardProps {
  quote: string
  icon?: string
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ quote, icon = '⚔️' }) => {
  return (
    <div
      className="japanese-serif samurai-quote"
      style={{
        fontSize: 'clamp(18px, 2.5vw, 26px)',
        fontWeight: 500,
        lineHeight: 1.5,
        letterSpacing: '0.04em',
        margin: '24px 0',
        color: 'var(--accent)',
        textAlign: 'center',
        padding: '16px 24px',
        position: 'relative',
      }}
    >
      <span style={{ fontSize: '1.3em', color: 'var(--gold)' }}>{icon}</span> 「{quote}」
    </div>
  )
}
