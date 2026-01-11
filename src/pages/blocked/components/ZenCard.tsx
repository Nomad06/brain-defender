/**
 * Zen Card Component
 * Displays Japanese kanji with meaning and contextual message
 * Used in Japanese theme for blocked page
 */

import React from 'react'
import type { ZenPhrase } from '../../../shared/japanese-zen'

interface ZenCardProps {
  zenPhrase: ZenPhrase
  language: 'en' | 'ru'
}

export const ZenCard: React.FC<ZenCardProps> = ({ zenPhrase, language }) => {
  const meaning = language === 'ru' ? zenPhrase.meaningRu : zenPhrase.meaning
  const message = language === 'ru' ? zenPhrase.messageRu : zenPhrase.message

  return (
    <div
      style={{
        textAlign: 'center',
        marginBottom: '32px',
        opacity: 0,
        animation: 'fadeInUp 1s ease-out forwards 0.5s',
      }}
    >
      {/* Large Kanji Title */}
      <h1
        className="kanji-title"
        style={{
          fontFamily: 'var(--font-serif, "Noto Serif JP", serif)',
          fontSize: 'clamp(3.5rem, 10vw, 5rem)',
          lineHeight: 1,
          marginBottom: '8px',
          color: 'var(--text)',
          opacity: 0,
          animation: 'fadeInUp 1s ease-out forwards 0.5s',
        }}
        data-zen
      >
        {zenPhrase.kanji}
      </h1>

      {/* Romanji + Meaning Subtitle */}
      <h2
        className="subtitle"
        style={{
          fontSize: '1.2rem',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: 'var(--muted)',
          marginBottom: '24px',
          opacity: 0,
          animation: 'fadeInUp 1s ease-out forwards 0.8s',
        }}
      >
        {zenPhrase.romanji} — {meaning}
      </h2>

      {/* Contextual Message */}
      <p
        className="message"
        style={{
          fontSize: '1.2rem',
          lineHeight: 1.8,
          color: 'var(--text)',
          fontWeight: 300,
          maxWidth: '600px',
          margin: '0 auto',
          whiteSpace: 'pre-line',
          opacity: 0,
          animation: 'fadeInUp 1s ease-out forwards 1.1s',
        }}
      >
        {message}
      </p>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .kanji-title,
          .subtitle,
          .message {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  )
}
