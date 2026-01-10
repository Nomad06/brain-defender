/**
 * Focus Shrine Component for Focusan
 * Visual progress tracker showing growing bonsai tree
 * Growth based on focus sessions completed and sites blocked
 */

import React, { useEffect, useState } from 'react'
import type { Stats } from '../domain/stats'

interface FocusShrineProps {
  stats: Stats | null
  width?: number
  height?: number
}

/**
 * Calculate bonsai growth level (0-100)
 * Based on total blocks only (focus sessions tracked separately)
 */
function calculateGrowthLevel(stats: Stats | null): number {
  if (!stats) return 0

  const totalBlocks = stats.totalBlocks || 0

  // Growth formula: each block = 0.2 points
  // 500 blocks = 100% growth (fully mature bonsai)
  const growthPoints = totalBlocks * 0.2

  // Cap at 100
  return Math.min(100, growthPoints)
}

/**
 * Get growth stage based on level
 */
function getGrowthStage(level: number): {
  stage: number
  name: string
  description: string
} {
  if (level < 10) {
    return { stage: 0, name: 'Seed', description: 'Your journey begins' }
  } else if (level < 25) {
    return { stage: 1, name: 'Sprout', description: 'First signs of growth' }
  } else if (level < 50) {
    return { stage: 2, name: 'Sapling', description: 'Growing stronger' }
  } else if (level < 75) {
    return { stage: 3, name: 'Young Tree', description: 'Steady progress' }
  } else if (level < 100) {
    return { stage: 4, name: 'Mature Bonsai', description: 'Almost complete' }
  } else {
    return { stage: 5, name: 'Master Bonsai', description: 'Perfect balance achieved' }
  }
}

const FocusShrine: React.FC<FocusShrineProps> = ({ stats, width = 300, height = 400 }) => {
  const [growthLevel, setGrowthLevel] = useState(0)
  const [growthStage, setGrowthStage] = useState(getGrowthStage(0))

  useEffect(() => {
    const level = calculateGrowthLevel(stats)
    setGrowthLevel(level)
    setGrowthStage(getGrowthStage(level))
  }, [stats])

  // Calculate visual elements based on growth
  const branchCount = Math.floor((growthLevel / 100) * 8) + 2 // 2 to 10 branches
  const leafDensity = growthLevel / 100 // 0 to 1

  return (
    <div
      className="focus-shrine"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
        background: 'linear-gradient(180deg, #e8f4f8 0%, #f5f1e8 100%)',
        borderRadius: 'var(--radius-lg)',
        border: '2px solid var(--border)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {/* Background elements */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(180deg, transparent 0%, #c8b8a0 100%)',
          borderRadius: '50% 50% 0 0 / 20% 20% 0 0',
        }}
      />

      {/* Shrine platform */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          height: '8px',
          background: 'var(--sumi-gray)',
          borderRadius: '2px',
        }}
      />

      {/* Bonsai pot */}
      <div
        style={{
          position: 'absolute',
          bottom: 'calc(10% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100px',
          height: '40px',
          background: 'linear-gradient(180deg, #8b6f47 0%, #6b5435 100%)',
          borderRadius: '0 0 8px 8px',
          border: '2px solid #5a4428',
        }}
      />

      {/* Bonsai tree SVG */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* Trunk */}
        <path
          d={`M ${width / 2} ${height * 0.5} Q ${width / 2 - 10} ${height * 0.65} ${width / 2} ${height * 0.75}`}
          fill="none"
          stroke="#4a3728"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Branches - drawn based on growth level */}
        {growthLevel > 10 && (
          <>
            {/* Left branch 1 */}
            <path
              d={`M ${width / 2} ${height * 0.55} Q ${width / 2 - 30} ${height * 0.52} ${width / 2 - 45} ${height * 0.48}`}
              fill="none"
              stroke="#4a3728"
              strokeWidth="4"
              strokeLinecap="round"
              opacity={growthLevel > 15 ? 1 : 0.5}
            />

            {/* Right branch 1 */}
            <path
              d={`M ${width / 2} ${height * 0.58} Q ${width / 2 + 25} ${height * 0.55} ${width / 2 + 40} ${height * 0.52}`}
              fill="none"
              stroke="#4a3728"
              strokeWidth="4"
              strokeLinecap="round"
              opacity={growthLevel > 20 ? 1 : 0.5}
            />
          </>
        )}

        {growthLevel > 30 && (
          <>
            {/* Left branch 2 */}
            <path
              d={`M ${width / 2} ${height * 0.62} Q ${width / 2 - 20} ${height * 0.60} ${width / 2 - 35} ${height * 0.58}`}
              fill="none"
              stroke="#4a3728"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Right branch 2 */}
            <path
              d={`M ${width / 2} ${height * 0.65} Q ${width / 2 + 30} ${height * 0.63} ${width / 2 + 42} ${height * 0.60}`}
              fill="none"
              stroke="#4a3728"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </>
        )}

        {/* Leaves - more appear as growth increases */}
        {growthLevel > 25 &&
          Array.from({ length: branchCount }).map((_, i) => {
            const angle = (i / branchCount) * Math.PI * 2
            const radius = 30 + (growthLevel / 100) * 20
            const x = width / 2 + Math.cos(angle) * radius
            const y = height * 0.45 + Math.sin(angle) * (radius * 0.6)
            const size = 8 + (growthLevel / 100) * 6

            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={size}
                fill="#6b8e23"
                opacity={0.6 + leafDensity * 0.4}
              />
            )
          })}

        {/* Cherry blossoms for high growth */}
        {growthLevel > 60 &&
          [0, 1, 2, 3, 4].map(i => {
            const angle = (i / 5) * Math.PI * 2
            const radius = 35 + (growthLevel / 100) * 15
            const x = width / 2 + Math.cos(angle + Math.PI / 4) * radius
            const y = height * 0.42 + Math.sin(angle + Math.PI / 4) * (radius * 0.5)

            return (
              <circle
                key={`blossom-${i}`}
                cx={x}
                cy={y}
                r={4}
                fill="#ffb7c5"
                opacity={0.8}
              />
            )
          })}
      </svg>

      {/* Growth info panel */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '8px 16px',
          borderRadius: 'var(--radius)',
          border: '2px solid var(--gold)',
          boxShadow: 'var(--shadow)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>
          {growthStage.name}
        </div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent)' }}>
          {Math.floor(growthLevel)}%
        </div>
        <div style={{ fontSize: '10px', color: 'var(--muted)', fontStyle: 'italic' }}>
          {growthStage.description}
        </div>
      </div>

      {/* Growth progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          right: '16px',
          height: '8px',
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '999px',
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${growthLevel}%`,
            background: 'linear-gradient(90deg, var(--bamboo-green) 0%, var(--gold) 100%)',
            transition: 'width 1s ease-out',
          }}
        />
      </div>

      {/* Milestone indicators */}
      {growthLevel >= 100 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '48px',
            animation: 'zenRipple 2s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        >
          ✨
        </div>
      )}

      <style>{`
        .focus-shrine {
          animation: toriiGateFade 0.8s ease-out;
        }
      `}</style>
    </div>
  )
}

export default FocusShrine
