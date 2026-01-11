/**
 * Zen Quote Footer Component
 * Displays a bottom quote with fade-in animation
 * Used in Japanese theme for blocked page
 */

import React from 'react'
import type { ZenQuote } from '../../../shared/japanese-zen'

interface ZenQuoteFooterProps {
  quote: ZenQuote
  language: 'en' | 'ru'
}

export const ZenQuoteFooter: React.FC<ZenQuoteFooterProps> = ({ quote, language }) => {
  const text = language === 'ru' ? quote.textRu : quote.text

  return (
    <div
      className="quote-container"
      style={{
        textAlign: 'center',
        marginTop: '48px',
        opacity: 0,
        animation: 'fadeIn 2s ease-out forwards 2s',
      }}
    >
      <p
        className="quote"
        style={{
          fontFamily: 'var(--font-serif, "Noto Serif JP", serif)',
          fontStyle: 'italic',
          color: 'var(--muted)',
          fontSize: '0.9rem',
          lineHeight: 1.6,
        }}
        data-zen
      >
        "{text}"
        {quote.author && (
          <span style={{ display: 'block', marginTop: '4px', fontSize: '0.8rem', fontStyle: 'normal' }}>
            — {quote.author}
          </span>
        )}
      </p>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 0.7;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .quote-container {
            animation: none !important;
            opacity: 0.7 !important;
          }
        }
      `}</style>
    </div>
  )
}
