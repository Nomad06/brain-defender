/**
 * Breathing Circles Component
 * Meditative breathing animation for Japanese Zen theme
 * Two concentric circles that expand/contract in a soothing rhythm
 */

import React from 'react'

interface BreathingCirclesProps {
  size?: number
}

export const BreathingCircles: React.FC<BreathingCirclesProps> = ({ size = 200 }) => {
  return (
    <div
      className="breath-container"
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '0 auto var(--spacing-2xl, 48px)',
      }}
    >
      {/* Outer breathing circle */}
      <div
        className="breath-circle"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          backgroundColor: 'rgba(39, 76, 119, 0.1)', // Seigaiha with low opacity
          animation: 'breath 4s ease-in-out infinite alternate',
        }}
      />

      {/* Inner breathing circle */}
      <div
        className="breath-circle-inner"
        style={{
          position: 'absolute',
          width: '60%',
          height: '60%',
          borderRadius: '50%',
          backgroundColor: 'var(--palette-ocean, #274C77)',
          opacity: 0.8,
          boxShadow: '0 0 30px rgba(39, 76, 119, 0.3)',
          animation: 'breathInner 4s ease-in-out infinite alternate',
        }}
      />

      <style>{`
        @keyframes breath {
          0% {
            transform: scale(0.8);
            opacity: 0.1;
          }
          100% {
            transform: scale(1.2);
            opacity: 0.2;
          }
        }

        @keyframes breathInner {
          0% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1.1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .breath-circle,
          .breath-circle-inner {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}
